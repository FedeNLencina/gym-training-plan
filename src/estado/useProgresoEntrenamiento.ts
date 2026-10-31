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
 * Con una `PersistenciaProgreso` inyectada, el avance además se recupera y se
 * conserva por cuenta a través del ServicioProgreso, y la sesión terminada entra
 * al historial de esa cuenta. La persistencia es opcional a propósito: el
 * cálculo del avance es independiente de dónde se guarde, y sin ella el hook se
 * comporta como lo hacía antes de que existiera el servicio, que es lo que
 * corresponde cuando no hay sesión activa.
 *
 * Cubre: 6.4, 6.5, 6.7
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Ejercicio } from '../dominio/modelos';
import { calcularPorcentajeAvance, estaCompleto } from '../dominio/progreso';
import type { ServicioProgreso } from '../servicios/servicioProgreso';

/**
 * Datos que el hook necesita para recordar el avance de una cuenta concreta en
 * un Entrenamiento concreto. Es opcional: sin él el avance vive sólo durante la
 * visita, que es el comportamiento que corresponde a un Visitante sin sesión.
 */
export type PersistenciaProgreso = {
  servicio: ServicioProgreso;
  /** Cuenta dueña del avance. Es la clave del aislamiento entre Usuarios. */
  correo: string;
  idEntrenamiento: string;
  /**
   * Título con el que la sesión entra al historial. Se guarda junto a la sesión
   * para que el historial siga siendo legible si el Entrenamiento se renombra
   * o se elimina.
   */
  tituloEntrenamiento: string;
};

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
  /**
   * Verdadero mientras se recupera el avance persistido. La vista no debe
   * presentar el avance hasta que sea falso: antes, el 0 % inicial no significa
   * «sin avance» sino «todavía no sabemos».
   */
  readonly rehidratando: boolean;
}

export function useProgresoEntrenamiento(
  ejercicios: readonly Ejercicio[],
  persistencia: PersistenciaProgreso | null = null,
): ProgresoEntrenamiento {
  const [marcados, setMarcados] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );

  /**
   * Sin persistencia no hay nada que recuperar, así que el hook arranca ya
   * rehidratado y se comporta igual que antes de que existiera el servicio.
   */
  const [rehidratando, setRehidratando] = useState(persistencia !== null);

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

  // --- Persistencia ----------------------------------------------------------

  // Los campos se desarman en primitivas para que los efectos dependan de
  // valores comparables y no de la identidad del objeto `persistencia`, que la
  // vista reconstruye en cada render.
  const servicio = persistencia?.servicio ?? null;
  const correo = persistencia?.correo ?? null;
  const idEntrenamiento = persistencia?.idEntrenamiento ?? null;
  const tituloEntrenamiento = persistencia?.tituloEntrenamiento ?? '';

  /** Firma del último avance conservado, para no repetir escrituras iguales. */
  const ultimoConservado = useRef<string | null>(null);

  /**
   * Evita que una misma sesión terminada entre dos veces al historial. Se
   * levanta al registrar y se baja en cuanto la sesión deja de estar completa,
   * de modo que desmarcar y volver a marcar un Ejercicio no cuente como una
   * sesión nueva.
   */
  const sesionYaRegistrada = useRef(false);

  const firmaDe = (ids: readonly string[]): string => ids.join('|');

  /**
   * Recupera el avance persistido de la cuenta. Un fallo equivale a no tener
   * avance: el Reproductor tiene que poder usarse igual (8.8).
   */
  useEffect(() => {
    if (servicio === null || correo === null || idEntrenamiento === null) {
      setRehidratando(false);
      return;
    }

    let vigente = true;
    setRehidratando(true);

    const rehidratar = async (): Promise<void> => {
      let recuperados: string[] = [];
      try {
        const avance = await servicio.obtenerAvance(correo, idEntrenamiento);
        recuperados = avance?.completados ?? [];
      } catch {
        recuperados = [];
      }
      if (!vigente) return;

      // Un Entrenamiento que ya estaba completo al abrirlo no vuelve a
      // registrarse en el historial.
      const yaEstabaCompleto =
        recuperados.length > 0 &&
        estaCompleto(
          ejercicios.filter((ejercicio) => recuperados.includes(ejercicio.id))
            .length,
          ejercicios.length,
        );
      sesionYaRegistrada.current = yaEstabaCompleto;

      ultimoConservado.current = firmaDe(
        ejercicios
          .map((ejercicio) => ejercicio.id)
          .filter((id) => recuperados.includes(id)),
      );
      setMarcados(new Set(recuperados));
      setRehidratando(false);
    };

    void rehidratar();

    return () => {
      vigente = false;
    };
    // `ejercicios` queda fuera a propósito: la rehidratación depende de la
    // cuenta y del Entrenamiento, no de la lista de Ejercicios, que puede
    // llegar como una referencia nueva en cada render sin haber cambiado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicio, correo, idEntrenamiento]);

  /** Conserva el avance vigente cuando cambió respecto de lo ya guardado. */
  useEffect(() => {
    if (
      servicio === null ||
      correo === null ||
      idEntrenamiento === null ||
      rehidratando
    ) {
      return;
    }

    const firma = firmaDe(completados);
    if (firma === ultimoConservado.current) return;
    ultimoConservado.current = firma;

    // El avance se conserva con el mejor esfuerzo: el servicio ya absorbe el
    // fallo del almacenamiento, así que no hay nada que tratar acá.
    void servicio.guardarAvance(correo, idEntrenamiento, completados);
  }, [servicio, correo, idEntrenamiento, rehidratando, completados]);

  /** Registra la sesión en el historial al completarse, una sola vez. */
  useEffect(() => {
    if (
      servicio === null ||
      correo === null ||
      idEntrenamiento === null ||
      rehidratando
    ) {
      return;
    }

    // La guarda no se baja al dejar de estar completa: desmarcar un Ejercicio
    // para corregir un tilde mal puesto y volver a marcarlo no es terminar el
    // entrenamiento otra vez. Sólo `reiniciar` habilita un registro nuevo.
    if (!completo || sesionYaRegistrada.current) return;
    sesionYaRegistrada.current = true;

    void servicio.registrarSesionCompletada(correo, {
      idEntrenamiento,
      tituloEntrenamiento,
      ejerciciosCompletados: cantidadCompletados,
      ejerciciosTotales: total,
    });
  }, [
    servicio,
    correo,
    idEntrenamiento,
    tituloEntrenamiento,
    rehidratando,
    completo,
    cantidadCompletados,
    total,
  ]);

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
    // Descartar el avance empieza una sesión nueva: la próxima vez que se
    // complete corresponde registrarla en el historial.
    sesionYaRegistrada.current = false;
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
      rehidratando,
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
      rehidratando,
    ],
  );
}
