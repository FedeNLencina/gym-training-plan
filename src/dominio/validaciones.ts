/**
 * Validaciones de dominio.
 *
 * Cada función recibe un valor dudoso (lo que llega de un formulario o del
 * almacenamiento local) y devuelve `null` cuando cumple las reglas, o un
 * `ErrorValidacion` con el mapa de campos inválidos. Devolver el error en lugar
 * de lanzarlo permite a los formularios presentar todos los mensajes de una vez
 * y a los servicios decidir si lo rechazan o lo propagan.
 *
 * Los límites de `validarEntrenamiento` son los del Repositorio_Datos (8.7,
 * 8.14), no los del formulario del Panel_Admin, que son más estrictos y viven
 * en la vista: un Entrenamiento aceptable para el almacenamiento no tiene por
 * qué ser creable desde el formulario.
 *
 * Cubre: 4.1, 8.7, 8.14
 */

import { ErrorValidacion, type CamposInvalidos } from './errores';
import { FUENTES_VIDEO, NIVELES, ROLES } from './modelos';

// --- Límites -----------------------------------------------------------------

export const LIMITES_ENTRENAMIENTO = Object.freeze({
  tituloMaximo: 120,
  descripcionMaxima: 1000,
  duracionMinima: 1,
  duracionMaxima: 240,
  ejerciciosMinimos: 1,
  ejerciciosMaximos: 50,
} as const);

export const LIMITES_EJERCICIO = Object.freeze({
  nombreMinimo: 3,
  nombreMaximo: 60,
  seriesMinimas: 1,
  seriesMaximas: 20,
  repeticionesMinimas: 1,
  repeticionesMaximas: 100,
  descansoMinimo: 0,
  descansoMaximo: 300,
} as const);

export const LIMITES_CUENTA = Object.freeze({
  nombreMinimo: 2,
  nombreMaximo: 60,
  correoMinimo: 6,
  correoMaximo: 254,
  contraseniaMinima: 8,
  contraseniaMaxima: 64,
} as const);

/**
 * Formato `texto@dominio.extension`: parte local sin espacios ni arroba, una
 * sola arroba, y un dominio con al menos un punto y segmentos no vacíos.
 */
const FORMATO_CORREO = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

// --- Utilidades --------------------------------------------------------------

