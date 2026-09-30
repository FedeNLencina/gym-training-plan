/**
 * useAnchoVentana: detecta en qué franja de ancho está la ventana.
 *
 * La Navbar presenta el botón "Menú" sólo por debajo de 768 px (2.7) y debe
 * cerrar el menú desplegado en cuanto la ventana cruza ese umbral hacia
 * escritorio (2.10). El umbral se observa con `matchMedia`, que notifica el
 * cruce una sola vez por transición en lugar de en cada píxel redimensionado.
 *
 * Cubre: 2.7, 2.10
 */
import { useEffect, useMemo, useState } from 'react';

/** Umbral, en píxeles, a partir del cual la presentación es de escritorio. */
export const UMBRAL_ESCRITORIO_PX = 768;

/** Consulta de medios que separa la franja móvil de la de escritorio. */
export const CONSULTA_ESCRITORIO = `(min-width: ${UMBRAL_ESCRITORIO_PX}px)`;

export interface EstadoAnchoVentana {
  /** La ventana mide 768 px o más: los elementos de navegación van fijos. */
  readonly esEscritorio: boolean;
  /** La ventana mide menos de 768 px: corresponde el botón de menú. */
  readonly esMovil: boolean;
}

/**
 * Lee la franja actual. Si el entorno no ofrece `matchMedia` se cae al ancho
 * informado por la ventana, de modo que el hook nunca deja de dar una lectura.
 */
function leerEsEscritorio(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia(CONSULTA_ESCRITORIO).matches;
  }
  return window.innerWidth >= UMBRAL_ESCRITORIO_PX;
}

export function useAnchoVentana(): EstadoAnchoVentana {
  const [esEscritorio, setEsEscritorio] = useState<boolean>(leerEsEscritorio);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const consulta = window.matchMedia(CONSULTA_ESCRITORIO);
    // Entre el primer render y el efecto la ventana pudo cambiar de franja.
    setEsEscritorio(consulta.matches);

    const alCambiar = (evento: MediaQueryListEvent) => {
      setEsEscritorio(evento.matches);
    };
    consulta.addEventListener('change', alCambiar);
    return () => {
      consulta.removeEventListener('change', alCambiar);
    };
  }, []);

  return useMemo<EstadoAnchoVentana>(
    () => ({ esEscritorio, esMovil: !esEscritorio }),
    [esEscritorio],
  );
}
