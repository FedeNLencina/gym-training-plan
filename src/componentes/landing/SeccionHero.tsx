/**
 * SeccionHero: primera sección de la Landing_Page.
 *
 * Presenta el titular (1–80) como encabezado de nivel 1 de la página, el
 * subtitular (40–200) y los dos CTA: "Comenzar ahora" hacia `/registro` y
 * "Ver entrenamientos" hacia `/entrenamientos`, ambos como `Link` de
 * react-router para navegar sin recargar el documento. El espacio visual se
 * arma con un bloque de color de los tokens (`bloque-imagen`), sin ningún
 * `img` ni `background-image` a archivos, y marcado `aria-hidden` para que las
 * tecnologías de asistencia lo ignoren.
 *
 * Cubre: 1.2, 1.3, 1.4
 */
import { type ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { HERO_LANDING } from '../../datos/heroLanding';
import { RUTAS } from '../../rutas/definicionRutas';

export default function SeccionHero(): ReactElement {
  return (
    <section className="seccion" aria-labelledby="hero-titular">
      <div className="contenedor">
        <div className="seccion__encabezado">
          <h1 id="hero-titular" className="titulo-acento">
            {HERO_LANDING.titular}
          </h1>
          <p className="seccion__bajada">{HERO_LANDING.subtitular}</p>
        </div>
        <div className="hero__acciones">
          <Link className="boton-primario" to={RUTAS.registro}>
            Comenzar ahora
          </Link>
          <Link className="boton-secundario" to={RUTAS.entrenamientos}>
            Ver entrenamientos
          </Link>
        </div>
        <div className="bloque-imagen" aria-hidden="true" />
      </div>
    </section>
  );
}
