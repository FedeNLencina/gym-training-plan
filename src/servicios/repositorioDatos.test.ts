import { describe, expect, it } from 'vitest';

import { ErrorAlmacenamiento, ErrorValidacion } from '../dominio/errores';
import {
  crearEjercicio,
  crearEntrenamiento,
  crearPlan,
  type ContenidoLanding,
  type Entrenamiento,
  type EntrenamientoDudoso,
} from '../dominio/modelos';
import {
  deserializarEntrenamientos,
  serializarEntrenamientos,
} from '../dominio/serializacion';
import {
  CLAVES_ALMACENAMIENTO,
  crearAlmacenamientoLocal,
  type MedioClaveValor,
} from '../infra/almacenamientoLocal';
import { crearEntrenamientosSimulados } from '../datos/entrenamientosSimulados';
import { crearAlmacenVideosEnMemoria } from '../tests/dobles/almacenVideosEnMemoria';
import {
  TOPE_ENTRENAMIENTOS,
  crearRepositorioDatos,
  type DatosIniciales,
} from './repositorioDatos';

/**
 * Doble de `localStorage`: contenido en memoria y fallo de escritura inyectable,
 * para ejercitar la degradación del criterio 8.8 sin depender del navegador.
 */
type MedioFalso = MedioClaveValor & {
  contenido: () => Record<string, string>;
};

type OpcionesMedioFalso = {
  inicial?: Record<string, string>;
  errorLectura?: unknown;
  errorEscritura?: unknown;
};

function crearMedioFalso({
  inicial = {},
  errorLectura,
  errorEscritura,
}: OpcionesMedioFalso = {}): MedioFalso {
  const datos = new Map<string, string>(Object.entries(inicial));
  return {
    getItem(clave) {
      if (errorLectura !== undefined) throw errorLectura;
      const valor = datos.get(clave);
      return valor === undefined ? null : valor;
    },
    setItem(clave, valor) {
      if (errorEscritura !== undefined) throw errorEscritura;
      datos.set(clave, valor);
    },
    removeItem(clave) {
      datos.delete(clave);
    },
    contenido() {
      return Object.fromEntries(datos);
    },
  };
}

/** Entrenamiento válido según los límites del Repositorio_Datos. */
function entrenamientoValido(
  datos: Partial<Entrenamiento> = {},
): Entrenamiento {
  return crearEntrenamiento({
    titulo: 'Fuerza total',
    descripcion: 'Rutina de cuerpo completo',
    categoria: 'Fuerza',
    nivel: 'Intermedio',
    duracionMinutos: 45,
    estado: 'publicado',
    fuenteVideo: 'enlace',
    enlaceVideo: 'https://www.youtube.com/watch?v=abc123',
    ejercicios: [
      crearEjercicio({
        id: 'ej-1',
        nombre: 'Sentadillas',
        series: 4,
        repeticiones: 10,
        descansoSegundos: 60,
      }),
    ],
    ...datos,
  });
}

/** Semilla de datos simulados: la cantidad que pide el criterio 8.3. */
function semillaEntrenamientos(cantidad = 8): Entrenamiento[] {
  return Array.from({ length: cantidad }, (_, indice) =>
    entrenamientoValido({
      id: `semilla-${indice}`,
      titulo: `Entrenamiento simulado ${indice + 1}`,
    }),
  );
}

const contenidoLandingDeEjemplo: ContenidoLanding = {
  beneficios: [{ titulo: 'Planificación', descripcion: 'Rutinas guiadas' }],
  testimonios: [{ nombre: 'Ana', texto: 'Cambió mi rutina' }],
  preguntasFrecuentes: [
    { pregunta: '¿Necesito equipo?', respuesta: 'No es imprescindible' },
  ],
  contacto: {
    correo: 'hola@atlas.com',
    telefono: '+54 11 0000 0000',
    direccion: 'Av. Siempre Viva 742',
    redes: [{ nombre: 'Instagram', url: 'https://instagram.com/atlas' }],
  },
};

type OpcionesEscenario = {
  medio?: MedioFalso;
  datosIniciales?: DatosIniciales;
};

function crearEscenario({
  medio = crearMedioFalso(),
  datosIniciales = { entrenamientos: semillaEntrenamientos() },
}: OpcionesEscenario = {}) {
  const almacenVideos = crearAlmacenVideosEnMemoria();
  const repositorio = crearRepositorioDatos({
    almacenamiento: crearAlmacenamientoLocal({ medio }),
    almacenVideos,
    datosIniciales,
  });
  const entrenamientosGuardados = (): Entrenamiento[] =>
    deserializarEntrenamientos(
      medio.contenido()[CLAVES_ALMACENAMIENTO.entrenamientos] ?? null,
    ) ?? [];

  return { medio, almacenVideos, repositorio, entrenamientosGuardados };
}

