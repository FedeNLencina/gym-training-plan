import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { RUTAS } from '../rutas/rutas';

export default function NoEncontrada(): ReactElement {
  return (
    <section className="seccion contenedor">
      <h1>Esta página no existe</h1>
      <p className="seccion__bajada">La dirección no corresponde a ninguna página de Atlas Training.</p>
      <Link to={RUTAS.inicio} className="boton-primario">
        Volver al inicio
      </Link>
    </section>
  );
}
