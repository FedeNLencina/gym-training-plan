/**
 * Historial de sesiones completadas de una cuenta.
 *
 * Funciones puras: el estado del historial vive en el ServicioProgreso, que
 * delega acá el orden de presentación y el cálculo del acumulado. Separarlas
 * permite probar el cálculo sin almacenamiento y reutilizarlo en la vista.
 *
 * Todo dato que llega acá pasó por el almacenamiento local, así que puede venir
 * corrupto: los recuentos no numéricos o negativos se normalizan a 0 y las
 * fechas ilegibles se relegan al final del orden en lugar de propagar `NaN`.
 */

import type { SesionCompletada } from './modelos';

export type EstadisticasHistorial = {
  /** Cantidad de sesiones terminadas por la cuenta. */
  sesionesCompletadas: number;
  /** Suma de Ejercicios completados en todas las sesiones. */
  ejerciciosCompletados: number;
  /** Cantidad de Entrenamientos distintos que la cuenta completó al menos una vez. */
  entrenamientosDistintos: number;
  /** Marca ISO de la sesión más reciente, o nulo si no hay ninguna. */
  ultimaSesionEn: string | null;
};

/** Acumulado de una cuenta sin sesiones completadas. */
export const HISTORIAL_VACIO: EstadisticasHistorial = Object.freeze({
  sesionesCompletadas: 0,
  ejerciciosCompletados: 0,
  entrenamientosDistintos: 0,
  ultimaSesionEn: null,
});

/** Normaliza un recuento dudoso a un entero no negativo. */
function recuentoValido(valor: number): number {
  if (!Number.isFinite(valor) || valor <= 0) return 0;
  return Math.floor(valor);
}

/**
 * Convierte una marca ISO en milisegundos comparables. Una fecha ilegible
 * devuelve `null`, que el orden trata como «más antigua que cualquier otra».
 */
function momento(marca: string): number | null {
  const milisegundos = Date.parse(marca);
  return Number.isNaN(milisegundos) ? null : milisegundos;
}

/**
 * Historial de la sesión más reciente a la más antigua. Devuelve una lista
 * nueva: la recibida queda intacta, porque suele ser el estado de un
 * componente y `sort` ordenaría en el lugar.
 */
export function ordenarPorFechaDescendente(
  historial: readonly SesionCompletada[],
): SesionCompletada[] {
  return [...historial].sort((una, otra) => {
    const momentoUna = momento(una.completadoEn);
    const momentoOtra = momento(otra.completadoEn);
    // Las fechas ilegibles van al final, sin alterar el orden entre ellas.
    if (momentoUna === null) return momentoOtra === null ? 0 : 1;
    if (momentoOtra === null) return -1;
    return momentoOtra - momentoUna;
  });
}

/** Acumulado de las sesiones completadas de una cuenta. */
export function calcularEstadisticas(
  historial: readonly SesionCompletada[],
): EstadisticasHistorial {
  if (historial.length === 0) return { ...HISTORIAL_VACIO };

  const ejerciciosCompletados = historial.reduce(
    (suma, sesion) => suma + recuentoValido(sesion.ejerciciosCompletados),
    0,
  );

  const entrenamientos = new Set(
    historial.map((sesion) => sesion.idEntrenamiento),
  );

  const masReciente = historial.reduce<string | null>((ultima, sesion) => {
    const momentoSesion = momento(sesion.completadoEn);
    if (momentoSesion === null) return ultima;
    if (ultima === null) return sesion.completadoEn;
    const momentoUltima = momento(ultima);
    if (momentoUltima === null) return sesion.completadoEn;
    return momentoSesion > momentoUltima ? sesion.completadoEn : ultima;
  }, null);

  return {
    sesionesCompletadas: historial.length,
    ejerciciosCompletados,
    entrenamientosDistintos: entrenamientos.size,
    ultimaSesionEn: masReciente,
  };
}

/** Texto con el que se presenta una fecha ausente o ilegible. */
export const SIN_FECHA = 'Sin fecha';

/**
 * Presenta una marca ISO como `dd/mm/aaaa`, el orden habitual en español.
 *
 * Se arma a mano en lugar de con `Intl.DateTimeFormat` para que el resultado no
 * dependa de la configuración regional del navegador ni de los datos de ICU
 * disponibles en el entorno de pruebas. Usa los componentes locales de la
 * fecha, que es la que el Usuario reconoce como «el día que entrenó».
 */
export function formatearFechaCorta(marca: string | null): string {
  if (marca === null) return SIN_FECHA;

  const milisegundos = Date.parse(marca);
  if (Number.isNaN(milisegundos)) return SIN_FECHA;

  const fecha = new Date(milisegundos);
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${String(fecha.getFullYear())}`;
}
