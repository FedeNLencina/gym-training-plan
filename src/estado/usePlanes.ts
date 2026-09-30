/**
 * `usePlanes`: máquina de estados de carga de los planes de la Seccion_Planes.
 *
 * Comparte con `useEntrenamientos` la máquina `cargando → listo | error`, el
 * `recargar` y la carrera contra el plazo de 5 segundos del reloj inyectado, así
 * que reutiliza `usarCargaConPlazo` en lugar de repetirla. Lo único propio es la
 * lectura que ejecuta y el mensaje de error, que la Seccion_Planes presenta
 * junto a la acción "Reintentar" (3.8).
 *
 * Cubre: 3.7, 3.8, 5.10
 */

import { useCallback } from 'react';

import type { Plan } from '../dominio/modelos';
import type { Reloj } from '../infra/reloj';
import type { RepositorioDatos } from '../servicios/repositorioDatos';
import {
  PLAZO_CARGA_MS,
  usarCargaConPlazo,
  type ResultadoCarga,
} from './useEntrenamientos';

export const MENSAJE_ERROR_PLANES = 'No pudimos cargar los planes';

/** Porción del Repositorio_Datos que el hook necesita. */
export type RepositorioDePlanes = Pick<RepositorioDatos, 'obtenerPlanes'>;

export type OpcionesUsePlanes = {
  repositorio: RepositorioDePlanes;
  reloj: Reloj;
  plazoMs?: number;
};

const SIN_PLANES: Plan[] = [];

export function usePlanes({
  repositorio,
  reloj,
  plazoMs = PLAZO_CARGA_MS,
}: OpcionesUsePlanes): ResultadoCarga<Plan[]> {
  const cargar = useCallback(() => repositorio.obtenerPlanes(), [repositorio]);

  return usarCargaConPlazo({
    cargar,
    valorInicial: SIN_PLANES,
    reloj,
    mensajeError: MENSAJE_ERROR_PLANES,
    plazoMs,
  });
}
