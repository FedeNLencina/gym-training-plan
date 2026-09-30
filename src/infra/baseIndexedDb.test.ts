import { describe, expect, it } from 'vitest';

import {
  ErrorAlmacenamiento,
  ErrorEspacioInsuficiente,
} from '../dominio/errores';
import {
  CLAVE_ALMACEN_VIDEOS,
  NOMBRE_ALMACEN_VIDEOS,
  NOMBRE_BASE,
  VERSION_BASE,
  crearBaseIndexedDb,
  type AbrirBase,
  type BaseAbierta,
  type RegistroVideo,
} from './baseIndexedDb';

/**
 * Doble de `idb`: reproduce la apertura con mejora, la transacción `readwrite`
 * y el aborto, sobre un `Map`. Registra la apertura, los almacenes creados, los
 * modos de transacción y los abortos para poder afirmar sobre ellos, y admite
 * inyectar el fallo de escritura que el navegador lanza al agotarse la cuota.
 */
type FallosIdb = {
  /** Error lanzado por `put`; si es `undefined` la escritura procede. */
  alEscribir?: unknown;
  /** Error lanzado al abrir la base. */
  alAbrir?: unknown;
};

type DobleIdb = {
  abrir: AbrirBase;
  aperturas: { nombre: string; version: number }[];
  almacenesCreados: { nombre: string; claveDe: string }[];
  modos: string[];
  abortos: number;
  registros: Map<string, RegistroVideo>;
};

