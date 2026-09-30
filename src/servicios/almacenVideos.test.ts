import { describe, expect, it } from 'vitest';

import {
  ErrorAlmacenamiento,
  ErrorEspacioInsuficiente,
  ErrorVideoAusente,
} from '../dominio/errores';
import {
  LIMITE_VIDEO_BYTES,
  crearEjercicio,
  crearEntrenamiento,
  type Entrenamiento,
} from '../dominio/modelos';
import {
  crearAlmacenamientoLocal,
  type MedioClaveValor,
} from '../infra/almacenamientoLocal';
import {
  crearBaseIndexedDb,
  type AbrirBase,
  type BaseAbierta,
  type BaseIndexedDb,
  type RegistroVideo,
} from '../infra/baseIndexedDb';
import { crearAlmacenVideosEnMemoria } from '../tests/dobles/almacenVideosEnMemoria';
import { crearRepositorioDatos } from './repositorioDatos';
import {
  MENSAJE_FORMATO_NO_ACEPTADO,
  MENSAJE_TAMANIO_EXCEDIDO,
  crearAlmacenVideos,
  type ArchivoVideoEntrante,
} from './almacenVideos';

/**
 * Doble de `crearBaseIndexedDb`: mismo contrato sobre un `Map`, con el rechazo
 * por cuota inyectable. La base real ya traduce `QuotaExceededError` a
 * `ErrorEspacioInsuficiente` (probado en `baseIndexedDb.test.ts`), así que el
 * doble entrega directamente el error de dominio.
 */
type BaseFalsa = {
  base: BaseIndexedDb;
  registros: Map<string, RegistroVideo>;
  rechazarPorCuota: (activo?: boolean) => void;
};

function crearBaseFalsa(): BaseFalsa {
  const registros = new Map<string, RegistroVideo>();
  let cuotaAgotada = false;

  return {
    base: {
      async guardar(registro) {
        if (cuotaAgotada) throw new ErrorEspacioInsuficiente();
        registros.set(registro.idEntrenamiento, registro);
      },
      async obtener(idEntrenamiento) {
        return registros.get(idEntrenamiento);
      },
      async borrar(idEntrenamiento) {
        if (cuotaAgotada) throw new ErrorEspacioInsuficiente();
        registros.delete(idEntrenamiento);
      },
      async cerrar() {},
    },
    registros,
    rechazarPorCuota(activo = true) {
      cuotaAgotada = activo;
    },
  };
}

function archivoDeVideo(
  tipo = 'video/mp4',
  contenido = 'binario',
  nombre = 'sentadilla.mp4',
): File {
  return new File([contenido], nombre, { type: tipo });
}

/** Archivo con tamaño declarado, para ejercitar el límite sin ocupar 50 MB. */
function archivoConTamanio(tamanioBytes: number): ArchivoVideoEntrante {
  return {
    contenido: new Blob(['binario'], { type: 'video/mp4' }),
    nombre: 'sentadilla.mp4',
    tipo: 'video/mp4',
    tamanioBytes,
  };
}

/**
 * Doble de `idb` reducido a lo que exige el criterio 8.12: la transacción
 * acumula las escrituras en una copia y sólo las confirma al resolverse `done`,
 * de modo que un aborto no deje ningún registro parcial. La cuota se agota
 * cuando se activa `agotarCuota`, con el mismo error que lanza el navegador.
 */
type DobleIdbConCuota = {
  abrir: AbrirBase;
  registros: Map<string, RegistroVideo>;
  abortos: () => number;
  agotarCuota: () => void;
};

function crearDobleIdbConCuota(): DobleIdbConCuota {
  const registros = new Map<string, RegistroVideo>();
  const almacenes = new Set<string>();
  let abortos = 0;
  let cuotaAgotada = false;

  const abrir: AbrirBase = async (_nombre, _version, { upgrade }) => {
    upgrade({
      objectStoreNames: { contains: (nombre) => almacenes.has(nombre) },
      createObjectStore: (nombre) => {
        almacenes.add(nombre);
      },
    });

    const base: BaseAbierta = {
      transaction() {
        const pendientes = new Map(registros);
        let abortada = false;

        return {
          store: {
            async put(valor) {
              if (cuotaAgotada) {
                const error = new Error('The quota has been exceeded.');
                error.name = 'QuotaExceededError';
                throw error;
              }
              pendientes.set(valor.idEntrenamiento, valor);
            },
            async get(clave) {
              return pendientes.get(clave);
            },
            async delete(clave) {
              pendientes.delete(clave);
            },
          },
          done: new Promise<void>((resolver, rechazar) => {
            queueMicrotask(() => {
              if (abortada) {
                rechazar(new Error('Transacción abortada'));
                return;
              }
              registros.clear();
              for (const [clave, valor] of pendientes) {
                registros.set(clave, valor);
              }
              resolver();
            });
          }),
          abort() {
            abortada = true;
            abortos += 1;
          },
        };
      },
      close() {},
    };

    return base;
  };

  return {
    abrir,
    registros,
    abortos: () => abortos,
    agotarCuota() {
      cuotaAgotada = true;
    },
  };
}

