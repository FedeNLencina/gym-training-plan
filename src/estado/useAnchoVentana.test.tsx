/**
 * Tests de useAnchoVentana.
 *
 * jsdom no implementa `matchMedia`, así que se instala un doble controlable:
 * guarda el ancho vigente, evalúa la consulta `(min-width: 768px)` contra ese
 * ancho y notifica a los suscriptores cuando el cambio de ancho cruza el
 * umbral. Con eso se cubre la franja móvil que habilita el botón "Menú" (2.7)
 * y el cruce del umbral que fija los elementos de navegación (2.10).
 *
 * Cubre: 2.7, 2.10
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CONSULTA_ESCRITORIO, useAnchoVentana } from './useAnchoVentana';

type EscuchaCambio = (evento: MediaQueryListEvent) => void;

interface VentanaSimulada {
  /** Cambia el ancho de la ventana y notifica los cruces de umbral. */
  readonly fijarAncho: (ancho: number) => void;
  /** Suscripciones vivas, para comprobar la limpieza al desmontar. */
  readonly cantidadDeEscuchas: () => number;
}

/** Evalúa una consulta `(min-width: Npx)` contra un ancho dado. */
function evaluar(consulta: string, ancho: number): boolean {
  const coincidencia = /\(min-width:\s*(\d+)px\)/.exec(consulta);
  if (coincidencia === null) {
    throw new Error(`Consulta de medios no contemplada por el doble: ${consulta}`);
  }
  return ancho >= Number(coincidencia[1]);
}

const matchMediaOriginal: typeof window.matchMedia | undefined = window.matchMedia;

function instalarVentana(anchoInicial: number): VentanaSimulada {
  let ancho = anchoInicial;
  const escuchasPorConsulta = new Map<string, Set<EscuchaCambio>>();

  const crearLista = (consulta: string): MediaQueryList => {
    const escuchas = escuchasPorConsulta.get(consulta) ?? new Set<EscuchaCambio>();
    escuchasPorConsulta.set(consulta, escuchas);
    const lista = {
      media: consulta,
      onchange: null,
      get matches(): boolean {
        return evaluar(consulta, ancho);
      },
      addEventListener: (_tipo: 'change', escucha: EscuchaCambio) => {
        escuchas.add(escucha);
      },
      removeEventListener: (_tipo: 'change', escucha: EscuchaCambio) => {
        escuchas.delete(escucha);
      },
      addListener: (escucha: EscuchaCambio) => {
        escuchas.add(escucha);
      },
      removeListener: (escucha: EscuchaCambio) => {
        escuchas.delete(escucha);
      },
      dispatchEvent: () => false,
    };
    return lista as unknown as MediaQueryList;
  };

  window.matchMedia = ((consulta: string) => crearLista(consulta)) as typeof window.matchMedia;
  window.innerWidth = ancho;

  return {
    fijarAncho: (nuevoAncho: number) => {
      const anterior = ancho;
      ancho = nuevoAncho;
      window.innerWidth = nuevoAncho;
      for (const [consulta, escuchas] of escuchasPorConsulta) {
        const antes = evaluar(consulta, anterior);
        const ahora = evaluar(consulta, nuevoAncho);
        if (antes === ahora) {
          continue;
        }
        const evento = { matches: ahora, media: consulta } as unknown as MediaQueryListEvent;
        for (const escucha of escuchas) {
          escucha(evento);
        }
      }
    },
    cantidadDeEscuchas: () => {
      let total = 0;
      for (const escuchas of escuchasPorConsulta.values()) {
        total += escuchas.size;
      }
      return total;
    },
  };
}

afterEach(() => {
  if (matchMediaOriginal === undefined) {
    Reflect.deleteProperty(window, 'matchMedia');
    return;
  }
  window.matchMedia = matchMediaOriginal;
});

/** Sonda que expone la franja informada por el hook como texto accesible. */
function SondaAncho() {
  const { esEscritorio, esMovil } = useAnchoVentana();
  return <p>{`Franja: ${esEscritorio ? 'escritorio' : ''}${esMovil ? 'movil' : ''}`}</p>;
}

describe('useAnchoVentana', () => {
  it('Dado un ancho de ventana de 375 px Cuando se monta la sonda Entonces el hook informa la franja movil', () => {
    // Cubre: 2.7
    instalarVentana(375);

    render(<SondaAncho />);

    expect(screen.getByText('Franja: movil')).toBeInTheDocument();
  });

  it('Dado un ancho de ventana de 767 px Cuando se monta la sonda Entonces el hook informa la franja movil en el borde del umbral', () => {
    // Cubre: 2.7
    instalarVentana(767);

    render(<SondaAncho />);

    expect(screen.getByText('Franja: movil')).toBeInTheDocument();
  });

  it('Dado un ancho de ventana de 768 px Cuando se monta la sonda Entonces el hook informa la franja escritorio en el borde del umbral', () => {
    // Cubre: 2.10
    instalarVentana(768);

    render(<SondaAncho />);

    expect(screen.getByText('Franja: escritorio')).toBeInTheDocument();
  });

  it('Dado un ancho de 375 px ya montado Cuando la ventana pasa a 768 px Entonces el hook informa la franja escritorio', () => {
    // Cubre: 2.10
    const ventana = instalarVentana(375);
    render(<SondaAncho />);

    act(() => {
      ventana.fijarAncho(768);
    });

    expect(screen.getByText('Franja: escritorio')).toBeInTheDocument();
  });

  it('Dado un ancho de 1024 px ya montado Cuando la ventana pasa a 767 px Entonces el hook informa la franja movil', () => {
    // Cubre: 2.7
    const ventana = instalarVentana(1024);
    render(<SondaAncho />);

    act(() => {
      ventana.fijarAncho(767);
    });

    expect(screen.getByText('Franja: movil')).toBeInTheDocument();
  });

  it('Dado un ancho de 375 px ya montado Cuando la ventana pasa a 500 px sin cruzar el umbral Entonces el hook conserva la franja movil', () => {
    // Cubre: 2.7
    const ventana = instalarVentana(375);
    render(<SondaAncho />);

    act(() => {
      ventana.fijarAncho(500);
    });

    expect(screen.getByText('Franja: movil')).toBeInTheDocument();
  });

  it('Dado un ancho de 375 px con la sonda montada Cuando se desmonta el arbol Entonces no queda ninguna suscripcion al umbral', () => {
    // Cubre: 2.10
    const ventana = instalarVentana(375);
    const { unmount } = render(<SondaAncho />);
    expect(ventana.cantidadDeEscuchas()).toBe(1);

    act(() => {
      unmount();
    });

    expect(ventana.cantidadDeEscuchas()).toBe(0);
  });

  it('Dado el umbral de escritorio Cuando se consulta la constante publicada Entonces declara la consulta de 768 px', () => {
    // Cubre: 2.10
    expect(CONSULTA_ESCRITORIO).toBe('(min-width: 768px)');
  });
});
