/**
 * Tests de ResumenSesion.
 *
 * El resumen se presenta cuando el Usuario completa todos los Ejercicios del
 * Entrenamiento e indica la cantidad de Ejercicios completados, la cantidad
 * total y el porcentaje de avance en 100 (6.5). Consultas sólo por rol, texto o
 * etiqueta accesible.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ResumenSesion from './ResumenSesion';

describe('ResumenSesion', () => {
  it('Dada una sesión completada Cuando se presenta el resumen Entonces muestra la cantidad de Ejercicios completados y el total', () => {
    // Cubre: 6.5
    render(<ResumenSesion completados={3} total={3} />);

    const resumen = screen.getByRole('status');
    expect(resumen).toHaveTextContent('3 de 3');
  });

  it('Dada una sesión completada Cuando se presenta el resumen Entonces muestra el porcentaje de avance en 100', () => {
    // Cubre: 6.5
    render(<ResumenSesion completados={3} total={3} />);

    expect(screen.getByRole('status')).toHaveTextContent('100%');
  });
});
