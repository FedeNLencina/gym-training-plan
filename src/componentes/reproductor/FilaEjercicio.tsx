/**
 * FilaEjercicio: detalle e interacción de un Ejercicio dentro del reproductor.
 *
 * Presenta el nombre del Ejercicio y su detalle completo —cantidad de series,
 * cantidad de repeticiones y descanso en segundos— tal como fija el criterio de
 * reproducción de un Entrenamiento (6.1). Se renderiza como un `li` para que sea
 * un elemento de la lista de Ejercicios y sea consultable por rol `listitem`.
 *
 * Cuando recibe los controladores de marcado ofrece una casilla accesible que
 * registra el Ejercicio como completado o no completado (6.4, 6.7), y cuando
 * recibe el reloj monta el temporizador de descanso del Ejercicio (6.2, 6.3).
 * Con el Entrenamiento sin Ejercicios interactivos ambos controles llegan
 * deshabilitados (6.9).
 *
 * Cubre: 6.1, 6.2, 6.3, 6.4, 6.7, 6.9
 */
import { type ReactElement } from 'react';

import type { Ejercicio } from '../../dominio/modelos';
import type { Reloj } from '../../infra/reloj';
import TemporizadorDescanso from './TemporizadorDescanso';

export type PropiedadesFilaEjercicio = {
  ejercicio: Ejercicio;
  /** Estado de completitud del Ejercicio. Ausente en la vista sólo lectura. */
  completado?: boolean;
  /** Invierte la completitud del Ejercicio identificado. */
  alAlternar?: (idEjercicio: string) => void;
  /** Reloj inyectado que alimenta el temporizador de descanso. */
  reloj?: Reloj;
  /** Inhabilita los controles cuando no hay Ejercicios que ejecutar (6.9). */
  deshabilitado?: boolean;
};

/** Texto del detalle con concordancia de número. */
function textoSeries(series: number): string {
  return series === 1 ? '1 serie' : `${series} series`;
}

function textoRepeticiones(repeticiones: number): string {
  return repeticiones === 1 ? '1 repetición' : `${repeticiones} repeticiones`;
}

function textoDescanso(segundos: number): string {
  return segundos === 1 ? '1 segundo' : `${segundos} segundos`;
}

export default function FilaEjercicio({
  ejercicio,
  completado,
  alAlternar,
  reloj,
  deshabilitado = false,
}: PropiedadesFilaEjercicio): ReactElement {
  const detalle = `${textoSeries(ejercicio.series)} · ${textoRepeticiones(
    ejercicio.repeticiones,
  )} · ${textoDescanso(ejercicio.descansoSegundos)}`;

  const esInteractiva = alAlternar !== undefined;

  return (
    <li className="fila-ejercicio">
      {esInteractiva ? (
        <label className="fila-ejercicio__marca">
          <input
            type="checkbox"
            checked={completado ?? false}
            disabled={deshabilitado}
            onChange={() => alAlternar?.(ejercicio.id)}
          />
          <span className="fila-ejercicio__nombre">{ejercicio.nombre}</span>
        </label>
      ) : (
        <span className="fila-ejercicio__nombre">{ejercicio.nombre}</span>
      )}
      <span className="fila-ejercicio__detalle">{detalle}</span>
      {reloj !== undefined ? (
        <TemporizadorDescanso
          descanso={ejercicio.descansoSegundos}
          reloj={reloj}
          deshabilitado={deshabilitado}
        />
      ) : null}
    </li>
  );
}
