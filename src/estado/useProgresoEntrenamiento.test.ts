/**
 * Tests de `useProgresoEntrenamiento`.
 *
 * El hook sostiene el conjunto de Ejercicios completados de la sesión y delega
 * el cálculo del avance en `calcularPorcentajeAvance` (6.4). Marcar registra el
 * Ejercicio y recalcula el porcentaje; desmarcar lo quita, vuelve a calcular y
 * deja de presentar el resumen (6.7). El resumen sólo corresponde cuando hay al
 * menos un Ejercicio y todos están completados (6.5).
 *
 * No hay interfaz en juego: el hook se ejercita con `renderHook`, con una sola
 * interacción (un único `act`) por test.
 *
 * Cubre: 6.4, 6.5, 6.7
 */

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Ejercicio } from '../dominio/modelos';
import { useProgresoEntrenamiento } from './useProgresoEntrenamiento';

/** Ejercicios de prueba con identificadores estables. */
function crearEjercicios(cantidad: number): Ejercicio[] {
  return Array.from({ length: cantidad }, (_sinUsar, indice) => ({
    id: `ej-${indice}`,
    nombre: `Ejercicio ${indice + 1}`,
    series: 3,
    repeticiones: 10,
    descansoSegundos: 60,
  }));
}

describe('useProgresoEntrenamiento', () => {
  it('Dado un Entrenamiento con cuatro Ejercicios sin avance Cuando se marca uno como completado Entonces el avance es 25 por ciento y el Ejercicio queda registrado', () => {
    // Cubre: 6.4
    const ejercicios = crearEjercicios(4);
    const { result } = renderHook(() => useProgresoEntrenamiento(ejercicios));

    act(() => {
      result.current.marcarCompletado('ej-0');
    });

    expect(result.current.porcentaje).toBe(25);
    expect(result.current.cantidadCompletados).toBe(1);
    expect(result.current.total).toBe(4);
    expect(result.current.estaCompletado('ej-0')).toBe(true);
    expect(result.current.estaCompletado('ej-1')).toBe(false);
  });

  it('Dado un Entrenamiento con tres Ejercicios y dos completados Cuando se desmarca uno Entonces el avance vuelve a 33 por ciento y el Ejercicio queda sin completar', () => {
    // Cubre: 6.7
    const ejercicios = crearEjercicios(3);
    const { result } = renderHook(() => useProgresoEntrenamiento(ejercicios));
    act(() => {
      result.current.marcarCompletado('ej-0');
      result.current.marcarCompletado('ej-1');
    });
    expect(result.current.porcentaje).toBe(67);

    act(() => {
      result.current.desmarcarCompletado('ej-1');
    });

    expect(result.current.porcentaje).toBe(33);
    expect(result.current.cantidadCompletados).toBe(1);
    expect(result.current.estaCompletado('ej-1')).toBe(false);
  });

  it('Dado un Entrenamiento con dos Ejercicios y uno completado Cuando se marca el restante Entonces la sesión queda completa con avance 100', () => {
    // Cubre: 6.5
    const ejercicios = crearEjercicios(2);
    const { result } = renderHook(() => useProgresoEntrenamiento(ejercicios));
    act(() => {
      result.current.marcarCompletado('ej-0');
    });
    expect(result.current.completo).toBe(false);

    act(() => {
      result.current.marcarCompletado('ej-1');
    });

    expect(result.current.completo).toBe(true);
    expect(result.current.porcentaje).toBe(100);
    expect(result.current.cantidadCompletados).toBe(2);
  });

  it('Dado un Entrenamiento con todos sus Ejercicios completados Cuando se desmarca uno Entonces la sesión deja de estar completa', () => {
    // Cubre: 6.7
    const ejercicios = crearEjercicios(2);
    const { result } = renderHook(() => useProgresoEntrenamiento(ejercicios));
    act(() => {
      result.current.marcarCompletado('ej-0');
      result.current.marcarCompletado('ej-1');
    });
    expect(result.current.completo).toBe(true);

    act(() => {
      result.current.desmarcarCompletado('ej-0');
    });

    expect(result.current.completo).toBe(false);
    expect(result.current.porcentaje).toBe(50);
  });

  it('Dado un Ejercicio ya completado Cuando se alterna su marca dos veces Entonces vuelve al estado inicial sin avance', () => {
    // Cubre: 6.7
    const ejercicios = crearEjercicios(5);
    const { result } = renderHook(() => useProgresoEntrenamiento(ejercicios));

    act(() => {
      result.current.alternarCompletado('ej-2');
      result.current.alternarCompletado('ej-2');
    });

    expect(result.current.porcentaje).toBe(0);
    expect(result.current.cantidadCompletados).toBe(0);
    expect(result.current.completo).toBe(false);
  });

  it('Dado un Entrenamiento sin Ejercicios Cuando se intenta marcar un Ejercicio inexistente Entonces el avance queda en 0 y la sesión no está completa', () => {
    // Cubre: 6.4, 6.5
    const { result } = renderHook(() => useProgresoEntrenamiento([]));

    act(() => {
      result.current.marcarCompletado('ej-0');
    });

    expect(result.current.porcentaje).toBe(0);
    expect(result.current.total).toBe(0);
    expect(result.current.cantidadCompletados).toBe(0);
    expect(result.current.completo).toBe(false);
  });

  it('Dado un Ejercicio completado Cuando se marca dos veces el mismo Ejercicio Entonces el recuento no se duplica', () => {
    // Cubre: 6.4
    const ejercicios = crearEjercicios(4);
    const { result } = renderHook(() => useProgresoEntrenamiento(ejercicios));

    act(() => {
      result.current.marcarCompletado('ej-1');
      result.current.marcarCompletado('ej-1');
    });

    expect(result.current.cantidadCompletados).toBe(1);
    expect(result.current.porcentaje).toBe(25);
  });

  it('Dado un Entrenamiento con avance registrado Cuando se reemplaza la lista de Ejercicios por otra Entonces el avance se recalcula sobre los Ejercicios vigentes', () => {
    // Cubre: 6.4
    const { result, rerender } = renderHook(
      ({ ejercicios }: { ejercicios: Ejercicio[] }) =>
        useProgresoEntrenamiento(ejercicios),
      { initialProps: { ejercicios: crearEjercicios(2) } },
    );
    act(() => {
      result.current.marcarCompletado('ej-0');
      result.current.marcarCompletado('ej-1');
    });
    expect(result.current.porcentaje).toBe(100);

    rerender({
      ejercicios: crearEjercicios(2).map((ejercicio, indice) => ({
        ...ejercicio,
        id: `otro-${indice}`,
      })),
    });

    expect(result.current.porcentaje).toBe(0);
    expect(result.current.cantidadCompletados).toBe(0);
    expect(result.current.completo).toBe(false);
  });
});
