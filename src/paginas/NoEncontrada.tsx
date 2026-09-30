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
    <section>
      <h1>Página no encontrada</h1>
      <p>La dirección que buscás no existe o fue movida.</p>
      <Link to={RUTAS.inicio}>Volver al inicio</Link>
    </section>
  );
}
