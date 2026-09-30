/**
 * Semilla de planes de la Seccion_Planes.
 *
 * Son 4 planes, dentro del rango de 3 a 6 que fija el criterio 3.1, y
 * exactamente uno marcado como recomendado. El destaque único es una condición
 * y no una preferencia: ante cero o más de un plan recomendado, la
 * Seccion_Planes debe presentar la lista entera sin etiqueta ni destaque (3.5),
 * de modo que una semilla con dos recomendados desactivaría silenciosamente el
 * destaque en toda la vista.
 *
 * Los precios se expresan en pesos con dos decimales exactos, el máximo que
 * admite el criterio 3.1, y quedan por debajo del tope de 999.999.
 *
 * Cubre: 3.1, 3.2, 3.4
 */

import { crearPlan, type Plan } from '../dominio/modelos';

/** Límites de la Seccion_Planes, según el criterio 3.1. */
export const LIMITES_PLAN = Object.freeze({
  nombreMinimo: 3,
  nombreMaximo: 40,
  objetivoMinimo: 10,
  objetivoMaximo: 120,
  precioMinimo: 1,
  precioMaximo: 999999,
  decimalesPrecio: 2,
  prestacionesMinimas: 3,
  prestacionesMaximas: 8,
  prestacionMinima: 5,
  prestacionMaxima: 80,
} as const);

const SEMILLA: readonly Plan[] = [
  {
    id: 'plan-base',
    nombre: 'Plan Base',
    objetivo: 'Empezar a entrenar con una rutina guiada y sostenible en el tiempo',
    precio: 14999.0,
    periodicidad: 'mensual',
    prestaciones: [
      'Acceso a todos los entrenamientos publicados',
      'Rutina semanal sugerida según tu nivel',
      'Seguimiento de avance por ejercicio',
    ],
    incluyeAsesoria: false,
    incluyeAlimentacion: false,
    recomendado: false,
  },
  {
    id: 'plan-progreso',
    nombre: 'Plan Progreso',
    objetivo: 'Ganar fuerza y constancia con correcciones de técnica en línea',
    precio: 24999.5,
    periodicidad: 'mensual',
    prestaciones: [
      'Acceso a todos los entrenamientos publicados',
      'Asesoría en línea de ejercicios una vez por semana',
      'Revisión de técnica sobre los videos que envíes',
      'Ajuste mensual de cargas y volumen',
    ],
    incluyeAsesoria: true,
    incluyeAlimentacion: false,
    recomendado: true,
  },
  {
    id: 'plan-integral',
    nombre: 'Plan Integral',
    objetivo: 'Combinar entrenamiento y alimentación para recomposición corporal',
    precio: 64999.99,
    periodicidad: 'trimestral',
    prestaciones: [
      'Acceso a todos los entrenamientos publicados',
      'Asesoría en línea de ejercicios dos veces por semana',
      'Plan de alimentación adaptado a tu objetivo',
      'Revisión trimestral de composición corporal',
      'Guía de suplementación básica opcional',
    ],
    incluyeAsesoria: true,
    incluyeAlimentacion: true,
    recomendado: false,
  },
  {
    id: 'plan-anual-atlas',
    nombre: 'Plan Anual Atlas',
    objetivo: 'Sostener un año completo de entrenamiento con acompañamiento continuo',
    precio: 219999.0,
    periodicidad: 'anual',
    prestaciones: [
      'Acceso a todos los entrenamientos publicados',
      'Asesoría en línea de ejercicios sin límite semanal',
      'Plan de alimentación con revisiones mensuales',
      'Planificación anual por bloques de carga',
      'Acceso anticipado a los entrenamientos nuevos',
      'Dos sesiones presenciales de evaluación por año',
    ],
    incluyeAsesoria: true,
    incluyeAlimentacion: true,
    recomendado: false,
  },
];

/**
 * Planes simulados. Se construye una instancia nueva por llamada, con la lista
 * de prestaciones copiada, para que ningún consumidor mute la semilla.
 */
export function crearPlanesSimulados(): Plan[] {
  return SEMILLA.map((plan) => crearPlan(plan));
}

/** Cantidad de planes de la semilla, dentro del rango 3 a 6 (3.1). */
export const CANTIDAD_PLANES_SIMULADOS = SEMILLA.length;