/** Doble de `localStorage` en memoria, con su contenido observable. */
function crearMedioEnMemoria(): MedioClaveValor & {
  contenido: () => Record<string, string>;
} {
  const datos = new Map<string, string>();
  return {
    getItem: (clave) => datos.get(clave) ?? null,
    setItem: (clave, valor) => {
      datos.set(clave, valor);
    },
    removeItem: (clave) => {
      datos.delete(clave);
    },
    contenido: () => Object.fromEntries(datos),
  };
}

/** Entrenamiento válido según los límites del Repositorio_Datos. */
function entrenamientoValido(): Entrenamiento {
  return crearEntrenamiento({
    id: 'ent-1',
    titulo: 'Fuerza total',
    categoria: 'Fuerza',
    nivel: 'Intermedio',
    duracionMinutos: 45,
    fuenteVideo: 'archivo',
    ejercicios: [
      crearEjercicio({
        id: 'ej-1',
        nombre: 'Sentadillas',
        series: 4,
        repeticiones: 10,
        descansoSegundos: 60,
      }),
    ],
  });
}

describe('almacenVideos', () => {
  it('Dado un archivo de tipo admitido Cuando se guarda el video Entonces lo conserva bajo el identificador del Entrenamiento y devuelve tipo y tamaño', async () => {
    // Cubre: 8.10, 7.18
    const { base, registros } = crearBaseFalsa();
    const almacen = crearAlmacenVideos({ base });
    const archivo = archivoDeVideo('video/mp4', 'contenido de video');

    const confirmacion = await almacen.guardarVideo('ent-1', archivo);

    expect(confirmacion).toEqual({
      tipo: 'video/mp4',
      tamanioBytes: archivo.size,
    });
    expect(registros.get('ent-1')).toMatchObject({
      idEntrenamiento: 'ent-1',
      blob: archivo,
      tipo: 'video/mp4',
      tamanioBytes: archivo.size,
      nombre: 'sentadilla.mp4',
    });
  });

  it('Dado un archivo webm con el tamaño en el límite exacto Cuando se guarda el video Entonces lo acepta y lo conserva', async () => {
    // Cubre: 8.10
    const { base, registros } = crearBaseFalsa();
    const almacen = crearAlmacenVideos({ base });

    await almacen.guardarVideo('ent-1', {
      contenido: new Blob(['binario'], { type: 'video/webm' }),
      nombre: 'plancha.webm',
      tamanioBytes: LIMITE_VIDEO_BYTES,
    });

    expect(registros.get('ent-1')?.tipo).toBe('video/webm');
    expect(registros.get('ent-1')?.tamanioBytes).toBe(LIMITE_VIDEO_BYTES);
  });

  it('Dado un archivo de tipo no admitido Cuando se guarda el video Entonces falla por formato y no escribe nada en la base', async () => {
    // Cubre: 8.10, 7.18
    const { base, registros } = crearBaseFalsa();
    const almacen = crearAlmacenVideos({ base });

    const fallo = await almacen
      .guardarVideo('ent-1', archivoDeVideo('video/avi', 'binario', 'a.avi'))
      .catch((error: unknown) => error);

    expect(fallo).toBeInstanceOf(ErrorAlmacenamiento);
    expect(fallo).not.toBeInstanceOf(ErrorEspacioInsuficiente);
    expect((fallo as ErrorAlmacenamiento).message).toBe(
      MENSAJE_FORMATO_NO_ACEPTADO,
    );
    expect(registros.size).toBe(0);
  });

  it('Dado un archivo que excede el tamaño máximo por un byte Cuando se guarda el video Entonces falla por tamaño y no escribe nada en la base', async () => {
    // Cubre: 8.10, 7.19
    const { base, registros } = crearBaseFalsa();
    const almacen = crearAlmacenVideos({ base });

    const fallo = await almacen
      .guardarVideo('ent-1', archivoConTamanio(LIMITE_VIDEO_BYTES + 1))
      .catch((error: unknown) => error);

    expect(fallo).toBeInstanceOf(ErrorEspacioInsuficiente);
    expect((fallo as ErrorEspacioInsuficiente).message).toBe(
      MENSAJE_TAMANIO_EXCEDIDO,
    );
    expect(registros.size).toBe(0);
  });

  it('Dado un video conservado Cuando se lo obtiene Entonces devuelve el mismo contenido binario con idéntico tipo y tamaño', async () => {
    // Cubre: 8.10
    const { base } = crearBaseFalsa();
    const almacen = crearAlmacenVideos({ base });
    const archivo = archivoDeVideo('video/mp4', 'contenido de video');
    await almacen.guardarVideo('ent-1', archivo);

    const recuperado = await almacen.obtenerVideo('ent-1');

    expect(recuperado).toBe(archivo);
    expect(recuperado.type).toBe('video/mp4');
    expect(recuperado.size).toBe(archivo.size);
  });

  it('Dado un identificador sin video conservado Cuando se lo obtiene Entonces falla con ErrorVideoAusente y conserva sin cambios el estado almacenado', async () => {
    // Cubre: 8.13
    const { base, registros } = crearBaseFalsa();
    const almacen = crearAlmacenVideos({ base });
    await almacen.guardarVideo('ent-1', archivoDeVideo());

    const fallo = await almacen
      .obtenerVideo('inexistente')
      .catch((error: unknown) => error);

    expect(fallo).toBeInstanceOf(ErrorVideoAusente);
    expect([...registros.keys()]).toEqual(['ent-1']);
  });

  it('Dada una base que rechaza la escritura por falta de espacio Cuando se guarda otro video Entonces falla con espacio insuficiente y conserva sin cambios los videos previos', async () => {
    // Cubre: 8.12, 7.19
    const { base, registros, rechazarPorCuota } = crearBaseFalsa();
    const almacen = crearAlmacenVideos({ base });
    await almacen.guardarVideo('ent-1', archivoDeVideo());
    rechazarPorCuota();

    const fallo = await almacen
      .guardarVideo('ent-2', archivoDeVideo())
      .catch((error: unknown) => error);

    expect(fallo).toBeInstanceOf(ErrorEspacioInsuficiente);
    expect([...registros.keys()]).toEqual(['ent-1']);
  });

  it('Dado un Entrenamiento y un video ya conservados Cuando el almacenamiento rechaza por cuota la escritura de otro video Entonces la transacción abortada no deja registros parciales y conserva los Entrenamientos y los Archivos_Video previos', async () => {
    // Cubre: 8.12
    const idb = crearDobleIdbConCuota();
    const almacen = crearAlmacenVideos({
      base: crearBaseIndexedDb({ abrir: idb.abrir }),
    });
    const medio = crearMedioEnMemoria();
    const repositorio = crearRepositorioDatos({
      almacenamiento: crearAlmacenamientoLocal({ medio }),
      almacenVideos: almacen,
    });
    const videoPrevio = archivoDeVideo('video/mp4', 'contenido previo');
    await almacen.guardarVideo('ent-1', videoPrevio);
    await repositorio.guardarEntrenamiento(entrenamientoValido());
    const entrenamientosPrevios = await repositorio.obtenerEntrenamientos();
    const contenidoPrevio = medio.contenido();
    idb.agotarCuota();

    const fallo = await almacen
      .guardarVideo('ent-2', archivoDeVideo('video/webm', 'contenido nuevo'))
      .catch((error: unknown) => error);

    expect(fallo).toBeInstanceOf(ErrorEspacioInsuficiente);
    expect(idb.abortos()).toBeGreaterThanOrEqual(1);
    expect([...idb.registros.keys()]).toEqual(['ent-1']);
    expect(await almacen.obtenerVideo('ent-1')).toBe(videoPrevio);
    expect(await repositorio.obtenerEntrenamientos()).toEqual(
      entrenamientosPrevios,
    );
    expect(medio.contenido()).toEqual(contenidoPrevio);
  });

  it('Dado un video conservado Cuando se lo elimina dos veces Entonces el borrado es idempotente y no queda ningún registro', async () => {
    // Cubre: 8.10
    const { base, registros } = crearBaseFalsa();
    const almacen = crearAlmacenVideos({ base });
    await almacen.guardarVideo('ent-1', archivoDeVideo());
    await almacen.eliminarVideo('ent-1');

    await almacen.eliminarVideo('ent-1');

    expect(registros.size).toBe(0);
  });

  it('Dado el doble en memoria y el almacén real Cuando ambos reciben un tipo no admitido Entonces rechazan con el mismo nombre de error', async () => {
    // Cubre: 8.10
    const { base } = crearBaseFalsa();
    const almacen = crearAlmacenVideos({ base });
    const doble = crearAlmacenVideosEnMemoria();

    const fallos = await Promise.all([
      almacen
        .guardarVideo('ent-1', archivoDeVideo('video/avi', 'binario', 'a.avi'))
        .catch((error: unknown) => error),
      doble
        .guardarVideo('ent-1', { nombre: 'a.avi', tipo: 'video/avi' })
        .catch((error: unknown) => error),
    ]);

    expect(fallos[0]).toMatchObject({ nombre: 'ErrorAlmacenamiento' });
    expect(fallos[1]).toMatchObject({ nombre: 'ErrorAlmacenamiento' });
  });

  it('Dado el doble en memoria y el almacén real Cuando a ambos se les pide un video ausente Entonces rechazan con el mismo nombre de error', async () => {
    // Cubre: 8.13
    const { base } = crearBaseFalsa();
    const almacen = crearAlmacenVideos({ base });
    const doble = crearAlmacenVideosEnMemoria();

    const fallos = await Promise.all([
      almacen.obtenerVideo('ent-1').catch((error: unknown) => error),
      doble.obtenerVideo('ent-1').catch((error: unknown) => error),
    ]);

    expect(fallos[0]).toMatchObject({ nombre: 'ErrorVideoAusente' });
    expect(fallos[1]).toMatchObject({ nombre: 'ErrorVideoAusente' });
  });
});
