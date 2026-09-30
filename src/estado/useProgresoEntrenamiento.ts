/**
 * useProgresoEntrenamiento: avance de una sesión de entrenamiento.
 *
 * El hook sostiene el conjunto de Ejercicios completados y delega el cálculo en
 * las funciones puras de `dominio/progreso`: `calcularPorcentajeAvance` para el
 * porcentaje entero de 0 a 100 (6.4) y `estaCompleto` para decidir si
 * corresponde presentar el resumen de la sesión (6.5). Desmarcar recalcula el
 * avance y, al dejar de estar completa la sesión, retira el resumen (6.7).
 *
 * El recuento de completados se deriva de los Ejercicios vigentes: los
 * identificadores que no pertenecen al Entrenamiento actual no cuentan, de modo
 * que cambiar de Entrenamiento no arrastra el avance del anterior ni hace falta
 * un efecto que lo limpie. Un Entrenamiento sin Ejercicios queda en 0 y nunca
 * completo (6.9).
 *
 * Cubre: 6.4, 6.5, 6.7
 */

import { useCallback, useMemo, useState } from 'react';

import type { Ejercicio } from '../dominio/modelos';
import { calcularPorcentajeAvance, estaCompleto } from '../dominio/progreso';

export interface ProgresoEntrenamiento {
  /** Identificadores de los Ejercicios completados del Entrenamiento actual. */
  readonly completados: readonly string[];
  /** Cantidad de Ejercicios completados. */
  readonly cantidadCompletados: number;
  /** Cantidad total de Ejercicios del Entrenamiento. */
  readonly total: number;
  /** Avance como entero de 0 a 100. */
  readonly porcentaje: number;
  /** Verdadero sólo si hay Ejercicios y todos están completados. */
  readonly completo: boolean;
  /** Indica si un Ejercicio concreto está completado. */
  readonly estaCompletado: (idEjercicio: string) => boolean;
  /** Registra un Ejercicio como completado. Idempotente. */
  readonly marcarCompletado: (idEjercicio: string) => void;
  /** Registra un Ejercicio como no completado. Idempotente. */
  readonly desmarcarCompletado: (idEjercicio: string) => void;
  /** Invierte el estado de completitud de un Ejercicio. */
  readonly alternarCompletado: (idEjercicio: string) => void;
  /** Descarta todo el avance registrado. */
  readonly reiniciar: () => void;
}

export function useProgresoEntrenamiento(
  ejercicios: readonly Ejercicio[],
): ProgresoEntrenamiento {
  const [marcados, setMarcados] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );

  const idsVigentes = useMemo(
    () => new Set(ejercicios.map((ejercicio) => ejercicio.id)),
    [ejercicios],
  );

  const completados = useMemo(
    () => ejercicios.map((ejercicio) => ejercicio.id).filter((id) => marcados.has(id)),
    [ejercicios, marcados],
  );

  const total = ejercicios.length;
  const cantidadCompletados = completados.length;
  const porcentaje = calcularPorcentajeAvance(cantidadCompletados, total);
  const completo = estaCompleto(cantidadCompletados, total);

  const estaCompletado = useCallback(
    (idEjercicio: string) =>
      idsVigentes.has(idEjercicio) && marcados.has(idEjercicio),
    [idsVigentes, marcados],
  );

  const marcarCompletado = useCallback((idEjercicio: string) => {
    setMarcados((previos) => {
      if (previos.has(idEjercicio)) return previos;
      const siguientes = new Set(previos);
      siguientes.add(idEjercicio);
      return siguientes;
    });
  }, []);

  const desmarcarCompletado = useCallback((idEjercicio: string) => {
    setMarcados((previos) => {
      if (!previos.has(idEjercicio)) return previos;
      const siguientes = new Set(previos);
      siguientes.delete(idEjercicio);
      return siguientes;
    });
  }, []);

  const alternarCompletado = useCallback((idEjercicio: string) => {
    setMarcados((previos) => {
      const siguientes = new Set(previos);
      if (siguientes.has(idEjercicio)) {
        siguientes.delete(idEjercicio);
      } else {
        siguientes.add(idEjercicio);
      }
      return siguientes;
    });
  }, []);

  const reiniciar = useCallback(() => {
    setMarcados(new Set<string>());
  }, []);

  return useMemo<ProgresoEntrenamiento>(
    () => ({
      completados,
      cantidadCompletados,
      total,
      porcentaje,
      completo,
      estaCompletado,
      marcarCompletado,
      desmarcarCompletado,
      alternarCompletado,
      reiniciar,
    }),
    [
      completados,
      cantidadCompletados,
      total,
      porcentaje,
      completo,
      estaCompletado,
      marcarCompletado,
      desmarcarCompletado,
      alternarCompletado,
      reiniciar,
    ],
  );
}
