/**
 * Reloj inyectable: única puerta de la aplicación al paso del tiempo.
 *
 * Ningún módulo llama a `Date.now`, `setTimeout` o `setInterval` de forma
 * directa; todos reciben un `Reloj`. En pruebas se sustituye por
 * `crearRelojFalso` (`src/tests/dobles/relojFalso.ts`), que comparte este mismo
 * contrato, para que el temporizador de descanso (6.2) y el plazo de carga de
 * 5 segundos (5.10) sean deterministas.
 *
 * Cubre: 5.10, 6.2, 10.8
 */

/** Función sin argumentos programada en el reloj. */
export type TareaReloj = () => void;

/** Identificador cancelable devuelto al programar una tarea. */
export type IdTarea = number;

export type Reloj = {
  /** Instante actual en milisegundos. */
  ahora: () => number;
  /** Programa un plazo: una única ejecución al vencer los milisegundos dados. */
  programar: (callback: TareaReloj, milisegundos: number) => IdTarea;
  /** Programa una ejecución repetida cada tantos milisegundos. */
  programarIntervalo: (callback: TareaReloj, milisegundos: number) => IdTarea;
  /** Cancela un plazo pendiente; sobre un identificador ya vencido no hace nada. */
  cancelar: (id: IdTarea) => void;
  /** Cancela un intervalo en curso; es idempotente. */
  cancelarIntervalo: (id: IdTarea) => void;
};

/**
 * Reloj del navegador. Los temporizadores se toman de `globalThis` para que los
 * temporizadores falsos de Vitest los intercepten, y los identificadores se
 * normalizan a número porque en Node devuelven un objeto `Timeout`.
 */
export function crearReloj(): Reloj {
  const temporizadores = new Map<IdTarea, ReturnType<typeof setTimeout>>();
  let siguienteId: IdTarea = 1;

  const registrar = (temporizador: ReturnType<typeof setTimeout>): IdTarea => {
    const id = siguienteId++;
    temporizadores.set(id, temporizador);
    return id;
  };

  return {
    ahora() {
      return Date.now();
    },

    programar(callback, milisegundos) {
      // El identificador se reserva antes de programar para que la tarea pueda
      // darse de baja del registro al ejecutarse.
      const id = siguienteId;
      return registrar(
        setTimeout(() => {
          temporizadores.delete(id);
          callback();
        }, milisegundos),
      );
    },

    programarIntervalo(callback, milisegundos) {
      return registrar(setInterval(callback, milisegundos));
    },

    cancelar(id) {
      const temporizador = temporizadores.get(id);
      if (temporizador === undefined) return;
      clearTimeout(temporizador);
      temporizadores.delete(id);
    },

    cancelarIntervalo(id) {
      const temporizador = temporizadores.get(id);
      if (temporizador === undefined) return;
      clearInterval(temporizador);
      temporizadores.delete(id);
    },
  };
}
