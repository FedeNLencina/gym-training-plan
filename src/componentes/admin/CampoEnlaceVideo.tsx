/**
 * CampoEnlaceVideo: campo obligatorio de Enlace_Video del Panel_Admin.
 *
 * Se presenta cuando la Fuente_Video es "enlace" (7.12). Es controlado: recibe
 * el valor y notifica cada cambio de texto. Cuando el formulario rechaza el
 * enlace por formato inválido, recibe el mensaje "Ingresá un enlace de video
 * válido" en `error` y lo asocia al control mediante `aria-describedby` (7.10).
 *
 * Cubre: 7.10, 7.12
 */
import type { ReactElement } from 'react';

export type PropiedadesCampoEnlaceVideo = {
  valor: string;
  error: string | null;
  onCambio: (valor: string) => void;
};

const ID_CONTROL = 'entrenamiento-enlace-video';
const ID_ERROR = 'entrenamiento-enlace-video-error';

export default function CampoEnlaceVideo({
  valor,
  error,
  onCambio,
}: PropiedadesCampoEnlaceVideo): ReactElement {
  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={ID_CONTROL}>
        Dirección del video
      </label>
      <input
        id={ID_CONTROL}
        className="campo__control"
        type="url"
        value={valor}
        aria-invalid={error !== null}
        aria-describedby={error !== null ? ID_ERROR : undefined}
        onChange={(evento) => onCambio(evento.target.value)}
      />
      {error !== null && (
        <p className="campo__error" id={ID_ERROR}>
          {error}
        </p>
      )}
    </div>
  );
}
