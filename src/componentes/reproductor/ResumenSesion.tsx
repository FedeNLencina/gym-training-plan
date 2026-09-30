/**
 * ResumenSesion: cierre de una sesión de entrenamiento completada.
 *
 * Se presenta cuando el Usuario marca como completados todos los Ejercicios del
 * Entrenamiento e indica la cantidad de Ejercicios completados, la cantidad
 * total y el porcentaje de avance en 100 (6.5). La decisión de mostrarlo u
 * ocultarlo corresponde al Reproductor, que lo monta sólo cuando la sesión está
 * completa y lo retira al desmarcar un Ejercicio (6.7).
 *
 * Se anuncia en una región `aria-live` (`role="status"`) para que las
 * tecnologías de asistencia informen el cierre de la sesión.
 *
 * Cubre: 6.5
 */
import { type ReactElement } from 'react';

export type PropiedadesResumenSesion = {
  /** Cantidad de Ejercicios completados. */
  completados: number;
  /** Cantidad total de Ejercicios del Entrenamiento. */
  total: number;
};

export default function ResumenSesion({
  completados,
  total,
}: PropiedadesResumenSesion): ReactElement {
  return (
    <div
      className="resumen-sesion"
      role="status"
      aria-label="Resumen de la sesión"
    >
      <h2 className="resumen-sesion__titulo">Sesión completada</h2>
      <p className="resumen-sesion__detalle">
        {`Completaste ${completados} de ${total} ejercicios · 100%`}
      </p>
    </div>
  );
}
