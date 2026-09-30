/**
 * Test de propiedad de la reversibilidad del marcado de un Ejercicio.
 *
 * El criterio 6.7 exige que desmarcar un Ejercicio recalcule el avance y retire
 * el resumen de la sesión. La propiedad lo verifica como reversibilidad: desde
 * cualquier avance previo, marcar un Ejercicio todavía no completado y volver a
 * desmarcarlo devuelve el porcentaje exactamente al valor anterior y deja el
 * resumen sin presentarse.
 *
 * El Ejercicio elegido nunca forma parte del avance previo: si ya estuviera
 * completado, marcarlo y desmarcarlo no sería un ida y vuelta sino una
 * eliminación, y el porcentaje final debería ser menor.
 *
 * Cubre: 6.7
 */

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';

import type { Ejercicio } from '../dominio/modelos';
import { arbEntrenamiento } from '../tests/generadores/generadoresDominio';
import { useProgresoEntrenamiento } from './useProgresoEntrenamiento';

type CasoReversibilidad = {
  ejercicios: Ejercicio[];
  completadosPrevios: Ejercicio[];
  elegido: Ejercicio;
};

/**
 * Entrenamiento con al menos un Ejercicio, un Ejercicio elegido y un avance
 * previo formado por cualquier subconjunto de los Ejercicios restantes.
 */
const arbCaso: fc.Arbitrary<CasoReversibilidad> = arbEntrenamiento({
  minimoEjercicios: 1,
  maximoEjercicios: 12,
}).chain((entrenamiento) => {
  const { ejercicios } = entrenamiento;
  return fc
    .integer({ min: 0, max: ejercicios.length - 1 })
    .chain((indice) => {
      const elegido = ejercicios[indice];
      const restantes = ejercicios.filter((_sinUsar, otro) => otro !== indice);
      return fc
        .subarray(restantes, { minLength: 0 })
        .map((completadosPrevios) => ({
          ejercicios,
          completadosPrevios,
          elegido,
        }));
    });
});

describe('Propiedad 29: reversibilidad del marcado', () => {
  it('Dado un avance previo y un Ejercicio sin completar Cuando se lo marca y se lo desmarca Entonces el porcentaje vuelve al previo y el resumen no se presenta', () => {
    // Cubre: 6.7
    // Feature: training-platform-landing, Property 29: Marcar y desmarcar un Ejercicio es reversible
    fc.assert(
      fc.property(arbCaso, ({ ejercicios, completadosPrevios, elegido }) => {
        const { result, unmount } = renderHook(() =>
          useProgresoEntrenamiento(ejercicios),
        );
        try {
          act(() => {
            completadosPrevios.forEach((ejercicio) => {
              result.current.marcarCompletado(ejercicio.id);
            });
          });
          const porcentajePrevio = result.current.porcentaje;
          const completoPrevio = result.current.completo;

          act(() => {
            result.current.marcarCompletado(elegido.id);
            result.current.desmarcarCompletado(elegido.id);
          });

          expect(result.current.porcentaje).toBe(porcentajePrevio);
          expect(result.current.cantidadCompletados).toBe(
            completadosPrevios.length,
          );
          expect(result.current.estaCompletado(elegido.id)).toBe(false);
          // El Ejercicio elegido queda sin completar, así que la sesión no
          // puede estar completa ni antes ni después del ida y vuelta.
          expect(completoPrevio).toBe(false);
          expect(result.current.completo).toBe(false);
        } finally {
          unmount();
        }
      }),
      { numRuns: 100, seed: 1 },
    );
  });
});
