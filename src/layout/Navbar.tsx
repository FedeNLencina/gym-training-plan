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

import { Link } from 'react-router-dom';

import { useAnchoVentana } from '../estado/useAnchoVentana';
import { RUTAS } from '../rutas/definicionRutas';
import { ElementosNavegacion } from './ElementosNavegacion';
import MenuMovil from './MenuMovil';

export default function Navbar(): ReactElement {
  const { esEscritorio } = useAnchoVentana();

  return (
    <header className="navbar">
      <div className="navbar__contenido contenedor">
        {/* La marca queda fuera del `nav` para que Inicio, Entrenamientos y
            Planes sigan siendo los tres primeros enlaces de la región
            "Principal" (2.1). */}
        <Link className="navbar__marca" to={RUTAS.inicio}>
          Atlas<span className="navbar__marca-acento">Gym</span>
        </Link>
        <nav className="navbar__navegacion" aria-label="Principal">
          {esEscritorio ? (
            <div className="navbar__enlaces">
              <ElementosNavegacion />
            </div>
          ) : (
            <MenuMovil />
          )}
        </nav>
      </div>
    </header>
  );
}
