/**
 * Tests del historial de sesiones completadas.
 *
 * Funciones puras sobre una lista de Sesiones_Completadas: el orden de
 * presentación y las estadísticas acumuladas de una cuenta. El estado vive en
 * el ServicioProgreso; acá sólo se prueba el cálculo.
 */

import { describe, expect, it } from 'vitest';

import {
  calcularEstadisticas,
  formatearFechaCorta,
  ordenarPorFechaDescendente,
  HISTORIAL_VACIO,
  SIN_FECHA,
} from './historial';
import { crearSesionCompletada, type SesionCompletada } from './modelos';

/** Sesión completada con valores por omisión sobrescribibles. */
function dadaSesion(
  datos: Partial<SesionCompletada> = {},
): SesionCompletada {
  return crearSesionCompletada({
    id: 'ses-1',
    idEntrenamiento: 'ent-1',
    tituloEntrenamiento: 'Fuerza total',
    completadoEn: '2026-01-10T10:00:00.000Z',
    ejerciciosCompletados: 4,
    ejerciciosTotales: 4,
    ...datos,
  });
}

describe('ordenarPorFechaDescendente', () => {
  it('Dado un historial desordenado Cuando se ordena Entonces la sesión más reciente queda primera', () => {
    const historial = [
      dadaSesion({ id: 'ses-vieja', completadoEn: '2026-01-01T10:00:00.000Z' }),
      dadaSesion({ id: 'ses-nueva', completadoEn: '2026-03-01T10:00:00.000Z' }),
      dadaSesion({ id: 'ses-media', completadoEn: '2026-02-01T10:00:00.000Z' }),
    ];

    const ordenado = ordenarPorFechaDescendente(historial);

    expect(ordenado.map((sesion) => sesion.id)).toEqual([
      'ses-nueva',
      'ses-media',
      'ses-vieja',
    ]);
  });

  it('Dado un historial Cuando se ordena Entonces no muta la lista recibida', () => {
    const historial = [
      dadaSesion({ id: 'ses-vieja', completadoEn: '2026-01-01T10:00:00.000Z' }),
      dadaSesion({ id: 'ses-nueva', completadoEn: '2026-03-01T10:00:00.000Z' }),
    ];

    ordenarPorFechaDescendente(historial);

    expect(historial.map((sesion) => sesion.id)).toEqual([
      'ses-vieja',
      'ses-nueva',
    ]);
  });

  it('Dado un historial con fecha ilegible Cuando se ordena Entonces la relega al final sin fallar', () => {
    const historial = [
      dadaSesion({ id: 'ses-ilegible', completadoEn: 'no-es-fecha' }),
      dadaSesion({ id: 'ses-valida', completadoEn: '2026-01-01T10:00:00.000Z' }),
    ];

    const ordenado = ordenarPorFechaDescendente(historial);

    expect(ordenado.map((sesion) => sesion.id)).toEqual([
      'ses-valida',
      'ses-ilegible',
    ]);
  });

  it('Dado un historial vacío Cuando se ordena Entonces devuelve una lista vacía', () => {
    expect(ordenarPorFechaDescendente([])).toEqual([]);
  });
});

describe('calcularEstadisticas', () => {
  it('Dado un historial vacío Cuando se calculan las estadísticas Entonces devuelve el acumulado en cero', () => {
    expect(calcularEstadisticas([])).toEqual(HISTORIAL_VACIO);
  });

  it('Dadas tres sesiones Cuando se calculan las estadísticas Entonces cuenta las sesiones completadas', () => {
    const historial = [
      dadaSesion({ id: 'ses-1' }),
      dadaSesion({ id: 'ses-2' }),
      dadaSesion({ id: 'ses-3' }),
    ];

    expect(calcularEstadisticas(historial).sesionesCompletadas).toBe(3);
  });

  it('Dadas sesiones con distinto avance Cuando se calculan las estadísticas Entonces suma los ejercicios completados', () => {
    const historial = [
      dadaSesion({ id: 'ses-1', ejerciciosCompletados: 4 }),
      dadaSesion({ id: 'ses-2', ejerciciosCompletados: 6 }),
    ];

    expect(calcularEstadisticas(historial).ejerciciosCompletados).toBe(10);
  });

  it('Dadas dos sesiones del mismo Entrenamiento Cuando se calculan las estadísticas Entonces cuenta un solo Entrenamiento distinto', () => {
    const historial = [
      dadaSesion({ id: 'ses-1', idEntrenamiento: 'ent-1' }),
      dadaSesion({ id: 'ses-2', idEntrenamiento: 'ent-1' }),
    ];

    expect(calcularEstadisticas(historial).entrenamientosDistintos).toBe(1);
  });

  it('Dadas sesiones de dos Entrenamientos Cuando se calculan las estadísticas Entonces cuenta dos Entrenamientos distintos', () => {
    const historial = [
      dadaSesion({ id: 'ses-1', idEntrenamiento: 'ent-1' }),
      dadaSesion({ id: 'ses-2', idEntrenamiento: 'ent-2' }),
    ];

    expect(calcularEstadisticas(historial).entrenamientosDistintos).toBe(2);
  });

  it('Dado un historial desordenado Cuando se calculan las estadísticas Entonces la última sesión es la más reciente', () => {
    const historial = [
      dadaSesion({ id: 'ses-1', completadoEn: '2026-01-01T10:00:00.000Z' }),
      dadaSesion({ id: 'ses-2', completadoEn: '2026-05-01T10:00:00.000Z' }),
      dadaSesion({ id: 'ses-3', completadoEn: '2026-03-01T10:00:00.000Z' }),
    ];

    expect(calcularEstadisticas(historial).ultimaSesionEn).toBe(
      '2026-05-01T10:00:00.000Z',
    );
  });

  it('Dadas sesiones con recuento negativo Cuando se calculan las estadísticas Entonces no resta del acumulado', () => {
    // El recuento llega del almacenamiento: un valor corrupto no debe producir
    // un acumulado negativo.
    const historial = [
      dadaSesion({ id: 'ses-1', ejerciciosCompletados: 5 }),
      dadaSesion({ id: 'ses-2', ejerciciosCompletados: -3 }),
    ];

    expect(calcularEstadisticas(historial).ejerciciosCompletados).toBe(5);
  });
});

describe('formatearFechaCorta', () => {
  // Las marcas de estas pruebas son al mediodía UTC a propósito: así el día
  // resultante es el mismo en cualquier huso horario razonable y la prueba no
  // depende del huso de la máquina que la corre.
  it('Dada una marca ISO Cuando se formatea Entonces la presenta como día/mes/año', () => {
    expect(formatearFechaCorta('2026-03-09T12:00:00.000Z')).toBe('09/03/2026');
  });

  it('Dada una marca de fin de año Cuando se formatea Entonces conserva el año', () => {
    expect(formatearFechaCorta('2026-12-31T12:00:00.000Z')).toBe('31/12/2026');
  });

  it('Dada una marca ilegible Cuando se formatea Entonces devuelve el texto de ausencia', () => {
    expect(formatearFechaCorta('no-es-fecha')).toBe(SIN_FECHA);
  });

  it('Dada una marca nula Cuando se formatea Entonces devuelve el texto de ausencia', () => {
    expect(formatearFechaCorta(null)).toBe(SIN_FECHA);
  });
});
