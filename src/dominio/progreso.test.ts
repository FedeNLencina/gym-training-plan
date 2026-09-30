/**
 * Tests unitarios del cálculo de avance de un Entrenamiento.
 *
 * El criterio 6.4 fija el porcentaje como la proporción de Ejercicios
 * completados expresada en un entero de 0 a 100 redondeado al más próximo; el
 * 6.5 exige 100 cuando están todos completados; el 6.9 exige 0 cuando el
 * Entrenamiento no tiene Ejercicios. Se verifican esos tres bordes y el
 * redondeo en sus puntos de corte.
 *
 * Cubre: 6.4, 6.5, 6.9
 */

import { describe, it, expect } from 'vitest';

import { calcularPorcentajeAvance, estaCompleto } from './progreso';

describe('calcularPorcentajeAvance', () => {
  it('Dado un total de 0 Ejercicios Cuando se calcula el avance Entonces devuelve 0', () => {
    // Cubre: 6.9
    expect(calcularPorcentajeAvance(0, 0)).toBe(0);
  });

  it('Dado un total de 0 Ejercicios con completados positivos Cuando se calcula el avance Entonces devuelve 0', () => {
    // Cubre: 6.9
    expect(calcularPorcentajeAvance(3, 0)).toBe(0);
  });

  it('Dado ningún Ejercicio completado Cuando se calcula el avance Entonces devuelve 0', () => {
    // Cubre: 6.4
    expect(calcularPorcentajeAvance(0, 7)).toBe(0);
  });

  it('Dados todos los Ejercicios completados Cuando se calcula el avance Entonces devuelve 100', () => {
    // Cubre: 6.5
    expect(calcularPorcentajeAvance(7, 7)).toBe(100);
  });

  it('Dada la mitad de los Ejercicios completados Cuando se calcula el avance Entonces devuelve 50', () => {
    // Cubre: 6.4
    expect(calcularPorcentajeAvance(2, 4)).toBe(50);
  });

  it('Dada una proporción con fracción menor a la mitad Cuando se calcula el avance Entonces redondea hacia abajo', () => {
    // Cubre: 6.4
    // 1/3 = 33,33 %
    expect(calcularPorcentajeAvance(1, 3)).toBe(33);
  });

  it('Dada una proporción con fracción mayor a la mitad Cuando se calcula el avance Entonces redondea hacia arriba', () => {
    // Cubre: 6.4
    // 2/3 = 66,66 %
    expect(calcularPorcentajeAvance(2, 3)).toBe(67);
  });

  it('Dada una proporción con fracción exacta de un medio Cuando se calcula el avance Entonces redondea al entero superior', () => {
    // Cubre: 6.4
    // 1/8 = 12,5 %
    expect(calcularPorcentajeAvance(1, 8)).toBe(13);
  });

  it('Dado un Ejercicio completado de 100 Cuando se calcula el avance Entonces no devuelve 0', () => {
    // Cubre: 6.4
    expect(calcularPorcentajeAvance(1, 100)).toBe(1);
  });

  it('Dados más completados que el total Cuando se calcula el avance Entonces devuelve 100', () => {
    // Cubre: 6.4
    expect(calcularPorcentajeAvance(9, 4)).toBe(100);
  });

  it('Dada una cantidad negativa de completados Cuando se calcula el avance Entonces devuelve 0', () => {
    // Cubre: 6.4
    expect(calcularPorcentajeAvance(-3, 4)).toBe(0);
  });

  it('Dado un total negativo Cuando se calcula el avance Entonces devuelve 0', () => {
    // Cubre: 6.9
    expect(calcularPorcentajeAvance(2, -4)).toBe(0);
  });

  it('Dados valores no finitos Cuando se calcula el avance Entonces devuelve 0', () => {
    // Cubre: 6.4
    expect(calcularPorcentajeAvance(Number.NaN, 10)).toBe(0);
    expect(calcularPorcentajeAvance(2, Number.NaN)).toBe(0);
    expect(calcularPorcentajeAvance(2, Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('Dados valores no enteros Cuando se calcula el avance Entonces los trunca antes de calcular', () => {
    // Cubre: 6.4
    expect(calcularPorcentajeAvance(1.9, 4.9)).toBe(25);
  });
});

describe('estaCompleto', () => {
  it('Dados todos los Ejercicios completados Cuando se consulta la completitud Entonces devuelve verdadero', () => {
    // Cubre: 6.5
    expect(estaCompleto(5, 5)).toBe(true);
  });

  it('Dado un Ejercicio pendiente Cuando se consulta la completitud Entonces devuelve falso', () => {
    // Cubre: 6.5
    expect(estaCompleto(4, 5)).toBe(false);
  });

  it('Dado un Entrenamiento sin Ejercicios Cuando se consulta la completitud Entonces devuelve falso', () => {
    // Cubre: 6.9
    expect(estaCompleto(0, 0)).toBe(false);
  });

  it('Dados más completados que el total Cuando se consulta la completitud Entonces devuelve verdadero', () => {
    // Cubre: 6.5
    expect(estaCompleto(7, 5)).toBe(true);
  });

  it('Dados valores no finitos Cuando se consulta la completitud Entonces devuelve falso', () => {
    // Cubre: 6.5
    expect(estaCompleto(Number.NaN, 5)).toBe(false);
    expect(estaCompleto(5, Number.NaN)).toBe(false);
  });
});
