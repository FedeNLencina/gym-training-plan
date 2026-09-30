/**
 * VideoEnlace: reproductor del video de un Entrenamiento cuya Fuente_Video es
 * "enlace".
 *
 * No decide por sí mismo cómo interpretar el enlace: delega en `resolverEmbebido`
 * del dominio, que devuelve la fuente concreta a montar. Un `iframe` embebido
 * para YouTube y Vimeo, un `<video controls>` nativo para enlaces directos a
 * archivo (6.10), o la ausencia de fuente cuando el Enlace_Video está vacío o no
 * es una dirección web, caso en el que presenta el mensaje "Video no disponible"
 * y no bloquea el resto de la ejecución del entrenamiento (6.6).
 *
 * Cubre: 6.6, 6.10
 */
import { type ReactElement } from 'react';

import { resolverEmbebido } from '../../dominio/enlacesVideo';

/** Nombre accesible común a las dos formas de reproductor. */
export const NOMBRE_VIDEO = 'Video del entrenamiento';
/** Mensaje exigido por el criterio 6.6 ante la ausencia de video reproducible. */
export const MENSAJE_VIDEO_NO_DISPONIBLE = 'Video no disponible';

export type PropiedadesVideoEnlace = {
  enlace: string;
};

export default function VideoEnlace({
  enlace,
}: PropiedadesVideoEnlace): ReactElement {
  const fuente = resolverEmbebido(enlace);

  if (fuente.clase === 'embebido') {
    return (
      <iframe
        className="visor-video__marco"
        title={NOMBRE_VIDEO}
        src={fuente.url}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (fuente.clase === 'nativo') {
    return (
      <video
        className="visor-video__nativo"
        aria-label={NOMBRE_VIDEO}
        src={fuente.url}
        controls
      />
    );
  }

  return <p className="visor-video__mensaje">{MENSAJE_VIDEO_NO_DISPONIBLE}</p>;
}
