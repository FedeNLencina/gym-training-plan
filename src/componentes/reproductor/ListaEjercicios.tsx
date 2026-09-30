/**
 * ListaEjercicios: lista completa de los Ejercicios de un Entrenamiento.
 *
 * Presenta la totalidad de los Ejercicios recibidos, uno por fila, cada uno con
 * su detalle completo delegado en `FilaEjercicio` (6.1). No decide qué hacer
 * ante la ausencia de Ejercicios: ese caso lo resuelve el Reproductor con su
 * mensaje correspondiente (6.9), de modo que esta lista se ocupa sólo de
 * presentar lo que recibe.
 *
 * Traslada a cada fila los controladores de marcado y el reloj del temporizador
 * de descanso, y la bandera de deshabilitado, que el Reproductor arma a partir
 * de `useProgresoEntrenamiento` y del ContextoServicios (6.2, 6.3, 6.4, 6.7).
 *
 * Cubre: 6.1
 */
import { type ReactElement } from 'react';

import type { Ejercicio } from '../../dominio/modelos';
import type { Reloj } from '../../infra/reloj';
import FilaEjercicio from './FilaEjercicio';

export type PropiedadesListaEjercicios = {
  ejercicios: Ejercicio[];
  /** Indica si un Ejercicio concreto está completado. */
  estaCompletado?: (idEjercicio: string) => boolean;
  /** Invierte la completitud de un Ejercicio. */
  alAlternar?: (idEjercicio: string) => void;
  /** Reloj inyectado que alimenta los temporizadores de descanso. */
  reloj?: Reloj;
  /** Inhabilita los controles de todas las filas (6.9). */
  deshabilitado?: boolean;
};

export default function ListaEjercicios({
  ejercicios,
  estaCompletado,
  alAlternar,
  reloj,
  deshabilitado = false,
}: PropiedadesListaEjercicios): ReactElement {
  return (
    <ul className="lista-ejercicios">
      {ejercicios.map((ejercicio) => (
        <FilaEjercicio
          key={ejercicio.id}
          ejercicio={ejercicio}
          completado={estaCompletado?.(ejercicio.id)}
          alAlternar={alAlternar}
          reloj={reloj}
          deshabilitado={deshabilitado}
        />
      ))}
    </ul>
  );
}
