/**
 * Tests unitarios de la serialización de Entrenamientos.
 *
 * El sobre `{ version: 1, entrenamientos }` es el único formato reconocido: se
 * verifica la ida y vuelta de un Entrenamiento válido (8.4) y el descarte del
 * contenido que no es deserializable, declara una versión desconocida o no
 * cumple la estructura de Entrenamiento (8.5).
 *
 * Cubre: 8.4, 8.5
 */

import { describe, it, expect } from 'vitest';

import {
  crearEjercicio,
  crearEntrenamiento,
  type Ejercicio,
  type Entrenamiento,
} from './modelos';
import {
  VERSION_ENTRENAMIENTOS,
  deserializarEntrenamientos,
  serializarEntrenamientos,
} from './serializacion';

function ejercicioValido(cambios: Partial<Ejercicio> = {}): Ejercicio {
  return crearEjercicio({
    id: 'ej-1',
    nombre: 'Sentadilla',
    series: 4,
    repeticiones: 10,
    descansoSegundos: 60,
    ...cambios,
  });
}

function entrenamientoValido(
  cambios: Partial<Entrenamiento> = {},
): Entrenamiento {
  return crearEntrenamiento({
    id: 'ent-1',
    titulo: 'Fuerza total',
    descripcion: 'Rutina de cuerpo completo',
    categoria: 'Fuerza',
    nivel: 'Intermedio',
    duracionMinutos: 45,
    estado: 'publicado',
    fuenteVideo: 'enlace',
    enlaceVideo: 'https://www.youtube.com/watch?v=abc',
    ejercicios: [ejercicioValido()],
    ...cambios,
  });
}

/** Sobre con una lista de contenido arbitrario, incluso inválido. */
function sobre(entrenamientos: unknown, version: unknown = 1): string {
  return JSON.stringify({ version, entrenamientos });
}

describe('serializarEntrenamientos', () => {
  it('Dada una lista de Entrenamientos Cuando se serializa Entonces produce el sobre con la versión 1', () => {
    // Cubre: 8.4
    const contenido = serializarEntrenamientos([entrenamientoValido()]);

    const analizado: unknown = JSON.parse(contenido);
    expect(analizado).toMatchObject({ version: VERSION_ENTRENAMIENTOS });
    expect(VERSION_ENTRENAMIENTOS).toBe(1);
  });

  it('Dada una lista vacía Cuando se serializa Entonces el sobre conserva la lista vacía', () => {
    // Cubre: 8.4
    const contenido = serializarEntrenamientos([]);

    expect(deserializarEntrenamientos(contenido)).toEqual([]);
  });
});

describe('deserializarEntrenamientos', () => {
  it('Dado un Entrenamiento serializado Cuando se deserializa Entonces devuelve todos sus campos idénticos', () => {
    // Cubre: 8.4
    const original = entrenamientoValido();

    const recuperados = deserializarEntrenamientos(
      serializarEntrenamientos([original]),
    );

    expect(recuperados).toEqual([original]);
  });

  it('Dado un Entrenamiento con archivo de video Cuando se deserializa Entonces conserva el metadato del archivo', () => {
    // Cubre: 8.4
    const original = entrenamientoValido({
      fuenteVideo: 'archivo',
      videoArchivo: {
        nombre: 'rutina.mp4',
        tipo: 'video/mp4',
        tamanioBytes: 1024,
      },
    });

    const recuperados = deserializarEntrenamientos(
      serializarEntrenamientos([original]),
    );

    expect(recuperados).toEqual([original]);
  });

  it('Dada una lista de varios Entrenamientos Cuando se deserializa Entonces conserva el orden', () => {
    // Cubre: 8.4
    const lista = [
      entrenamientoValido({ id: 'ent-1', titulo: 'Uno' }),
      entrenamientoValido({ id: 'ent-2', titulo: 'Dos' }),
      entrenamientoValido({ id: 'ent-3', titulo: 'Tres' }),
    ];

    const recuperados = deserializarEntrenamientos(
      serializarEntrenamientos(lista),
    );

    expect(recuperados?.map((entrenamiento) => entrenamiento.id)).toEqual([
      'ent-1',
      'ent-2',
      'ent-3',
    ]);
  });

  it('Dado contenido ausente Cuando se deserializa Entonces devuelve null', () => {
    // Cubre: 8.5
    expect(deserializarEntrenamientos(null)).toBeNull();
  });

  it('Dado contenido que no es JSON Cuando se deserializa Entonces devuelve null', () => {
    // Cubre: 8.5
    expect(deserializarEntrenamientos('{esto no es json')).toBeNull();
  });

  it('Dado un sobre con versión desconocida Cuando se deserializa Entonces devuelve null', () => {
    // Cubre: 8.5
    const contenido = sobre([entrenamientoValido()], 2);

    expect(deserializarEntrenamientos(contenido)).toBeNull();
  });

  it('Dado un sobre sin campo de versión Cuando se deserializa Entonces devuelve null', () => {
    // Cubre: 8.5
    const contenido = JSON.stringify({
      entrenamientos: [entrenamientoValido()],
    });

    expect(deserializarEntrenamientos(contenido)).toBeNull();
  });

  it('Dado un sobre cuya lista no es un arreglo Cuando se deserializa Entonces devuelve null', () => {
    // Cubre: 8.5
    expect(deserializarEntrenamientos(sobre({ uno: 1 }))).toBeNull();
  });

  it('Dado un contenido que no es un objeto Cuando se deserializa Entonces devuelve null', () => {
    // Cubre: 8.5
    expect(deserializarEntrenamientos(JSON.stringify([1, 2, 3]))).toBeNull();
  });

  it('Dado un sobre con un Entrenamiento inválido Cuando se deserializa Entonces lo descarta y conserva los válidos', () => {
    // Cubre: 8.5
    const valido = entrenamientoValido({ id: 'ent-ok' });
    const contenido = sobre([valido, { titulo: 'Sin nada más' }]);

    expect(deserializarEntrenamientos(contenido)).toEqual([valido]);
  });

  it('Dado un sobre con un Entrenamiento con Ejercicio inválido Cuando se deserializa Entonces lo descarta', () => {
    // Cubre: 8.5
    const contenido = sobre([
      { ...entrenamientoValido(), ejercicios: [{ nombre: 'X', series: 0 }] },
    ]);

    expect(deserializarEntrenamientos(contenido)).toEqual([]);
  });

  it('Dado un sobre con un Entrenamiento sin identificador Cuando se deserializa Entonces lo descarta', () => {
    // Cubre: 8.5
    const contenido = sobre([{ ...entrenamientoValido(), id: '' }]);

    expect(deserializarEntrenamientos(contenido)).toEqual([]);
  });

  it('Dado un sobre con un estado desconocido Cuando se deserializa Entonces descarta ese Entrenamiento', () => {
    // Cubre: 8.5
    const contenido = sobre([
      { ...entrenamientoValido(), estado: 'archivado' },
    ]);

    expect(deserializarEntrenamientos(contenido)).toEqual([]);
  });

  it('Dado un Entrenamiento con campos ajenos al modelo Cuando se deserializa Entonces los descarta', () => {
    // Cubre: 8.5
    const contenido = sobre([{ ...entrenamientoValido(), sobrante: 'x' }]);

    const recuperados = deserializarEntrenamientos(contenido);

    expect(recuperados).toEqual([entrenamientoValido()]);
  });
});
