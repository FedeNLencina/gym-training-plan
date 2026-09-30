/**
 * Tests del temporizador de descanso.
 *
 * El paso del tiempo no se observa con temporizadores reales: el hook recibe el
 * reloj inyectado (`src/infra/reloj.ts`) y acá se sustituye por
 * `crearRelojFalso` (`src/tests/dobles/relojFalso.ts`), cuyo tiempo avanza sólo
 * cuando la prueba lo pide. Así el decremento de un segundo por segundo (6.2) y
 * la detención en 0 con el aviso "Descanso finalizado" (6.3) son deterministas.
 *
 * La única interacción del Usuario en cada test es activar el temporizador; el
 * avance del reloj no es una interacción, sólo se envuelve en `act` porque
 * provoca actualizaciones de estado.
 *
 * Cubre: 6.2, 6.3
 */

import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { crearRelojFalso, type RelojFalso } from '../tests/dobles/relojFalso';
import { useTemporizadorDescanso } from './useTemporizadorDescanso';

const AVISO_FINALIZADO = 'Descanso finalizado';

/** Expone el estado del temporizador como texto y ofrece el control de inicio. */
function Sonda({
  descanso,
  reloj,
}: {
  descanso: number;
  reloj: RelojFalso;
}): ReactElement {
  const { restante, finalizado, enMarcha, iniciar } = useTemporizadorDescanso({
    descanso,
    reloj,
  });

  return (
    <div>
      <p>{`Restante: ${restante} s`}</p>
      <p>{`En marcha: ${enMarcha ? 'sí' : 'no'}`}</p>
      {finalizado ? <p role="status">{AVISO_FINALIZADO}</p> : null}
      <button type="button" onClick={iniciar}>
        Iniciar descanso
      </button>
    </div>
  );
}

function renderizarSonda(descanso: number): RelojFalso {
  const reloj = crearRelojFalso();
  render(<Sonda descanso={descanso} reloj={reloj} />);
  return reloj;
}

const activar = async (): Promise<void> => {
  await userEvent.click(screen.getByRole('button', { name: 'Iniciar descanso' }));
};

const avanzarSegundos = (reloj: RelojFalso, segundos: number): void => {
  act(() => {
    reloj.avanzarSegundos(segundos);
  });
};

describe('useTemporizadorDescanso', () => {
  it('Dado un descanso de 30 segundos sin activar Cuando pasan 5 segundos Entonces el valor presentado sigue en 30 y no hay aviso de descanso finalizado', () => {
    // Cubre: 6.2
    const reloj = renderizarSonda(30);
    expect(screen.getByText('Restante: 30 s')).toBeInTheDocument();
    expect(screen.getByText('En marcha: no')).toBeInTheDocument();

    avanzarSegundos(reloj, 5);

    expect(screen.getByText('Restante: 30 s')).toBeInTheDocument();
    expect(screen.queryByText(AVISO_FINALIZADO)).not.toBeInTheDocument();
  });

  it('Dado un descanso de 10 segundos Cuando el Usuario activa el temporizador Entonces el valor presentado decrece un segundo por segundo', async () => {
    // Cubre: 6.2
    const reloj = renderizarSonda(10);

    await activar();

    expect(screen.getByText('Restante: 10 s')).toBeInTheDocument();
    expect(screen.getByText('En marcha: sí')).toBeInTheDocument();
    for (const esperado of [9, 8, 7, 6, 5]) {
      avanzarSegundos(reloj, 1);
      expect(screen.getByText(`Restante: ${esperado} s`)).toBeInTheDocument();
    }
    expect(screen.queryByText(AVISO_FINALIZADO)).not.toBeInTheDocument();
  });

  it('Dado un descanso de 5 segundos activado Cuando pasan los 5 segundos Entonces el valor queda en 0 y se presenta el aviso de descanso finalizado', async () => {
    // Cubre: 6.3
    const reloj = renderizarSonda(5);

    await activar();

    avanzarSegundos(reloj, 5);
    expect(screen.getByText('Restante: 0 s')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(AVISO_FINALIZADO);
    expect(screen.getByText('En marcha: no')).toBeInTheDocument();
  });

  it('Dado un descanso de 5 segundos ya agotado Cuando pasan 20 segundos más Entonces el valor se mantiene en 0 y el reloj no conserva tareas pendientes', async () => {
    // Cubre: 6.3
    const reloj = renderizarSonda(5);

    await activar();

    avanzarSegundos(reloj, 5);
    avanzarSegundos(reloj, 20);
    expect(screen.getByText('Restante: 0 s')).toBeInTheDocument();
    expect(reloj.tareasPendientes()).toBe(0);
    expect(screen.getByRole('status')).toHaveTextContent(AVISO_FINALIZADO);
  });

  it('Dado un descanso de 600 segundos Cuando el Usuario activa el temporizador Entonces el valor llega a 0 tras 600 segundos y no baja de ahí', async () => {
    // Cubre: 6.2, 6.3
    const reloj = renderizarSonda(600);

    await activar();

    avanzarSegundos(reloj, 599);
    expect(screen.getByText('Restante: 1 s')).toBeInTheDocument();
    avanzarSegundos(reloj, 1);
    expect(screen.getByText('Restante: 0 s')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(AVISO_FINALIZADO);
  });
});
