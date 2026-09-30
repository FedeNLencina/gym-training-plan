/**
 * SeccionCatalogoDestacado: "Catálogo destacado de entrenamientos".
 *
 * Presenta una muestra de a lo sumo 3 Entrenamientos publicados —min(n, 3)—,
 * cada uno con su título, categoría, nivel de dificultad y duración estimada en
 * minutos (1.7). Los datos llegan de `useEntrenamientos`, que toma el
 * Repositorio_Datos y el reloj del ContextoServicios; así esta sección no sabe
 * de dónde salen los Entrenamientos ni cómo se mide el plazo de carga.
 *
 * Sólo interesan los Entrenamientos en estado publicado: la Landing_Page es
 * pública y no expone borradores. Sobre ellos aplica `soloPublicados` y luego el
 * tope de 3.
 *
 * Ante una lista vacía o un fallo de lectura (estado `error`, que también cubre
 * el vencimiento del plazo de 5 segundos) presenta el mensaje "No hay
 * entrenamientos destacados por el momento" y sigue siendo una sección más de la
 * Landing_Page, con su encabezado accesible intacto, de modo que las otras siete
 * secciones permanezcan visibles (1.8).
 *
 * La tarjeta es deliberadamente liviana: sin enlace al detalle, porque desde la
 * landing no se navega al Reproductor. La tarjeta completa del catálogo
 * (`TarjetaEntrenamiento`) es tarea aparte.
 *
 * Cubre: 1.7, 1.8
 */
import { type ReactElement } from 'react';

import { soloPublicados } from '../../dominio/filtros';
import type { Entrenamiento } from '../../dominio/modelos';
import { usarServicios } from '../../estado/ContextoServicios';
import { useEntrenamientos } from '../../estado/useEntrenamientos';

/** Tope de Entrenamientos que presenta el Catálogo destacado (criterio 1.7). */
export const TOPE_DESTACADOS = 3;

export const MENSAJE_CATALOGO_VACIO =
  'No hay entrenamientos destacados por el momento';

/** Tarjeta liviana de un Entrenamiento destacado: sin enlace al detalle. */
function TarjetaDestacada({
  entrenamiento,
}: {
  entrenamiento: Entrenamiento;
}): ReactElement {
  return (
    <li className="tarjeta">
      <h3 className="tarjeta__titulo">{entrenamiento.titulo}</h3>
      <div className="tarjeta__meta">
        <span>{entrenamiento.categoria}</span>
        <span>{entrenamiento.nivel}</span>
        <span>{`${entrenamiento.duracionMinutos} min`}</span>
      </div>
    </li>
  );
}

export default function SeccionCatalogoDestacado(): ReactElement {
  const { repositorio, reloj } = usarServicios();
  const { estado, datos } = useEntrenamientos({ repositorio, reloj });

  const destacados =
    estado === 'error' ? [] : soloPublicados(datos).slice(0, TOPE_DESTACADOS);

  return (
    <section className="seccion" aria-labelledby="catalogo-destacado-titulo">
      <div className="contenedor">
        <div className="seccion__encabezado">
          <h2 id="catalogo-destacado-titulo">
            Catálogo destacado de entrenamientos
          </h2>
        </div>
        {destacados.length === 0 ? (
          <p className="seccion__bajada">{MENSAJE_CATALOGO_VACIO}</p>
        ) : (
          <ul className="grilla grilla--cuatro">
            {destacados.map((entrenamiento) => (
              <TarjetaDestacada
                key={entrenamiento.id}
                entrenamiento={entrenamiento}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
