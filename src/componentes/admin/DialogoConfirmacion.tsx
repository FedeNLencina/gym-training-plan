/**
 * DialogoConfirmacion: diálogo de confirmación accesible reutilizable.
 *
 * Presenta un `role="dialog"` modal cuyo nombre accesible es su título
 * (`aria-labelledby`) y cuyo cuerpo describe la acción a confirmar
 * (`aria-describedby`). Ofrece dos acciones: confirmar, que invoca
 * `onConfirmar`, y cancelar, que invoca `onCancelar`. Es un componente de
 * presentación puro: no conoce el Repositorio_Datos ni qué se confirma. El
 * Panel_Admin lo compone para la eliminación de Entrenamientos, donde confirmar
 * quita el Entrenamiento y avisa, y cancelar no cambia nada (7.6, 7.9).
 *
 * Cubre: 7.6, 7.9
 */
import { useId, type ReactElement } from 'react';

export type PropiedadesDialogoConfirmacion = {
  /** Encabezado del diálogo; oficia de nombre accesible del `role="dialog"`. */
  titulo: string;
  /** Cuerpo que describe la acción a confirmar. */
  mensaje: string;
  /** Etiqueta de la acción de confirmación (p. ej. "Eliminar"). */
  etiquetaConfirmar: string;
  /** Se invoca al confirmar la acción. */
  onConfirmar: () => void;
  /** Se invoca al cancelar la acción. */
  onCancelar: () => void;
};

export default function DialogoConfirmacion({
  titulo,
  mensaje,
  etiquetaConfirmar,
  onConfirmar,
  onCancelar,
}: PropiedadesDialogoConfirmacion): ReactElement {
  const idTitulo = useId();
  const idMensaje = useId();

  return (
    <div className="dialogo-fondo">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={idMensaje}
        className="dialogo"
      >
        <h2 id={idTitulo} className="dialogo__titulo">
          {titulo}
        </h2>
        <p id={idMensaje} className="dialogo__mensaje">
          {mensaje}
        </p>
        <div className="dialogo__acciones">
          <button type="button" className="boton-secundario" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="button" className="boton-primario" onClick={onConfirmar}>
            {etiquetaConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
