/**
 * Tests de TemporizadorDescanso.
 *
 * El temporizador arranca la cuenta regresiva desde el descanso del Ejercicio y
 * decrece un segundo por segundo (6.2); al alcanzar 0 se detiene, mantiene el
 * valor en 0 y anuncia "Descanso finalizado" en una región `aria-live` (6.3).
 * Sin Ejercicios el control queda deshabilitado (6.9).
 *
 * El paso del tiempo entra por el reloj falso inyectado por el
 * ContextoServicios. Consultas sólo por rol, texto o etiqueta accesible; una
 * sola interacción por test.
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { crearRelojFalso } from '../../tests/dobles/relojFalso';
import TemporizadorDescanso, {
  MENSAJE_DESCANSO_FINALIZADO,
} from './TemporizadorDescanso';

function renderizar({
  descanso = 3,
  deshabilitado = false,
  reloj = crearRelojFalso(),
}: {
  descanso?: number;
  deshabilitado?: boolean;
  reloj?: ReturnType<typeof crearRelojFalso>;
} = {}): { reloj: ReturnType<typeof crearRelojFalso> } {
  render(
    <TemporizadorDescanso
      descanso={descanso}
      reloj={reloj}
      deshabilitado={deshabilitado}
    />,
  );
  return { reloj };
}

describe('TemporizadorDescanso', () => {
  it('Dado un descanso de 3 segundos Cuando el Usuario activa el temporizador Entonces presenta la cuenta regresiva iniciada', async () => {
    // Cubre: 6.2
    renderizar({ descanso: 3 });

    await userEvent.click(
      screen.getByRole('button', { name: 'Iniciar descanso' }),
    );

    expect(screen.getByRole('timer')).toHaveTextContent('3');
  });

  it('Dado un temporizador en marcha Cuando transcurre un segundo Entonces decrece el valor presentado en uno', async () => {
    // Cubre: 6.2
    const { reloj } = renderizar({ descanso: 3 });
    await userEvent.click(
      screen.getByRole('button', { name: 'Iniciar descanso' }),
    );

    act(() => reloj.avanzarSegundos(1));

    expect(screen.getByRole('timer')).toHaveTextContent('2');
  });

  it('Dado un temporizador en marcha Cuando la cuenta alcanza 0 Entonces mantiene el valor en 0 y anuncia el descanso finalizado', async () => {
    // Cubre: 6.3
    const { reloj } = renderizar({ descanso: 3 });
    await userEvent.click(
      screen.getByRole('button', { name: 'Iniciar descanso' }),
    );

    act(() => reloj.avanzarSegundos(3));

    expect(screen.getByRole('timer')).toHaveTextContent('0');
    expect(screen.getByRole('status')).toHaveTextContent(
      MENSAJE_DESCANSO_FINALIZADO,
    );
  });

  it('Dado un Entrenamiento sin Ejercicios Cuando se presenta el temporizador deshabilitado Entonces el control de inicio queda inhabilitado', () => {
    // Cubre: 6.9
    renderizar({ deshabilitado: true });

    expect(
      screen.getByRole('button', { name: 'Iniciar descanso' }),
    ).toBeDisabled();
  });
});
