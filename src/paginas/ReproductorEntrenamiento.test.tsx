/**
 * Tests de ReproductorEntrenamiento.
 *
 * El reproductor recibe el identificador del Entrenamiento por la ruta
 * `/entrenamientos/:id`, lo solicita al Repositorio_Datos y presenta su título y
 * la lista completa de sus Ejercicios, indicando para cada uno el nombre, la
 * cantidad de series, la cantidad de repeticiones y el descanso en segundos
 * (6.1).
 *
 * Los datos llegan del ContextoServicios con un repositorio en memoria y un
 * reloj falso. Consultas sólo por rol, texto o etiqueta accesible; una sola
 * interacción por test.
 */
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { crearEjercicio, crearEntrenamiento } from '../dominio/modelos';
import { ProveedorServicios } from '../estado/ContextoServicios';
import { crearRelojFalso } from '../tests/dobles/relojFalso';
import { crearRepositorioEnMemoria } from '../tests/dobles/repositorioEnMemoria';
import ReproductorEntrenamiento from './ReproductorEntrenamiento';

type OpcionesRender = {
  repositorio?: ReturnType<typeof crearRepositorioEnMemoria>;
  reloj?: ReturnType<typeof crearRelojFalso>;
  ruta?: string;
};

function renderizar({
  repositorio = crearRepositorioEnMemoria(),
  reloj = crearRelojFalso(),
  ruta = '/entrenamientos/e1',
}: OpcionesRender = {}): {
  repositorio: ReturnType<typeof crearRepositorioEnMemoria>;
  reloj: ReturnType<typeof crearRelojFalso>;
} {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <ProveedorServicios repositorio={repositorio} reloj={reloj}>
        <Routes>
          <Route
            path="/entrenamientos/:id"
            element={<ReproductorEntrenamiento />}
          />
        </Routes>
      </ProveedorServicios>
    </MemoryRouter>,
  );
  return { repositorio, reloj };
}

const ENTRENAMIENTO_CON_EJERCICIOS = crearEntrenamiento({
  id: 'e1',
  titulo: 'Rutina de piernas',
  ejercicios: [
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
  ],
});

