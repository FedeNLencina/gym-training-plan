/**
 * TarjetaEntrenamiento: tarjeta de un Entrenamiento publicado del catálogo.
 *
 * Presenta el título, la categoría, el nivel de dificultad y la duración
 * estimada en minutos de un Entrenamiento publicado (5.1). Su forma depende de
 * si hay una sesión activa:
 *
 * - **Con sesión** la tarjeta entera es un enlace al detalle del Reproductor
 *   (`/entrenamientos/:id`, 6.1): quien tiene sesión puede entrenar, así que
 *   toda la tarjeta navega al detalle.
 * - **Sin sesión** la tarjeta muestra la descripción del Entrenamiento y un CTA
 *   "Registrate para entrenar" hacia `/registro`, y no expone ningún enlace al
 *   detalle (5.8): el visitante conoce la propuesta pero sólo puede entrenar
 *   tras registrarse.
 *
 * Cubre: 5.1, 5.8
 */
import { type ReactElement } from 'react';
import { Link } from 'react-router-dom';

import type { Entrenamiento } from '../../dominio/modelos';
import { RUTAS } from '../../rutas/definicionRutas';

export const CTA_REGISTRO = 'Registrate para entrenar';

export type PropiedadesTarjetaEntrenamiento = {
  entrenamiento: Entrenamiento;
  haySesion: boolean;
};

/** Metadatos comunes a ambas variantes: categoría, nivel y duración. */
function Meta({ entrenamiento }: { entrenamiento: Entrenamiento }): ReactElement {
  return (
    <div className="tarjeta__meta">
      <span>{entrenamiento.categoria}</span>
      <span>{entrenamiento.nivel}</span>
      <span>{`${entrenamiento.duracionMinutos} min`}</span>
    </div>
  );
}

export default function TarjetaEntrenamiento({
  entrenamiento,
  haySesion,
}: PropiedadesTarjetaEntrenamiento): ReactElement {
  if (haySesion) {
    return (
      <li className="tarjeta">
        <Link
          className="tarjeta__enlace"
          to={RUTAS.detalleEntrenamiento(entrenamiento.id)}
        >
          <h3 className="tarjeta__titulo">{entrenamiento.titulo}</h3>
          <Meta entrenamiento={entrenamiento} />
        </Link>
      </li>
    );
  }

  return (
    <li className="tarjeta">
      <h3 className="tarjeta__titulo">{entrenamiento.titulo}</h3>
      <Meta entrenamiento={entrenamiento} />
      <p className="tarjeta__descripcion">{entrenamiento.descripcion}</p>
      <Link className="boton" to={RUTAS.registro}>
        {CTA_REGISTRO}
      </Link>
    </li>
  );
}
