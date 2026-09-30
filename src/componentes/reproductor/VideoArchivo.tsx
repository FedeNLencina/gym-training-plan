/**
 * VideoArchivo: reproductor del video de un Entrenamiento cuya Fuente_Video es
 * "archivo".
 *
 * Solicita el Archivo_Video al AlmacenVideos por el identificador del
 * Entrenamiento y, mientras espera la respuesta, presenta un indicador de carga
 * en el área del video (6.12). Cuando el `Blob` llega, crea una URL de objeto a
 * partir de él (`URL.createObjectURL`) y monta un reproductor nativo con
 * controles de reproducción, pausa y posición (6.11); esa URL se libera al
 * desmontar o al cambiar de archivo (`URL.revokeObjectURL`) para no filtrar
 * memoria. Si el AlmacenVideos no devuelve el Archivo_Video —o no hay
 * AlmacenVideos disponible— presenta el mensaje "Video no disponible" sin
 * bloquear el resto de la ejecución del entrenamiento (6.6).
 *
 * Cubre: 6.6, 6.11, 6.12
 */
import { useEffect, useState, type ReactElement } from 'react';

import type { AlmacenVideosDeVistas } from '../../estado/ContextoServicios';
import {
  MENSAJE_VIDEO_NO_DISPONIBLE,
  NOMBRE_VIDEO,
} from './VideoEnlace';

export { MENSAJE_VIDEO_NO_DISPONIBLE };

/** Texto del indicador de carga del área del video (6.12). */
export const TEXTO_CARGANDO_VIDEO = 'Cargando video';

type EstadoVideo =
  | { fase: 'cargando' }
  | { fase: 'listo'; url: string }
  | { fase: 'ausente' };

export type PropiedadesVideoArchivo = {
  idEntrenamiento: string;
  almacenVideos: AlmacenVideosDeVistas | null;
};

export default function VideoArchivo({
  idEntrenamiento,
  almacenVideos,
}: PropiedadesVideoArchivo): ReactElement {
  const [estado, setEstado] = useState<EstadoVideo>(
    almacenVideos === null ? { fase: 'ausente' } : { fase: 'cargando' },
  );

  useEffect(() => {
    if (almacenVideos === null) {
      setEstado({ fase: 'ausente' });
      return;
    }

    let vigente = true;
    let urlCreada: string | null = null;
    setEstado({ fase: 'cargando' });

    almacenVideos
      .obtenerVideo(idEntrenamiento)
      .then((blob) => {
        if (!vigente) return;
        urlCreada = URL.createObjectURL(blob);
        setEstado({ fase: 'listo', url: urlCreada });
      })
      .catch(() => {
        if (!vigente) return;
        setEstado({ fase: 'ausente' });
      });

    return () => {
      vigente = false;
      if (urlCreada !== null) URL.revokeObjectURL(urlCreada);
    };
  }, [almacenVideos, idEntrenamiento]);

  if (estado.fase === 'cargando') {
    return (
      <p className="visor-video__mensaje" role="status">
        {TEXTO_CARGANDO_VIDEO}
      </p>
    );
  }

  if (estado.fase === 'ausente') {
    return <p className="visor-video__mensaje">{MENSAJE_VIDEO_NO_DISPONIBLE}</p>;
  }

  return (
    <video
      className="visor-video__nativo"
      aria-label={NOMBRE_VIDEO}
      src={estado.url}
      controls
    />
  );
}
