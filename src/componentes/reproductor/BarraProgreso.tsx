/**
 * BarraProgreso: avance de la sesión del Reproductor_Entrenamiento.
 *
 * Presenta el porcentaje de avance —un entero de 0 a 100 (6.4)— como una barra
 * de progreso accesible (`role="progressbar"`) con su valor actual, mínimo y
 * máximo, acompañada de su lectura en texto. El cálculo del porcentaje vive en
 * el dominio (`calcularPorcentajeAvance`) y llega ya resuelto por props: un
 * Entrenamiento sin Ejercicios entrega 0 (6.9).
 *
 * Cubre: 6.4, 6.9
 */
import { type ReactElement } from 'react';

export type PropiedadesBarraProgreso = {
  /** Avance como entero de 0 a 100. */
  porcentaje: number;
};

export default function BarraProgreso({
  porcentaje,
}: PropiedadesBarraProgreso): ReactElement {
  const valor = Math.min(100, Math.max(0, Math.round(porcentaje)));
  return (
    <div className="progreso-sesion">
      <div
        className="barra-progreso"
        role="progressbar"
        aria-label="Avance del entrenamiento"
        aria-valuenow={valor}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="barra-progreso__relleno"
          style={{ width: `${valor}%` }}
        />
      </div>
      <span className="progreso-sesion__texto">{`${valor}%`}</span>
    </div>
  );
}
