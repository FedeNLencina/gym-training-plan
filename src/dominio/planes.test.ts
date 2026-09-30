/**
 * Tests de `resolverPlanRecomendado`.
 *
 * El destaque de un plan recomendado existe si y sólo si hay exactamente un
 * plan marcado como recomendado: con cero o con más de uno, la función devuelve
 * `null` y la Seccion_Planes presenta todos los planes sin destaque (3.4, 3.5).
 */
import { describe, expect, it } from 'vitest';

import { crearPlan, type Plan } from './modelos';
import { resolverPlanRecomendado } from './planes';

/** Construye una lista de planes marcando como recomendados los ids indicados. */
function planesConRecomendados(
  cantidad: number,
  idsRecomendados: string[],
): Plan[] {
  return Array.from({ length: cantidad }, (_, indice) => {
    const id = `plan-${indice + 1}`;
    return crearPlan({ id, nombre: `Plan ${indice + 1}`, recomendado: idsRecomendados.includes(id) });
  });
}

describe('resolverPlanRecomendado', () => {
  it('Dado un solo plan recomendado Cuando se resuelve el destaque Entonces devuelve su identificador', () => {
    // Cubre: 3.4
    const planes = planesConRecomendados(4, ['plan-2']);

    expect(resolverPlanRecomendado(planes)).toBe('plan-2');
  });

  it('Dada una lista sin planes recomendados Cuando se resuelve el destaque Entonces devuelve null', () => {
    // Cubre: 3.5
    const planes = planesConRecomendados(4, []);

    expect(resolverPlanRecomendado(planes)).toBeNull();
  });

  it('Dada una lista con dos planes recomendados Cuando se resuelve el destaque Entonces devuelve null', () => {
    // Cubre: 3.5
    const planes = planesConRecomendados(4, ['plan-1', 'plan-3']);

    expect(resolverPlanRecomendado(planes)).toBeNull();
  });

  it('Dada una lista vacía de planes Cuando se resuelve el destaque Entonces devuelve null', () => {
    // Cubre: 3.5
    expect(resolverPlanRecomendado([])).toBeNull();
  });
});
