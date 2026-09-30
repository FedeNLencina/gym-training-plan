/**
 * Propiedades del Repositorio_Datos (Properties 42, 43, 45, 46 y 47).
 *
 * Cada propiedad se ejercita sobre un doble de `localStorage` en memoria, de
 * modo que la persistencia sea observable (el contenido crudo de la clave) sin
 * depender del navegador.
 *
 * Cubre: 8.1, 8.2, 8.5, 8.6, 8.7, 8.14
 */

import { describe, expect, it } from 'vitest';
import fc from 'fast-check';

import { ErrorValidacion } from '../dominio/errores';
import type { Entrenamiento } from '../dominio/modelos';
import {
  deserializarEntrenamientos,
  serializarEntrenamientos,
} from '../dominio/serializacion';
import {
  CLAVES_ALMACENAMIENTO,
  crearAlmacenamientoLocal,
  type MedioClaveValor,
} from '../infra/almacenamientoLocal';
import {
  arbEntrenamiento,
  arbEntrenamientoInvalido,
  arbListaEntrenamientos,
  arbTexto,
} from '../tests/generadores/generadoresDominio';
import {
  TOPE_ENTRENAMIENTOS,
  crearRepositorioDatos,
  type DatosIniciales,
} from './repositorioDatos';

const CONFIGURACION = { numRuns: 100, seed: 1 };

/** Doble de `localStorage` con contenido inspeccionable. */
type MedioFalso = MedioClaveValor & { crudo: () => string | null };

function crearMedioFalso(inicial: Record<string, string> = {}): MedioFalso {
  const datos = new Map<string, string>(Object.entries(inicial));
  return {
    getItem(clave) {
      return datos.get(clave) ?? null;
    },
    setItem(clave, valor) {
      datos.set(clave, valor);
    },
    removeItem(clave) {
      datos.delete(clave);
    },
    crudo() {
      return datos.get(CLAVES_ALMACENAMIENTO.entrenamientos) ?? null;
    },
  };
}

function crearEscenario(
  medio: MedioFalso,
  datosIniciales: DatosIniciales = { entrenamientos: [] },
) {
  const repositorio = crearRepositorioDatos({
    almacenamiento: crearAlmacenamientoLocal({ medio }),
    datosIniciales,
  });
  const conservados = (): Entrenamiento[] =>
    deserializarEntrenamientos(medio.crudo()) ?? [];
  return { repositorio, conservados };
}

/** Semilla de datos simulados mínima y válida, distinguible por su prefijo. */
function semilla(cantidad = 6): Entrenamiento[] {
  return fc.sample(arbListaEntrenamientos({ minimo: cantidad, maximo: cantidad }), {
    numRuns: 1,
    seed: 7,
  })[0];
}

/**
 * Contenido de almacenamiento que el Repositorio_Datos no puede usar: texto
 * arbitrario, JSON que no es el sobre esperado, versión desconocida, lista
 * ausente y sobre cuya lista entera incumple la estructura de Entrenamiento.
 */
const arbContenidoInutilizable: fc.Arbitrary<string> = fc.oneof(
  arbTexto(1, 40).filter((texto) => {
    try {
      return typeof JSON.parse(texto) !== 'object';
    } catch {
      return true;
    }
  }),
  fc.constantFrom('[]', 'null', '42', '"texto"', '{}', '{ esto no es json'),
  fc
    .integer({ min: 2, max: 99 })
    .map((version) => JSON.stringify({ version, entrenamientos: [] })),
  fc.constant(JSON.stringify({ version: 1 })),
  fc.constant(JSON.stringify({ version: 1, entrenamientos: 'no es lista' })),
  fc
    .array(arbEntrenamientoInvalido(), { minLength: 1, maxLength: 4 })
    .map((casos) =>
      JSON.stringify({
        version: 1,
        entrenamientos: casos.map((caso) => caso.entrenamiento),
      }),
    ),
);

