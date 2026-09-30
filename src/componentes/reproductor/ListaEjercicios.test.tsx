/**
 * Tests de ListaEjercicios.
 *
 * La lista presenta la totalidad de los Ejercicios del Entrenamiento, cada uno
 * con su detalle completo: nombre, series, repeticiones y descanso en segundos
 * (6.1). Consultas sólo por rol, texto o etiqueta accesible.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { crearEjercicio, type Ejercicio } from '../../dominio/modelos';
import ListaEjercicios from './ListaEjercicios';

const EJERCICIOS: Ejercicio[] = [
  crearEjercicio({
    id: 'ej1',
    nombre: 'Sentadilla',
    series: 4,
    repeticiones: 12,
    descansoSegundos: 90,
  }),
  crearEjercicio({
    id: 'ej2',
    nombre: 'Peso muerto',
    series: 3,
    repeticiones: 8,
    descansoSegundos: 120,
  }),
];

describe('ListaEjercicios', () => {
  it('Dado un Entrenamiento con varios Ejercicios Cuando se presenta la lista Entonces muestra una fila por cada Ejercicio', () => {
    // Cubre: 6.1
    render(<ListaEjercicios ejercicios={EJERCICIOS} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(EJERCICIOS.length);
  });

  it('Dado un Entrenamiento con varios Ejercicios Cuando se presenta la lista Entonces muestra el nombre de cada Ejercicio', () => {
    // Cubre: 6.1
    render(<ListaEjercicios ejercicios={EJERCICIOS} />);

    expect(screen.getByText('Sentadilla')).toBeInTheDocument();
    expect(screen.getByText('Peso muerto')).toBeInTheDocument();
  });
});
