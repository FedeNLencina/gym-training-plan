/**
 * Tests de VideoArchivo.
 *
 * VideoArchivo presenta el video de un Entrenamiento cuya Fuente_Video es
 * "archivo": solicita el Archivo_Video al AlmacenVideos, crea una URL de objeto
 * a partir del `Blob` y monta un reproductor nativo con controles (6.11).
 * Mientras espera la respuesta presenta un indicador de carga en el área del
 * video (6.12), y si el AlmacenVideos no devuelve el Archivo_Video presenta el
 * mensaje "Video no disponible" (6.6). Al desmontar libera la URL de objeto
 * creada para no filtrar memoria.
 *
 * El AlmacenVideos se sustituye por un doble inline con la sola operación
 * `obtenerVideo`. Consultas sólo por rol, texto o etiqueta accesible; una sola
 * interacción por test.
 */
import { render, screen, waitFor } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type { AlmacenVideosDeVistas } from '../../estado/ContextoServicios';
import VideoArchivo, {
  MENSAJE_VIDEO_NO_DISPONIBLE,
  TEXTO_CARGANDO_VIDEO,
} from './VideoArchivo';

const URL_OBJETO = 'blob:https://atlas/objeto-1';

/** Espías sobre las URL de objeto para verificar creación y liberación. */
let crearUrl: ReturnType<typeof vi.fn>;
let liberarUrl: ReturnType<typeof vi.fn>;

beforeEach(() => {
  crearUrl = vi.fn(() => URL_OBJETO);
  liberarUrl = vi.fn();
  URL.createObjectURL = crearUrl as unknown as typeof URL.createObjectURL;
  URL.revokeObjectURL = liberarUrl as unknown as typeof URL.revokeObjectURL;
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** AlmacenVideos que resuelve el `Blob` pedido. */
function almacenConVideo(blob: Blob): AlmacenVideosDeVistas {
  return { obtenerVideo: () => Promise.resolve(blob) };
}

/** AlmacenVideos que nunca resuelve, para observar el indicador de carga. */
function almacenEnEspera(): AlmacenVideosDeVistas {
  return { obtenerVideo: () => new Promise<Blob>(() => undefined) };
}

/** AlmacenVideos que rechaza la lectura del Archivo_Video. */
function almacenSinVideo(): AlmacenVideosDeVistas {
  return { obtenerVideo: () => Promise.reject(new Error('ausente')) };
}

describe('VideoArchivo', () => {
  it('Dado un AlmacenVideos que aún no responde Cuando se presenta el video Entonces muestra el indicador de carga', () => {
    // Cubre: 6.12
    render(
      <VideoArchivo idEntrenamiento="e1" almacenVideos={almacenEnEspera()} />,
    );

    expect(screen.getByText(TEXTO_CARGANDO_VIDEO)).toBeInTheDocument();
  });

  it('Dado un AlmacenVideos con el Archivo_Video Cuando la lectura se resuelve Entonces monta un reproductor nativo con controles', async () => {
    // Cubre: 6.11
    const blob = new Blob(['contenido'], { type: 'video/mp4' });
    render(
      <VideoArchivo idEntrenamiento="e1" almacenVideos={almacenConVideo(blob)} />,
    );

    const video = await screen.findByLabelText('Video del entrenamiento');
    expect(video).toHaveAttribute('src', URL_OBJETO);
    expect(video).toHaveAttribute('controls');
  });

  it('Dado un AlmacenVideos sin el Archivo_Video Cuando la lectura se rechaza Entonces presenta el mensaje de video no disponible', async () => {
    // Cubre: 6.6
    render(
      <VideoArchivo idEntrenamiento="e1" almacenVideos={almacenSinVideo()} />,
    );

    expect(
      await screen.findByText(MENSAJE_VIDEO_NO_DISPONIBLE),
    ).toBeInTheDocument();
  });

  it('Dado un reproductor nativo montado Cuando el componente se desmonta Entonces libera la URL de objeto creada', async () => {
    // Cubre: 6.11
    const blob = new Blob(['contenido'], { type: 'video/mp4' });
    const { unmount } = render(
      <VideoArchivo idEntrenamiento="e1" almacenVideos={almacenConVideo(blob)} />,
    );
    await screen.findByLabelText('Video del entrenamiento');

    unmount();

    await waitFor(() => expect(liberarUrl).toHaveBeenCalledWith(URL_OBJETO));
  });

  it('Dado un AlmacenVideos ausente Cuando se presenta el video Entonces presenta el mensaje de video no disponible', () => {
    // Cubre: 6.6
    render(<VideoArchivo idEntrenamiento="e1" almacenVideos={null} />);

    expect(screen.getByText(MENSAJE_VIDEO_NO_DISPONIBLE)).toBeInTheDocument();
  });
});