describe('propiedades del repositorioDatos', () => {
  // Feature: training-platform-landing, Property 42: Toda escritura válida se conserva y se devuelve
  it('Dado un Entrenamiento válido Cuando se guarda en el repositorio Entonces queda conservado y una lectura posterior lo devuelve con idéntico identificador y contenido', async () => {
    // Cubre: 5.2
    await fc.assert(
      fc.asyncProperty(arbEntrenamiento(), async (entrenamiento) => {
        const medio = crearMedioFalso();
        const { repositorio, conservados } = crearEscenario(medio);

        const devuelto = await repositorio.guardarEntrenamiento(entrenamiento);

        expect(devuelto).toEqual(entrenamiento);
        expect(await repositorio.obtenerEntrenamiento(entrenamiento.id)).toEqual(
          entrenamiento,
        );
        expect(await repositorio.obtenerEntrenamientos()).toEqual([
          entrenamiento,
        ]);
        expect(conservados()).toEqual([entrenamiento]);
      }),
      CONFIGURACION,
    );
  });

  // Feature: training-platform-landing, Property 43: La lectura devuelve la totalidad de lo almacenado hasta el tope
  it('Dada una lista de Entrenamientos almacenada de forma deserializable Cuando se piden los Entrenamientos Entonces devuelve el mínimo entre la cantidad almacenada y el tope de doscientos, todos pertenecientes a la lista', async () => {
    // Cubre: 5.3
    // Una lista vacía equivale a la ausencia de datos y dispara la siembra, de
    // modo que la propiedad del tope se enuncia sobre listas de al menos uno.
    const arbAlmacenados = fc.oneof(
      { weight: 9, arbitrary: arbListaEntrenamientos({ minimo: 1, maximo: 8 }) },
      {
        weight: 1,
        arbitrary: arbListaEntrenamientos({
          minimo: TOPE_ENTRENAMIENTOS + 1,
          maximo: TOPE_ENTRENAMIENTOS + 3,
        }),
      },
    );

    await fc.assert(
      fc.asyncProperty(arbAlmacenados, async (almacenados) => {
        const medio = crearMedioFalso({
          [CLAVES_ALMACENAMIENTO.entrenamientos]:
            serializarEntrenamientos(almacenados),
        });
        const { repositorio } = crearEscenario(medio, {
          entrenamientos: semilla(),
        });

        const leidos = await repositorio.obtenerEntrenamientos();

        expect(leidos).toHaveLength(
          Math.min(almacenados.length, TOPE_ENTRENAMIENTOS),
        );
        const identificadores = new Set(almacenados.map((uno) => uno.id));
        for (const leido of leidos) {
          expect(identificadores.has(leido.id)).toBe(true);
          expect(leido).toEqual(
            almacenados.find((uno) => uno.id === leido.id),
          );
        }
      }),
      CONFIGURACION,
    );
  });

  // Feature: training-platform-landing, Property 45: Todo contenido almacenado inválido se descarta sin interrumpir la carga
  it('Dado un contenido almacenado que no es deserializable o no cumple la estructura Cuando se piden los Entrenamientos Entonces descarta ese contenido y devuelve los datos simulados sin propagar error', async () => {
    // Cubre: 5.4
    await fc.assert(
      fc.asyncProperty(arbContenidoInutilizable, async (contenido) => {
        const simulados = semilla();
        const medio = crearMedioFalso({
          [CLAVES_ALMACENAMIENTO.entrenamientos]: contenido,
        });
        const { repositorio, conservados } = crearEscenario(medio, {
          entrenamientos: simulados,
        });

        const leidos = await repositorio.obtenerEntrenamientos();

        expect(leidos).toEqual(simulados);
        expect(conservados()).toEqual(simulados);
      }),
      CONFIGURACION,
    );
  });

  // Feature: training-platform-landing, Property 46: La escritura de un Entrenamiento es idempotente
  it('Dado un Entrenamiento válido ya guardado Cuando se aplica otra vez la misma escritura Entonces el estado almacenado es idéntico y la cantidad de Entrenamientos no crece', async () => {
    // Cubre: 5.5
    await fc.assert(
      fc.asyncProperty(arbEntrenamiento(), async (entrenamiento) => {
        const medio = crearMedioFalso();
        const { repositorio, conservados } = crearEscenario(medio);
        await repositorio.guardarEntrenamiento(entrenamiento);
        const trasUna = medio.crudo();
        const cantidadTrasUna = conservados().length;

        await repositorio.guardarEntrenamiento(entrenamiento);

        expect(medio.crudo()).toBe(trasUna);
        expect(conservados()).toHaveLength(cantidadTrasUna);
        expect(await repositorio.obtenerEntrenamientos()).toEqual([
          entrenamiento,
        ]);
      }),
      CONFIGURACION,
    );
  });

  // Feature: training-platform-landing, Property 47: Toda escritura inválida es rechazada y preserva el estado previo
  it('Dado un Entrenamiento que incumple alguna regla de validez Cuando se intenta guardarlo Entonces la escritura es rechazada nombrando el campo inválido y el estado almacenado queda idéntico al previo', async () => {
    // Cubre: 5.6
    await fc.assert(
      fc.asyncProperty(
        arbEntrenamientoInvalido(),
        arbListaEntrenamientos({ minimo: 1, maximo: 4 }),
        async (caso, previos) => {
          const medio = crearMedioFalso({
            [CLAVES_ALMACENAMIENTO.entrenamientos]:
              serializarEntrenamientos(previos),
          });
          const { repositorio, conservados } = crearEscenario(medio, {
            entrenamientos: semilla(),
          });
          const crudoPrevio = medio.crudo();

          const fallo = await repositorio
            .guardarEntrenamiento(caso.entrenamiento)
            .catch((error: unknown) => error);

          expect(fallo).toBeInstanceOf(ErrorValidacion);
          expect((fallo as ErrorValidacion).campos).toHaveProperty(caso.campo);
          expect(medio.crudo()).toBe(crudoPrevio);
          expect(conservados()).toEqual(previos);
        },
      ),
      CONFIGURACION,
    );
  });
});
