/**
 * SeccionBeneficios: "Beneficios del método".
 *
 * Presenta la lista de beneficios (≥ 3) que devuelve `crearContenidoLanding`,
 * cada uno con su título y su descripción en texto. El encabezado de nivel 2
 * lleva texto único dentro de la página, lo que hace verificable el orden y la
 * unicidad de las ocho secciones (1.1, 1.9).
 *
 * Cubre: 1.9
 */
import { type ReactElement } from 'react';

import type { Beneficio } from '../../dominio/modelos';

export default function SeccionBeneficios({
  beneficios,
}: {
  beneficios: Beneficio[];
}): ReactElement {
  return (
    <section className="seccion seccion--superficie" aria-labelledby="beneficios-titulo">
      <div className="contenedor">
        <div className="seccion__encabezado">
          <h2 id="beneficios-titulo">Beneficios del método</h2>
        </div>
        <ul className="grilla grilla--dos">
          {beneficios.map((beneficio) => (
            <li key={beneficio.titulo} className="tarjeta">
              <h3 className="tarjeta__titulo">{beneficio.titulo}</h3>
              <p className="tarjeta__texto">{beneficio.descripcion}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
