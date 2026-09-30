/**
 * Repositorio_Datos: única puerta de la aplicación a los Entrenamientos, los
 * planes y el contenido de la Landing_Page.
 *
 * La fábrica recibe sus tres colaboradores por parámetro —el almacenamiento de
 * cadenas, el almacén de Archivos_Video y los datos simulados iniciales— de modo
 * que las pruebas puedan sustituirlos por dobles y que la semilla de datos no
 * quede acoplada al servicio.
 *
 * Decisiones de diseño relevantes:
 *
 * - **Validación antes de escribir.** Toda escritura pasa por
 *   `validarEntrenamiento`; si falla, el error nombra el campo inválido y el
 *   estado almacenado queda idéntico al previo (8.7, 8.14).
 * - **Idempotencia por id.** Guardar dos veces el mismo Entrenamiento reemplaza
 *   en lugar de agregar, así que la cantidad almacenada no crece (8.6).
 * - **Tope de lectura.** Una lectura devuelve como máximo 200 Entrenamientos
 *   (8.2).
 * - **Siembra.** Con el almacenamiento vacío o con contenido no deserializable,
 *   se devuelven los datos simulados y se intentan conservar, sin interrumpir la
 *   carga si esa conservación falla (8.3, 8.5).
 * - **Degradación a memoria.** Si el almacenamiento no está disponible o rechaza
 *   la escritura, el estado sigue vivo en memoria durante la sesión y la
 *   escritura devuelve `ErrorAlmacenamiento`, dejando intacto el contenido
 *   previo del almacenamiento (8.8).
 * - **Copias, nunca referencias.** Ningún método devuelve una referencia al
 *   estado interno, de modo que quien consume no pueda mutarlo por accidente.
 *
 * Cubre: 8.1, 8.2, 8.3, 8.5, 8.6, 8.7, 8.8, 8.9, 8.14
 */

import { ErrorAlmacenamiento } from '../dominio/errores';
import {
  crearEjercicio,
  crearEntrenamiento,
  type ContenidoLanding,
  type Ejercicio,
  type Entrenamiento,
  type EntrenamientoDudoso,
  type FuenteVideo,
  type Nivel,
  type Plan,
  type VideoArchivo,
} from '../dominio/modelos';
import {
  deserializarEntrenamientos,
  serializarEntrenamientos,
} from '../dominio/serializacion';
import { validarEntrenamiento } from '../dominio/validaciones';
import {
  CLAVES_ALMACENAMIENTO,
  type AlmacenamientoLocal,
} from '../infra/almacenamientoLocal';

/** Tope de Entrenamientos que devuelve una lectura (criterio 8.2). */
export const TOPE_ENTRENAMIENTOS = 200;

/**
 * Porción del AlmacenVideos que el repositorio necesita: sólo el borrado en
 * cascada al eliminar un Entrenamiento con Fuente_Video `archivo` (8.9).
 */
export type AlmacenVideosDelRepositorio = {
  eliminarVideo: (idEntrenamiento: string) => Promise<void>;
};

/** Datos simulados con los que se siembra la primera carga. */
export type DatosIniciales = {
  entrenamientos?: readonly Entrenamiento[];
  planes?: readonly Plan[];
  contenidoLanding?: ContenidoLanding;
};

export type OpcionesRepositorioDatos = {
  almacenamiento: AlmacenamientoLocal;
  almacenVideos?: AlmacenVideosDelRepositorio | null;
  datosIniciales?: DatosIniciales;
};

export type RepositorioDatos = {
  obtenerEntrenamientos: () => Promise<Entrenamiento[]>;
  obtenerEntrenamiento: (id: string) => Promise<Entrenamiento | null>;
  guardarEntrenamiento: (
    entrenamiento: EntrenamientoDudoso,
  ) => Promise<Entrenamiento>;
  eliminarEntrenamiento: (id: string) => Promise<void>;
  obtenerPlanes: () => Promise<Plan[]>;
  obtenerContenidoLanding: () => Promise<ContenidoLanding>;
};

