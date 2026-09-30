/**
 * Acceso a IndexedDB: única puerta de la aplicación al almacén binario del
 * navegador.
 *
 * Los metadatos viven en `localStorage`, pero un Archivo_Video de hasta 50 MB no
 * cabe ahí: se conserva como `Blob` en la base `atlas-gym`, almacén `videos`,
 * con el identificador del Entrenamiento como clave. Toda operación corre en una
 * transacción `readwrite` atómica, de modo que un rechazo por cuota aborte la
 * transacción completa y no deje registros parciales (8.12).
 *
 * La dependencia de `idb` se inyecta (`abrir`) para que las pruebas usen un
 * doble y no dependan de la implementación de IndexedDB del entorno.
 *
 * Cubre: 8.10, 8.12
 */

import { openDB } from 'idb';

import {
  ErrorAlmacenamiento,
  ErrorEspacioInsuficiente,
} from '../dominio/errores';

/** Nombre de la base de datos del prototipo. */
export const NOMBRE_BASE = 'atlas-gym';
/** Almacén de los Archivos_Video. */
export const NOMBRE_ALMACEN_VIDEOS = 'videos';
/** Clave del almacén: el identificador del Entrenamiento asociado. */
export const CLAVE_ALMACEN_VIDEOS = 'idEntrenamiento';
/** Versión del esquema; se incrementa sólo al cambiar la estructura. */
export const VERSION_BASE = 1;

/** Registro conservado en el almacén `videos`. */
export type RegistroVideo = {
  idEntrenamiento: string;
  blob: Blob;
  tipo: string;
  tamanioBytes: number;
  nombre: string;
};

/**
 * Todas las transacciones son `readwrite`: el tipo lo fija explícitamente para
 * que ninguna operación pueda abrirse en un modo que no sea atómico.
 */
export type ModoTransaccion = 'readwrite';

/** Almacén dentro de una transacción, reducido a lo que el prototipo usa. */
export type AlmacenVideosIdb = {
  put: (valor: RegistroVideo) => Promise<unknown>;
  get: (clave: string) => Promise<RegistroVideo | undefined>;
  delete: (clave: string) => Promise<unknown>;
};

/** Transacción en curso. `done` se resuelve al confirmarse. */
export type TransaccionIdb = {
  store: AlmacenVideosIdb;
  done: Promise<void>;
  abort: () => void;
};

/** Base en proceso de mejora, disponible sólo durante la apertura. */
export type BaseEnMejora = {
  objectStoreNames: { contains: (nombre: string) => boolean };
  createObjectStore: (nombre: string, opciones: { keyPath: string }) => void;
};

/** Base abierta. */
export type BaseAbierta = {
  transaction: (nombre: string, modo: ModoTransaccion) => TransaccionIdb;
  close: () => void;
};

/** Apertura de la base, con la mejora del esquema como devolución de llamada. */
export type AbrirBase = (
  nombre: string,
  version: number,
  opciones: { upgrade: (base: BaseEnMejora) => void },
) => Promise<BaseAbierta>;

/** Contrato que consume `crearAlmacenVideos({ base })`. */
export type BaseIndexedDb = {
  /** Conserva el registro; sobrescribe el existente con la misma clave. */
  guardar: (registro: RegistroVideo) => Promise<void>;
  /** Devuelve el registro conservado, o `undefined` si no existe. */
  obtener: (idEntrenamiento: string) => Promise<RegistroVideo | undefined>;
  /** Borrado idempotente. */
  borrar: (idEntrenamiento: string) => Promise<void>;
  /** Cierra la conexión; la siguiente operación vuelve a abrirla. */
  cerrar: () => Promise<void>;
};

/** Apertura real, sobre el envoltorio con promesas `idb`. */
const abrirConIdb: AbrirBase = async (nombre, version, { upgrade }) => {
  const base = await openDB(nombre, version, {
    upgrade(baseEnMejora) {
      upgrade({
        objectStoreNames: {
          contains: (nombreAlmacen) =>
            baseEnMejora.objectStoreNames.contains(nombreAlmacen),
        },
        createObjectStore: (nombreAlmacen, opciones) => {
          baseEnMejora.createObjectStore(nombreAlmacen, opciones);
        },
      });
    },
  });

  return {
    transaction(nombreAlmacen, modo) {
      const transaccion = base.transaction(nombreAlmacen, modo);
      const almacen = transaccion.store;
      return {
        store: {
          put: (valor) => almacen.put(valor),
          get: async (clave) => {
            const valor: unknown = await almacen.get(clave);
            return esRegistroVideo(valor) ? valor : undefined;
          },
          delete: (clave) => almacen.delete(clave),
        },
        done: transaccion.done,
        abort: () => transaccion.abort(),
      };
    },
    close: () => base.close(),
  };
};

