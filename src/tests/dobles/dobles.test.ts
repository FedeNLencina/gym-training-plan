/**
 * Autoverificación de los dobles de prueba: confirma que el doble conserva,
 * devuelve copias y falla cuando la prueba se lo pide. Sin estas garantías,
 * cualquier prueba construida sobre los dobles sería poco confiable.
 */

import { describe, it, expect } from 'vitest';
import type { Entrenamiento } from '../tiposDominio';
import { crearRepositorioEnMemoria } from './repositorioEnMemoria';
import {
  crearAlmacenVideosEnMemoria,
  LIMITE_VIDEO_BYTES,
} from './almacenVideosEnMemoria';
import { crearRelojFalso } from './relojFalso';

const entrenamientoConArchivo: Entrenamiento = {
  id: 'ent-1',
  titulo: 'Fuerza total',
  descripcion: '',
  categoria: 'Fuerza',
  nivel: 'Intermedio',
  duracionMinutos: 45,
  estado: 'publicado',
  fuenteVideo: 'archivo',
  enlaceVideo: '',
  videoArchivo: { nombre: 'a.mp4', tipo: 'video/mp4', tamanioBytes: 10 },
  ejercicios: [
    {
      id: 'ej-1',
      nombre: 'Sentadilla',
      series: 4,
      repeticiones: 8,
      descansoSegundos: 90,
    },
  ],
};

describe('repositorioEnMemoria', () => {
  it('Dado un repositorio vacío Cuando se guarda un entrenamiento Entonces una lectura posterior lo devuelve con idéntico identificador', async () => {
    // Cubre: 10.8
    const repositorio = crearRepositorioEnMemoria();

    await repositorio.guardarEntrenamiento(entrenamientoConArchivo);

    const almacenados = await repositorio.obtenerEntrenamientos();
    expect(almacenados).toHaveLength(1);
    expect(almacenados[0].id).toBe('ent-1');
  });

  it('Dado un repositorio con un entrenamiento Cuando se modifica el objeto devuelto Entonces el estado almacenado queda intacto', async () => {
    // Cubre: 10.8
    const repositorio = crearRepositorioEnMemoria({
      entrenamientos: [entrenamientoConArchivo],
    });

    const [devuelto] = await repositorio.obtenerEntrenamientos();
    devuelto.titulo = 'Otro título';

    const [almacenado] = await repositorio.obtenerEntrenamientos();
    expect(almacenado.titulo).toBe('Fuerza total');
  });

  it('Dado un repositorio con fallo de lectura simulado Cuando se piden los entrenamientos Entonces se rechaza con el error de carga', async () => {
    // Cubre: 10.8
    const repositorio = crearRepositorioEnMemoria();
    repositorio.simularFalloLectura();

    const resultado = repositorio.obtenerEntrenamientos();

    await expect(resultado).rejects.toMatchObject({ nombre: 'ErrorCarga' });
  });

  it('Dado un repositorio con fallo de escritura simulado Cuando se guarda un entrenamiento Entonces se rechaza y el estado almacenado no cambia', async () => {
    // Cubre: 10.8
    const repositorio = crearRepositorioEnMemoria();
    repositorio.simularFalloEscritura();

    const resultado = repositorio.guardarEntrenamiento(entrenamientoConArchivo);

    await expect(resultado).rejects.toMatchObject({
      nombre: 'ErrorAlmacenamiento',
    });
    expect(repositorio.entrenamientosAlmacenados()).toEqual([]);
  });

  it('Dado un repositorio con espacio insuficiente simulado Cuando se guarda un entrenamiento Entonces se rechaza con el error de espacio', async () => {
    // Cubre: 10.8
    const repositorio = crearRepositorioEnMemoria();
    repositorio.simularEspacioInsuficiente();

    const resultado = repositorio.guardarEntrenamiento(entrenamientoConArchivo);

    await expect(resultado).rejects.toMatchObject({
      nombre: 'ErrorEspacioInsuficiente',
    });
  });

  it('Dado un entrenamiento con fuente de video archivo y su video conservado Cuando se elimina el entrenamiento Entonces el video asociado también se elimina', async () => {
    // Cubre: 10.8
    const almacenVideos = crearAlmacenVideosEnMemoria({
      videosIniciales: [
        {
          idEntrenamiento: 'ent-1',
          blob: null,
          tipo: 'video/mp4',
          tamanioBytes: 10,
          nombre: 'a.mp4',
        },
      ],
    });
    const repositorio = crearRepositorioEnMemoria({
      entrenamientos: [entrenamientoConArchivo],
      almacenVideos,
    });

    await repositorio.eliminarEntrenamiento('ent-1');

    expect(repositorio.entrenamientosAlmacenados()).toEqual([]);
    expect(almacenVideos.tieneVideo('ent-1')).toBe(false);
  });

  it('Dado un repositorio con un entrenamiento Cuando se guarda el mismo entrenamiento otra vez Entonces la cantidad almacenada sigue siendo uno', async () => {
    // Cubre: 10.8
    const repositorio = crearRepositorioEnMemoria({
      entrenamientos: [entrenamientoConArchivo],
    });

    await repositorio.guardarEntrenamiento(entrenamientoConArchivo);

    expect(repositorio.entrenamientosAlmacenados()).toHaveLength(1);
  });
});

