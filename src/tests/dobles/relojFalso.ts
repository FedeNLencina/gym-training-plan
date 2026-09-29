/**
 * Doble del reloj inyectado (diseño: `infra/reloj.ts`).
 *
 * El tiempo no avanza solo: avanza únicamente cuando la prueba llama a
 * `avanzar(ms)`. Eso hace deterministas el temporizador de descanso y el plazo
 * de carga de 5 segundos, de modo que dos corridas consecutivas sin cambios de
 * código produzcan el mismo resultado.
 *
 * Cubre: 10.8
 */

/** Función sin argumentos programada en el reloj. */
export type TareaReloj = () => void;

type TareaProgramada = {
  vence: number;
  intervalo: number | null;
  callback: TareaReloj;
};

export type RelojFalso = {
  /** Instante actual en milisegundos. */
  ahora: () => number;
  /** Programa una ejecución única y devuelve un identificador cancelable. */
  programar: (callback: TareaReloj, milisegundos: number) => number;
  /** Programa una ejecución repetida y devuelve un identificador cancelable. */
  programarIntervalo: (callback: TareaReloj, milisegundos: number) => number;
  cancelar: (id: number) => void;
  cancelarIntervalo: (id: number) => void;
  /** Avanza el tiempo y ejecuta las tareas que vencen en el trayecto. */
  avanzar: (milisegundos: number) => void;
  /** Avanza en pasos de un segundo, útil para observar cada tic. */
  avanzarSegundos: (segundos: number) => void;
  /** Cantidad de tareas pendientes. */
  tareasPendientes: () => number;
};

export function crearRelojFalso({
  ahoraInicial = 0,
}: { ahoraInicial?: number } = {}): RelojFalso {
  let ahora = ahoraInicial;
  let siguienteId = 1;

  const tareas = new Map<number, TareaProgramada>();

  /** Ejecuta las tareas vencidas hasta el instante actual, en orden temporal. */
  const ejecutarVencidas = (): void => {
    let quedan = true;
    while (quedan) {
      const vencidas = [...tareas.entries()]
        .filter(([, tarea]) => tarea.vence <= ahora)
        .sort((a, b) => a[1].vence - b[1].vence || a[0] - b[0]);
      quedan = vencidas.length > 0;
      for (const [id, tarea] of vencidas) {
        if (tarea.intervalo === null) tareas.delete(id);
        else tarea.vence += tarea.intervalo;
        tarea.callback();
      }
    }
  };

  const reloj: RelojFalso = {
    ahora() {
      return ahora;
    },

    programar(callback, milisegundos) {
      const id = siguienteId++;
      tareas.set(id, {
        vence: ahora + milisegundos,
        intervalo: null,
        callback,
      });
      return id;
    },

    programarIntervalo(callback, milisegundos) {
      const id = siguienteId++;
      tareas.set(id, {
        vence: ahora + milisegundos,
        intervalo: Math.max(1, milisegundos),
        callback,
      });
      return id;
    },

    cancelar(id) {
      tareas.delete(id);
    },

    cancelarIntervalo(id) {
      tareas.delete(id);
    },

    // --- Controles de prueba -------------------------------------------------

    avanzar(milisegundos) {
      ahora += milisegundos;
      ejecutarVencidas();
    },

    avanzarSegundos(segundos) {
      for (let i = 0; i < segundos; i += 1) reloj.avanzar(1000);
    },

    tareasPendientes() {
      return tareas.size;
    },
  };

  return reloj;
}
