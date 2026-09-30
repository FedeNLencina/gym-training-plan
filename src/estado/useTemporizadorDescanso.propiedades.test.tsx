/**
 * Test de propiedad del temporizador de descanso: la cuenta regresiva.
 *
 * El reloj falso (`src/tests/dobles/relojFalso.ts`) hace observable cualquier
 * instante k sin esperar tiempo real: se avanzan k segundos de una vez dentro de
 * un único `act`, con lo que la corrida es determinista y no depende de la
 * velocidad de la máquina.
 *
 * Cubre: 6.2, 6.3
 */

import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fc from 'fast-check';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { crearRelojFalso, type RelojFalso } from '../tests/dobles/relojFalso';
import { useTemporizadorDescanso } from './useTemporizadorDescanso';

const CONFIGURACION = { numRuns: 100, seed: 1 };

// 100 corridas de render + userEvent + avance del reloj superan el límite por
// defecto de 5000 ms de Vitest; se eleva sólo el tope de este test para que las
// 100 corridas mandadas por el plan (numRuns:100, seed:1) completen sin bajar.
const TIEMPO_MAXIMO_MS = 30000;

/**
 * Usuario sin demoras entre eventos: la propiedad monta y activa el temporizador
 * cien veces, y las esperas por omisión de `userEvent` dominarían la corrida sin
 * aportar nada a lo que se verifica.
 */
const usuario = userEvent.setup({ delay: null });

const AVISO_FINALIZADO = 'Descanso finalizado';

/** Descanso admitido por el criterio 6.2: segundos enteros entre 5 y 600. */
const arbDescanso = fc.integer({ min: 5, max: 600 });

/** Instante observado: incluye el 0, los interiores y los posteriores al final. */
const arbInstante = fc.integer({ min: 0, max: 700 });

/** Segundos extra tras agotarse la cuenta, para comprobar que no baja de 0. */
const arbSegundosExtra = fc.integer({ min: 1, max: 120 });

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

describe('useTemporizadorDescanso (propiedades)', () => {
  // Feature: training-platform-landing, Property 26: La cuenta regresiva decrece un segundo por segundo y se detiene en 0
  it('Dado un descanso entero entre 5 y 600 segundos y un instante k Cuando el Usuario activa el temporizador Entonces el valor presentado tras k segundos es el máximo entre el descanso menos k y 0, y al llegar a 0 la cuenta se detiene con el aviso de descanso finalizado', async () => {
    // Cubre: 6.2, 6.3
    await fc.assert(
      fc.asyncProperty(
        arbDescanso,
        arbInstante,
        arbSegundosExtra,
        async (descanso, k, extra) => {
          // Dado: el temporizador montado sobre un reloj cuyo tiempo no avanza solo.
          const reloj = crearRelojFalso();
          const vista = render(<Sonda descanso={descanso} reloj={reloj} />);

          // Cuando: el Usuario activa el temporizador y transcurren k segundos.
          await usuario.click(
            screen.getByRole('button', { name: 'Iniciar descanso' }),
          );
          act(() => {
            reloj.avanzar(k * 1000);
          });

          // Entonces: el valor presentado es el máximo entre descanso - k y 0.
          const esperado = Math.max(descanso - k, 0);
          expect(
            screen.getByText(`Restante: ${esperado} s`),
          ).toBeInTheDocument();

          if (esperado > 0) {
            // La cuenta sigue en marcha y todavía no anuncia el final.
            expect(screen.getByText('En marcha: sí')).toBeInTheDocument();
            expect(screen.queryByText(AVISO_FINALIZADO)).not.toBeInTheDocument();
          } else {
            // Alcanzado el 0: la cuenta se detiene, el valor se mantiene en 0
            // por más tiempo que pase y se presenta el aviso.
            expect(screen.getByRole('status')).toHaveTextContent(
              AVISO_FINALIZADO,
            );
            expect(screen.getByText('En marcha: no')).toBeInTheDocument();
            expect(reloj.tareasPendientes()).toBe(0);

            act(() => {
              reloj.avanzarSegundos(extra);
            });
            expect(screen.getByText('Restante: 0 s')).toBeInTheDocument();
            expect(screen.getByRole('status')).toHaveTextContent(
              AVISO_FINALIZADO,
            );
          }

          vista.unmount();
        },
      ),
      CONFIGURACION,
    );
  }, TIEMPO_MAXIMO_MS);
});
