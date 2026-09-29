/**
 * Doble en memoria del AlmacenVideos (diseño: `crearAlmacenVideos`).
 *
 * Sustituye a IndexedDB en las pruebas: mismas firmas asincrónicas, estado en un
 * `Map` y fallos inyectables (lectura, escritura, espacio insuficiente) para
 * poder ejercitar los caminos de error sin depender del navegador.
 *
 * Cubre: 10.8
 */

import {
  LIMITE_VIDEO_BYTES,
  TIPOS_VIDEO_ADMITIDOS,
  esTipoVideoAdmitido,
} from '../tiposDominio';
import {
  errorAlmacenamiento,
  errorCarga,
  errorEspacioInsuficiente,
  errorVideoAusente,
} from './erroresFalsos';

export { LIMITE_VIDEO_BYTES, TIPOS_VIDEO_ADMITIDOS };

/** Registro conservado por el almacén. */
export type RegistroVideo = {
  idEntrenamiento: string;
  /** Contenido binario tal como fue entregado. */
  blob: unknown;
  tipo: string;
  tamanioBytes: number;
  nombre: string;
};

/**
 * Archivo entrante. Admite tanto un `File` del navegador (`name`, `type`,
 * `size`) como un descriptor en español producido por los generadores.
 */
export type ArchivoEntrante = {
  name?: string;
  nombre?: string;
  type?: string;
  tipo?: string;
  size?: number;
  tamanioBytes?: number;
  contenido?: unknown;
};

export type AlmacenVideosEnMemoria = {
  guardarVideo: (
    idEntrenamiento: string,
    archivo: ArchivoEntrante,
  ) => Promise<{ tipo: string; tamanioBytes: number }>;
  obtenerVideo: (idEntrenamiento: string) => Promise<unknown>;
  eliminarVideo: (idEntrenamiento: string) => Promise<void>;
  simularFalloLectura: (activo?: boolean) => void;
  simularFalloEscritura: (activo?: boolean) => void;
  simularEspacioInsuficiente: (activo?: boolean) => void;
  /** Copia del contenido almacenado, para aserciones. */
  videosAlmacenados: () => RegistroVideo[];
  tieneVideo: (idEntrenamiento: string) => boolean;
  /** Registro de llamadas recibidas, para verificar interacciones. */
  llamadas: {
    guardarVideo: { idEntrenamiento: string; archivo: ArchivoEntrante }[];
    obtenerVideo: string[];
    eliminarVideo: string[];
  };
};

export function crearAlmacenVideosEnMemoria({
  videosIniciales = [],
}: { videosIniciales?: RegistroVideo[] } = {}): AlmacenVideosEnMemoria {
  const videos = new Map<string, RegistroVideo>();
  for (const registro of videosIniciales) {
    videos.set(registro.idEntrenamiento, { ...registro });
  }

  const fallos = {
    lectura: false,
    escritura: false,
    espacioInsuficiente: false,
  };

  const llamadas: AlmacenVideosEnMemoria['llamadas'] = {
    guardarVideo: [],
    obtenerVideo: [],
    eliminarVideo: [],
  };

  return {
    /** Valida tipo y tamaño y conserva el binario bajo el id del Entrenamiento. */
    async guardarVideo(idEntrenamiento, archivo) {
      llamadas.guardarVideo.push({ idEntrenamiento, archivo });
      if (fallos.espacioInsuficiente) throw errorEspacioInsuficiente();
      if (fallos.escritura) throw errorAlmacenamiento();

      const tipo = archivo.type ?? archivo.tipo ?? '';
      const tamanioBytes = archivo.size ?? archivo.tamanioBytes ?? 0;
      const nombre = archivo.name ?? archivo.nombre ?? '';

      if (!esTipoVideoAdmitido(tipo)) {
        throw errorAlmacenamiento(`Tipo de video no admitido: ${tipo}`);
      }
      if (tamanioBytes > LIMITE_VIDEO_BYTES) {
        throw errorEspacioInsuficiente('El video supera el tamaño máximo');
      }

      videos.set(idEntrenamiento, {
        idEntrenamiento,
        blob: archivo.contenido ?? archivo,
        tipo,
        tamanioBytes,
        nombre,
      });
      return { tipo, tamanioBytes };
    },

    /** Devuelve el binario conservado. */
    async obtenerVideo(idEntrenamiento) {
      llamadas.obtenerVideo.push(idEntrenamiento);
      if (fallos.lectura) throw errorCarga('Fallo al leer el video');
      const registro = videos.get(idEntrenamiento);
      if (registro === undefined) throw errorVideoAusente();
      return registro.blob;
    },

    /** Borrado idempotente. */
    async eliminarVideo(idEntrenamiento) {
      llamadas.eliminarVideo.push(idEntrenamiento);
      if (fallos.escritura) throw errorAlmacenamiento();
      videos.delete(idEntrenamiento);
    },

    // --- Controles de prueba -------------------------------------------------

    simularFalloLectura(activo = true) {
      fallos.lectura = activo;
    },
    simularFalloEscritura(activo = true) {
      fallos.escritura = activo;
    },
    simularEspacioInsuficiente(activo = true) {
      fallos.espacioInsuficiente = activo;
    },
    videosAlmacenados() {
      return [...videos.values()].map((registro) => ({ ...registro }));
    },
    tieneVideo(idEntrenamiento) {
      return videos.has(idEntrenamiento);
    },
    llamadas,
  };
}