describe('ReproductorEntrenamiento', () => {
  it('Dado un Entrenamiento almacenado Cuando la lectura se resuelve Entonces presenta su título', async () => {
    // Cubre: 6.1
    renderizar({
      repositorio: crearRepositorioEnMemoria({
        entrenamientos: [ENTRENAMIENTO_CON_EJERCICIOS],
      }),
    });

    expect(
      await screen.findByRole('heading', { name: 'Rutina de piernas' }),
    ).toBeInTheDocument();
  });

  it('Dado un Entrenamiento con Ejercicios Cuando la lectura se resuelve Entonces presenta una fila por cada Ejercicio', async () => {
    // Cubre: 6.1
    renderizar({
      repositorio: crearRepositorioEnMemoria({
        entrenamientos: [ENTRENAMIENTO_CON_EJERCICIOS],
      }),
    });
    await screen.findByRole('heading', { name: 'Rutina de piernas' });

    const lista = screen.getByRole('list');
    expect(within(lista).getAllByRole('listitem')).toHaveLength(2);
  });

  it('Dado un Entrenamiento con Ejercicios Cuando la lectura se resuelve Entonces presenta el detalle completo de cada Ejercicio', async () => {
    // Cubre: 6.1
    renderizar({
      repositorio: crearRepositorioEnMemoria({
        entrenamientos: [ENTRENAMIENTO_CON_EJERCICIOS],
      }),
    });
    const primera = (await screen.findAllByRole('listitem'))[0];

    expect(primera).toHaveTextContent('Sentadilla');
    expect(primera).toHaveTextContent('4 series');
    expect(primera).toHaveTextContent('12 repeticiones');
    expect(primera).toHaveTextContent('90 segundos');
  });

  it('Dado un Entrenamiento con dos Ejercicios Cuando el Usuario marca uno como completado Entonces presenta el porcentaje de avance recalculado', async () => {
    // Cubre: 6.4
    renderizar({
      repositorio: crearRepositorioEnMemoria({
        entrenamientos: [ENTRENAMIENTO_CON_EJERCICIOS],
      }),
    });
    await screen.findByRole('heading', { name: 'Rutina de piernas' });

    await userEvent.click(screen.getByRole('checkbox', { name: /Sentadilla/ }));

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
  });

  it('Dado un Ejercicio marcado como completado Cuando el Usuario lo desmarca Entonces recalcula el porcentaje de avance a la baja', async () => {
    // Cubre: 6.7
    renderizar({
      repositorio: crearRepositorioEnMemoria({
        entrenamientos: [ENTRENAMIENTO_CON_EJERCICIOS],
      }),
    });
    await screen.findByRole('heading', { name: 'Rutina de piernas' });
    const casilla = screen.getByRole('checkbox', { name: /Sentadilla/ });
    await userEvent.click(casilla);

    await userEvent.click(casilla);

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
  });

  it('Dado un Entrenamiento Cuando el Usuario marca como completados todos sus Ejercicios Entonces presenta el resumen de la sesión con total y 100 %', async () => {
    // Cubre: 6.5
    renderizar({
      repositorio: crearRepositorioEnMemoria({
        entrenamientos: [ENTRENAMIENTO_CON_EJERCICIOS],
      }),
    });
    await screen.findByRole('heading', { name: 'Rutina de piernas' });
    await userEvent.click(screen.getByRole('checkbox', { name: /Sentadilla/ }));

    await userEvent.click(
      screen.getByRole('checkbox', { name: /Peso muerto/ }),
    );

    const resumen = screen.getByRole('status', { name: 'Resumen de la sesión' });
    expect(resumen).toHaveTextContent('2 de 2');
    expect(resumen).toHaveTextContent('100%');
  });

  it('Dado un temporizador de descanso iniciado Cuando la cuenta alcanza 0 Entonces anuncia "Descanso finalizado" en una región aria-live', async () => {
    // Cubre: 6.3
    const { reloj } = renderizar({
      repositorio: crearRepositorioEnMemoria({
        entrenamientos: [ENTRENAMIENTO_CON_EJERCICIOS],
      }),
    });
    await screen.findByRole('heading', { name: 'Rutina de piernas' });
    const fila = screen
      .getAllByRole('listitem')
      .find((elemento) => elemento.textContent?.includes('Sentadilla'));
    await userEvent.click(
      within(fila as HTMLElement).getByRole('button', {
        name: 'Iniciar descanso',
      }),
    );

    act(() => reloj.avanzarSegundos(90));

    expect(
      within(fila as HTMLElement).getByRole('status'),
    ).toHaveTextContent('Descanso finalizado');
  });

  it('Dado un Entrenamiento sin Ejercicios Cuando la lectura se resuelve Entonces presenta el mensaje de entrenamiento sin ejercicios', async () => {
    // Cubre: 6.9
    renderizar({
      repositorio: crearRepositorioEnMemoria({
        entrenamientos: [
          crearEntrenamiento({ id: 'e1', titulo: 'Vacío', ejercicios: [] }),
        ],
      }),
    });

    expect(
      await screen.findByText('Este entrenamiento no tiene ejercicios cargados'),
    ).toBeInTheDocument();
  });

  it('Dado un Entrenamiento sin Ejercicios Cuando la lectura se resuelve Entonces presenta el porcentaje de avance en 0', async () => {
    // Cubre: 6.9
    renderizar({
      repositorio: crearRepositorioEnMemoria({
        entrenamientos: [
          crearEntrenamiento({ id: 'e1', titulo: 'Vacío', ejercicios: [] }),
        ],
      }),
    });
    await screen.findByText('Este entrenamiento no tiene ejercicios cargados');

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
  });
});
