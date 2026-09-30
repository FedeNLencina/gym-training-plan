/**
 * ListaEntrenamientosAdmin: listado de Entrenamientos administrables.
 *
 * Presenta, para el Administrador, el conjunto de Entrenamientos que puede
 * gestionar (7.1). A diferencia del catálogo público (`soloPublicados`, 5.1),
 * incluye tanto los publicados como los borradores, porque el Administrador
 * gestiona todos. De cada Entrenamiento presenta su título, su categoría, su
 * nivel de dificultad, su duración estimada y su estado.
 *
 * Es un componente de presentación puro: recibe la lista ya cargada y no conoce
 * el Repositorio_Datos ni el estado de la carga. El PanelAdmin es quien resuelve
 * la carga y le entrega los datos. Cada fila ofrece la acción de eliminación,
 * que abre un DialogoConfirmacion; al confirmar, la lista delega en `onEliminar`
 * con el identificador del Entrenamiento, y al cancelar cierra el diálogo sin
 * cambio alguno (7.6, 7.9). Quien resuelve la eliminación en el Repositorio_Datos
 * y presenta el aviso es el Panel_Admin.
 *
 * Cubre: 7.1, 7.6, 7.9
 */
import { useState, type ReactElement } from 'react';

import type { Entrenamiento } from '../../dominio/modelos';
import DialogoConfirmacion from './DialogoConfirmacion';

export const MENSAJE_LISTA_VACIA =
  'Todavía no hay entrenamientos para administrar';

export type PropiedadesListaEntrenamientosAdmin = {
  entrenamientos: Entrenamiento[];
  /** Se invoca con el identificador del Entrenamiento cuya eliminación se confirma. */
  onEliminar?: (id: string) => void;
};

/** Metadatos de la fila: categoría, nivel, duración y estado. */
function Meta({ entrenamiento }: { entrenamiento: Entrenamiento }): ReactElement {
  return (
    <div className="tarjeta__meta">
      <span>{entrenamiento.categoria}</span>
      <span>{entrenamiento.nivel}</span>
      <span>{`${entrenamiento.duracionMinutos} min`}</span>
      <span>{entrenamiento.estado}</span>
    </div>
  );
}

export default function ListaEntrenamientosAdmin({
  entrenamientos,
  onEliminar,
}: PropiedadesListaEntrenamientosAdmin): ReactElement {
  // Entrenamiento cuya eliminación se está confirmando; `null` mientras no hay
  // diálogo abierto.
  const [enConfirmacion, setEnConfirmacion] = useState<Entrenamiento | null>(
    null,
  );

  if (entrenamientos.length === 0) {
    return <p className="seccion__bajada">{MENSAJE_LISTA_VACIA}</p>;
  }

  const confirmar = (): void => {
    if (enConfirmacion === null) return;
    const id = enConfirmacion.id;
    setEnConfirmacion(null);
    onEliminar?.(id);
  };

  return (
    <>
      <ul className="grilla">
        {entrenamientos.map((entrenamiento) => (
          <li className="tarjeta" key={entrenamiento.id}>
            <h3 className="tarjeta__titulo">{entrenamiento.titulo}</h3>
            <Meta entrenamiento={entrenamiento} />
            <div className="tarjeta__acciones">
              <button
                type="button"
                className="boton-secundario"
                aria-label={`Eliminar ${entrenamiento.titulo}`}
                onClick={() => setEnConfirmacion(entrenamiento)}
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
      {enConfirmacion !== null && (
        <DialogoConfirmacion
          titulo="Eliminar entrenamiento"
          mensaje={`¿Seguro que querés eliminar «${enConfirmacion.titulo}»?`}
          etiquetaConfirmar="Eliminar"
          onConfirmar={confirmar}
          onCancelar={() => setEnConfirmacion(null)}
        />
      )}
    </>
  );
}
