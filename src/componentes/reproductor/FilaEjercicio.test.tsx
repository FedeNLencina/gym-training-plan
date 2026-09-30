/**
 * Tests de FilaEjercicio.
 *
 * Una fila presenta el detalle completo de un Ejercicio: su nombre, la cantidad
 * de series, la cantidad de repeticiones y el descanso en segundos (6.1).
 * Consultas sólo por rol, texto o etiqueta accesible.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { crearEjercicio } from '../../dominio/modelos';
import FilaEjercicio from './FilaEjercicio';

describe('FilaEjercicio', () => {
  it('Dado un Ejercicio Cuando se presenta la fila Entonces muestra su nombre', () => {
    // Cubre: 6.1
    render(
      <ul>
        <FilaEjercicio
          ejercicio={crearEjercicio({
            id: 'ej1',
            nombre: 'Sentadilla',
            series: 4,
            repeticiones: 12,
            descansoSegundos: 90,
          })}
        />
      </ul>,
    );

    expect(screen.getByText('Sentadilla')).toBeInTheDocument();
  });

  it('Dado un Ejercicio Cuando se presenta la fila Entonces muestra sus series, repeticiones y descanso en segundos', () => {
    // Cubre: 6.1
    render(
      <ul>
        <FilaEjercicio
          ejercicio={crearEjercicio({
            id: 'ej1',
            nombre: 'Sentadilla',
            series: 4,
            repeticiones: 12,
            descansoSegundos: 90,
          })}
        />
      </ul>,
    );

    const fila = screen.getByRole('listitem');
    expect(fila).toHaveTextContent('4 series');
    expect(fila).toHaveTextContent('12 repeticiones');
    expect(fila).toHaveTextContent('90 segundos');
  });

  it('Dado un Ejercicio sin completar Cuando el Usuario marca su casilla Entonces solicita alternar su completitud', async () => {
    // Cubre: 6.7
    const alAlternar = vi.fn();
    render(
      <ul>
        <FilaEjercicio
          ejercicio={crearEjercicio({ id: 'ej1', nombre: 'Sentadilla' })}
          completado={false}
          alAlternar={alAlternar}
        />
      </ul>,
    );

    await userEvent.click(
      screen.getByRole('checkbox', { name: /Sentadilla/ }),
    );

    expect(alAlternar).toHaveBeenCalledWith('ej1');
  });

  it('Dado un Ejercicio ya completado Cuando se presenta la fila Entonces su casilla figura marcada', () => {
    // Cubre: 6.4
    render(
      <ul>
        <FilaEjercicio
          ejercicio={crearEjercicio({ id: 'ej1', nombre: 'Sentadilla' })}
          completado
          alAlternar={vi.fn()}
        />
      </ul>,
    );

    expect(screen.getByRole('checkbox', { name: /Sentadilla/ })).toBeChecked();
  });

  it('Dado un reproductor sin Ejercicios interactivos Cuando la fila se presenta deshabilitada Entonces su casilla queda inhabilitada', () => {
    // Cubre: 6.9
    render(
      <ul>
        <FilaEjercicio
          ejercicio={crearEjercicio({ id: 'ej1', nombre: 'Sentadilla' })}
          completado={false}
          alAlternar={vi.fn()}
          deshabilitado
        />
      </ul>,
    );

    expect(
      screen.getByRole('checkbox', { name: /Sentadilla/ }),
    ).toBeDisabled();
  });
});