const CONTENIDO_LANDING_VACIO: ContenidoLanding = {
  beneficios: [],
  testimonios: [],
  preguntasFrecuentes: [],
  contacto: { correo: '', telefono: '', direccion: '', redes: [] },
};

// --- Copias ------------------------------------------------------------------

function copiarEjercicio(ejercicio: Ejercicio): Ejercicio {
  return { ...ejercicio };
}

function copiarVideoArchivo(
  videoArchivo: VideoArchivo | null,
): VideoArchivo | null {
  return videoArchivo === null ? null : { ...videoArchivo };
}

function copiarEntrenamiento(entrenamiento: Entrenamiento): Entrenamiento {
  return {
    ...entrenamiento,
    videoArchivo: copiarVideoArchivo(entrenamiento.videoArchivo),
    ejercicios: entrenamiento.ejercicios.map(copiarEjercicio),
  };
}

function copiarEntrenamientos(
  entrenamientos: readonly Entrenamiento[],
): Entrenamiento[] {
  return entrenamientos.map(copiarEntrenamiento);
}

function copiarPlan(plan: Plan): Plan {
  return { ...plan, prestaciones: [...plan.prestaciones] };
}

function copiarContenidoLanding(contenido: ContenidoLanding): ContenidoLanding {
  return {
    beneficios: contenido.beneficios.map((beneficio) => ({ ...beneficio })),
    testimonios: contenido.testimonios.map((testimonio) => ({ ...testimonio })),
    preguntasFrecuentes: contenido.preguntasFrecuentes.map((par) => ({
      ...par,
    })),
    contacto: {
      ...contenido.contacto,
      redes: contenido.contacto.redes.map((red) => ({ ...red })),
    },
  };
}

// --- Normalización -----------------------------------------------------------

/**
 * Reconstruye el Entrenamiento a partir de un registro ya validado, de modo que
 * los campos ajenos al modelo no lleguen al estado almacenado. Las aserciones de
 * tipo son seguras porque `validarEntrenamiento` ya comprobó cada campo en
 * tiempo de ejecución.
 */
function normalizarValidado(valor: EntrenamientoDudoso): Entrenamiento {
  const crudos = valor.ejercicios as readonly EntrenamientoDudoso[];
  const ejercicios = crudos.map((crudo) =>
    crearEjercicio({
      id: typeof crudo.id === 'string' ? crudo.id : undefined,
      nombre: crudo.nombre as string,
      series: crudo.series as number,
      repeticiones: crudo.repeticiones as number,
      descansoSegundos: crudo.descansoSegundos as number,
    }),
  );

  const { descripcion, enlaceVideo, videoArchivo, estado } = valor;

  return crearEntrenamiento({
    id: typeof valor.id === 'string' && valor.id.trim() !== '' ? valor.id : undefined,
    titulo: valor.titulo as string,
    descripcion: typeof descripcion === 'string' ? descripcion : '',
    categoria: valor.categoria as string,
    nivel: valor.nivel as Nivel,
    duracionMinutos: valor.duracionMinutos as number,
    estado: estado === 'borrador' ? 'borrador' : 'publicado',
    fuenteVideo: valor.fuenteVideo as FuenteVideo,
    enlaceVideo: typeof enlaceVideo === 'string' ? enlaceVideo : '',
    videoArchivo: esVideoArchivo(videoArchivo) ? videoArchivo : null,
    ejercicios,
  });
}

function esVideoArchivo(valor: unknown): valor is VideoArchivo {
  if (typeof valor !== 'object' || valor === null) return false;
  const registro = valor as Record<string, unknown>;
  return (
    typeof registro.nombre === 'string' &&
    typeof registro.tipo === 'string' &&
    typeof registro.tamanioBytes === 'number'
  );
}

// --- Fábrica -----------------------------------------------------------------

