import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { crearRelojFalso } from '../tests/dobles/relojFalso';
import { crearReloj, type Reloj } from './reloj';

/**
 * El reloj real se ejercita con los temporizadores falsos de Vitest, de modo
 * que el tiempo avance sólo cuando la prueba lo pide y dos corridas
 * consecutivas produzcan el mismo resultado.
 */
describe('reloj', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Dado un plazo programado a 5 segundos Cuando el tiempo avanza 4999 milisegundos Entonces la tarea todavía no se ejecutó', () => {
    // Cubre: 5.10
    const reloj = crearReloj();
    let ejecuciones = 0;
    reloj.programar(() => {
      ejecuciones += 1;
    }, 5000);

    vi.advanceTimersByTime(4999);

    expect(ejecuciones).toBe(0);
  });

  it('Dado un plazo programado a 5 segundos Cuando el tiempo avanza 5000 milisegundos Entonces la tarea se ejecutó exactamente una vez', () => {
    // Cubre: 5.10
    const reloj = crearReloj();
    let ejecuciones = 0;
    reloj.programar(() => {
      ejecuciones += 1;
    }, 5000);

    vi.advanceTimersByTime(10000);

    expect(ejecuciones).toBe(1);
  });

  it('Dado un plazo programado y luego cancelado Cuando el tiempo avanza más allá de su vencimiento Entonces la tarea no se ejecuta', () => {
    // Cubre: 5.10
    const reloj = crearReloj();
    let ejecuciones = 0;
    const id = reloj.programar(() => {
      ejecuciones += 1;
    }, 100);
    reloj.cancelar(id);

    vi.advanceTimersByTime(500);

    expect(ejecuciones).toBe(0);
  });

  it('Dado un intervalo de un segundo Cuando el tiempo avanza tres segundos Entonces la tarea se ejecutó exactamente tres veces', () => {
    // Cubre: 6.2
    const reloj = crearReloj();
    let ejecuciones = 0;
    reloj.programarIntervalo(() => {
      ejecuciones += 1;
    }, 1000);

    vi.advanceTimersByTime(3000);

    expect(ejecuciones).toBe(3);
  });

  it('Dado un intervalo de un segundo cancelado tras el primer tic Cuando el tiempo avanza tres segundos más Entonces no vuelve a ejecutarse', () => {
    // Cubre: 6.2, 6.3
    const reloj = crearReloj();
    let ejecuciones = 0;
    const id = reloj.programarIntervalo(() => {
      ejecuciones += 1;
      reloj.cancelarIntervalo(id);
    }, 1000);

    vi.advanceTimersByTime(4000);

    expect(ejecuciones).toBe(1);
  });

  it('Dado un reloj real con el tiempo del sistema fijado Cuando se consulta el instante actual Entonces devuelve ese instante en milisegundos', () => {
    // Cubre: 10.8
    const instante = new Date('2024-01-01T00:00:00.000Z');
    vi.setSystemTime(instante);
    const reloj = crearReloj();

    const ahora = reloj.ahora();

    expect(ahora).toBe(instante.getTime());
  });

  it('Dado el doble relojFalso Cuando se usa donde se espera un Reloj Entonces cumple el mismo contrato y es sustituible', () => {
    // Cubre: 10.8
    const relojFalso = crearRelojFalso({ ahoraInicial: 1000 });
    const reloj: Reloj = relojFalso;
    let ejecuciones = 0;
    reloj.programarIntervalo(() => {
      ejecuciones += 1;
    }, 1000);

    relojFalso.avanzarSegundos(2);

    expect(ejecuciones).toBe(2);
    expect(reloj.ahora()).toBe(3000);
  });
});
