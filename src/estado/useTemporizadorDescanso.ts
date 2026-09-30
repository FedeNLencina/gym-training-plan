/**
 * Temporizador de descanso del Reproductor_Entrenamiento.
 *
 * Cuenta regresiva desde el descanso del Ejercicio que decrece un segundo por
 * segundo (6.2), se detiene al llegar a 0, mantiene el valor en 0 y levanta la
 * bandera `finalizado` con la que la vista anuncia "Descanso finalizado" en una
 * región `aria-live="polite"` (6.3).
 *
 * El paso del tiempo entra por el reloj inyectado (`src/infra/reloj.ts`): el
 * hook nunca llama a `setInterval` ni a `Date.now`, de modo que en pruebas se
 * sustituye por `crearRelojFalso` y la cuenta es determinista.
 *
 * Cubre: 6.2, 6.3
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { IdTarea, Reloj } from '../infra/reloj';

/** Un tic del temporizador equivale a un segundo. */
export const MILISEGUNDOS_POR_TIC = 1000;

export type TemporizadorDescanso = {
  /** Segundos que faltan; nunca baja de 0. */
  restante: number;
  /** Verdadero sólo después de que la cuenta alcanzó 0. */
  finalizado: boolean;
  /** Verdadero mientras la cuenta avanza. */
  enMarcha: boolean;
  /** Arranca (o reinicia) la cuenta desde el descanso del Ejercicio. */
  iniciar: () => void;
  /** Corta la cuenta sin marcarla como finalizada. */
  detener: () => void;
};

export type OpcionesTemporizadorDescanso = {
  /** Descanso del Ejercicio en segundos enteros. */
  descanso: number;
  reloj: Reloj;
};

/**
 * Normaliza el descanso recibido: segundos enteros no negativos. Un descanso
 * nulo o inválido deja el temporizador en 0 y no lo pone en marcha, porque no
 * hay nada que contar y tampoco un descanso que anunciar como finalizado.
 */
function segundosIniciales(descanso: number): number {
  if (!Number.isFinite(descanso) || descanso <= 0) return 0;
  return Math.trunc(descanso);
}

export function useTemporizadorDescanso({
  descanso,
  reloj,
}: OpcionesTemporizadorDescanso): TemporizadorDescanso {
  const inicial = segundosIniciales(descanso);

  const [restante, setRestante] = useState(inicial);
  const [finalizado, setFinalizado] = useState(false);
  const [enMarcha, setEnMarcha] = useState(false);

  // El valor vive también en una referencia para que el tic lo lea sin depender
  // del estado capturado en la clausura y sin recalcular el intervalo.
  const restanteRef = useRef(inicial);
  const idIntervalo = useRef<IdTarea | null>(null);

  const cancelarIntervalo = useCallback((): void => {
    if (idIntervalo.current === null) return;
    reloj.cancelarIntervalo(idIntervalo.current);
    idIntervalo.current = null;
  }, [reloj]);

  const detener = useCallback((): void => {
    cancelarIntervalo();
    setEnMarcha(false);
  }, [cancelarIntervalo]);

  const iniciar = useCallback((): void => {
    cancelarIntervalo();

    const segundos = segundosIniciales(descanso);
    restanteRef.current = segundos;
    setRestante(segundos);
    setFinalizado(false);

    if (segundos === 0) {
      setEnMarcha(false);
      return;
    }

    setEnMarcha(true);
    idIntervalo.current = reloj.programarIntervalo(() => {
      const siguiente = Math.max(0, restanteRef.current - 1);
      restanteRef.current = siguiente;
      setRestante(siguiente);
      if (siguiente > 0) return;
      // Alcanzado el 0: la cuenta se detiene y el valor se mantiene en 0.
      cancelarIntervalo();
      setEnMarcha(false);
      setFinalizado(true);
    }, MILISEGUNDOS_POR_TIC);
  }, [cancelarIntervalo, descanso, reloj]);

  // Al desmontar el Reproductor_Entrenamiento no queda ningún tic vivo.
  useEffect(() => cancelarIntervalo, [cancelarIntervalo]);

  return { restante, finalizado, enMarcha, iniciar, detener };
}
