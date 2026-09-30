/**
 * Filtrado de Entrenamientos.
 *
 * Funciones puras, sin dependencia de la vista: reciben una lista y devuelven
 * una lista nueva, nunca la misma referencia ni una mutación de la entrada, de
 * modo que el estado del catálogo pueda derivarse en cada render sin efectos.
 *
 * El valor `'Todos'` es el neutro del filtrado: un filtro con ese valor (o
 * ausente) no restringe nada. La coincidencia es exacta, sin normalizar caja ni
 * espacios, porque los valores disponibles en los controles provienen de la
 * propia lista de Entrenamientos.
 *
 * Cubre: 5.1, 5.2, 5.3, 5.9
 */

import type { Entrenamiento, Nivel } from './modelos';

/** Valor neutro de un filtro: presente en los controles, ignorado al filtrar. */
export const FILTRO_TODOS = 'Todos';
export type FiltroTodos = typeof FILTRO_TODOS;

export type FiltrosCatalogo = {
  categoria?: string | FiltroTodos;
  nivel?: Nivel | FiltroTodos;
};

/** Un filtro restringe sólo si tiene un valor distinto de `'Todos'`. */
function estaAplicado(valor: string | undefined): valor is string {
  return valor !== undefined && valor !== FILTRO_TODOS;
}

/**
 * Devuelve los Entrenamientos que satisfacen todos los filtros aplicados a la
 * vez. Los filtros ausentes o en `'Todos'` no participan de la conjunción.
 */
export function filtrarEntrenamientos(
  entrenamientos: readonly Entrenamiento[],
  filtros: FiltrosCatalogo = {},
): Entrenamiento[] {
  const { categoria, nivel } = filtros;
  return entrenamientos.filter((entrenamiento) => {
    const coincideCategoria =
      !estaAplicado(categoria) || entrenamiento.categoria === categoria;
    const coincideNivel =
      !estaAplicado(nivel) || entrenamiento.nivel === nivel;
    return coincideCategoria && coincideNivel;
  });
}

/** Devuelve únicamente los Entrenamientos en estado publicado. */
export function soloPublicados(
  entrenamientos: readonly Entrenamiento[],
): Entrenamiento[] {
  return entrenamientos.filter(
    (entrenamiento) => entrenamiento.estado === 'publicado',
  );
}
