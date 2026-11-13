import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ADMIN, montarApp } from '../tests/montar';

const abrir = async (user: ReturnType<typeof userEvent.setup>, seccion: string) => {
  await user.click(screen.getByRole('tab', { name: seccion }));
};

const fila = (texto: string) => within(screen.getByRole('row', { name: new RegExp(texto) }));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Administración', () => {
  it('da de alta al usuario que pidió un plan', async () => {
    const user = userEvent.setup();
    montarApp('/admin', { sesion: ADMIN });
    await abrir(user, 'Usuarios');

    expect(fila('Bruno Giménez').getByText(/pidió avanzado/i)).toBeInTheDocument();
    await user.click(fila('Bruno Giménez').getByRole('button', { name: 'Dar de alta' }));

    expect(fila('Bruno Giménez').getByRole('combobox', { name: /plan activo/i })).toHaveValue('plan-avanzado');
    expect(fila('Bruno Giménez').queryByRole('button', { name: 'Dar de alta' })).not.toBeInTheDocument();
  });

  it('asigna y quita un plan a mano', async () => {
    const user = userEvent.setup();
    montarApp('/admin', { sesion: ADMIN });
    await abrir(user, 'Usuarios');
    const plan = fila('Diego Sosa').getByRole('combobox', { name: /plan activo/i });

    await user.selectOptions(plan, 'plan-basico');
    expect(plan).toHaveValue('plan-basico');
    await user.selectOptions(plan, '');
    expect(plan).toHaveValue('');
  });

  it('elimina un usuario tras confirmar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    montarApp('/admin', { sesion: ADMIN });
    await abrir(user, 'Usuarios');
    await user.click(fila('Diego Sosa').getByRole('button', { name: 'Eliminar' }));
    expect(screen.queryByRole('row', { name: /Diego Sosa/ })).not.toBeInTheDocument();
  });

  it('crea, edita y elimina un plan', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    montarApp('/admin', { sesion: ADMIN });
    await abrir(user, 'Planes');

    await user.click(screen.getByRole('button', { name: 'Nuevo plan' }));
    await user.click(screen.getByRole('button', { name: 'Guardar plan' }));
    expect(screen.getByLabelText('Nombre')).toHaveAccessibleDescription('Ingresá el nombre del plan');

    await user.type(screen.getByLabelText('Nombre'), 'Elite');
    await user.type(screen.getByLabelText('Descripción'), 'Seguimiento personal');
    await user.type(screen.getByLabelText('Precio mensual'), '45000');
    await user.click(screen.getByRole('button', { name: 'Guardar plan' }));
    expect(fila('Elite').getByText(/45\.000/)).toBeInTheDocument();

    await user.click(fila('Elite').getByRole('button', { name: 'Editar' }));
    await user.clear(screen.getByLabelText('Nombre'));
    await user.type(screen.getByLabelText('Nombre'), 'Elite Plus');
    await user.click(screen.getByRole('button', { name: 'Guardar plan' }));
    expect(screen.getByRole('row', { name: /Elite Plus/ })).toBeInTheDocument();

    await user.click(fila('Elite Plus').getByRole('button', { name: 'Eliminar' }));
    expect(screen.queryByRole('row', { name: /Elite Plus/ })).not.toBeInTheDocument();
  });

  it('crea un entrenamiento con enlace de video y lo elimina', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    montarApp('/admin', { sesion: ADMIN });

    await user.click(screen.getByRole('button', { name: 'Nuevo entrenamiento' }));
    await user.type(screen.getByLabelText('Título'), 'Dominadas');
    await user.type(screen.getByLabelText('Duración en minutos'), '25');
    await user.selectOptions(screen.getByLabelText('Categoría'), 'avanzado');
    await user.type(screen.getByLabelText('Enlace del video'), 'no-es-enlace');
    await user.click(screen.getByRole('button', { name: 'Guardar entrenamiento' }));
    expect(screen.getByLabelText('Enlace del video')).toHaveAccessibleDescription(
      'Ingresá un enlace de video válido',
    );

    await user.clear(screen.getByLabelText('Enlace del video'));
    await user.type(screen.getByLabelText('Enlace del video'), 'https://youtu.be/abc123');
    await user.click(screen.getByRole('button', { name: 'Guardar entrenamiento' }));
    expect(await screen.findByRole('row', { name: /Dominadas/ })).toBeInTheDocument();

    await user.click(fila('Dominadas').getByRole('button', { name: 'Eliminar' }));
    expect(screen.queryByRole('row', { name: /Dominadas/ })).not.toBeInTheDocument();
  });

  it('los textos editados aparecen en la página de inicio', async () => {
    const user = userEvent.setup();
    montarApp('/admin', { sesion: ADMIN });
    await abrir(user, 'Contenido');

    await user.clear(screen.getByLabelText('Título principal'));
    await user.type(screen.getByLabelText('Título principal'), 'Nuevo titular');
    await user.click(screen.getByRole('button', { name: 'Agregar pregunta' }));
    const preguntas = screen.getAllByLabelText('Pregunta');
    await user.type(preguntas[preguntas.length - 1], '¿Hay prueba gratis?');
    await user.click(screen.getByRole('button', { name: 'Guardar contenido' }));
    expect(screen.getByRole('status')).toHaveTextContent('Contenido guardado');

    await user.click(within(screen.getByRole('banner')).getByRole('link', { name: 'Inicio' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Nuevo titular' })).toBeInTheDocument();
    expect(screen.getByText('¿Hay prueba gratis?')).toBeInTheDocument();
  });
});
