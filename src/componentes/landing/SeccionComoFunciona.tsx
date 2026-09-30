/**
 * SeccionComoFunciona: "Cómo funciona la Plataforma".
 *
 * Presenta los pasos del método (`crearPasosMetodo`) como una lista ordenada,
 * cada paso con su título y su descripción en texto. Encabezado de nivel 2 con
 * texto único dentro de la página (1.1, 1.4).
 *
 * Cubre: 1.4
 */
import { type ReactElement } from 'react';

import type { PasoMetodo } from '../../datos/contenidoLanding';

export default function SeccionComoFunciona({
  pasos,
}: {
  pasos: PasoMetodo[];
}): ReactElement {
  return (
    <section className="seccion" aria-labelledby="como-funciona-titulo">
      <div className="contenedor">
        <div className="seccion__encabezado">
          <h2 id="como-funciona-titulo">Cómo funciona la Plataforma</h2>
        </div>
        <ol className="grilla grilla--cuatro">
          {pasos.map((paso) => (
            <li key={paso.orden} className="tarjeta">
              <h3 className="tarjeta__titulo">{paso.titulo}</h3>
              <p className="tarjeta__texto">{paso.descripcion}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
