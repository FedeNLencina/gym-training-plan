/**
 * Validación y resolución de Enlace_Video.
 *
 * Dos responsabilidades separadas a propósito:
 *
 * - `esEnlaceVideoValido` es el predicado que usa el formulario del Panel_Admin
 *   para decidir si acepta lo que escribió el Administrador (7.10). Sólo mira el
 *   formato: no hay forma de comprobar desde el navegador que el video exista.
 * - `resolverEmbebido` traduce un Enlace_Video ya guardado a la fuente concreta
 *   que necesita el reproductor (6.10): un `iframe` embebido para YouTube y
 *   Vimeo, un `<video src>` nativo cuando el enlace apunta a un archivo directo,
 *   y la ausencia de fuente cuando el enlace está vacío o no es una dirección
 *   web, caso en el que el reproductor presenta "Video no disponible" (6.6).
 *
 * Ambas funciones son puras y aceptan `unknown`, porque el enlace puede venir
 * del almacenamiento local, donde nada garantiza el tipo.
 *
 * Cubre: 6.10, 7.10
 */

/** Mensaje de validación exigido por el criterio 7.10. */
export const MENSAJE_ENLACE_VIDEO_INVALIDO = 'Ingresá un enlace de video válido';

/** Protocolos admitidos: sólo web, para no habilitar `javascript:` ni `data:`. */
const PROTOCOLOS_WEB = Object.freeze(['http:', 'https:'] as const);

/** Extensiones que el navegador puede reproducir de forma nativa. */
const EXTENSIONES_ARCHIVO = Object.freeze([
  '.mp4',
  '.webm',
  '.ogg',
  '.ogv',
  '.m4v',
] as const);

const DOMINIOS_YOUTUBE = Object.freeze([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
] as const);

const DOMINIOS_VIMEO = Object.freeze([
  'vimeo.com',
  'www.vimeo.com',
  'player.vimeo.com',
] as const);

/**
 * Fuente que el reproductor debe montar.
 *
 * Unión discriminada por `clase` para que el componente `VisorVideo` no pueda
 * olvidarse de ninguno de los tres casos.
 */
export type FuenteEmbebida =
  | { clase: 'embebido'; url: string }
  | { clase: 'nativo'; url: string }
  | { clase: 'ninguno' };

const SIN_FUENTE: FuenteEmbebida = Object.freeze({ clase: 'ninguno' });

/**
 * Convierte el valor en una URL web, o devuelve `null`.
 *
 * Se rechaza cualquier espacio interno antes de delegar en el parser, porque
 * `new URL` tolera formas como `https:// ejemplo.com` que no son direcciones
 * escritas por una persona con intención de que funcionen.
 */
function comoUrlWeb(valor: unknown): URL | null {
  if (typeof valor !== 'string') return null;
  const texto = valor.trim();
  if (texto.length === 0 || /\s/.test(texto)) return null;

  let url: URL;
  try {
    url = new URL(texto);
  } catch {
    return null;
  }

  if (!PROTOCOLOS_WEB.includes(url.protocol as (typeof PROTOCOLOS_WEB)[number])) {
    return null;
  }
  if (url.hostname.length === 0) return null;
  return url;
}

/** Predicado de formato del Enlace_Video. */
export function esEnlaceVideoValido(valor: unknown): boolean {
  return comoUrlWeb(valor) !== null;
}

function pertenece(hostname: string, dominios: readonly string[]): boolean {
  return dominios.includes(hostname.toLowerCase());
}

/** Primer segmento no vacío de la ruta, o cadena vacía. */
function segmentos(url: URL): readonly string[] {
  return url.pathname.split('/').filter((parte) => parte.length > 0);
}

/**
 * Identificador de YouTube según la forma del enlace: `watch?v=`, `youtu.be/`,
 * `embed/` o `shorts/`. Devuelve `null` cuando el enlace no lo transporta.
 */
function idYouTube(url: URL): string | null {
  const partes = segmentos(url);

  if (url.hostname.toLowerCase().endsWith('youtu.be')) {
    return partes[0] ?? null;
  }

  const [primero, segundo] = partes;
  if (primero === 'watch') {
    const v = url.searchParams.get('v');
    return v !== null && v.length > 0 ? v : null;
  }
  if ((primero === 'embed' || primero === 'shorts') && segundo !== undefined) {
    return segundo;
  }
  return null;
}

/** Identificador numérico de Vimeo, en la forma `/123` o `/video/123`. */
function idVimeo(url: URL): string | null {
  const partes = segmentos(url);
  const candidato = partes[0] === 'video' ? partes[1] : partes[0];
  if (candidato === undefined) return null;
  return /^\d+$/.test(candidato) ? candidato : null;
}

function apuntaAArchivo(url: URL): boolean {
  const ruta = url.pathname.toLowerCase();
  return EXTENSIONES_ARCHIVO.some((extension) => ruta.endsWith(extension));
}

/**
 * Resuelve la fuente reproducible del Enlace_Video.
 *
 * Un enlace web que no es de YouTube ni de Vimeo ni apunta a un archivo se
 * ofrece como embebido genérico: el criterio 6.10 pide apuntar al Enlace_Video
 * declarado, no restringir la lista de plataformas.
 */
export function resolverEmbebido(valor: unknown): FuenteEmbebida {
  const url = comoUrlWeb(valor);
  if (url === null) return SIN_FUENTE;

  const esYouTube =
    pertenece(url.hostname, DOMINIOS_YOUTUBE) ||
    url.hostname.toLowerCase().endsWith('youtu.be');

  if (esYouTube) {
    const id = idYouTube(url);
    if (id === null) return SIN_FUENTE;
    return { clase: 'embebido', url: `https://www.youtube.com/embed/${id}` };
  }

  if (pertenece(url.hostname, DOMINIOS_VIMEO)) {
    const id = idVimeo(url);
    if (id === null) return SIN_FUENTE;
    return { clase: 'embebido', url: `https://player.vimeo.com/video/${id}` };
  }

  if (apuntaAArchivo(url)) {
    return { clase: 'nativo', url: url.href };
  }

  return { clase: 'embebido', url: url.href };
}
