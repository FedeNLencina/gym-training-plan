/**
 * SubidaArchivoVideo: control obligatorio de Archivo_Video del Panel_Admin.
 *
 * Se presenta cuando la Fuente_Video es "archivo" e indica los formatos
 * aceptados `mp4` y `webm` y el tamaño máximo de 50 MB (7.13). Valida en el
 * momento de la selección: acepta `video/mp4` o `video/webm` de tamaño ≤
 * 52.428.800 bytes y notifica el `File` aceptado (7.14); rechaza el tipo no
 * admitido con "Formato de video no aceptado: subí un archivo mp4 o webm" (7.15)
 * y el tamaño excedido con "El video supera el tamaño máximo de 50 MB" (7.16),
 * descartando el archivo. Presenta el nombre y el tamaño en MB con un decimal
 * del archivo aceptado (7.14), y asocia el mensaje de validación al control
 * mediante `aria-describedby`.
 *
 * El componente es controlado: recibe el archivo aceptado y el mensaje de error
 * desde el formulario, que es quien conserva ese estado entre reintentos (7.17,
 * 7.19). La validación de selección vive aquí porque es inmediata y no depende
 * del envío del formulario.
 *
 * Cubre: 7.13, 7.14, 7.15, 7.16, 7.17
 */
import type { ChangeEvent, ReactElement } from 'react';

import { LIMITE_VIDEO_BYTES, esTipoVideoAdmitido } from '../../dominio/modelos';

/** Mensaje de rechazo por formato (7.15). */
export const MENSAJE_FORMATO_NO_ACEPTADO =
  'Formato de video no aceptado: subí un archivo mp4 o webm';
/** Mensaje de rechazo por tamaño (7.16). */
export const MENSAJE_TAMANIO_EXCEDIDO =
  'El video supera el tamaño máximo de 50 MB';

const BYTES_POR_MB = 1024 * 1024;

/** Metadatos del archivo aceptado que el control presenta. */
export type ArchivoAceptado = {
  nombre: string;
  tamanioBytes: number;
};

export type PropiedadesSubidaArchivoVideo = {
  archivo: ArchivoAceptado | null;
  error: string | null;
  onSeleccion: (archivo: File) => void;
  onRechazo: (mensaje: string) => void;
};

const ID_CONTROL = 'entrenamiento-archivo-video';
const ID_ERROR = 'entrenamiento-archivo-video-error';
const ID_AYUDA = 'entrenamiento-archivo-video-ayuda';

/** Tamaño en megabytes con un decimal, tal como exige el criterio 7.14. */
export function formatearTamanioMb(tamanioBytes: number): string {
  return `${(tamanioBytes / BYTES_POR_MB).toFixed(1)} MB`;
}

export default function SubidaArchivoVideo({
  archivo,
  error,
  onSeleccion,
  onRechazo,
}: PropiedadesSubidaArchivoVideo): ReactElement {
  const alSeleccionar = (evento: ChangeEvent<HTMLInputElement>): void => {
    const seleccionado = evento.target.files?.[0];
    // Se limpia el valor del control para que una nueva selección del mismo
    // archivo vuelva a disparar el evento de cambio.
    evento.target.value = '';
    if (seleccionado === undefined) return;

    if (!esTipoVideoAdmitido(seleccionado.type)) {
      onRechazo(MENSAJE_FORMATO_NO_ACEPTADO);
      return;
    }
    if (seleccionado.size > LIMITE_VIDEO_BYTES) {
      onRechazo(MENSAJE_TAMANIO_EXCEDIDO);
      return;
    }
    onSeleccion(seleccionado);
  };

  const idsDescripcion = [ID_AYUDA, error !== null ? ID_ERROR : null]
    .filter((id): id is string => id !== null)
    .join(' ');

  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={ID_CONTROL}>
        Archivo de video
      </label>
      <p className="campo__ayuda" id={ID_AYUDA}>
        Formatos aceptados: mp4 o webm. Tamaño máximo: 50 MB.
      </p>
      <input
        id={ID_CONTROL}
        className="campo__control"
        type="file"
        accept="video/mp4,video/webm"
        aria-invalid={error !== null}
        aria-describedby={idsDescripcion}
        onChange={alSeleccionar}
      />
      {archivo !== null && (
        <p className="campo__ayuda">
          {archivo.nombre} ({formatearTamanioMb(archivo.tamanioBytes)})
        </p>
      )}
      {error !== null && (
        <p className="campo__error" id={ID_ERROR}>
          {error}
        </p>
      )}
    </div>
  );
}
