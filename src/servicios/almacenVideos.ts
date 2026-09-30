/**
 * Servicio AlmacenVideos: única vía de la aplicación para conservar, leer y
 * borrar el Archivo_Video de un Entrenamiento.
 *
 * El servicio aporta la política (tipo admitido y tamaño máximo) y la
 * traducción a la jerarquía de errores de dominio; la atomicidad y el diálogo
 * con el navegador quedan en `crearBaseIndexedDb`, que se inyecta como `base`.
 * Así el Panel_Admin puede distinguir un rechazo por formato de un rechazo por
 * falta de espacio (7.18, 7.19) sin conocer IndexedDB.
 *
 * Cubre: 8.10, 8.12, 8.13, 7.18, 7.19
 */

import {
  ErrorAlmacenamiento,
  ErrorVideoAusente,
  ErrorEspacioInsuficiente,
} from '../dominio/errores';
import { LIMITE_VIDEO_BYTES, esTipoVideoAdmitido } from '../dominio/modelos';
import type { BaseIndexedDb } from '../infra/baseIndexedDb';

/** Mensaje de rechazo por formato, en los términos del Panel_Admin (7.15). */
export const MENSAJE_FORMATO_NO_ACEPTADO =
  'Formato de video no aceptado: subí un archivo mp4 o webm';
/** Mensaje de rechazo por tamaño, en los términos del Panel_Admin (7.16). */
export const MENSAJE_TAMANIO_EXCEDIDO =
  'El video supera el tamaño máximo de 50 MB';

/**
 * Descriptor de archivo: alternativa al `File` del navegador cuando el tamaño
 * declarado no coincide con el del contenido, como en las pruebas que ejercitan
 * el límite de 50 MB sin materializar 50 MB.
 */
export type DescriptorArchivoVideo = {
  contenido: Blob;
  nombre?: string;
  tipo?: string;
  tamanioBytes?: number;
};

/** Archivo entrante: el `File` de la subida o su descriptor equivalente. */
export type ArchivoVideoEntrante = Blob | DescriptorArchivoVideo;

/** Confirmación devuelta al conservar un Archivo_Video. */
export type MetadatosVideo = {
  tipo: string;
  tamanioBytes: number;
};

export type AlmacenVideos = {
  /** Valida tipo y tamaño y conserva el `Blob` bajo el id del Entrenamiento. */
  guardarVideo: (
    idEntrenamiento: string,
    archivo: ArchivoVideoEntrante,
  ) => Promise<MetadatosVideo>;
  /** Devuelve el `Blob` conservado; rechaza si no existe. */
  obtenerVideo: (idEntrenamiento: string) => Promise<Blob>;
  /** Borrado idempotente. */
  eliminarVideo: (idEntrenamiento: string) => Promise<void>;
};

type ArchivoNormalizado = {
  blob: Blob;
  tipo: string;
  tamanioBytes: number;
  nombre: string;
};

/** Unifica el `File` del navegador y el descriptor en una sola forma. */
function normalizarArchivo(
  archivo: ArchivoVideoEntrante,
): ArchivoNormalizado {
  if (archivo instanceof Blob) {
    return {
      blob: archivo,
      tipo: archivo.type,
      tamanioBytes: archivo.size,
      nombre: archivo instanceof File ? archivo.name : '',
    };
  }

  const { contenido } = archivo;
  return {
    blob: contenido,
    tipo: archivo.tipo ?? contenido.type,
    tamanioBytes: archivo.tamanioBytes ?? contenido.size,
    nombre: archivo.nombre ?? '',
  };
}

export function crearAlmacenVideos({
  base,
}: {
  base: BaseIndexedDb;
}): AlmacenVideos {
  return {
    async guardarVideo(idEntrenamiento, archivo) {
      const { blob, tipo, tamanioBytes, nombre } = normalizarArchivo(archivo);

      // La validación precede a toda escritura: un archivo rechazado no llega
      // a abrir transacción y deja el almacén exactamente como estaba.
      if (!esTipoVideoAdmitido(tipo)) {
        throw new ErrorAlmacenamiento(MENSAJE_FORMATO_NO_ACEPTADO);
      }
      if (tamanioBytes > LIMITE_VIDEO_BYTES) {
        throw new ErrorEspacioInsuficiente(MENSAJE_TAMANIO_EXCEDIDO);
      }

      await base.guardar({ idEntrenamiento, blob, tipo, tamanioBytes, nombre });
      return { tipo, tamanioBytes };
    },

    async obtenerVideo(idEntrenamiento) {
      const registro = await base.obtener(idEntrenamiento);
      if (registro === undefined) throw new ErrorVideoAusente();
      return registro.blob;
    },

    async eliminarVideo(idEntrenamiento) {
      await base.borrar(idEntrenamiento);
    },
  };
}
