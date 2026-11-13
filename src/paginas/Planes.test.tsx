import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ANA, BRUNO, DIEGO, montarApp } from '../tests/montar';

const tarjeta = (nombre: string) => within(screen.getByRole('article', { name: `Plan ${nombre}` }));

describe('Planes', () => {
  it('muestra los planes del más barato al más caro', () => {
    montarApp('/planes', {
      preparar: (datos) => datos.planes.reverse(),
    });
    const nombres = screen.getAllByRole('article').map((a) => a.getAttribute('aria-label'));
    expect(nombres).toEqual(['Plan Básico', 'Plan Intermedio', 'Plan Avanzado']);
  });

  it('sin sesión no hay botón de adquirir: pide iniciar sesión', () => {
    montarApp('/planes');
    expect(screen.queryByRole('button', { name: /adquirir plan/i })).not.toBeInTheDocument();
    expect(tarjeta('Básico').getByRole('link', { name: /iniciá sesión/i })).toBeInTheDocument();
  });

  it('con sesión y sin plan, cada plan se puede adquirir', () => {
    montarApp('/planes', { sesion: DIEGO });
    expect(screen.getAllByRole('button', { name: 'Adquirir plan' })).toHaveLength(3);
  });

  it('al adquirir queda la solicitud pendiente con las instrucciones de pago', async () => {
    const user = userEvent.setup();
    montarApp('/planes', { sesion: DIEGO });
    await user.click(tarjeta('Intermedio').getByRole('button', { name: 'Adquirir plan' }));

    expect(tarjeta('Intermedio').getByText('Solicitud pendiente')).toBeInTheDocument();
    expect(tarjeta('Intermedio').getByText(/ATLAS\.GYM\.PLANES/)).toBeInTheDocument();
    expect(
      tarjeta('Intermedio').queryByRole('button', { name: 'Adquirir plan' }),
    ).not.toBeInTheDocument();
  });

  it('con un plan activo lo marca y ofrece cambiar a los demás, más baratos o más caros', () => {
    montarApp('/planes', { sesion: ANA });
    expect(tarjeta('Intermedio').getByText('Tu plan actual')).toBeInTheDocument();
    expect(tarjeta('Básico').getByRole('button', { name: 'Cambiar a este plan' })).toBeInTheDocument();
    expect(tarjeta('Avanzado').getByRole('button', { name: 'Cambiar a este plan' })).toBeInTheDocument();
  });

  it('una solicitud pendiente se puede cancelar', async () => {
    const user = userEvent.setup();
    montarApp('/planes', { sesion: BRUNO });
    await user.click(tarjeta('Avanzado').getByRole('button', { name: 'Cancelar solicitud' }));
    expect(tarjeta('Avanzado').getByRole('button', { name: 'Cambiar a este plan' })).toBeInTheDocument();
  });
});
