/**
 * SelectorFuenteVideo: grupo de radios de Fuente_Video del Panel_Admin.
 *
 * Presenta exactamente dos opciones rotuladas "Enlace de video" y "Subir video"
 * (7.11). El componente es controlado: recibe la fuente activa en `valor` y
 * notifica el cambio con `onCambio`; el formulario decide qué control obligatorio
 * mostrar según la fuente elegida (7.12, 7.13).
 *
 * Cubre: 7.11, 7.12, 7.13
 */
import type { ReactElement } from 'react';

import type { FuenteVideo } from '../../dominio/modelos';

export type PropiedadesSelectorFuenteVideo = {
  valor: FuenteVideo;
  onCambio: (fuente: FuenteVideo) => void;
};

const OPCIONES: readonly { fuente: FuenteVideo; etiqueta: string }[] =
  Object.freeze([
    { fuente: 'enlace', etiqueta: 'Enlace de video' },
    { fuente: 'archivo', etiqueta: 'Subir video' },
  ]);

export default function SelectorFuenteVideo({
  valor,
  onCambio,
}: PropiedadesSelectorFuenteVideo): ReactElement {
  return (
    <fieldset>
      <legend>Fuente del video</legend>
      {OPCIONES.map(({ fuente, etiqueta }) => (
        <label key={fuente} className="campo__opcion">
          <input
            type="radio"
            name="fuente-video"
            value={fuente}
            checked={valor === fuente}
            onChange={() => onCambio(fuente)}
          />
          {etiqueta}
        </label>
      ))}
    </fieldset>
  );
}
