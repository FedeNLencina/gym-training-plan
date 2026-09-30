/**
 * Navbar: barra de navegación superior, persistente en toda vista pública.
 *
 * Presenta, en este orden, "Inicio", "Entrenamientos" y "Planes" (2.1) más las
 * acciones de cuenta, todo delegado en `ElementosNavegacion`. Por debajo de
 * 768 px los elementos se repliegan tras el botón "Menú" (`MenuMovil`); por
 * encima quedan fijos (2.7, 2.10). El corte se decide con `useAnchoVentana`, de
 * modo que al cruzar el umbral hacia escritorio el menú móvil desaparece y los
 * elementos quedan permanentes sin dejar estado colgado.
 *
 * Cubre: 2.1, 2.7, 2.10
 */
import { type ReactElement } from 'react';

import { useAnchoVentana } from '../estado/useAnchoVentana';
import { ElementosNavegacion } from './ElementosNavegacion';
import MenuMovil from './MenuMovil';

export default function Navbar(): ReactElement {
  const { esEscritorio } = useAnchoVentana();

  return (
    <nav className="navbar" aria-label="Principal">
      <div className="navbar__contenido">
        {esEscritorio ? (
          <div className="navbar__enlaces">
            <ElementosNavegacion />
          </div>
        ) : (
          <MenuMovil />
        )}
      </div>
    </nav>
  );
}
