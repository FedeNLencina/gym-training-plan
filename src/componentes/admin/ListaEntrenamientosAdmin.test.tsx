/**
 * Tests de ListaEntrenamientosAdmin.
 *
 * La lista administrable presenta los Entrenamientos que el Administrador puede
 * gestionar (7.1). A diferencia del catálogo público, incluye tanto los
 * publicados como los borradores, porque el Administrador gestiona todos, y de
 * cada uno presenta su título, su categoría, su nivel de dificultad, su duración
 * estimada y su estado. Cuando no hay ningún Entrenamiento, presenta un mensaje
 * de lista vacía.
 *
 * Es un componente de presentación puro: recibe la lista ya cargada, sin conocer
 * el Repositorio_Datos. Consultas sólo por rol, texto o etiqueta accesible; una
 * sola interacción por test.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { crearEntrenamiento, type Entrenamiento } from '../../dominio/modelos';
import ListaEntrenamientosAdmin, {
  MENSAJE_LISTA_VACIA,
} from './ListaEntrenamientosAdmin';

function entrenamiento(datos: Partial<Entrenamiento>): Entrenamiento {
  return crearEntrenamiento(datos);
}

describe('ListaEntrenamientosAdmin', () => {
  it('Dado una lista con publicados y borradores Cuando se presenta Entonces presenta todos los Entrenamientos administrables', () => {
    // Cubre: 7.1
    render(
      <ListaEntrenamientosAdmin
        entrenamientos={[
          entrenamiento({ id: 'e1', titulo: 'Fuerza total', estado: 'publicado' }),
          entrenamiento({ id: 'e2', titulo: 'Cardio express', estado: 'borrador' }),
        ]}
      />,
    );

    expect(screen.getByText('Fuerza total')).toBeInTheDocument();
    expect(screen.getByText('Cardio express')).toBeInTheDocument();
  });

  it('Dado un Entrenamiento administrable Cuando se presenta Entonces presenta su categoría, su nivel, su duración y su estado', () => {
    // Cubre: 7.1
    render(
      <ListaEntrenamientosAdmin
        entrenamientos={[
          entrenamiento({
            id: 'e1',
            titulo: 'Fuerza total',
            categoria: 'Fuerza',
            nivel: 'Avanzado',
            duracionMinutos: 45,
            estado: 'publicado',
          }),
        ]}
      />,
    );
    const fila = screen.getByRole('listitem');

    expect(within(fila).getByText('Fuerza')).toBeInTheDocument();
    expect(within(fila).getByText('Avanzado')).toBeInTheDocument();
    expect(within(fila).getByText('45 min')).toBeInTheDocument();
    expect(within(fila).getByText('publicado')).toBeInTheDocument();
  });

  it('Dado una lista sin Entrenamientos Cuando se presenta Entonces presenta el mensaje de lista vacía', () => {
    // Cubre: 7.1
    render(<ListaEntrenamientosAdmin entrenamientos={[]} />);

    expect(screen.getByText(MENSAJE_LISTA_VACIA)).toBeInTheDocument();
  });

  it('Dado un Entrenamiento administrable Cuando se pide eliminarlo y se confirma Entonces invoca onEliminar con su identificador', async () => {
    // Cubre: 7.6
    const usuario = userEvent.setup();
    const onEliminar = vi.fn();
    render(
      <ListaEntrenamientosAdmin
        entrenamientos={[entrenamiento({ id: 'e1', titulo: 'Fuerza total' })]}
        onEliminar={onEliminar}
      />,
    );
    await usuario.click(screen.getByRole('button', { name: 'Eliminar Fuerza total' }));

    await usuario.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }),
    );

    expect(onEliminar).toHaveBeenCalledTimes(1);
    expect(onEliminar).toHaveBeenCalledWith('e1');
  });

  it('Dado un Entrenamiento administrable Cuando se pide eliminarlo y se cancela Entonces no invoca onEliminar y cierra el diálogo', async () => {
    // Cubre: 7.9
    const usuario = userEvent.setup();
    const onEliminar = vi.fn();
    render(
      <ListaEntrenamientosAdmin
        entrenamientos={[entrenamiento({ id: 'e1', titulo: 'Fuerza total' })]}
        onEliminar={onEliminar}
      />,
    );
    await usuario.click(screen.getByRole('button', { name: 'Eliminar Fuerza total' }));

    await usuario.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }),
    );

    expect(onEliminar).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
