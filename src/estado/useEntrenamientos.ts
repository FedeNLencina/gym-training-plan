/**
 * `useEntrenamientos`: máquina de estados de carga de los Entrenamientos.
 *
 * El hook no conoce el almacenamiento: recibe el Repositorio_Datos y el reloj
 * inyectados, de modo que las pruebas puedan sustituirlos por dobles y que el
 * plazo de 5 segundos sea determinista.
 *
 * Decisiones relevantes:
 *
 * - **Máquina de estados `cargando → listo | error`.** La vista no tiene que
 *   inferir la situación a partir de los datos: el estado la nombra, y de ahí
 *   salen el indicador de carga con filtros deshabilitados (5.5) y el mensaje
 *   con "Reintentar" (5.6, 3.8).
 * - **Carrera contra el plazo.** El plazo de 5 segundos (5.10) se programa en el
 *   reloj inyectado y compite con la promesa del repositorio. Gana el primero
 *   que llega: al vencer el plazo el hook pasa a `error` y la respuesta tardía
 *   se descarta, así una lectura lenta no vuelve a encender la vista después de
 *   haberse rendido.
 * - **Los datos previos sobreviven al error.** El hook no borra lo que ya tenía;
 *   quien consume decide qué presentar según `estado`. Esto también deja intacto
 *   el estado de filtros de la vista (5.7).
 *
 * `usarCargaConPlazo` vive acá porque `usePlanes` comparte exactamente la misma
 * máquina de estados y la misma carrera: duplicarla sería duplicar el riesgo.
 *
 * Cubre: 3.7, 3.8, 5.5, 5.6, 5.7, 5.10
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { ErrorCarga } from '../dominio/errores';
import type { Entrenamiento } from '../dominio/modelos';
import type { Reloj } from '../infra/reloj';
import type { RepositorioDatos } from '../servicios/repositorioDatos';

/** Plazo máximo de espera de una lectura, en milisegundos (criterio 5.10). */
export const PLAZO_CARGA_MS = 5000;

export const MENSAJE_ERROR_ENTRENAMIENTOS =
  'No pudimos cargar los entrenamientos';

/** Estados de la carga, tal como los nombra el diagrama del diseño. */
export type EstadoCarga = 'cargando' | 'listo' | 'error';

export type ResultadoCarga<T> = {
  estado: EstadoCarga;
  datos: T;
  error: ErrorCarga | null;
  /** Vuelve a solicitar los datos: `listo | error → cargando`. */
  recargar: () => void;
};

export type OpcionesCargaConPlazo<T> = {
  /** Lectura a ejecutar; debe ser estable entre renderizados. */
  cargar: () => Promise<T>;
  /** Valor presentado antes de la primera respuesta. */
  valorInicial: T;
  reloj: Reloj;
  mensajeError: string;
  plazoMs?: number;
};

/**
 * Carga asincrónica con plazo: la promesa y el temporizador compiten, y el
 * resultado del perdedor se descarta.
 */
export function usarCargaConPlazo<T>({
  cargar,
  valorInicial,
  reloj,
  mensajeError,
  plazoMs = PLAZO_CARGA_MS,
}: OpcionesCargaConPlazo<T>): ResultadoCarga<T> {
  const [intento, setIntento] = useState(0);
  const [estado, setEstado] = useState<EstadoCarga>('cargando');
  const [datos, setDatos] = useState<T>(valorInicial);
  const [error, setError] = useState<ErrorCarga | null>(null);

  useEffect(() => {
    // `resuelta` cierra la carrera: el primero en llegar la marca y el que
    // llega después no toca el estado.
    let resuelta = false;
    setEstado('cargando');
    setError(null);

    const idPlazo = reloj.programar(() => {
      if (resuelta) return;
      resuelta = true;
      setError(new ErrorCarga(mensajeError));
      setEstado('error');
    }, plazoMs);

    const terminar = (): boolean => {
      if (resuelta) return false;
      resuelta = true;
      reloj.cancelar(idPlazo);
      return true;
    };

    void cargar().then(
      (resueltos) => {
        if (!terminar()) return;
        setDatos(resueltos);
        setError(null);
        setEstado('listo');
      },
      () => {
        if (!terminar()) return;
        setError(new ErrorCarga(mensajeError));
        setEstado('error');
      },
    );

    return () => {
      resuelta = true;
      reloj.cancelar(idPlazo);
    };
  }, [cargar, reloj, mensajeError, plazoMs, intento]);

  const recargar = useCallback(() => {
    setIntento((anterior) => anterior + 1);
  }, []);

  return useMemo(
    () => ({ estado, datos, error, recargar }),
    [estado, datos, error, recargar],
  );
}

/** Porción del Repositorio_Datos que el hook necesita. */
export type RepositorioDeEntrenamientos = Pick<
  RepositorioDatos,
  'obtenerEntrenamientos'
>;

export type OpcionesUseEntrenamientos = {
  repositorio: RepositorioDeEntrenamientos;
  reloj: Reloj;
  plazoMs?: number;
};

const SIN_ENTRENAMIENTOS: Entrenamiento[] = [];

export function useEntrenamientos({
  repositorio,
  reloj,
  plazoMs = PLAZO_CARGA_MS,
}: OpcionesUseEntrenamientos): ResultadoCarga<Entrenamiento[]> {
  const cargar = useCallback(
    () => repositorio.obtenerEntrenamientos(),
    [repositorio],
  );

  return usarCargaConPlazo({
    cargar,
    valorInicial: SIN_ENTRENAMIENTOS,
    reloj,
    mensajeError: MENSAJE_ERROR_ENTRENAMIENTOS,
    plazoMs,
  });
}
