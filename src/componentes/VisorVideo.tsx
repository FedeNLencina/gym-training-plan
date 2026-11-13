import { useEffect, useState, type ReactElement } from 'react';

import type { Video } from '../dominio/modelos';
import { fuenteDeVideo } from '../dominio/reglas';
import { leerVideo } from '../infra/almacen';

type EstadoArchivo = { estado: 'cargando' } | { estado: 'listo'; url: string } | { estado: 'ausente' };

function VideoDeArchivo({ idArchivo, titulo }: { idArchivo: string; titulo: string }): ReactElement {
  const [archivo, setArchivo] = useState<EstadoArchivo>({ estado: 'cargando' });

  useEffect(() => {
    let url: string | null = null;
    let vigente = true;
    leerVideo(idArchivo)
      .then((blob) => {
        if (!vigente) return;
        if (blob === null) return setArchivo({ estado: 'ausente' });
        url = URL.createObjectURL(blob);
        setArchivo({ estado: 'listo', url });
      })
      .catch(() => vigente && setArchivo({ estado: 'ausente' }));
    return () => {
      vigente = false;
      if (url !== null) URL.revokeObjectURL(url);
    };
  }, [idArchivo]);

  if (archivo.estado === 'cargando') return <p role="status">Cargando video…</p>;
  if (archivo.estado === 'ausente') {
    return <p className="mensaje">El video no está disponible en este navegador.</p>;
  }
  return <video className="visor__video" src={archivo.url} controls aria-label={titulo} />;
}

export default function VisorVideo({ video, titulo }: { video: Video; titulo: string }): ReactElement {
  if (video.tipo === 'archivo') {
    return (
      <div className="visor">
        <VideoDeArchivo idArchivo={video.idArchivo} titulo={titulo} />
      </div>
    );
  }
  const fuente = fuenteDeVideo(video.url);
  return (
    <div className="visor">
      {fuente.clase === 'embebido' && (
        <iframe
          className="visor__video"
          src={fuente.url}
          title={titulo}
          allow="accelerometer; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      )}
      {fuente.clase === 'nativo' && (
        <video className="visor__video" src={fuente.url} controls aria-label={titulo} />
      )}
      {fuente.clase === 'ninguno' && <p className="mensaje">El video no está disponible.</p>}
    </div>
  );
}