function crearDobleIdb(fallos: FallosIdb = {}): DobleIdb {
  const registros = new Map<string, RegistroVideo>();
  const aperturas: DobleIdb['aperturas'] = [];
  const almacenesCreados: DobleIdb['almacenesCreados'] = [];
  const modos: string[] = [];
  const doble = { abortos: 0 };
  const almacenes = new Set<string>();

  const abrir: AbrirBase = async (nombre, version, { upgrade }) => {
    aperturas.push({ nombre, version });
    if (fallos.alAbrir !== undefined) throw fallos.alAbrir;

    upgrade({
      objectStoreNames: {
        contains: (nombreAlmacen) => almacenes.has(nombreAlmacen),
      },
      createObjectStore: (nombreAlmacen, opciones) => {
        almacenes.add(nombreAlmacen);
        almacenesCreados.push({
          nombre: nombreAlmacen,
          claveDe: opciones.keyPath,
        });
      },
    });

    const base: BaseAbierta = {
      transaction(nombreAlmacen, modo) {
        modos.push(modo);
        if (!almacenes.has(nombreAlmacen)) {
          throw new Error(`Almacén inexistente: ${nombreAlmacen}`);
        }
        // Las escrituras se aplican sobre una copia y se confirman al
        // resolverse `done`, de modo que un aborto no deje rastro alguno.
        const pendientes = new Map(registros);
        let abortada = false;

        return {
          store: {
            async put(valor) {
              if (fallos.alEscribir !== undefined) throw fallos.alEscribir;
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
            doble.abortos += 1;
          },
        };
      },
      close() {},
    };

    return base;
  };

  return {
    abrir,
    aperturas,
    almacenesCreados,
    modos,
    get abortos() {
      return doble.abortos;
    },
    registros,
  };
}

function registroDeVideo(
  idEntrenamiento: string,
  contenido = 'binario',
): RegistroVideo {
  const blob = new Blob([contenido], { type: 'video/mp4' });
  return {
    idEntrenamiento,
    blob,
    tipo: 'video/mp4',
    tamanioBytes: blob.size,
    nombre: 'sentadilla.mp4',
  };
}

/** Error equivalente al que lanza el navegador al agotarse la cuota. */
function errorDeCuota(): Error {
  const error = new Error('The quota has been exceeded.');
  error.name = 'QuotaExceededError';
  return error;
}

describe('baseIndexedDb', () => {
  it('Dado un navegador sin la base creada Cuando se guarda un registro Entonces abre la base atlas-gym y crea el almacén videos con clave idEntrenamiento', async () => {
    // Cubre: 8.10
    const idb = crearDobleIdb();
    const base = crearBaseIndexedDb({ abrir: idb.abrir });

    await base.guardar(registroDeVideo('e1'));

    expect(idb.aperturas).toEqual([
      { nombre: NOMBRE_BASE, version: VERSION_BASE },
    ]);
    expect(idb.almacenesCreados).toEqual([
      { nombre: NOMBRE_ALMACEN_VIDEOS, claveDe: CLAVE_ALMACEN_VIDEOS },
    ]);
  });

  it('Dado un registro guardado Cuando se lo obtiene por el identificador del Entrenamiento Entonces devuelve el mismo tipo, tamaño y contenido', async () => {
    // Cubre: 8.10
    const idb = crearDobleIdb();
    const base = crearBaseIndexedDb({ abrir: idb.abrir });
    const registro = registroDeVideo('e1', 'contenido de video');
    await base.guardar(registro);

    const recuperado = await base.obtener('e1');

    expect(recuperado?.tipo).toBe('video/mp4');
    expect(recuperado?.tamanioBytes).toBe(registro.tamanioBytes);
    expect(recuperado?.blob).toBe(registro.blob);
    expect(recuperado?.blob.size).toBe(registro.blob.size);
  });

  it('Dado un identificador sin registro conservado Cuando se lo obtiene Entonces devuelve indefinido sin alterar el estado', async () => {
    // Cubre: 8.10
    const idb = crearDobleIdb();
    const base = crearBaseIndexedDb({ abrir: idb.abrir });
    await base.guardar(registroDeVideo('e1'));

    const recuperado = await base.obtener('inexistente');

    expect(recuperado).toBeUndefined();
    expect([...idb.registros.keys()]).toEqual(['e1']);
  });

  it('Dado un almacén que rechaza la escritura por falta de espacio Cuando se guarda un registro Entonces falla con ErrorEspacioInsuficiente', async () => {
    // Cubre: 8.12
    const idb = crearDobleIdb({ alEscribir: errorDeCuota() });
    const base = crearBaseIndexedDb({ abrir: idb.abrir });

    const fallo = await base.guardar(registroDeVideo('e1')).catch(
      (error: unknown) => error,
    );

    expect(fallo).toBeInstanceOf(ErrorEspacioInsuficiente);
  });

  it('Dado un registro previo y una escritura rechazada por cuota Cuando se guarda otro registro Entonces aborta la transacción y conserva sin cambios lo previo', async () => {
    // Cubre: 8.12
    const fallos: FallosIdb = {};
    const idb = crearDobleIdb(fallos);
    const base = crearBaseIndexedDb({ abrir: idb.abrir });
    await base.guardar(registroDeVideo('e1'));
    fallos.alEscribir = errorDeCuota();

    await base.guardar(registroDeVideo('e2')).catch(() => undefined);

    expect([...idb.registros.keys()]).toEqual(['e1']);
    expect(idb.abortos).toBe(1);
  });

  it('Dado un fallo de escritura ajeno a la cuota Cuando se guarda un registro Entonces falla con ErrorAlmacenamiento y no con espacio insuficiente', async () => {
    // Cubre: 8.12
    const idb = crearDobleIdb({ alEscribir: new Error('fallo interno') });
    const base = crearBaseIndexedDb({ abrir: idb.abrir });

    const fallo = await base.guardar(registroDeVideo('e1')).catch(
      (error: unknown) => error,
    );

    expect(fallo).toBeInstanceOf(ErrorAlmacenamiento);
    expect(fallo).not.toBeInstanceOf(ErrorEspacioInsuficiente);
  });

  it('Dada una base que no se puede abrir Cuando se intenta guardar un registro Entonces falla con ErrorAlmacenamiento', async () => {
    // Cubre: 8.12
    const idb = crearDobleIdb({ alAbrir: new Error('IndexedDB no disponible') });
    const base = crearBaseIndexedDb({ abrir: idb.abrir });

    const fallo = await base.guardar(registroDeVideo('e1')).catch(
      (error: unknown) => error,
    );

    expect(fallo).toBeInstanceOf(ErrorAlmacenamiento);
  });

  it('Dado un registro conservado Cuando se lo borra dos veces Entonces el borrado es idempotente y deja el almacén sin ese registro', async () => {
    // Cubre: 8.10
    const idb = crearDobleIdb();
    const base = crearBaseIndexedDb({ abrir: idb.abrir });
    await base.guardar(registroDeVideo('e1'));
    await base.borrar('e1');

    await base.borrar('e1');

    expect(idb.registros.size).toBe(0);
  });

  it('Dada una base abierta una vez Cuando se ejecutan varias operaciones Entonces reutiliza la apertura y usa transacciones readwrite', async () => {
    // Cubre: 8.12
    const idb = crearDobleIdb();
    const base = crearBaseIndexedDb({ abrir: idb.abrir });
    await base.guardar(registroDeVideo('e1'));

    await base.obtener('e1');

    expect(idb.aperturas).toHaveLength(1);
    expect(idb.modos).toEqual(['readwrite', 'readwrite']);
  });
});
