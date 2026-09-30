/**
 * useNavegacionLanding: centraliza la combinación de navegación y desplazamiento
 * de los elementos "Inicio" y "Planes" de la Navbar.
 *
 * Ambos elementos son enlaces reales (`<a>`), de modo que la activación con
 * teclado (Enter) funciona nativamente (2.11). Este hook intercepta la
 * activación para decidir, según la ruta actual, si sólo hay que desplazar o si
 * además hay que navegar:
 *
 * - "Inicio": si la ruta ya es `/`, sólo desplaza la ventana a la posición
 *   vertical 0 sin navegar (2.3); si no, navega a `/` sin recargar el documento
 *   y el propio destino queda en 0 (2.2).
 * - "Planes": si la ruta ya es `/`, sólo desplaza hasta que el inicio de la
 *   Seccion_Planes quede visible (2.9); si no, navega a `/#planes`, y la landing
 *   desplaza al montar leyendo `location.hash` (2.5).
 *
 * El desplazamiento hasta la Seccion_Planes se resuelve por su ancla `#planes`,
 * el mismo identificador que consume la landing al montar.
 *
 * Cubre: 2.2, 2.3, 2.5, 2.9
 */
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/** Identificador del ancla de la Seccion_Planes dentro de la Landing_Page. */
export const ANCLA_PLANES = 'planes';

export interface NavegacionLanding {
  /** Activa el elemento "Inicio": navega a `/` o desplaza al tope. */
  readonly irAInicio: () => void;
  /** Activa el elemento "Planes": navega a `/#planes` o desplaza a la sección. */
  readonly irAPlanes: () => void;
}

/** Desplaza la ventana hasta el inicio del documento. */
function desplazarAlTope(): void {
  if (typeof window === 'undefined') return;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** Desplaza la ventana hasta que la Seccion_Planes quede visible, si existe. */
function desplazarAPlanes(): void {
  if (typeof document === 'undefined') return;
  const seccion = document.getElementById(ANCLA_PLANES);
  if (seccion !== null) {
    seccion.scrollIntoView({ behavior: 'smooth' });
  }
}

export function useNavegacionLanding(): NavegacionLanding {
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const enLaRaiz = ubicacion.pathname === '/';

  const irAInicio = useCallback(() => {
    if (enLaRaiz) {
      desplazarAlTope();
      return;
    }
    navegar('/');
  }, [enLaRaiz, navegar]);

  const irAPlanes = useCallback(() => {
    if (enLaRaiz) {
      desplazarAPlanes();
      return;
    }
    navegar('/#planes');
  }, [enLaRaiz, navegar]);

  return { irAInicio, irAPlanes };
}
