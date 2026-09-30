/**
 * MenuMovil: presentación replegable de la navegación por debajo de 768 px.
 *
 * Presenta un botón con nombre accesible "Menú", con estado inicial cerrado y el
 * atributo `aria-expanded` en `false` mientras el menú está cerrado y en `true`
 * mientras está desplegado (2.7). Al activar cualquier elemento del menú
 * desplegado, el menú se cierra y ejecuta la navegación asociada (2.8): esto se
 * consigue pasando `alNavegar` a `ElementosNavegacion`, que lo invoca en cada
 * activación.
 *
 * El cierre al cruzar el umbral de 768 px hacia escritorio (2.10) lo resuelve la
 * Navbar: al pasar a escritorio deja de montar este componente y presenta los
 * elementos de forma fija, de modo que el menú desaparece sin dejar estado
 * colgado.
 *
 * Los elementos del menú son `<Link>` (elementos `a`), por lo que Enter los
 * activa nativamente (2.11).
 *
 * Cubre: 2.7, 2.8, 2.11
 */
import { useState, type ReactElement } from 'react';

import { ElementosNavegacion } from './ElementosNavegacion';

export default function MenuMovil(): ReactElement {
  const [desplegado, setDesplegado] = useState(false);

  return (
    <>
      <button
        type="button"
        className="navbar__boton-menu"
        aria-expanded={desplegado}
        aria-label="Menú"
        onClick={() => setDesplegado((abierto) => !abierto)}
      >
        <span className="navbar__boton-menu-barra" aria-hidden="true" />
      </button>
      {desplegado ? (
        <>
          <div
            className="menu-movil__telon"
            aria-hidden="true"
            onClick={() => setDesplegado(false)}
          />
          <div className="menu-movil">
            <ElementosNavegacion alNavegar={() => setDesplegado(false)} />
          </div>
        </>
      ) : null}
    </>
  );
}
