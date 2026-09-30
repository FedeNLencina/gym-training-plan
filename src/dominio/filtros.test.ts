/**
 * Tests unitarios del filtrado de Entrenamientos.
 *
 * Se verifica que el filtrado sea conjuntivo (categoría y nivel a la vez), que
 * el valor `'Todos'` se ignore en cualquiera de los dos filtros y que la falta
 * de coincidencias devuelva una lista vacía sin alterar la lista de entrada.
 *
 * Cubre: 5.1, 5.2, 5.3, 5.9
 */

import { describe, it, expect } from 'vitest';

import {
  FILTRO_TODOS,
  filtrarEntrenamientos,
  soloPublicados,
} from './filtros';
import { crearEntrenamiento, type Entrenamiento, type Nivel } from './modelos';

function entrenamiento(
  titulo: string,
  categoria: string,
  nivel: Nivel,
  estado: 'publicado' | 'borrador' = 'publicado',
): Entrenamiento {
  return crearEntrenamiento({ titulo, categoria, nivel, estado });
}

const fuerzaPrincipiante = entrenamiento('Fuerza base', 'Fuerza', 'Principiante');
const fuerzaAvanzado = entrenamiento('Fuerza total', 'Fuerza', 'Avanzado');
const cardioPrincipiante = entrenamiento('Cardio suave', 'Cardio', 'Principiante');
const movilidadIntermedio = entrenamiento('Movilidad', 'Movilidad', 'Intermedio');

const catalogo: readonly Entrenamiento[] = [
  fuerzaPrincipiante,
  fuerzaAvanzado,
  cardioPrincipiante,
  movilidadIntermedio,
];

function titulos(entrenamientos: readonly Entrenamiento[]): string[] {
  return entrenamientos.map((uno) => uno.titulo);
}

describe('filtrarEntrenamientos', () => {
  it('Dado un filtro de categoría Cuando se filtra Entonces devuelve sólo esa categoría', () => {
    // Cubre: 5.2
    const resultado = filtrarEntrenamientos(catalogo, { categoria: 'Fuerza' });

    expect(titulos(resultado)).toEqual(['Fuerza base', 'Fuerza total']);
  });

  it('Dado un filtro de nivel Cuando se filtra Entonces devuelve sólo ese nivel', () => {
    // Cubre: 5.3
    const resultado = filtrarEntrenamientos(catalogo, {
      nivel: 'Principiante',
    });

    expect(titulos(resultado)).toEqual(['Fuerza base', 'Cardio suave']);
  });

  it('Dados los dos filtros a la vez Cuando se filtra Entonces exige ambas coincidencias', () => {
    // Cubre: 5.9
    const resultado = filtrarEntrenamientos(catalogo, {
      categoria: 'Fuerza',
      nivel: 'Avanzado',
    });

    expect(titulos(resultado)).toEqual(['Fuerza total']);
  });

  it('Dado el valor Todos en categoría Cuando se filtra Entonces ese filtro se ignora', () => {
    // Cubre: 5.2, 5.9
    const resultado = filtrarEntrenamientos(catalogo, {
      categoria: FILTRO_TODOS,
      nivel: 'Principiante',
    });

    expect(titulos(resultado)).toEqual(['Fuerza base', 'Cardio suave']);
  });

  it('Dado el valor Todos en nivel Cuando se filtra Entonces ese filtro se ignora', () => {
    // Cubre: 5.3, 5.9
    const resultado = filtrarEntrenamientos(catalogo, {
      categoria: 'Fuerza',
      nivel: FILTRO_TODOS,
    });

    expect(titulos(resultado)).toEqual(['Fuerza base', 'Fuerza total']);
  });

  it('Dado el valor Todos en ambos filtros Cuando se filtra Entonces devuelve la lista completa', () => {
    // Cubre: 5.9
    const resultado = filtrarEntrenamientos(catalogo, {
      categoria: FILTRO_TODOS,
      nivel: FILTRO_TODOS,
    });

    expect(titulos(resultado)).toEqual(titulos(catalogo));
  });

  it('Dados filtros sin argumento Cuando se filtra Entonces devuelve la lista completa', () => {
    // Cubre: 5.9
    const resultado = filtrarEntrenamientos(catalogo);

    expect(titulos(resultado)).toEqual(titulos(catalogo));
  });

  it('Dada una combinación sin coincidencias Cuando se filtra Entonces devuelve lista vacía', () => {
    // Cubre: 5.2, 5.3, 5.9
    const resultado = filtrarEntrenamientos(catalogo, {
      categoria: 'Cardio',
      nivel: 'Avanzado',
    });

    expect(resultado).toEqual([]);
  });

  it('Dada una categoría con otra caja Cuando se filtra Entonces no coincide por ser exacta', () => {
    // Cubre: 5.2
    const resultado = filtrarEntrenamientos(catalogo, { categoria: 'fuerza' });

    expect(resultado).toEqual([]);
  });

  it('Dada una lista vacía Cuando se filtra Entonces devuelve lista vacía', () => {
    // Cubre: 5.9
    const resultado = filtrarEntrenamientos([], { categoria: 'Fuerza' });

    expect(resultado).toEqual([]);
  });

  it('Dada una lista de entrada Cuando se filtra Entonces devuelve otra lista sin mutar la original', () => {
    // Cubre: 5.9
    const entrada: Entrenamiento[] = [...catalogo];

    const resultado = filtrarEntrenamientos(entrada, { categoria: 'Fuerza' });

    expect(resultado).not.toBe(entrada);
    expect(entrada).toHaveLength(4);
  });
});

describe('soloPublicados', () => {
  it('Dada una lista con estados mixtos Cuando se filtra Entonces devuelve sólo los publicados', () => {
    // Cubre: 5.1
    const borrador = entrenamiento('En borrador', 'Cardio', 'Intermedio', 'borrador');

    const resultado = soloPublicados([...catalogo, borrador]);

    expect(titulos(resultado)).toEqual(titulos(catalogo));
  });

  it('Dada una lista sin publicados Cuando se filtra Entonces devuelve lista vacía', () => {
    // Cubre: 5.1
    const borrador = entrenamiento('En borrador', 'Cardio', 'Intermedio', 'borrador');

    const resultado = soloPublicados([borrador]);

    expect(resultado).toEqual([]);
  });

  it('Dada una lista vacía Cuando se filtra por publicados Entonces devuelve lista vacía', () => {
    // Cubre: 5.1
    const resultado = soloPublicados([]);

    expect(resultado).toEqual([]);
  });

  it('Dada una lista publicada Cuando se filtra Entonces devuelve otra lista sin mutar la original', () => {
    // Cubre: 5.1
    const entrada: Entrenamiento[] = [...catalogo];

    const resultado = soloPublicados(entrada);

    expect(resultado).not.toBe(entrada);
    expect(entrada).toHaveLength(4);
  });
});
