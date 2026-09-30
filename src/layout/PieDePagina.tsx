/**
 * PieDePagina: cierre persistente de toda vista pública.
 *
 * Se presenta como región `contentinfo` (elemento `footer`) con los datos de
 * contacto y las redes sociales de la Plataforma, tomados del contenido de la
 * landing. Presenta el correo, el teléfono, la dirección y las redes sociales
 * de contacto (1.5). Es la octava y última sección de la Landing_Page, por lo
 * que expone un encabezado accesible "Pie de página" de texto único (1.1),
 * consistente con el resto de las secciones.
 *
 * Cubre: 1.5, 2.1
 */
import { type ReactElement } from 'react';

import { crearContenidoLanding } from '../datos/contenidoLanding';

export default function PieDePagina(): ReactElement {
  const { contacto } = crearContenidoLanding();

  return (
    <footer className="pie" aria-labelledby="pie-titulo">
      <div className="contenedor">
        <h2 id="pie-titulo">Pie de página</h2>
        <p>{contacto.correo}</p>
        <p>{contacto.telefono}</p>
        <p>{contacto.direccion}</p>
        <nav aria-label="Redes sociales">
          <ul>
            {contacto.redes.map((red) => (
              <li key={red.nombre}>
                <a href={red.url}>{red.nombre}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