/** Registro de campos en construcción, antes de congelarse en el error. */
type Acumulador = Record<string, string>;

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esTextoConContenido(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function esEnteroEnRango(valor: unknown, min: number, max: number): boolean {
  return (
    typeof valor === 'number' &&
    Number.isInteger(valor) &&
    valor >= min &&
    valor <= max
  );
}

function perteneceA(valor: unknown, admitidos: readonly string[]): boolean {
  return typeof valor === 'string' && admitidos.includes(valor);
}

/** Construye el error sólo si hay campos inválidos. */
function resultado(campos: Acumulador): ErrorValidacion | null {
  const nombres = Object.keys(campos);
  if (nombres.length === 0) return null;
  const detalle: CamposInvalidos = campos;
  return new ErrorValidacion(detalle);
}

// --- Correo ------------------------------------------------------------------

/** Predicado del formato y de la longitud del correo electrónico. */
export function esCorreoValido(valor: unknown): boolean {
  if (typeof valor !== 'string') return false;
  if (
    valor.length < LIMITES_CUENTA.correoMinimo ||
    valor.length > LIMITES_CUENTA.correoMaximo
  ) {
    return false;
  }
  return FORMATO_CORREO.test(valor);
}

/**
 * Valida el correo electrónico de forma aislada, para que el formulario de
 * ingreso pueda usar la misma regla que el de registro.
 */
export function validarCorreo(valor: unknown): ErrorValidacion | null {
  if (esCorreoValido(valor)) return null;
  return resultado({
    correo: `Ingresá un correo válido con el formato texto@dominio.extension, de ${LIMITES_CUENTA.correoMinimo} a ${LIMITES_CUENTA.correoMaximo} caracteres`,
  });
}

// --- Ejercicio ---------------------------------------------------------------

/** Acumula en `campos` los errores del Ejercicio, sin construir el error. */
function acumularEjercicio(valor: unknown, campos: Acumulador): void {
  if (!esRegistro(valor)) {
    campos.nombre = 'El ejercicio no tiene la estructura esperada';
    return;
  }

  const { nombre, series, repeticiones, descansoSegundos } = valor;
  const { nombreMinimo, nombreMaximo } = LIMITES_EJERCICIO;

  if (
    !esTextoConContenido(nombre) ||
    nombre.trim().length < nombreMinimo ||
    nombre.length > nombreMaximo
  ) {
    campos.nombre = `Ingresá un nombre de ${nombreMinimo} a ${nombreMaximo} caracteres`;
  }
  if (
    !esEnteroEnRango(
      series,
      LIMITES_EJERCICIO.seriesMinimas,
      LIMITES_EJERCICIO.seriesMaximas,
    )
  ) {
    campos.series = `Ingresá un número entero de series de ${LIMITES_EJERCICIO.seriesMinimas} a ${LIMITES_EJERCICIO.seriesMaximas}`;
  }
  if (
    !esEnteroEnRango(
      repeticiones,
      LIMITES_EJERCICIO.repeticionesMinimas,
      LIMITES_EJERCICIO.repeticionesMaximas,
    )
  ) {
    campos.repeticiones = `Ingresá un número entero de repeticiones de ${LIMITES_EJERCICIO.repeticionesMinimas} a ${LIMITES_EJERCICIO.repeticionesMaximas}`;
  }
  if (
    !esEnteroEnRango(
      descansoSegundos,
      LIMITES_EJERCICIO.descansoMinimo,
      LIMITES_EJERCICIO.descansoMaximo,
    )
  ) {
    campos.descansoSegundos = `Ingresá un descanso entero de ${LIMITES_EJERCICIO.descansoMinimo} a ${LIMITES_EJERCICIO.descansoMaximo} segundos`;
  }
}

export function validarEjercicio(valor: unknown): ErrorValidacion | null {
  const campos: Acumulador = {};
  acumularEjercicio(valor, campos);
  return resultado(campos);
}

// --- Entrenamiento -----------------------------------------------------------

export function validarEntrenamiento(valor: unknown): ErrorValidacion | null {
  if (!esRegistro(valor)) {
    return resultado({
      entrenamiento: 'El entrenamiento no tiene la estructura esperada',
    });
  }

  const campos: Acumulador = {};
  const {
    titulo,
    descripcion,
    categoria,
    nivel,
    duracionMinutos,
    fuenteVideo,
    ejercicios,
  } = valor;
  const {
    tituloMaximo,
    descripcionMaxima,
    duracionMinima,
    duracionMaxima,
    ejerciciosMinimos,
    ejerciciosMaximos,
  } = LIMITES_ENTRENAMIENTO;

  if (!esTextoConContenido(titulo) || titulo.length > tituloMaximo) {
    campos.titulo = `Ingresá un título de 1 a ${tituloMaximo} caracteres`;
  }
  // La descripción es opcional: sólo se acota su longitud máxima.
  if (
    descripcion !== undefined &&
    descripcion !== null &&
    (typeof descripcion !== 'string' || descripcion.length > descripcionMaxima)
  ) {
    campos.descripcion = `La descripción admite hasta ${descripcionMaxima} caracteres`;
  }
  if (!esTextoConContenido(categoria)) {
    campos.categoria = 'Elegí una categoría';
  }
  if (!perteneceA(nivel, NIVELES)) {
    campos.nivel = `Elegí un nivel entre ${NIVELES.join(', ')}`;
  }
  if (!esEnteroEnRango(duracionMinutos, duracionMinima, duracionMaxima)) {
    campos.duracionMinutos = `Ingresá una duración entera de ${duracionMinima} a ${duracionMaxima} minutos`;
  }
  if (!perteneceA(fuenteVideo, FUENTES_VIDEO)) {
    campos.fuenteVideo = `Elegí una fuente de video entre ${FUENTES_VIDEO.join(' y ')}`;
  }
  if (
    !Array.isArray(ejercicios) ||
    ejercicios.length < ejerciciosMinimos ||
    ejercicios.length > ejerciciosMaximos
  ) {
    campos.ejercicios = `Cargá entre ${ejerciciosMinimos} y ${ejerciciosMaximos} ejercicios`;
  }

  return resultado(campos);
}

// --- Cuenta ------------------------------------------------------------------

export function validarCuenta(valor: unknown): ErrorValidacion | null {
  if (!esRegistro(valor)) {
    return resultado({ cuenta: 'La cuenta no tiene la estructura esperada' });
  }

  const campos: Acumulador = {};
  const { nombre, correo, contrasenia, rol } = valor;
  const {
    nombreMinimo,
    nombreMaximo,
    contraseniaMinima,
    contraseniaMaxima,
  } = LIMITES_CUENTA;

  if (
    !esTextoConContenido(nombre) ||
    nombre.trim().length < nombreMinimo ||
    nombre.length > nombreMaximo
  ) {
    campos.nombre = `Ingresá un nombre de ${nombreMinimo} a ${nombreMaximo} caracteres`;
  }

  const errorCorreo = validarCorreo(correo);
  if (errorCorreo !== null) {
    campos.correo = errorCorreo.campos.correo;
  }

  if (
    typeof contrasenia !== 'string' ||
    contrasenia.length < contraseniaMinima ||
    contrasenia.length > contraseniaMaxima
  ) {
    campos.contrasenia = `Ingresá una contraseña de ${contraseniaMinima} a ${contraseniaMaxima} caracteres`;
  }

  // El rol es opcional en un borrador de registro: sólo se valida si viene.
  if (rol !== undefined && !perteneceA(rol, ROLES)) {
    campos.rol = `El rol debe ser uno de ${ROLES.join(' o ')}`;
  }

  return resultado(campos);
}
