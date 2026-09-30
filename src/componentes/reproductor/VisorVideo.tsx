/**
 * VisorVideo: área de video del Reproductor_Entrenamiento.
 *
 * Despacha según la Fuente_Video del Entrenamiento. Con fuente "enlace" delega
 * en `VideoEnlace`, que monta el reproductor embebido apuntando al Enlace_Video
 * (6.10). Con fuente "archivo" delega en `VideoArchivo`, que pide el
 * Archivo_Video al AlmacenVideos del ContextoServicios y monta el reproductor
 * nativo (6.11), mostrando el indicador de carga mientras espera (6.12). En
 * ausencia de video reproducible se presenta "Video no disponible" (6.6), sin
 * bloquear la lista de Ejercicios ni las acciones del reproductor.
 *
 * El envoltorio mantiene el área del video como región accesible, de modo que
 * la ausencia de video ocupe el mismo lugar que el reproductor.
 *
 * Cubre: 6.6, 6.10, 6.11, 6.12
 */
import { type ReactElement } from 'react';

import type { Entrenamiento } from '../../dominio/modelos';
import { usarServicios } from '../../estado/ContextoServicios';
import VideoArchivo from './VideoArchivo';
import VideoEnlace from './VideoEnlace';

/** Nombre accesible del área del video, distinto del reproductor interno. */
export const REGION_VIDEO = 'Reproductor de video';

export type PropiedadesVisorVideo = {
  entrenamiento: Entrenamiento;
};

export default function VisorVideo({
  entrenamiento,
}: PropiedadesVisorVideo): ReactElement {
  const { almacenVideos } = usarServicios();

  return (
    <div className="visor-video" aria-label={REGION_VIDEO}>
      {entrenamiento.fuenteVideo === 'archivo' ? (
        <VideoArchivo
          idEntrenamiento={entrenamiento.id}
          almacenVideos={almacenVideos}
        />
      ) : (
        <VideoEnlace enlace={entrenamiento.enlaceVideo} />
      )}
    </div>
  );
}
