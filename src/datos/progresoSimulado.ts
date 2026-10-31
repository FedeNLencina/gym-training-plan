/**
 * Semilla de progreso por cuenta.
 *
 * Siembra avances en curso e historiales de sesiones completadas para que las
 * vistas de progreso tengan material desde el primer arranque y el aislamiento
 * entre Usuarios sea verificable a mano: al entrar con una cuenta y con otra,
 * los números tienen que ser distintos.
 *
 * Los identificadores de Ejercicio siguen la convención estable de
 * `entrenamientosSimulados`, `<idEntrenamiento>-e<n>`. `cuentasSimuladas.test`
 * comprueba que cada referencia exista de verdad, así que un cambio en la
 * semilla de Entrenamientos que deje un avance colgado rompe las pruebas en
 * lugar de producir un avance silenciosamente incoherente.
 *
 * Cada cuenta cubre una situación distinta:
 *
 * - `ana`: avance parcial en dos Entrenamientos y tres sesiones completadas,
 *   incluidas dos del mismo Entrenamiento, para que el acumulado de
 *   "Entrenamientos distintos" no coincida con el de sesiones.
 * - `bruno`: una sola sesión completada y ningún avance en curso.
 * - `carla`: avance en curso sin ninguna sesión completada.
 * - `diego`: sin entrada, para probar el estado vacío.
 */

import {
  crearProgresoCuenta,
  crearProgresoEntrenamientoGuardado,
  crearSesionCompletada,
  type ProgresoCuenta,
} from '../dominio/modelos';
import { CORREOS_SIMULADOS } from './cuentasSimuladas';

/** Progreso de cada cuenta, indexado por correo. */
export type ProgresoSimulado = Record<string, ProgresoCuenta>;

const SEMILLA: ProgresoSimulado = {
  [CORREOS_SIMULADOS.ana]: crearProgresoCuenta({
    porEntrenamiento: {
      // 2 de 4 Ejercicios: 50 % de avance.
      'ent-hipertrofia-piernas': crearProgresoEntrenamientoGuardado({
        idEntrenamiento: 'ent-hipertrofia-piernas',
        completados: ['ent-hipertrofia-piernas-e1', 'ent-hipertrofia-piernas-e2'],
        actualizadoEn: '2026-10-28T19:30:00.000Z',
      }),
      // 1 de 3 Ejercicios: 33 % de avance.
      'ent-fuerza-core': crearProgresoEntrenamientoGuardado({
        idEntrenamiento: 'ent-fuerza-core',
        completados: ['ent-fuerza-core-e1'],
        actualizadoEn: '2026-10-29T08:15:00.000Z',
      }),
    },
    historial: [
      crearSesionCompletada({
        id: 'ses-ana-1',
        idEntrenamiento: 'ent-fuerza-tren-superior',
        tituloEntrenamiento: 'Fuerza de tren superior',
        completadoEn: '2026-10-20T18:00:00.000Z',
        ejerciciosCompletados: 4,
        ejerciciosTotales: 4,
      }),
      crearSesionCompletada({
        id: 'ses-ana-2',
        idEntrenamiento: 'ent-cardio-intervalos',
        tituloEntrenamiento: 'Cardio por intervalos',
        completadoEn: '2026-10-23T18:20:00.000Z',
        ejerciciosCompletados: 3,
        ejerciciosTotales: 3,
      }),
      crearSesionCompletada({
        id: 'ses-ana-3',
        idEntrenamiento: 'ent-fuerza-tren-superior',
        tituloEntrenamiento: 'Fuerza de tren superior',
        completadoEn: '2026-10-27T18:05:00.000Z',
        ejerciciosCompletados: 4,
        ejerciciosTotales: 4,
      }),
    ],
  }),

  [CORREOS_SIMULADOS.bruno]: crearProgresoCuenta({
    porEntrenamiento: {},
    historial: [
      crearSesionCompletada({
        id: 'ses-bruno-1',
        idEntrenamiento: 'ent-movilidad-matinal',
        tituloEntrenamiento: 'Movilidad matinal',
        completadoEn: '2026-10-26T11:00:00.000Z',
        ejerciciosCompletados: 3,
        ejerciciosTotales: 3,
      }),
    ],
  }),

  [CORREOS_SIMULADOS.carla]: crearProgresoCuenta({
    porEntrenamiento: {
      // 4 de 5 Ejercicios: 80 % de avance, sesión casi terminada.
      'ent-funcional-cuerpo-completo': crearProgresoEntrenamientoGuardado({
        idEntrenamiento: 'ent-funcional-cuerpo-completo',
        completados: [
          'ent-funcional-cuerpo-completo-e1',
          'ent-funcional-cuerpo-completo-e2',
          'ent-funcional-cuerpo-completo-e3',
          'ent-funcional-cuerpo-completo-e4',
        ],
        actualizadoEn: '2026-10-30T20:45:00.000Z',
      }),
    },
    historial: [],
  }),
};

/**
 * Progreso simulado. Construye una estructura nueva por llamada, con los
 * avances y el historial copiados, para que ningún consumidor mute la semilla.
 */
export function crearProgresoSimulado(): ProgresoSimulado {
  return Object.fromEntries(
    Object.entries(SEMILLA).map(([correo, progreso]) => [
      correo,
      crearProgresoCuenta({
        porEntrenamiento: Object.fromEntries(
          Object.entries(progreso.porEntrenamiento).map(([id, avance]) => [
            id,
            crearProgresoEntrenamientoGuardado(avance),
          ]),
        ),
        historial: progreso.historial.map((sesion) =>
          crearSesionCompletada(sesion),
        ),
      }),
    ]),
  );
}
