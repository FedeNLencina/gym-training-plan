/**
 * Tests de VideoEnlace.
 *
 * VideoEnlace presenta el video de un Entrenamiento cuya Fuente_Video es
 * "enlace" mediante un reproductor embebido que apunta al Enlace_Video (6.10).
 * Delega la traducción del enlace a fuente reproducible en `resolverEmbebido`
 * del dominio: un `iframe` embebido para YouTube y Vimeo, un `<video>` nativo
 * para enlaces directos a archivo, y el mensaje "Video no disponible" cuando el
 * enlace está vacío o no es una dirección web (6.6).
 *
 * Consultas sólo por rol, texto o etiqueta accesible; una sola interacción por
 * test.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import VideoEnlace, { MENSAJE_VIDEO_NO_DISPONIBLE } from './VideoEnlace';

describe('VideoEnlace', () => {
  it('Dado un enlace de YouTube Cuando se presenta el video Entonces monta un reproductor embebido hacia ese enlace', () => {
    // Cubre: 6.10
    render(<VideoEnlace enlace="https://www.youtube.com/watch?v=abc123" />);

    const marco = screen.getByTitle('Video del entrenamiento');
    expect(marco).toHaveAttribute(
      'src',
      'https://www.youtube.com/embed/abc123',
    );
  });

  it('Dado un enlace directo a un archivo de video Cuando se presenta el video Entonces monta un reproductor nativo hacia ese enlace', () => {
    // Cubre: 6.10
    render(<VideoEnlace enlace="https://cdn.ejemplo.com/rutina.mp4" />);

    const video = screen.getByLabelText('Video del entrenamiento');
    expect(video).toHaveAttribute('src', 'https://cdn.ejemplo.com/rutina.mp4');
    expect(video).toHaveAttribute('controls');
  });

  it('Dado un Enlace_Video vacío Cuando se presenta el video Entonces presenta el mensaje de video no disponible', () => {
    // Cubre: 6.6
    render(<VideoEnlace enlace="" />);

    expect(screen.getByText(MENSAJE_VIDEO_NO_DISPONIBLE)).toBeInTheDocument();
  });

  it('Dado un enlace que no es una dirección web Cuando se presenta el video Entonces presenta el mensaje de video no disponible', () => {
    // Cubre: 6.6
    render(<VideoEnlace enlace="esto no es un enlace" />);

    expect(screen.getByText(MENSAJE_VIDEO_NO_DISPONIBLE)).toBeInTheDocument();
  });
});
