/**
 * Tests unitarios de la validación y resolución de Enlace_Video.
 *
 * Se cubren las tres formas de enlace que el diseño contempla para la
 * Fuente_Video `enlace` (YouTube, Vimeo y archivo directo) y los dos casos que
 * no son reproducibles: la cadena vacía y el texto que no es una dirección web.
 *
 * Cubre: 6.10, 7.10
 */

import { describe, it, expect } from 'vitest';

import {
  MENSAJE_ENLACE_VIDEO_INVALIDO,
  esEnlaceVideoValido,
  resolverEmbebido,
} from './enlacesVideo';

describe('esEnlaceVideoValido', () => {
  it('Dado un enlace de YouTube Cuando se valida Entonces lo acepta', () => {
    // Cubre: 7.10
    expect(esEnlaceVideoValido('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      true,
    );
  });

  it('Dado un enlace corto de YouTube Cuando se valida Entonces lo acepta', () => {
    // Cubre: 7.10
    expect(esEnlaceVideoValido('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
  });

  it('Dado un enlace de Vimeo Cuando se valida Entonces lo acepta', () => {
    // Cubre: 7.10
    expect(esEnlaceVideoValido('https://vimeo.com/76979871')).toBe(true);
  });

  it('Dado un enlace directo a un archivo de video Cuando se valida Entonces lo acepta', () => {
    // Cubre: 7.10
    expect(esEnlaceVideoValido('https://cdn.ejemplo.com/rutinas/fuerza.mp4')).toBe(
      true,
    );
  });

  it('Dado un enlace con protocolo http Cuando se valida Entonces lo acepta', () => {
    // Cubre: 7.10
    expect(esEnlaceVideoValido('http://ejemplo.com/video.webm')).toBe(true);
  });

  it('Dado un enlace con espacios alrededor Cuando se valida Entonces lo acepta', () => {
    // Cubre: 7.10
    expect(esEnlaceVideoValido('  https://vimeo.com/76979871  ')).toBe(true);
  });

  it('Dada la cadena vacía Cuando se valida Entonces la rechaza', () => {
    // Cubre: 7.10
    expect(esEnlaceVideoValido('')).toBe(false);
  });

  it('Dada una cadena de sólo espacios Cuando se valida Entonces la rechaza', () => {
    // Cubre: 7.10
    expect(esEnlaceVideoValido('     ')).toBe(false);
  });

  it('Dados textos que no son direcciones web Cuando se validan Entonces los rechaza', () => {
    // Cubre: 7.10
    const invalidos = [
      'no soy un enlace',
      'www.youtube.com/watch?v=abc',
      'youtube.com/watch?v=abc',
      'javascript:alert(1)',
      'ftp://ejemplo.com/video.mp4',
      'data:video/mp4;base64,AAAA',
      'https://',
      'https:// ejemplo.com/video.mp4',
    ];
    invalidos.forEach((enlace) => {
      expect(esEnlaceVideoValido(enlace)).toBe(false);
    });
  });

  it('Dado un valor que no es una cadena Cuando se valida Entonces lo rechaza', () => {
    // Cubre: 7.10
    expect(esEnlaceVideoValido(undefined)).toBe(false);
    expect(esEnlaceVideoValido(null)).toBe(false);
    expect(esEnlaceVideoValido(42)).toBe(false);
  });

  it('Dado el mensaje de validación Cuando se consulta Entonces es el del criterio', () => {
    // Cubre: 7.10
    expect(MENSAJE_ENLACE_VIDEO_INVALIDO).toBe('Ingresá un enlace de video válido');
  });
});

describe('resolverEmbebido', () => {
  it('Dado un enlace de YouTube con parámetro v Cuando se resuelve Entonces devuelve el embebido de YouTube', () => {
    // Cubre: 6.10
    expect(resolverEmbebido('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({
      clase: 'embebido',
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    });
  });

  it('Dado un enlace corto de YouTube Cuando se resuelve Entonces devuelve el embebido de YouTube', () => {
    // Cubre: 6.10
    expect(resolverEmbebido('https://youtu.be/dQw4w9WgXcQ')).toEqual({
      clase: 'embebido',
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    });
  });

  it('Dado un enlace de YouTube ya embebido Cuando se resuelve Entonces conserva el identificador', () => {
    // Cubre: 6.10
    expect(resolverEmbebido('https://www.youtube.com/embed/dQw4w9WgXcQ')).toEqual({
      clase: 'embebido',
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    });
  });

  it('Dado un enlace de YouTube Shorts Cuando se resuelve Entonces devuelve el embebido de YouTube', () => {
    // Cubre: 6.10
    expect(resolverEmbebido('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toEqual({
      clase: 'embebido',
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    });
  });

  it('Dado un enlace de Vimeo Cuando se resuelve Entonces devuelve el embebido del reproductor de Vimeo', () => {
    // Cubre: 6.10
    expect(resolverEmbebido('https://vimeo.com/76979871')).toEqual({
      clase: 'embebido',
      url: 'https://player.vimeo.com/video/76979871',
    });
  });

  it('Dado un enlace del reproductor de Vimeo Cuando se resuelve Entonces conserva el identificador', () => {
    // Cubre: 6.10
    expect(resolverEmbebido('https://player.vimeo.com/video/76979871')).toEqual({
      clase: 'embebido',
      url: 'https://player.vimeo.com/video/76979871',
    });
  });

  it('Dado un enlace directo a un mp4 Cuando se resuelve Entonces devuelve una fuente nativa', () => {
    // Cubre: 6.10
    expect(resolverEmbebido('https://cdn.ejemplo.com/rutinas/fuerza.mp4')).toEqual({
      clase: 'nativo',
      url: 'https://cdn.ejemplo.com/rutinas/fuerza.mp4',
    });
  });

  it('Dado un enlace directo a un webm con parámetros Cuando se resuelve Entonces devuelve una fuente nativa', () => {
    // Cubre: 6.10
    expect(resolverEmbebido('https://cdn.ejemplo.com/f.webm?firma=abc')).toEqual({
      clase: 'nativo',
      url: 'https://cdn.ejemplo.com/f.webm?firma=abc',
    });
  });

  it('Dado un enlace web de otro origen Cuando se resuelve Entonces devuelve un embebido genérico', () => {
    // Cubre: 6.10
    expect(resolverEmbebido('https://ejemplo.com/clases/fuerza')).toEqual({
      clase: 'embebido',
      url: 'https://ejemplo.com/clases/fuerza',
    });
  });

  it('Dado un enlace con espacios alrededor Cuando se resuelve Entonces lo normaliza', () => {
    // Cubre: 6.10
    expect(resolverEmbebido('  https://youtu.be/dQw4w9WgXcQ  ')).toEqual({
      clase: 'embebido',
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    });
  });

  it('Dada la cadena vacía Cuando se resuelve Entonces no hay fuente reproducible', () => {
    // Cubre: 6.10
    expect(resolverEmbebido('')).toEqual({ clase: 'ninguno' });
  });

  it('Dado un texto que no es una dirección web Cuando se resuelve Entonces no hay fuente reproducible', () => {
    // Cubre: 6.10
    expect(resolverEmbebido('no soy un enlace')).toEqual({ clase: 'ninguno' });
  });

  it('Dado un enlace de YouTube sin identificador Cuando se resuelve Entonces no hay fuente reproducible', () => {
    // Cubre: 6.10
    expect(resolverEmbebido('https://www.youtube.com/watch')).toEqual({
      clase: 'ninguno',
    });
  });

  it('Dado un valor que no es una cadena Cuando se resuelve Entonces no hay fuente reproducible', () => {
    // Cubre: 6.10
    expect(resolverEmbebido(undefined)).toEqual({ clase: 'ninguno' });
  });
});
