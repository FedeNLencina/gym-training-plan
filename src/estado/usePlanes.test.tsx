/**
 * Tests de `usePlanes`.
 *
 * La Seccion_Planes necesita distinguir el indicador de carga (3.7) del mensaje
 * "No pudimos cargar los planes" con su acción "Reintentar" (3.8), así que se
 * ejercita la misma máquina `cargando → listo | error` y el vencimiento del
 * plazo de 5 segundos con el reloj falso.
 *
 * Cubre: 3.7, 3.8, 5.10
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { crearPlan, type Plan } from '../dominio/modelos';
import { crearRelojFalso, type RelojFalso } from '../tests/dobles/relojFalso';
import {
  crearRepositorioEnMemoria,
  type RepositorioEnMemoria,
} from '../tests/dobles/repositorioEnMemoria';
import { PLAZO_CARGA_MS } from './useEntrenamientos';
import { usePlanes, type RepositorioDePlanes } from './usePlanes';

const PLANES: Plan[] = [
  crearPlan({ id: 'p1', nombre: 'Base', precio: 10000 }),
  crearPlan({ id: 'p2', nombre: 'Pro', precio: 18000, recomendado: true }),
];

/** Sonda que expone la máquina de estados del hook como texto accesible. */
function SondaPlanes({
  repositorio,
  reloj,
}: {
  repositorio: RepositorioDePlanes;
  reloj: RelojFalso;
}) {
  const { estado, datos, error, recargar } = usePlanes({ repositorio, reloj });

  return (
    <div>
      <p>{`Estado: ${estado}`}</p>
      <p>{`Cantidad: ${datos.length}`}</p>
      <p>{`Error: ${error === null ? 'ninguno' : error.message}`}</p>
      <ul>
        {datos.map((plan) => (
          <li key={plan.id}>{plan.nombre}</li>
        ))}
      </ul>
      <button type="button" onClick={recargar}>
        Reintentar
      </button>
    </div>
  );
}

function renderizarSonda(repositorio: RepositorioDePlanes): {
  reloj: RelojFalso;
} {
  const reloj = crearRelojFalso();
  render(<SondaPlanes repositorio={repositorio} reloj={reloj} />);
  return { reloj };
}

function repositorioConPlanes(): RepositorioEnMemoria {
  return crearRepositorioEnMemoria({ planes: PLANES });
}

describe('usePlanes', () => {
  it('Dado un repositorio que todavía no responde Cuando se monta la sección Entonces el estado arranca en cargando sin planes', () => {
    // Cubre: 3.7
    renderizarSonda({ obtenerPlanes: () => new Promise<Plan[]>(() => undefined) });

    expect(screen.getByText('Estado: cargando')).toBeInTheDocument();
    expect(screen.getByText('Cantidad: 0')).toBeInTheDocument();
  });

  it('Dado un repositorio con planes Cuando la lectura se resuelve Entonces el estado pasa a listo con la lista completa', async () => {
    // Cubre: 3.7
    renderizarSonda(repositorioConPlanes());

    expect(await screen.findByText('Estado: listo')).toBeInTheDocument();
    expect(screen.getByText('Cantidad: 2')).toBeInTheDocument();
    expect(screen.getByText('Base')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  it('Dado un repositorio que falla la lectura Cuando la lectura se rechaza Entonces el estado pasa a error con el mensaje de planes', async () => {
    // Cubre: 3.8
    const repositorio = repositorioConPlanes();
    repositorio.simularFalloLectura();
    renderizarSonda(repositorio);

    expect(await screen.findByText('Estado: error')).toBeInTheDocument();
    expect(
      screen.getByText('Error: No pudimos cargar los planes'),
    ).toBeInTheDocument();
  });

  it('Dado un repositorio que dejó de fallar Cuando el usuario activa Reintentar Entonces se solicita otra vez la lista de planes', async () => {
    // Cubre: 3.8
    const repositorio = repositorioConPlanes();
    repositorio.simularFalloLectura();
    renderizarSonda(repositorio);
    await screen.findByText('Estado: error');
    repositorio.simularFalloLectura(false);

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Estado: listo')).toBeInTheDocument();
    expect(screen.getByText('Cantidad: 2')).toBeInTheDocument();
    expect(repositorio.llamadas.obtenerPlanes).toBe(2);
  });

  it('Dado un repositorio que no responde Cuando vence el plazo de cinco segundos Entonces el estado pasa a error', async () => {
    // Cubre: 5.10
    const repositorio: RepositorioDePlanes = {
      obtenerPlanes: () => new Promise<Plan[]>(() => undefined),
    };
    const { reloj } = renderizarSonda(repositorio);

    await act(async () => {
      reloj.avanzar(PLAZO_CARGA_MS);
    });

    expect(screen.getByText('Estado: error')).toBeInTheDocument();
    expect(
      screen.getByText('Error: No pudimos cargar los planes'),
    ).toBeInTheDocument();
  });
});
