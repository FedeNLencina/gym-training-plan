/**
 * Test de propiedad de la serialización de Entrenamientos.
 *
 * El criterio 8.4 exige que el sobre versionado conserve el Entrenamiento
 * completo: al volver del almacenamiento local, ningún campo del modelo ni
 * ningún Ejercicio puede haberse perdido, alterado ni reordenado.
 *
 * El generador `arbEntrenamiento` produce textos que pueden empezar o terminar
 * con espacios, de modo que un nombre de Ejercicio de longitud 3 puede quedar
 * por debajo del mínimo al recortarlo. Esos casos no son Entrenamientos
 * válidos, que es el universo que fija la propiedad, así que se descartan con
 * las propias validaciones de dominio en lugar de asumirlos válidos.
 *
 * Cubre: 8.4
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

import type { Entrenamiento } from './modelos';
import {
  deserializarEntrenamientos,
  serializarEntrenamientos,
} from './serializacion';
import { validarEjercicio, validarEntrenamiento } from './validaciones';
import { arbEntrenamiento } from '../tests/generadores/generadoresDominio';

/** Entrenamiento válido según las reglas del Repositorio_Datos (8.7, 8.14). */
function esEntrenamientoValido(entrenamiento: Entrenamiento): boolean {
  if (validarEntrenamiento(entrenamiento) !== null) return false;
  return entrenamiento.ejercicios.every(
    (ejercicio) => validarEjercicio(ejercicio) === null,
  );
}

const arbEntrenamientoValido = arbEntrenamiento().filter(esEntrenamientoValido);

describe('Propiedad 44: ida y vuelta de serialización de Entrenamiento', () => {
  it('Dado un Entrenamiento válido Cuando se serializa y se deserializa Entonces conserva todos sus campos y sus Ejercicios en orden', () => {
    // Cubre: 8.4
    // Feature: training-platform-landing, Property 44: Ida y vuelta de serialización de Entrenamiento
    fc.assert(
      fc.property(arbEntrenamientoValido, (entrenamiento) => {
        const recuperados = deserializarEntrenamientos(
          serializarEntrenamientos([entrenamiento]),
        );

        expect(recuperados).not.toBeNull();
        const recuperado = recuperados?.[0];
        expect(recuperado).toBeDefined();
        if (recuperado === undefined) return;

        expect(recuperado.id).toBe(entrenamiento.id);
        expect(recuperado.titulo).toBe(entrenamiento.titulo);
        expect(recuperado.descripcion).toBe(entrenamiento.descripcion);
        expect(recuperado.nivel).toBe(entrenamiento.nivel);
        expect(recuperado.duracionMinutos).toBe(entrenamiento.duracionMinutos);
        expect(recuperado.categoria).toBe(entrenamiento.categoria);
        expect(recuperado.fuenteVideo).toBe(entrenamiento.fuenteVideo);
        // Referencia de video: el enlace o el metadato del archivo, según fuente.
        expect(recuperado.enlaceVideo).toBe(entrenamiento.enlaceVideo);
        expect(recuperado.videoArchivo).toEqual(entrenamiento.videoArchivo);

        expect(
          recuperado.ejercicios.map((ejercicio) => ({
            nombre: ejercicio.nombre,
            series: ejercicio.series,
            repeticiones: ejercicio.repeticiones,
            descansoSegundos: ejercicio.descansoSegundos,
          })),
        ).toEqual(
          entrenamiento.ejercicios.map((ejercicio) => ({
            nombre: ejercicio.nombre,
            series: ejercicio.series,
            repeticiones: ejercicio.repeticiones,
            descansoSegundos: ejercicio.descansoSegundos,
          })),
        );
      }),
      { numRuns: 100, seed: 1 },
    );
  });
});
