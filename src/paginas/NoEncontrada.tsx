/**
 * NoEncontrada: vista de ruta inexistente.
 *
 * Se presenta cuando el Enrutador recibe una dirección que no coincide con
 * ninguna ruta declarada. Conserva la Navbar visible por montarse dentro de
 * `LayoutPublico`, presenta el mensaje "Página no encontrada" y ofrece la acción
 * "Volver al inicio" como enlace de navegación hacia la raíz, de modo que Enter
 * funcione de forma nativa.
 *
 * Cubre: 2.15
 */

import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { RUTAS } from '../rutas/definicionRutas';

export default function NoEncontrada(): ReactElement {
  return (
    <section className="seccion">
      <div className="contenedor no-encontrada">
        <span className="no-encontrada__codigo" aria-hidden="true">
          404
        </span>
        <h1>Página no encontrada</h1>
        <p className="seccion__bajada">
          La dirección que buscás no existe o fue movida.
        </p>
        <Link className="boton boton--primario" to={RUTAS.inicio}>
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
