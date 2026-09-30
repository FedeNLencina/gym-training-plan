/**
 * Cálculo del avance de una sesión de entrenamiento.
 *
 * Funciones puras: el estado de los Ejercicios completados vive en
 * `useProgresoEntrenamiento`, que delega acá el cálculo del porcentaje y la
 * decisión de presentar el resumen de la sesión.
 *
 * El porcentaje es siempre un entero de 0 a 100 (6.4) y vale 0 cuando el
 * Entrenamiento no tiene Ejercicios (6.9), de modo que una división por cero
 * nunca llega a la vista.
 *
 * Cubre: 6.4, 6.5, 6.9
 */

/**
 * Normaliza una cantidad dudosa a un entero no negativo. Los valores no
 * finitos, negativos o fraccionarios provienen de datos almacenados o de
 * cálculos externos: se truncan en lugar de propagar `NaN`.
 */
function cantidadValida(valor: number): number {
  if (!Number.isFinite(valor) || valor <= 0) return 0;
  return Math.floor(valor);
}

/**
 * Porcentaje de avance como la proporción de Ejercicios completados sobre el
 * total, redondeada al entero más próximo y acotada al rango 0–100.
 *
 * Devuelve 0 cuando el total es 0, y 100 cuando los completados igualan o
 * superan el total.
 */
export function calcularPorcentajeAvance(
  completados: number,
  total: number,
): number {
  const totalValido = cantidadValida(total);
  if (totalValido === 0) return 0;

  const completadosValidos = cantidadValida(completados);
  const porcentaje = Math.round((completadosValidos / totalValido) * 100);

  return Math.min(100, Math.max(0, porcentaje));
}

/**
 * Indica si la sesión está completa, es decir si hay al menos un Ejercicio y
 * todos están completados. Un Entrenamiento sin Ejercicios nunca está
 * completo: su avance es 0 y no corresponde presentar el resumen (6.9).
 */
export function estaCompleto(completados: number, total: number): boolean {
  const totalValido = cantidadValida(total);
  if (totalValido === 0) return false;

  return cantidadValida(completados) >= totalValido;
}