/** Contenido del almacenamiento con una lista concreta ya conservada. */
function medioConEntrenamientos(entrenamientos: Entrenamiento[]): MedioFalso {
  return crearMedioFalso({
    inicial: {
      [CLAVES_ALMACENAMIENTO.entrenamientos]:
        serializarEntrenamientos(entrenamientos),
    },
  });
}

describe('repositorioDatos', () => {
  describe('obtenerEntrenamientos', () => {
    it('Dado un almacenamiento con tres Entrenamientos conservados Cuando se piden los Entrenamientos Entonces devuelve los tres con su identificador y título', async () => {
      // Cubre: 8.2
      const conservados = [
        entrenamientoValido({ id: 'a', titulo: 'Uno' }),
        entrenamientoValido({ id: 'b', titulo: 'Dos' }),
        entrenamientoValido({ id: 'c', titulo: 'Tres' }),
      ];
      const { repositorio } = crearEscenario({
        medio: medioConEntrenamientos(conservados),
      });

      const leidos = await repositorio.obtenerEntrenamientos();

      expect(leidos.map((entrenamiento) => entrenamiento.id)).toEqual([
        'a',
        'b',
        'c',
      ]);
      expect(leidos.map((entrenamiento) => entrenamiento.titulo)).toEqual([
        'Uno',
        'Dos',
        'Tres',
      ]);
    });

    it('Dado un almacenamiento con 201 Entrenamientos conservados Cuando se piden los Entrenamientos Entonces devuelve exactamente 200', async () => {
      // Cubre: 8.2
      const conservados = Array.from({ length: TOPE_ENTRENAMIENTOS + 1 }, (_, i) =>
        entrenamientoValido({ id: `ent-${i}` }),
      );
      const { repositorio } = crearEscenario({
        medio: medioConEntrenamientos(conservados),
      });

      const leidos = await repositorio.obtenerEntrenamientos();

      expect(leidos).toHaveLength(TOPE_ENTRENAMIENTOS);
    });

    it('Dado un almacenamiento vacío Cuando se piden los Entrenamientos Entonces devuelve los datos simulados y los conserva', async () => {
      // Cubre: 8.3
      const { repositorio, entrenamientosGuardados } = crearEscenario();

      const leidos = await repositorio.obtenerEntrenamientos();

      expect(leidos).toHaveLength(8);
      expect(entrenamientosGuardados().map((e) => e.id)).toEqual(
        leidos.map((e) => e.id),
      );
    });

    it('Dado un almacenamiento con contenido no deserializable Cuando se piden los Entrenamientos Entonces descarta el contenido y devuelve los datos simulados', async () => {
      // Cubre: 8.5
      const medio = crearMedioFalso({
        inicial: { [CLAVES_ALMACENAMIENTO.entrenamientos]: '{ esto no es json' },
      });
      const { repositorio } = crearEscenario({ medio });

      const leidos = await repositorio.obtenerEntrenamientos();

      expect(leidos.map((entrenamiento) => entrenamiento.id)).toEqual(
        semillaEntrenamientos().map((entrenamiento) => entrenamiento.id),
      );
    });

    it('Dado un almacenamiento donde sólo un Entrenamiento cumple la estructura Cuando se piden los Entrenamientos Entonces devuelve únicamente el válido', async () => {
      // Cubre: 8.5
      const valido = entrenamientoValido({ id: 'valido' });
      const invalido: EntrenamientoDudoso = { id: 'roto', titulo: '' };
      const medio = crearMedioFalso({
        inicial: {
          [CLAVES_ALMACENAMIENTO.entrenamientos]: JSON.stringify({
            version: 1,
            entrenamientos: [valido, invalido],
          }),
        },
      });
      const { repositorio } = crearEscenario({ medio });

      const leidos = await repositorio.obtenerEntrenamientos();

      expect(leidos.map((entrenamiento) => entrenamiento.id)).toEqual([
        'valido',
      ]);
    });

    it('Dada una lectura previa de Entrenamientos Cuando se muta la lista devuelta Entonces la lectura siguiente no refleja la mutación', async () => {
      // Cubre: 8.2
      const { repositorio } = crearEscenario({
        medio: medioConEntrenamientos([entrenamientoValido({ id: 'a' })]),
      });
      const primera = await repositorio.obtenerEntrenamientos();

      primera[0].titulo = 'Título alterado por quien consume';

      const segunda = await repositorio.obtenerEntrenamientos();
      expect(segunda[0].titulo).toBe('Fuerza total');
    });
  });

  describe('obtenerEntrenamiento', () => {
    it('Dado un Entrenamiento conservado Cuando se pide por su identificador Entonces devuelve ese Entrenamiento con sus Ejercicios', async () => {
      // Cubre: 8.2
      const { repositorio } = crearEscenario({
        medio: medioConEntrenamientos([
          entrenamientoValido({ id: 'buscado', titulo: 'Movilidad' }),
        ]),
      });

      const encontrado = await repositorio.obtenerEntrenamiento('buscado');

      expect(encontrado?.titulo).toBe('Movilidad');
      expect(encontrado?.ejercicios.map((ejercicio) => ejercicio.nombre)).toEqual(
        ['Sentadillas'],
      );
    });

    it('Dado un almacenamiento sin el identificador pedido Cuando se pide ese Entrenamiento Entonces devuelve nulo', async () => {
      // Cubre: 8.2
      const { repositorio } = crearEscenario({
        medio: medioConEntrenamientos([entrenamientoValido({ id: 'otro' })]),
      });

      const encontrado = await repositorio.obtenerEntrenamiento('inexistente');

      expect(encontrado).toBeNull();
    });
  });

  describe('guardarEntrenamiento', () => {
    it('Dado un Entrenamiento válido Cuando se guarda Entonces lo devuelve conservado y una lectura posterior lo incluye', async () => {
      // Cubre: 8.1
      const { repositorio, entrenamientosGuardados } = crearEscenario({
        datosIniciales: { entrenamientos: [] },
      });
      const nuevo = entrenamientoValido({ id: 'nuevo', titulo: 'Cardio base' });

      const guardado = await repositorio.guardarEntrenamiento(nuevo);

      expect(guardado).toEqual(nuevo);
      expect(await repositorio.obtenerEntrenamientos()).toEqual([nuevo]);
      expect(entrenamientosGuardados()).toEqual([nuevo]);
    });

    it('Dado un Entrenamiento ya guardado Cuando se guarda otra vez el mismo identificador Entonces la cantidad almacenada no crece y queda la última versión', async () => {
      // Cubre: 8.6
      const { repositorio } = crearEscenario({
        datosIniciales: { entrenamientos: [] },
      });
      const original = entrenamientoValido({ id: 'unico', titulo: 'Original' });
      await repositorio.guardarEntrenamiento(original);

      await repositorio.guardarEntrenamiento({
        ...original,
        titulo: 'Corregido',
      });

      const leidos = await repositorio.obtenerEntrenamientos();
      expect(leidos).toHaveLength(1);
      expect(leidos[0].titulo).toBe('Corregido');
    });

    it('Dado un Entrenamiento sin título Cuando se guarda Entonces rechaza nombrando el campo título y deja el estado previo intacto', async () => {
      // Cubre: 8.7
      const previo = entrenamientoValido({ id: 'previo' });
      const { repositorio, entrenamientosGuardados } = crearEscenario({
        medio: medioConEntrenamientos([previo]),
      });
      const invalido: EntrenamientoDudoso = { ...previo, id: 'x', titulo: '   ' };

      const fallo = await repositorio
        .guardarEntrenamiento(invalido)
        .catch((error: unknown) => error);

      expect(fallo).toBeInstanceOf(ErrorValidacion);
      expect((fallo as ErrorValidacion).campos).toHaveProperty('titulo');
      expect(entrenamientosGuardados()).toEqual([previo]);
    });

    it('Dado un Entrenamiento sin Ejercicios Cuando se guarda Entonces rechaza nombrando el campo ejercicios', async () => {
      // Cubre: 8.7
      const { repositorio } = crearEscenario({
        datosIniciales: { entrenamientos: [] },
      });
      const invalido: EntrenamientoDudoso = {
        ...entrenamientoValido(),
        ejercicios: [],
      };

      const fallo = await repositorio
        .guardarEntrenamiento(invalido)
        .catch((error: unknown) => error);

      expect(fallo).toBeInstanceOf(ErrorValidacion);
      expect((fallo as ErrorValidacion).campos).toHaveProperty('ejercicios');
    });

    it('Dado un Entrenamiento con Fuente_Video desconocida Cuando se guarda Entonces rechaza nombrando el campo fuenteVideo y no lo agrega', async () => {
      // Cubre: 8.14
      const { repositorio } = crearEscenario({
        datosIniciales: { entrenamientos: [] },
      });
      const invalido: EntrenamientoDudoso = {
        ...entrenamientoValido({ id: 'dudoso' }),
        fuenteVideo: 'ambos',
      };

      const fallo = await repositorio
        .guardarEntrenamiento(invalido)
        .catch((error: unknown) => error);

      expect(fallo).toBeInstanceOf(ErrorValidacion);
      expect((fallo as ErrorValidacion).campos).toHaveProperty('fuenteVideo');
      expect(await repositorio.obtenerEntrenamiento('dudoso')).toBeNull();
    });

    it('Dado un almacenamiento que rechaza la escritura Cuando se guarda un Entrenamiento válido Entonces devuelve error de persistencia, lo conserva en memoria y deja intacto el contenido previo', async () => {
      // Cubre: 8.8
      const previo = entrenamientoValido({ id: 'previo' });
      const medio = crearMedioFalso({
        inicial: {
          [CLAVES_ALMACENAMIENTO.entrenamientos]:
            serializarEntrenamientos([previo]),
        },
        errorEscritura: new DOMException('quota exceeded', 'QuotaExceededError'),
      });
      const { repositorio, entrenamientosGuardados } = crearEscenario({ medio });
      const nuevo = entrenamientoValido({ id: 'nuevo', titulo: 'En memoria' });

      const fallo = await repositorio
        .guardarEntrenamiento(nuevo)
        .catch((error: unknown) => error);

      expect(fallo).toBeInstanceOf(ErrorAlmacenamiento);
      expect(entrenamientosGuardados()).toEqual([previo]);
      const enMemoria = await repositorio.obtenerEntrenamientos();
      expect(enMemoria.map((entrenamiento) => entrenamiento.id)).toEqual([
        'previo',
        'nuevo',
      ]);
    });
  });

  describe('siembra y degradación del almacenamiento', () => {
    it('Dado un almacenamiento vacío y los datos simulados de la Plataforma Cuando se hace la primera carga Entonces devuelve entre 6 y 12 Entrenamientos y los conserva', async () => {
      // Cubre: 8.3
      const simulados = crearEntrenamientosSimulados();
      const { repositorio, entrenamientosGuardados } = crearEscenario({
        datosIniciales: { entrenamientos: simulados },
      });

      const leidos = await repositorio.obtenerEntrenamientos();

      expect(leidos.length).toBeGreaterThanOrEqual(6);
      expect(leidos.length).toBeLessThanOrEqual(12);
      expect(leidos).toEqual(simulados);
      expect(entrenamientosGuardados()).toEqual(simulados);
    });

    it('Dado un almacenamiento no disponible con contenido previo Cuando se guarda un Entrenamiento válido Entonces devuelve error de persistencia, lo conserva en memoria y deja intacto el contenido previo', async () => {
      // Cubre: 8.8
      const previo = entrenamientoValido({ id: 'previo' });
      const contenidoPrevio = serializarEntrenamientos([previo]);
      const ausenciaDeApi = new Error('localStorage no está disponible');
      const medio = crearMedioFalso({
        inicial: { [CLAVES_ALMACENAMIENTO.entrenamientos]: contenidoPrevio },
        errorLectura: ausenciaDeApi,
        errorEscritura: ausenciaDeApi,
      });
      const { repositorio } = crearEscenario({ medio });
      const nuevo = entrenamientoValido({ id: 'nuevo', titulo: 'En memoria' });

      const fallo = await repositorio
        .guardarEntrenamiento(nuevo)
        .catch((error: unknown) => error);

      expect(fallo).toBeInstanceOf(ErrorAlmacenamiento);
      expect(medio.contenido()[CLAVES_ALMACENAMIENTO.entrenamientos]).toBe(
        contenidoPrevio,
      );
      const enMemoria = await repositorio.obtenerEntrenamientos();
      expect(enMemoria.map((entrenamiento) => entrenamiento.id)).toContain(
        'nuevo',
      );
    });
  });

  describe('eliminarEntrenamiento', () => {
    it('Dados dos Entrenamientos conservados Cuando se elimina uno Entonces queda sólo el otro sin cambios', async () => {
      // Cubre: 8.9
      const quedaba = entrenamientoValido({ id: 'queda', titulo: 'Se queda' });
      const { repositorio, entrenamientosGuardados } = crearEscenario({
        medio: medioConEntrenamientos([
          entrenamientoValido({ id: 'se-va' }),
          quedaba,
        ]),
      });

      await repositorio.eliminarEntrenamiento('se-va');

      expect(await repositorio.obtenerEntrenamientos()).toEqual([quedaba]);
      expect(entrenamientosGuardados()).toEqual([quedaba]);
    });

    it('Dado un Entrenamiento con Fuente_Video archivo y su video conservado Cuando se elimina el Entrenamiento Entonces también se elimina el Archivo_Video asociado', async () => {
      // Cubre: 8.9
      const conArchivo = entrenamientoValido({
        id: 'con-archivo',
        fuenteVideo: 'archivo',
        videoArchivo: {
          nombre: 'rutina.mp4',
          tipo: 'video/mp4',
          tamanioBytes: 1024,
        },
      });
      const { repositorio, almacenVideos } = crearEscenario({
        medio: medioConEntrenamientos([conArchivo]),
      });
      await almacenVideos.guardarVideo('con-archivo', {
        nombre: 'rutina.mp4',
        tipo: 'video/mp4',
        tamanioBytes: 1024,
        contenido: new Uint8Array([1, 2, 3]),
      });

      await repositorio.eliminarEntrenamiento('con-archivo');

      expect(almacenVideos.tieneVideo('con-archivo')).toBe(false);
    });

    it('Dado un Entrenamiento con Fuente_Video enlace Cuando se elimina Entonces no solicita ningún borrado al almacén de videos', async () => {
      // Cubre: 8.9
      const { repositorio, almacenVideos } = crearEscenario({
        medio: medioConEntrenamientos([entrenamientoValido({ id: 'enlazado' })]),
      });

      await repositorio.eliminarEntrenamiento('enlazado');

      expect(almacenVideos.llamadas.eliminarVideo).toEqual([]);
    });

    it('Dado un identificador inexistente Cuando se elimina Entonces conserva los Entrenamientos almacenados sin cambios', async () => {
      // Cubre: 8.9
      const conservado = entrenamientoValido({ id: 'intacto' });
      const { repositorio, entrenamientosGuardados } = crearEscenario({
        medio: medioConEntrenamientos([conservado]),
      });

      await repositorio.eliminarEntrenamiento('no-existe');

      expect(entrenamientosGuardados()).toEqual([conservado]);
    });
  });

  describe('obtenerPlanes', () => {
    it('Dados dos planes simulados Cuando se piden los planes Entonces devuelve ambos con su nombre y precio', async () => {
      // Cubre: 8.3
      const planes = [
        crearPlan({ id: 'p1', nombre: 'Base', precio: 9999 }),
        crearPlan({ id: 'p2', nombre: 'Pro', precio: 14999 }),
      ];
      const { repositorio } = crearEscenario({
        datosIniciales: { entrenamientos: [], planes },
      });

      const leidos = await repositorio.obtenerPlanes();

      expect(leidos).toEqual(planes);
    });

    it('Dada una lectura previa de planes Cuando se muta la lista devuelta Entonces la lectura siguiente no refleja la mutación', async () => {
      // Cubre: 8.3
      const { repositorio } = crearEscenario({
        datosIniciales: {
          entrenamientos: [],
          planes: [crearPlan({ id: 'p1', nombre: 'Base' })],
        },
      });
      const primera = await repositorio.obtenerPlanes();

      primera[0].nombre = 'Alterado';

      expect((await repositorio.obtenerPlanes())[0].nombre).toBe('Base');
    });
  });

  describe('obtenerContenidoLanding', () => {
    it('Dado el contenido de la Landing_Page simulado Cuando se pide el contenido Entonces devuelve beneficios, testimonios, preguntas y contacto', async () => {
      // Cubre: 8.3
      const { repositorio } = crearEscenario({
        datosIniciales: {
          entrenamientos: [],
          contenidoLanding: contenidoLandingDeEjemplo,
        },
      });

      const contenido = await repositorio.obtenerContenidoLanding();

      expect(contenido).toEqual(contenidoLandingDeEjemplo);
    });

    it('Dada una lectura previa del contenido Cuando se muta el contacto devuelto Entonces la lectura siguiente no refleja la mutación', async () => {
      // Cubre: 8.3
      const { repositorio } = crearEscenario({
        datosIniciales: {
          entrenamientos: [],
          contenidoLanding: contenidoLandingDeEjemplo,
        },
      });
      const primera = await repositorio.obtenerContenidoLanding();

      primera.contacto.correo = 'alterado@atlas.com';

      const segunda = await repositorio.obtenerContenidoLanding();
      expect(segunda.contacto.correo).toBe('hola@atlas.com');
    });
  });
});