export function crearRepositorioDatos({
  almacenamiento,
  almacenVideos = null,
  datosIniciales = {},
}: OpcionesRepositorioDatos): RepositorioDatos {
  const semilla = datosIniciales.entrenamientos ?? [];
  const planes = datosIniciales.planes ?? [];
  const contenidoLanding =
    datosIniciales.contenidoLanding ?? CONTENIDO_LANDING_VACIO;

  /** Estado vivo de la sesión; `null` mientras no se hizo la primera lectura. */
  let memoria: Entrenamiento[] | null = null;

  /** Intenta conservar el estado y deja el fallo a cargo de quien llama. */
  const persistir = (entrenamientos: readonly Entrenamiento[]): void => {
    try {
      almacenamiento.escribir(
        CLAVES_ALMACENAMIENTO.entrenamientos,
        serializarEntrenamientos(entrenamientos),
      );
    } catch (fallo) {
      // El rechazo del medio deja el contenido previo intacto: sólo se traduce
      // a un error de persistencia, mientras el estado sigue vivo en memoria.
      throw fallo instanceof ErrorAlmacenamiento ? fallo : new ErrorAlmacenamiento();
    }
  };

  /** Conserva el estado sin propagar fallos, para no interrumpir la carga. */
  const persistirTolerante = (entrenamientos: readonly Entrenamiento[]): void => {
    try {
      persistir(entrenamientos);
    } catch {
      // 8.5 y 8.8: la Plataforma sigue funcionando sobre el estado en memoria.
    }
  };

  /**
   * Devuelve el estado vivo, haciendo la primera lectura si hace falta. La
   * referencia devuelta es interna: los métodos públicos copian antes de
   * entregar.
   */
  const cargar = (): Entrenamiento[] => {
    if (memoria !== null) return memoria;

    let contenido: string | null = null;
    let disponible = true;
    try {
      contenido = almacenamiento.leer(CLAVES_ALMACENAMIENTO.entrenamientos);
    } catch {
      disponible = false;
    }

    if (!disponible) {
      // Sin medio, la sesión arranca con los datos simulados en memoria y el
      // almacenamiento queda intacto.
      memoria = copiarEntrenamientos(semilla);
      return memoria;
    }

    const leidos = deserializarEntrenamientos(contenido);
    // `null` señala contenido no utilizable; la lista vacía, ausencia de datos.
    if (leidos === null || leidos.length === 0) {
      memoria = copiarEntrenamientos(semilla);
      persistirTolerante(memoria);
      return memoria;
    }

    memoria = leidos;
    return memoria;
  };

  return {
    async obtenerEntrenamientos() {
      return copiarEntrenamientos(cargar().slice(0, TOPE_ENTRENAMIENTOS));
    },

    async obtenerEntrenamiento(id) {
      const encontrado = cargar().find(
        (entrenamiento) => entrenamiento.id === id,
      );
      return encontrado === undefined ? null : copiarEntrenamiento(encontrado);
    },

    async guardarEntrenamiento(entrenamiento) {
      const invalido = validarEntrenamiento(entrenamiento);
      if (invalido !== null) throw invalido;

      const lista = cargar();
      const normalizado = normalizarValidado(entrenamiento);
      const indice = lista.findIndex(
        (existente) => existente.id === normalizado.id,
      );
      if (indice === -1) lista.push(normalizado);
      else lista[indice] = normalizado;

      persistir(lista);
      return copiarEntrenamiento(normalizado);
    },

    async eliminarEntrenamiento(id) {
      const lista = cargar();
      const indice = lista.findIndex((entrenamiento) => entrenamiento.id === id);
      // Borrado idempotente: un identificador ausente no altera nada.
      if (indice === -1) return;

      const [objetivo] = lista.splice(indice, 1);

      let falloPersistencia: unknown = null;
      try {
        persistir(lista);
      } catch (fallo) {
        falloPersistencia = fallo;
      }

      // La cascada ocurre igual si la persistencia falló: el Entrenamiento ya
      // no existe para la sesión y su Archivo_Video no debe quedar huérfano.
      if (objetivo.fuenteVideo === 'archivo' && almacenVideos !== null) {
        await almacenVideos.eliminarVideo(objetivo.id);
      }

      if (falloPersistencia !== null) throw falloPersistencia;
    },

    async obtenerPlanes() {
      return planes.map(copiarPlan);
    },

    async obtenerContenidoLanding() {
      return copiarContenidoLanding(contenidoLanding);
    },
  };
}
