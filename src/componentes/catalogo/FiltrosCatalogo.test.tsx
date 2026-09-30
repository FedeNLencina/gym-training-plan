/**
 * Tests de FiltrosCatalogo.
 *
 * Los controles de filtro del catálogo son dos selectores accesibles por su
 * etiqueta ("Categoría" y "Nivel"), cada uno con el valor neutro "Todos" y las
 * opciones que recibe. Notifican la selección al contenedor y, mientras el
 * catálogo carga, quedan deshabilitados (5.5).
 *
 * Consultas sólo por etiqueta accesible y rol; una sola interacción por test.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FILTRO_TODOS } from '../../dominio/filtros';
import FiltrosCatalogo from './FiltrosCatalogo';

const CATEGORIAS = ['Fuerza', 'Cardio'];
const NIVELES = ['Principiante', 'Intermedio', 'Avanzado'];

function renderizar(
  props: Partial<Parameters<typeof FiltrosCatalogo>[0]> = {},
): { alCambiar: ReturnType<typeof vi.fn> } {
  const alCambiar = vi.fn();
  render(
    <FiltrosCatalogo
      categoria={FILTRO_TODOS}
      nivel={FILTRO_TODOS}
      categorias={CATEGORIAS}
      niveles={NIVELES}
      deshabilitado={false}
      alCambiarFiltros={alCambiar}
      {...props}
    />,
  );
  return { alCambiar };
}

describe('FiltrosCatalogo', () => {
  it('Dado el selector de categoría Cuando el usuario elige una categoría Entonces notifica el nuevo filtro de categoría', async () => {
    // Cubre: 5.2
    const { alCambiar } = renderizar();

    await userEvent.selectOptions(
      screen.getByLabelText('Categoría'),
      'Cardio',
    );

    expect(alCambiar).toHaveBeenCalledWith({ categoria: 'Cardio' });
  });

  it('Dado el selector de nivel Cuando el usuario elige un nivel Entonces notifica el nuevo filtro de nivel', async () => {
    // Cubre: 5.3
    const { alCambiar } = renderizar();

    await userEvent.selectOptions(
      screen.getByLabelText('Nivel'),
      'Intermedio',
    );

    expect(alCambiar).toHaveBeenCalledWith({ nivel: 'Intermedio' });
  });

  it('Dado que el catálogo está cargando Cuando se presentan los filtros Entonces los selectores quedan deshabilitados', () => {
    // Cubre: 5.5
    renderizar({ deshabilitado: true });

    expect(screen.getByLabelText('Categoría')).toBeDisabled();
    expect(screen.getByLabelText('Nivel')).toBeDisabled();
  });

  it('Dado el valor neutro seleccionado Cuando se presentan los filtros Entonces cada selector ofrece la opción Todos', () => {
    // Cubre: 5.9
    renderizar();

    expect(screen.getByLabelText('Categoría')).toHaveValue(FILTRO_TODOS);
    expect(screen.getByLabelText('Nivel')).toHaveValue(FILTRO_TODOS);
  });
});
