import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ANA, DIEGO, montarApp } from '../tests/montar';

const tarjeta = (titulo: string) => within(screen.getByRole('article', { name: titulo }));

describe('Entrenamientos', () => {
  it('lista los entrenamientos con la etiqueta de su categoría', () => {
    montarApp('/entrenamientos', { sesion: ANA });
    expect(screen.getAllByRole('article')).toHaveLength(8);
    expect(tarjeta('Peso muerto con barra').getByText('Avanzado')).toBeInTheDocument();
    expect(tarjeta('Zona media: estabilidad').getByText('Básico')).toBeInTheDocument();
  });

  it('el filtro deja sólo los de la categoría elegida', async () => {
    const user = userEvent.setup();
    montarApp('/entrenamientos', { sesion: ANA });
    const filtros = within(screen.getByRole('group', { name: 'Filtrar por categoría' }));

    await user.click(filtros.getByRole('button', { name: 'Avanzado' }));
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(filtros.getByRole('button', { name: 'Avanzado' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(filtros.getByRole('button', { name: 'Todos' }));
    expect(screen.getAllByRole('article')).toHaveLength(8);
  });

  it('el plan habilita su nivel y los inferiores; el resto queda bloqueado', () => {
    montarApp('/entrenamientos', { sesion: ANA });
    expect(tarjeta('Zona media: estabilidad').getByRole('link', { name: /ver entrenamiento/i })).toBeInTheDocument();
    expect(tarjeta('Intervalos de alta intensidad').getByRole('link', { name: /ver entrenamiento/i })).toBeInTheDocument();

    const avanzado = tarjeta('Peso muerto con barra');
    expect(avanzado.queryByRole('link', { name: /ver entrenamiento/i })).not.toBeInTheDocument();
    expect(avanzado.getByText(/requiere el plan avanzado/i)).toBeInTheDocument();
  });

  it('sin plan activo avisa y no habilita ninguno', () => {
    montarApp('/entrenamientos', { sesion: DIEGO });
    expect(screen.getByText(/todavía no tenés un plan activo/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /ver entrenamiento/i })).not.toBeInTheDocument();
  });

  it('abre el video de un entrenamiento habilitado', async () => {
    const user = userEvent.setup();
    montarApp('/entrenamientos', { sesion: ANA });
    await user.click(tarjeta('Zona media: estabilidad').getByRole('link', { name: /ver entrenamiento/i }));
    expect(screen.getByRole('heading', { name: 'Zona media: estabilidad' })).toBeInTheDocument();
    expect(screen.getByLabelText('Zona media: estabilidad', { selector: 'video' })).toBeInTheDocument();
  });

  it('no deja ver por dirección directa un entrenamiento de un nivel superior', () => {
    montarApp('/entrenamientos/ent-peso-muerto', { sesion: ANA });
    expect(screen.queryByLabelText('Peso muerto con barra', { selector: 'video' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver planes' })).toBeInTheDocument();
  });
});
