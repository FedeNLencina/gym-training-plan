/**
 * Test de propiedad del porcentaje de avance de una sesión.
 *
 * El criterio 6.4 fija el avance como la proporción de Ejercicios completados
 * sobre el total, redondeada al entero más próximo y acotada a 0–100. La
 * propiedad se verifica sin repetir la fórmula de la implementación: se exige
 * que el resultado sea entero, que esté en el rango y que no se aparte más de
 * medio punto del porcentaje exacto, que es justamente la definición de
 * redondeo al entero más próximo.
 *
 * Cubre: 6.4
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

import { calcularPorcentajeAvance } from './progreso';
import { arbEntrenamiento } from '../tests/generadores/generadoresDominio';

/** Entrenamiento con al menos un Ejercicio y un subconjunto completado. */
const arbAvance = arbEntrenamiento({
  minimoEjercicios: 1,
  maximoEjercicios: 12,
}).chain((entrenamiento) =>
  fc
    .subarray(entrenamiento.ejercicios, { minLength: 0 })
    .map((completados) => ({ entrenamiento, completados })),
);

describe('Propiedad 27: porcentaje de avance', () => {
  it('Dado un Entrenamiento con Ejercicios y un subconjunto completado Cuando se calcula el avance Entonces es el entero más próximo a la proporción entre 0 y 100', () => {
    // Cubre: 6.4
    // Feature: training-platform-landing, Property 27: El porcentaje de avance es el redondeo entero de la proporción completada
    fc.assert(
      fc.property(arbAvance, ({ entrenamiento, completados }) => {
        const total = entrenamiento.ejercicios.length;
        const porcentaje = calcularPorcentajeAvance(completados.length, total);
        const exacto = (completados.length / total) * 100;

        expect(Number.isInteger(porcentaje)).toBe(true);
        expect(porcentaje).toBeGreaterThanOrEqual(0);
        expect(porcentaje).toBeLessThanOrEqual(100);
        expect(Math.abs(porcentaje - exacto)).toBeLessThanOrEqual(0.5);
      }),
      { numRuns: 100, seed: 1 },
    );
  });
});
