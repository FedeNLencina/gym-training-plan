/**
 * SeccionTestimonios: "Testimonios".
 *
 * Presenta la lista de testimonios (≥ 3), cada uno con el nombre de quien lo
 * firma y el texto del testimonio, dentro de un `blockquote`/`figcaption`
 * accesible. Encabezado de nivel 2 con texto único dentro de la página (1.9).
 *
 * Cubre: 1.9
 */
import { type ReactElement } from 'react';

import type { Testimonio } from '../../dominio/modelos';

export default function SeccionTestimonios({
  testimonios,
}: {
  testimonios: Testimonio[];
}): ReactElement {
  return (
    <section className="seccion seccion--superficie" aria-labelledby="testimonios-titulo">
      <div className="contenedor">
        <div className="seccion__encabezado">
          <h2 id="testimonios-titulo">Testimonios</h2>
        </div>
        <ul className="grilla grilla--tres">
          {testimonios.map((testimonio) => (
            <li key={testimonio.nombre} className="tarjeta">
              <figure>
                <blockquote className="tarjeta__texto">
                  {testimonio.texto}
                </blockquote>
                <figcaption className="tarjeta__titulo">
                  {testimonio.nombre}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
