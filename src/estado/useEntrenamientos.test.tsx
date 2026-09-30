/**
 * Tests de `useEntrenamientos`.
 *
 * Se ejercita la máquina `cargando → listo | error`, el `recargar` que vuelve a
 * solicitar la lista al Repositorio_Datos y la carrera contra el plazo de 5
 * segundos, con el reloj falso como única fuente del paso del tiempo para que
 * dos corridas consecutivas den el mismo resultado.
 *
 * El hook se observa a través de una sonda que publica su estado como texto
 * accesible: así las aserciones consultan por texto y rol, como el resto de la
 * suite, en lugar de inspeccionar el valor devuelto.
 *
 * Cubre: 3.7, 5.5, 5.6, 5.7, 5.10
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { crearEntrenamiento, type Entrenamiento } from '../dominio/modelos';
import { crearRelojFalso, type RelojFalso } from '../tests/dobles/relojFalso';
import {
  crearRepositorioEnMemoria,
  type RepositorioEnMemoria,
} from '../tests/dobles/repositorioEnMemoria';
import {
  PLAZO_CARGA_MS,
  useEntrenamientos,
  type RepositorioDeEntrenamientos,
} from './useEntrenamientos';

const ENTRENAMIENTOS: Entrenamiento[] = [
  crearEntrenamiento({ id: 'e1', titulo: 'Fuerza total', categoria: 'Fuerza' }),
  crearEntrenamiento({ id: 'e2', titulo: 'Cardio express', categoria: 'Cardio' }),
];

/** Sonda que expone la máquina de estados del hook como texto accesible. */
function SondaEntrenamientos({
  repositorio,
  reloj,
}: {
  repositorio: RepositorioDeEntrenamientos;
  reloj: RelojFalso;
}) {
  const { estado, datos, error, recargar } = useEntrenamientos({
    repositorio,
    reloj,
  });

  return (
    <div>
      <p>{`Estado: ${estado}`}</p>
      <p>{`Cantidad: ${datos.length}`}</p>
      <p>{`Error: ${error === null ? 'ninguno' : error.message}`}</p>
      <ul>
        {datos.map((entrenamiento) => (
          <li key={entrenamiento.id}>{entrenamiento.titulo}</li>
        ))}
      </ul>
      <button type="button" onClick={recargar}>
        Reintentar
      </button>
    </div>
  );
}

/** Repositorio cuya lectura nunca se resuelve por sí sola. */
function repositorioDemorado(): {
  repositorio: RepositorioDeEntrenamientos;
  resolver: (entrenamientos: Entrenamiento[]) => void;
  lecturas: () => number;
} {
  let resolver: (entrenamientos: Entrenamiento[]) => void = () => undefined;
  let lecturas = 0;
  return {
    repositorio: {
      obtenerEntrenamientos: () => {
        lecturas += 1;
        return new Promise<Entrenamiento[]>((cumplir) => {
          resolver = cumplir;
        });
      },
    },
    resolver: (entrenamientos) => resolver(entrenamientos),
    lecturas: () => lecturas,
  };
}

function renderizarSonda(repositorio: RepositorioDeEntrenamientos): {
  reloj: RelojFalso;
} {
  const reloj = crearRelojFalso();
  render(<SondaEntrenamientos repositorio={repositorio} reloj={reloj} />);
  return { reloj };
}

function repositorioConEntrenamientos(): RepositorioEnMemoria {
  return crearRepositorioEnMemoria({ entrenamientos: ENTRENAMIENTOS });
}

describe('useEntrenamientos', () => {
  it('Dado un repositorio que todavía no responde Cuando se monta la vista Entonces el estado arranca en cargando', () => {
    // Cubre: 5.5
    renderizarSonda(repositorioDemorado().repositorio);

    expect(screen.getByText('Estado: cargando')).toBeInTheDocument();
    expect(screen.getByText('Cantidad: 0')).toBeInTheDocument();
  });

  it('Dado un repositorio con entrenamientos Cuando la lectura se resuelve Entonces el estado pasa a listo con la lista completa', async () => {
    // Cubre: 3.7, 5.5
    renderizarSonda(repositorioConEntrenamientos());

    expect(await screen.findByText('Estado: listo')).toBeInTheDocument();
    expect(screen.getByText('Cantidad: 2')).toBeInTheDocument();
    expect(screen.getByText('Fuerza total')).toBeInTheDocument();
    expect(screen.getByText('Cardio express')).toBeInTheDocument();
    expect(screen.getByText('Error: ninguno')).toBeInTheDocument();
  });

  it('Dado un repositorio que falla la lectura Cuando la lectura se rechaza Entonces el estado pasa a error con el mensaje de carga', async () => {
    // Cubre: 5.6
    const repositorio = repositorioConEntrenamientos();
    repositorio.simularFalloLectura();
    renderizarSonda(repositorio);

    expect(await screen.findByText('Estado: error')).toBeInTheDocument();
    expect(
      screen.getByText('Error: No pudimos cargar los entrenamientos'),
    ).toBeInTheDocument();
  });

  it('Dado un repositorio que dejó de fallar Cuando el usuario activa Reintentar Entonces se solicita otra vez la lista y el estado queda listo', async () => {
    // Cubre: 5.7
    const repositorio = repositorioConEntrenamientos();
    repositorio.simularFalloLectura();
    renderizarSonda(repositorio);
    await screen.findByText('Estado: error');
    repositorio.simularFalloLectura(false);

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Estado: listo')).toBeInTheDocument();
    expect(screen.getByText('Cantidad: 2')).toBeInTheDocument();
    expect(repositorio.llamadas.obtenerEntrenamientos).toBe(2);
  });

  it('Dado un repositorio que no responde Cuando vence el plazo de cinco segundos Entonces el estado pasa a error y se retira la carga', async () => {
    // Cubre: 5.10
    const demorado = repositorioDemorado();
    const { reloj } = renderizarSonda(demorado.repositorio);

    await act(async () => {
      reloj.avanzar(PLAZO_CARGA_MS);
    });

    expect(screen.getByText('Estado: error')).toBeInTheDocument();
    expect(
      screen.getByText('Error: No pudimos cargar los entrenamientos'),
    ).toBeInTheDocument();
  });

  it('Dado un plazo ya vencido Cuando la lectura tardía se resuelve Entonces la respuesta se descarta y el estado sigue en error', async () => {
    // Cubre: 5.10
    const demorado = repositorioDemorado();
    const { reloj } = renderizarSonda(demorado.repositorio);
    await act(async () => {
      reloj.avanzar(PLAZO_CARGA_MS);
    });

    await act(async () => {
      demorado.resolver(ENTRENAMIENTOS);
    });

    expect(screen.getByText('Estado: error')).toBeInTheDocument();
    expect(screen.getByText('Cantidad: 0')).toBeInTheDocument();
  });

  it('Dado un repositorio que responde antes del plazo Cuando el plazo vencería Entonces el estado permanece listo', async () => {
    // Cubre: 5.10
    const demorado = repositorioDemorado();
    const { reloj } = renderizarSonda(demorado.repositorio);
    await act(async () => {
      demorado.resolver(ENTRENAMIENTOS);
    });

    await act(async () => {
      reloj.avanzar(PLAZO_CARGA_MS);
    });

    expect(screen.getByText('Estado: listo')).toBeInTheDocument();
    expect(screen.getByText('Cantidad: 2')).toBeInTheDocument();
    expect(reloj.tareasPendientes()).toBe(0);
  });
});
