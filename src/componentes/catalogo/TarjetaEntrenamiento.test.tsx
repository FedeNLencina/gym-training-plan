/**
 * Tests de TarjetaEntrenamiento.
 *
 * La tarjeta presenta un Entrenamiento publicado del catálogo (5.1). Su forma
 * depende de si hay sesión activa:
 *
 * - Con sesión, la tarjeta entera es un enlace al detalle del Reproductor
 *   (`/entrenamientos/:id`, 6.1).
 * - Sin sesión, la tarjeta muestra la descripción del Entrenamiento y un CTA
 *   "Registrate para entrenar" hacia `/registro`, y no expone ningún enlace al
 *   detalle (5.8).
 *
 * Consultas sólo por rol, texto o etiqueta accesible; una sola interacción por
 * test. El enrutamiento se resuelve con `MemoryRouter` para que los `Link`
 * expongan su `href`.
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { crearEntrenamiento, type Entrenamiento } from '../../dominio/modelos';
import { RUTAS } from '../../rutas/definicionRutas';
import TarjetaEntrenamiento from './TarjetaEntrenamiento';

function entrenamientoDemo(): Entrenamiento {
  return crearEntrenamiento({
    id: 'ent-1',
    titulo: 'Fuerza total',
    descripcion: 'Rutina de fuerza para todo el cuerpo',
    categoria: 'Fuerza',
    nivel: 'Avanzado',
    duracionMinutos: 45,
    estado: 'publicado',
  });
}

function renderizar(
  entrenamiento: Entrenamiento,
  haySesion: boolean,
): void {
  render(
    <MemoryRouter>
      <TarjetaEntrenamiento entrenamiento={entrenamiento} haySesion={haySesion} />
    </MemoryRouter>,
  );
}

describe('TarjetaEntrenamiento', () => {
  it('Dado un Entrenamiento publicado Cuando se presenta la tarjeta Entonces muestra su título, categoría, nivel y duración', () => {
    // Cubre: 5.1
    renderizar(entrenamientoDemo(), false);

    expect(
      screen.getByRole('heading', { name: 'Fuerza total' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Fuerza')).toBeInTheDocument();
    expect(screen.getByText('Avanzado')).toBeInTheDocument();
    expect(screen.getByText('45 min')).toBeInTheDocument();
  });

  it('Dado que no hay sesión activa Cuando se presenta la tarjeta Entonces muestra la descripción y el CTA de registro sin enlace al detalle', () => {
    // Cubre: 5.8
    renderizar(entrenamientoDemo(), false);

    expect(
      screen.getByText('Rutina de fuerza para todo el cuerpo'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Registrate para entrenar' }),
    ).toHaveAttribute('href', RUTAS.registro);
    expect(
      screen.queryByRole('link', {
        name: (_nombre, elemento) =>
          elemento.getAttribute('href') ===
          RUTAS.detalleEntrenamiento('ent-1'),
      }),
    ).not.toBeInTheDocument();
  });

  it('Dado una sesión activa Cuando se presenta la tarjeta Entonces la tarjeta enlaza al detalle del Entrenamiento', () => {
    // Cubre: 5.8
    renderizar(entrenamientoDemo(), true);

    expect(
      screen.getByRole('link', { name: /Fuerza total/ }),
    ).toHaveAttribute('href', RUTAS.detalleEntrenamiento('ent-1'));
    expect(
      screen.queryByRole('link', { name: 'Registrate para entrenar' }),
    ).not.toBeInTheDocument();
  });
});
