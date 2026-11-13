/** Reglas de negocio puras: sin React ni almacenamiento. */

import type { CamposInvalidos } from './errores';
import type { Cuenta, Entrenamiento, Nivel, Plan, Video } from './modelos';

export type FiltroNivel = Nivel | 'todos';

export type FuenteVideo =
  | { clase: 'embebido'; url: string }
  | { clase: 'nativo'; url: string }
  | { clase: 'ninguno' };

const ORDEN_NIVEL: Readonly<Record<Nivel, number>> = { basico: 1, intermedio: 2, avanzado: 3 };

/** Del más barato al más caro. */
export function ordenarPorPrecio(planes: readonly Plan[]): Plan[] {
  return [...planes].sort((a, b) => a.precio - b.precio);
}

/**
 * Nivel más alto de entrenamientos que la cuenta puede ver. Sólo cuenta el plan
 * activo (el que dio de alta el administrador), nunca el solicitado.
 */
export function nivelDeAcceso(cuenta: Cuenta | null, planes: readonly Plan[]): Nivel | null {
  if (cuenta === null) return null;
  if (cuenta.rol === 'administrador') return 'avanzado';
  return planes.find((plan) => plan.id === cuenta.idPlan)?.nivel ?? null;
}

/** Un plan habilita los entrenamientos de su nivel y de los inferiores. */
export function puedeVer(acceso: Nivel | null, nivel: Nivel): boolean {
  return acceso !== null && ORDEN_NIVEL[acceso] >= ORDEN_NIVEL[nivel];
}

export function filtrarPorNivel(
  entrenamientos: readonly Entrenamiento[],
  filtro: FiltroNivel,
): Entrenamiento[] {
  return entrenamientos.filter((e) => filtro === 'todos' || e.nivel === filtro);
}

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const LARGO_MINIMO_CONTRASENIA = 8;

export function validarRegistro(datos: {
  nombre: string;
  correo: string;
  contrasenia: string;
}): CamposInvalidos {
  const campos: Record<string, string> = {};
  if (datos.nombre.trim() === '') campos.nombre = 'Ingresá tu nombre';
  if (!FORMATO_CORREO.test(datos.correo.trim())) campos.correo = 'Ingresá un correo válido';
  if (datos.contrasenia.length < LARGO_MINIMO_CONTRASENIA) {
    campos.contrasenia = `La contraseña debe tener al menos ${LARGO_MINIMO_CONTRASENIA} caracteres`;
  }
  return campos;
}

export function validarPlan(datos: Pick<Plan, 'nombre' | 'descripcion' | 'precio'>): CamposInvalidos {
  const campos: Record<string, string> = {};
  if (datos.nombre.trim() === '') campos.nombre = 'Ingresá el nombre del plan';
  if (datos.descripcion.trim() === '') campos.descripcion = 'Ingresá una descripción';
  if (!Number.isFinite(datos.precio) || datos.precio <= 0) {
    campos.precio = 'Ingresá un precio mayor a cero';
  }
  return campos;
}

export function validarEntrenamiento(datos: {
  titulo: string;
  duracionMin: number;
  video: Video;
}): CamposInvalidos {
  const campos: Record<string, string> = {};
  if (datos.titulo.trim() === '') campos.titulo = 'Ingresá el título';
  if (!Number.isFinite(datos.duracionMin) || datos.duracionMin <= 0) {
    campos.duracionMin = 'Ingresá la duración en minutos';
  }
  if (datos.video.tipo === 'enlace' && fuenteDeVideo(datos.video.url).clase === 'ninguno') {
    campos.video = 'Ingresá un enlace de video válido';
  }
  if (datos.video.tipo === 'archivo' && datos.video.idArchivo === '') {
    campos.video = 'Elegí un archivo de video';
  }
  return campos;
}

function idYouTube(url: URL): string | null {
  const host = url.hostname.replace(/^(www|m)\./, '');
  const partes = url.pathname.split('/').filter(Boolean);
  if (host === 'youtu.be') return partes[0] ?? null;
  if (host !== 'youtube.com' && host !== 'youtube-nocookie.com') return null;
  if (partes[0] === 'watch') return url.searchParams.get('v');
  if (partes[0] === 'embed' || partes[0] === 'shorts') return partes[1] ?? null;
  return null;
}

function idVimeo(url: URL): string | null {
  const host = url.hostname.replace(/^(www|player)\./, '');
  if (host !== 'vimeo.com') return null;
  const partes = url.pathname.split('/').filter(Boolean);
  const candidato = partes[0] === 'video' ? partes[1] : partes[0];
  return candidato !== undefined && /^\d+$/.test(candidato) ? candidato : null;
}

/**
 * Cómo se reproduce un enlace: YouTube y Vimeo van embebidos en un iframe; el
 * resto de los enlaces http(s) se tratan como archivo de video. Cualquier otro
 * protocolo se rechaza para no inyectar direcciones ejecutables.
 */
export function fuenteDeVideo(enlace: string): FuenteVideo {
  let url: URL;
  try {
    url = new URL(enlace.trim());
  } catch {
    return { clase: 'ninguno' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return { clase: 'ninguno' };

  const youtube = idYouTube(url);
  if (youtube) return { clase: 'embebido', url: `https://www.youtube.com/embed/${youtube}` };
  const vimeo = idVimeo(url);
  if (vimeo) return { clase: 'embebido', url: `https://player.vimeo.com/video/${vimeo}` };
  return { clase: 'nativo', url: url.href };
}

const FORMATO_PRECIO = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export function formatearPrecio(precio: number): string {
  return FORMATO_PRECIO.format(precio);
}
