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
        {/* El encabezado de la octava sección se conserva en el árbol
            accesible, pero no compite visualmente con el contenido. */}
        <h2 id="pie-titulo" className="solo-lectores">
          Pie de página
        </h2>
        <div className="pie__contenido">
          <div className="pie__marca">
            <span className="pie__logo">
              Atlas<span className="pie__logo-acento">Gym</span>
            </span>
            <p className="pie__lema">
              Entrenamientos guiados en video, progreso medible y planes para
              cada objetivo.
            </p>
          </div>
          <div>
            <p className="pie__grupo-titulo">Contacto</p>
            <div className="pie__datos">
              <p className="pie__dato">{contacto.correo}</p>
              <p className="pie__dato">{contacto.telefono}</p>
            </div>
          </div>
          <div>
            <p className="pie__grupo-titulo">Dónde estamos</p>
            <div className="pie__datos">
              <p className="pie__dato">{contacto.direccion}</p>
            </div>
          </div>
          <nav aria-label="Redes sociales">
            <p className="pie__grupo-titulo">Seguinos</p>
            <ul className="pie__redes">
              {contacto.redes.map((red) => (
                <li key={red.nombre}>
                  <a className="pie__red" href={red.url}>
                    {red.nombre}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <p className="pie__legal">
            AtlasGym · Prototipo de plataforma de entrenamiento.
          </p>
        </div>
      </div>
    </footer>
  );
}
