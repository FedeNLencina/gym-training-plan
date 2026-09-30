/**
 * Tests de BarraProgreso.
 *
 * La barra presenta el porcentaje de avance de la sesión como un entero de 0 a
 * 100 (6.4) y se expone como una barra de progreso accesible con su valor
 * actual, mínimo y máximo. Un Entrenamiento sin Ejercicios queda en 0 (6.9).
 * Consultas sólo por rol, texto o etiqueta accesible.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import BarraProgreso from './BarraProgreso';

describe('BarraProgreso', () => {
  it('Dado un avance parcial Cuando se presenta la barra Entonces expone el porcentaje como valor accesible de progreso', () => {
    // Cubre: 6.4
    render(<BarraProgreso porcentaje={50} />);

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
  });

  it('Dado un avance parcial Cuando se presenta la barra Entonces muestra el porcentaje en texto', () => {
    // Cubre: 6.4
    render(<BarraProgreso porcentaje={50} />);

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('Dado un Entrenamiento sin avance Cuando se presenta la barra Entonces expone el porcentaje en 0', () => {
    // Cubre: 6.9
    render(<BarraProgreso porcentaje={0} />);

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
  });
});
