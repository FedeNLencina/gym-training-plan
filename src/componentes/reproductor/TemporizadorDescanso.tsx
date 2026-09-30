/**
 * TemporizadorDescanso: cuenta regresiva de descanso de un Ejercicio.
 *
 * Envuelve el hook `useTemporizadorDescanso` en un control accesible: un botón
 * arranca la cuenta desde el descanso del Ejercicio, un `role="timer"` presenta
 * el valor restante actualizado una vez por segundo (6.2) y, al alcanzar 0, la
 * cuenta se detiene, el valor se mantiene en 0 y una región `aria-live`
 * anuncia "Descanso finalizado" (6.3).
 *
 * El reloj entra por props (lo inyecta el Reproductor desde el
 * ContextoServicios), de modo que las pruebas lo sustituyen por `relojFalso` y
 * la cuenta es determinista. Cuando el Entrenamiento no tiene Ejercicios el
 * control llega deshabilitado (6.9).
 *
 * Cubre: 6.2, 6.3, 6.9
 */
import { type ReactElement } from 'react';

import type { Reloj } from '../../infra/reloj';
import { useTemporizadorDescanso } from '../../estado/useTemporizadorDescanso';

export const MENSAJE_DESCANSO_FINALIZADO = 'Descanso finalizado';

export type PropiedadesTemporizadorDescanso = {
  /** Descanso del Ejercicio en segundos enteros. */
  descanso: number;
  reloj: Reloj;
  /** Inhabilita el control cuando no hay Ejercicios que descansar (6.9). */
  deshabilitado?: boolean;
};

export default function TemporizadorDescanso({
  descanso,
  reloj,
  deshabilitado = false,
}: PropiedadesTemporizadorDescanso): ReactElement {
  const { restante, finalizado, enMarcha, iniciar } = useTemporizadorDescanso({
    descanso,
    reloj,
  });

  return (
    <div className="temporizador-descanso">
      <button
        type="button"
        className="boton boton--secundario"
        onClick={iniciar}
        disabled={deshabilitado}
      >
        Iniciar descanso
      </button>
      <span className="temporizador-descanso__valor" role="timer">
        {`${restante} s`}
      </span>
      <span
        className="temporizador-descanso__aviso"
        role="status"
        aria-live="polite"
      >
        {finalizado && !enMarcha ? MENSAJE_DESCANSO_FINALIZADO : ''}
      </span>
    </div>
  );
}
