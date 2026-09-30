/**
 * Reglas de dominio de la Seccion_Planes.
 *
 * El destaque de un plan recomendado es una condición, no una preferencia: la
 * Seccion_Planes destaca y etiqueta como "Recomendado" a un plan si y sólo si
 * hay exactamente uno marcado como recomendado en la lista. Con cero o con más
 * de uno, la vista presenta todos los planes sin destaque ni etiqueta (3.4,
 * 3.5).
 *
 * La regla vive en el dominio, y no en la vista, para que sea pura y verificable
 * al margen del renderizado: `resolverPlanRecomendado` recibe la lista de planes
 * y devuelve el identificador del único plan recomendado, o `null` cuando el
 * destaque no corresponde.
 *
 * Cubre: 3.4, 3.5
 */

import type { Plan } from './modelos';

/**
 * Identificador del plan a destacar, o `null` cuando no corresponde destacar.
 *
 * Devuelve el `id` del plan recomendado sólo cuando hay exactamente uno; con
 * cero o con dos o más planes recomendados devuelve `null`, de modo que la vista
 * presente la lista completa sin destaque.
 */
export function resolverPlanRecomendado(planes: readonly Plan[]): string | null {
  const recomendados = planes.filter((plan) => plan.recomendado);
  return recomendados.length === 1 ? recomendados[0].id : null;
}
