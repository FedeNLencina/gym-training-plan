/**
 * Tests de VisorVideo.
 *
 * VisorVideo despacha según la Fuente_Video del Entrenamiento: monta un
 * reproductor embebido hacia el Enlace_Video cuando la fuente es "enlace"
 * (6.10), o pide el Archivo_Video al AlmacenVideos del ContextoServicios y monta
 * un reproductor nativo cuando la fuente es "archivo" (6.11), presentando el
 * indicador de carga mientras espera la respuesta (6.12). En ausencia de video
 * reproducible presenta el mensaje "Video no disponible" (6.6).
 *
 * El AlmacenVideos se inyecta por el ContextoServicios con un doble inline.
 * Consultas sólo por rol, texto o etiqueta accesible; una sola interacción por
 * test.
 */
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { crearEntrenamiento } from '../../dominio/modelos';
import {
  ProveedorServicios,
  type AlmacenVideosDeVistas,
} from '../../estado/ContextoServicios';
import { crearRelojFalso } from '../../tests/dobles/relojFalso';
import { crearRepositorioEnMemoria } from '../../tests/dobles/repositorioEnMemoria';
import VisorVideo from './VisorVideo';
import { MENSAJE_VIDEO_NO_DISPONIBLE } from './VideoEnlace';

const URL_OBJETO = 'blob:https://atlas/objeto-visor';

beforeEach(() => {
  URL.createObjectURL = vi
    .fn(() => URL_OBJETO) as unknown as typeof URL.createObjectURL;
  URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderizar(
  entrenamiento: ReturnType<typeof crearEntrenamiento>,
  almacenVideos: AlmacenVideosDeVistas | null = null,
): void {
  render(
    <ProveedorServicios
      repositorio={crearRepositorioEnMemoria()}
      reloj={crearRelojFalso()}
      almacenVideos={almacenVideos}
    >
      <VisorVideo entrenamiento={entrenamiento} />
    </ProveedorServicios>,
  );
}

describe('VisorVideo', () => {
  it('Dado un Entrenamiento con Fuente_Video enlace Cuando se presenta el video Entonces monta un reproductor embebido hacia su Enlace_Video', () => {
    // Cubre: 6.10
    renderizar(
      crearEntrenamiento({
        id: 'e1',
        fuenteVideo: 'enlace',
        enlaceVideo: 'https://vimeo.com/76979871',
      }),
    );

    expect(screen.getByTitle('Video del entrenamiento')).toHaveAttribute(
      'src',
      'https://player.vimeo.com/video/76979871',
    );
  });

  it('Dado un Entrenamiento enlace sin Enlace_Video Cuando se presenta el video Entonces presenta el mensaje de video no disponible', () => {
    // Cubre: 6.6
    renderizar(
      crearEntrenamiento({ id: 'e1', fuenteVideo: 'enlace', enlaceVideo: '' }),
    );

    expect(screen.getByText(MENSAJE_VIDEO_NO_DISPONIBLE)).toBeInTheDocument();
  });

  it('Dado un Entrenamiento con Fuente_Video archivo Cuando la lectura se resuelve Entonces monta un reproductor nativo con controles', async () => {
    // Cubre: 6.11
    const blob = new Blob(['contenido'], { type: 'video/mp4' });
    const almacen: AlmacenVideosDeVistas = {
      obtenerVideo: () => Promise.resolve(blob),
    };
    renderizar(
      crearEntrenamiento({
        id: 'e1',
        fuenteVideo: 'archivo',
        videoArchivo: { nombre: 'r.mp4', tipo: 'video/mp4', tamanioBytes: 9 },
      }),
      almacen,
    );

    const video = await screen.findByLabelText('Video del entrenamiento');
    expect(video).toHaveAttribute('controls');
  });

  it('Dado un Entrenamiento archivo sin Archivo_Video en el AlmacenVideos Cuando la lectura se rechaza Entonces presenta el mensaje de video no disponible', async () => {
    // Cubre: 6.6
    const almacen: AlmacenVideosDeVistas = {
      obtenerVideo: () => Promise.reject(new Error('ausente')),
    };
    renderizar(
      crearEntrenamiento({
        id: 'e1',
        fuenteVideo: 'archivo',
        videoArchivo: { nombre: 'r.mp4', tipo: 'video/mp4', tamanioBytes: 9 },
      }),
      almacen,
    );

    expect(
      await screen.findByText(MENSAJE_VIDEO_NO_DISPONIBLE),
    ).toBeInTheDocument();
  });
});