/** Descarta contenido de forma desconocida en lugar de propagarlo hacia arriba. */
function esRegistroVideo(valor: unknown): valor is RegistroVideo {
  if (typeof valor !== 'object' || valor === null) return false;
  const candidato = valor as Partial<RegistroVideo>;
  return (
    typeof candidato.idEntrenamiento === 'string' &&
    candidato.blob instanceof Blob &&
    typeof candidato.tipo === 'string' &&
    typeof candidato.tamanioBytes === 'number'
  );
}

/**
 * Reconoce el rechazo por cuota agotada. El navegador lo señala con el nombre
 * `QuotaExceededError`; el código heredado 22 cubre implementaciones viejas.
 */
function esCuotaAgotada(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const candidato = error as { name?: unknown; code?: unknown };
  return candidato.name === 'QuotaExceededError' || candidato.code === 22;
}

/** Traduce cualquier fallo del navegador a la jerarquía de errores de dominio. */
function traducirFallo(error: unknown): ErrorAlmacenamiento {
  if (error instanceof ErrorAlmacenamiento) return error;
  if (esCuotaAgotada(error)) return new ErrorEspacioInsuficiente();
  return new ErrorAlmacenamiento('No pudimos guardar el video');
}

export function crearBaseIndexedDb({
  abrir = abrirConIdb,
}: { abrir?: AbrirBase } = {}): BaseIndexedDb {
  // La apertura se memoriza para no repetirla en cada operación, y se descarta
  // ante un fallo para que el siguiente intento vuelva a probar.
  let apertura: Promise<BaseAbierta> | null = null;

  const abrirBase = (): Promise<BaseAbierta> => {
    if (apertura === null) {
      apertura = abrir(NOMBRE_BASE, VERSION_BASE, {
        upgrade(base) {
          if (!base.objectStoreNames.contains(NOMBRE_ALMACEN_VIDEOS)) {
            base.createObjectStore(NOMBRE_ALMACEN_VIDEOS, {
              keyPath: CLAVE_ALMACEN_VIDEOS,
            });
          }
        },
      }).catch((error: unknown) => {
        apertura = null;
        throw error;
      });
    }
    return apertura;
  };

  /**
   * Corre la acción dentro de una única transacción `readwrite` y la confirma.
   * Ante cualquier fallo aborta, de modo que la transacción no deje escrituras
   * a medias, y traduce el error antes de propagarlo.
   */
  async function enTransaccion<T>(
    accion: (almacen: AlmacenVideosIdb) => Promise<T>,
  ): Promise<T> {
    let transaccion: TransaccionIdb | null = null;
    try {
      const base = await abrirBase();
      transaccion = base.transaction(NOMBRE_ALMACEN_VIDEOS, 'readwrite');
      const resultado = await accion(transaccion.store);
      await transaccion.done;
      return resultado;
    } catch (error) {
      if (transaccion !== null) {
        // El aborto hace que `done` se rechace: se consume aquí para no dejar
        // un rechazo sin atender, y el error propagado es el original.
        transaccion.done.catch(() => undefined);
        try {
          transaccion.abort();
        } catch {
          // La transacción ya estaba abortada o confirmada: nada que deshacer.
        }
      }
      throw traducirFallo(error);
    }
  }

  return {
    async guardar(registro) {
      await enTransaccion(async (almacen) => {
        await almacen.put(registro);
      });
    },

    async obtener(idEntrenamiento) {
      return enTransaccion((almacen) => almacen.get(idEntrenamiento));
    },

    async borrar(idEntrenamiento) {
      await enTransaccion(async (almacen) => {
        await almacen.delete(idEntrenamiento);
      });
    },

    async cerrar() {
      if (apertura === null) return;
      const pendiente = apertura;
      apertura = null;
      const base = await pendiente.catch(() => null);
      base?.close();
    },
  };
}