describe('almacenVideosEnMemoria', () => {
  it('Dado un almacén vacío Cuando se pide un video inexistente Entonces se rechaza con el error de video ausente', async () => {
    // Cubre: 10.8
    const almacen = crearAlmacenVideosEnMemoria();

    const resultado = almacen.obtenerVideo('ent-1');

    await expect(resultado).rejects.toMatchObject({
      nombre: 'ErrorVideoAusente',
    });
  });

  it('Dado un archivo de tipo admitido y tamaño en el límite exacto Cuando se guarda el video Entonces queda conservado bajo el identificador del entrenamiento', async () => {
    // Cubre: 10.8
    const almacen = crearAlmacenVideosEnMemoria();

    await almacen.guardarVideo('ent-1', {
      nombre: 'a.mp4',
      tipo: 'video/mp4',
      tamanioBytes: LIMITE_VIDEO_BYTES,
    });

    expect(almacen.tieneVideo('ent-1')).toBe(true);
  });

  it('Dado un almacén con espacio insuficiente simulado Cuando se guarda un video Entonces se rechaza y no queda ningún registro', async () => {
    // Cubre: 10.8
    const almacen = crearAlmacenVideosEnMemoria();
    almacen.simularEspacioInsuficiente();

    const resultado = almacen.guardarVideo('ent-1', {
      nombre: 'a.mp4',
      tipo: 'video/mp4',
      tamanioBytes: 10,
    });

    await expect(resultado).rejects.toMatchObject({
      nombre: 'ErrorEspacioInsuficiente',
    });
    expect(almacen.videosAlmacenados()).toEqual([]);
  });

  it('Dado un almacén sin ningún video conservado Cuando se elimina un video inexistente Entonces el almacén queda vacío sin lanzar error', async () => {
    // Cubre: 10.8
    const almacen = crearAlmacenVideosEnMemoria();

    await almacen.eliminarVideo('ent-1');

    expect(almacen.videosAlmacenados()).toEqual([]);
  });
});

describe('relojFalso', () => {
  it('Dada una tarea programada a 5 segundos Cuando el reloj avanza 4999 milisegundos Entonces la tarea sigue pendiente y no se ejecutó', () => {
    // Cubre: 10.8
    const reloj = crearRelojFalso();
    let ejecuciones = 0;
    reloj.programar(() => {
      ejecuciones += 1;
    }, 5000);

    reloj.avanzar(4999);

    expect(ejecuciones).toBe(0);
    expect(reloj.tareasPendientes()).toBe(1);
  });

  it('Dado un intervalo de un segundo Cuando el reloj avanza tres segundos Entonces la tarea se ejecutó exactamente tres veces', () => {
    // Cubre: 10.8
    const reloj = crearRelojFalso();
    let ejecuciones = 0;
    reloj.programarIntervalo(() => {
      ejecuciones += 1;
    }, 1000);

    reloj.avanzarSegundos(3);

    expect(ejecuciones).toBe(3);
  });

  it('Dada una tarea programada y luego cancelada Cuando el reloj avanza más allá de su vencimiento Entonces la tarea no se ejecuta', () => {
    // Cubre: 10.8
    const reloj = crearRelojFalso({ ahoraInicial: 1000 });
    let ejecuciones = 0;
    const id = reloj.programar(() => {
      ejecuciones += 1;
    }, 100);
    reloj.cancelar(id);

    reloj.avanzar(500);

    expect(ejecuciones).toBe(0);
    expect(reloj.ahora()).toBe(1500);
  });
});
