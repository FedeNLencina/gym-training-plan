/**
 * Doble en memoria del Repositorio_Datos (diseño: `crearRepositorioDatos`).
 *
 * Reproduce las firmas asincrónicas del repositorio real y devuelve siempre
 * copias, nunca referencias al estado interno. No valida modelos: la validación
 * es responsabilidad del dominio y se prueba por separado; este doble sólo
 * decide entre conservar o fallar, y los fallos se inyectan desde la prueba.
 *
 * Cubre: 10.8
 */

import type {
  ContenidoLanding,
  Entrenamiento,
  Plan,
} from '../tiposDominio';
import type { AlmacenVideosEnMemoria } from './almacenVideosEnMemoria';
import {
  errorAlmacenamiento,
  errorCarga,
  errorEspacioInsuficiente,
} from './erroresFalsos';

/** Tope de Entrenamientos devueltos por una lectura (diseño, criterio 8.2). */
export const TOPE_ENTRENAMIENTOS = 200;

const copiar = <T>(valor: T): T =>
  valor === null || typeof valor !== 'object'
    ? valor
    : (JSON.parse(JSON.stringify(valor)) as T);

const CONTENIDO_LANDING_POR_OMISION: ContenidoLanding = Object.freeze({
  beneficios: [],
  testimonios: [],
  preguntasFrecuentes: [],
  contacto: { correo: '', telefono: '', direccion: '', redes: [] },
});

export type OpcionesRepositorioEnMemoria = {
  /** Estado inicial de Entrenamientos. */
  entrenamientos?: Entrenamiento[];
  /** Planes devueltos por `obtenerPlanes`. */
  planes?: Plan[];
  /** Contenido de la Landing_Page. */
  contenidoLanding?: ContenidoLanding;
  /** Almacén de videos usado para el borrado en cascada (criterio 8.9). */
  almacenVideos?: AlmacenVideosEnMemoria | null;
};

export type RepositorioEnMemoria = {
  obtenerEntrenamientos: () => Promise<Entrenamiento[]>;
  obtenerEntrenamiento: (id: string) => Promise<Entrenamiento | null>;
  guardarEntrenamiento: (
    entrenamiento: Entrenamiento,
  ) => Promise<Entrenamiento>;
  eliminarEntrenamiento: (id: string) => Promise<void>;
  obtenerPlanes: () => Promise<Plan[]>;
  obtenerContenidoLanding: () => Promise<ContenidoLanding>;
  simularFalloLectura: (activo?: boolean) => void;
  simularFalloEscritura: (activo?: boolean) => void;
  simularEspacioInsuficiente: (activo?: boolean) => void;
  /** Copia del estado almacenado, para aserciones. */
  entrenamientosAlmacenados: () => Entrenamiento[];
  /** Reemplaza el estado almacenado. */
  fijarEntrenamientos: (nuevos: Entrenamiento[]) => void;
  /** Registro de llamadas recibidas, para verificar interacciones. */
  llamadas: {
    obtenerEntrenamientos: number;
    obtenerEntrenamiento: string[];
    guardarEntrenamiento: Entrenamiento[];
    eliminarEntrenamiento: string[];
    obtenerPlanes: number;
    obtenerContenidoLanding: number;
  };
};

export function crearRepositorioEnMemoria({
  entrenamientos = [],
  planes = [],
  contenidoLanding = CONTENIDO_LANDING_POR_OMISION,
  almacenVideos = null,
}: OpcionesRepositorioEnMemoria = {}): RepositorioEnMemoria {
  let almacenados: Entrenamiento[] = copiar(entrenamientos);

  const fallos = {
    lectura: false,
    escritura: false,
    espacioInsuficiente: false,
  };

  const llamadas: RepositorioEnMemoria['llamadas'] = {
    obtenerEntrenamientos: 0,
    obtenerEntrenamiento: [],
    guardarEntrenamiento: [],
    eliminarEntrenamiento: [],
    obtenerPlanes: 0,
    obtenerContenidoLanding: 0,
  };

  const verificarLectura = (): void => {
    if (fallos.lectura) throw errorCarga();
  };

  const verificarEscritura = (): void => {
    if (fallos.espacioInsuficiente) throw errorEspacioInsuficiente();
    if (fallos.escritura) throw errorAlmacenamiento();
  };

  return {
    async obtenerEntrenamientos() {
      llamadas.obtenerEntrenamientos += 1;
      verificarLectura();
      return copiar(almacenados.slice(0, TOPE_ENTRENAMIENTOS));
    },

    async obtenerEntrenamiento(id) {
      llamadas.obtenerEntrenamiento.push(id);
      verificarLectura();
      const encontrado = almacenados.find(
        (entrenamiento) => entrenamiento.id === id,
      );
      return encontrado === undefined ? null : copiar(encontrado);
    },

    /**
     * Inserta o reemplaza por id, de modo que dos escrituras del mismo
     * Entrenamiento dejan el mismo estado que una sola (criterio 8.6).
     */
    async guardarEntrenamiento(entrenamiento) {
      llamadas.guardarEntrenamiento.push(copiar(entrenamiento));
      verificarEscritura();
      const copia = copiar(entrenamiento);
      const indice = almacenados.findIndex(
        (existente) => existente.id === copia.id,
      );
      if (indice === -1) almacenados = [...almacenados, copia];
      else almacenados = almacenados.map((e, i) => (i === indice ? copia : e));
      return copiar(copia);
    },

    /**
     * Quita el Entrenamiento y, si su Fuente_Video es `archivo`, su video
     * asociado (criterio 8.9).
     */
    async eliminarEntrenamiento(id) {
      llamadas.eliminarEntrenamiento.push(id);
      verificarEscritura();
      const objetivo = almacenados.find(
        (entrenamiento) => entrenamiento.id === id,
      );
      almacenados = almacenados.filter(
        (entrenamiento) => entrenamiento.id !== id,
      );
      if (objetivo?.fuenteVideo === 'archivo' && almacenVideos !== null) {
        await almacenVideos.eliminarVideo(id);
      }
    },

    async obtenerPlanes() {
      llamadas.obtenerPlanes += 1;
      verificarLectura();
      return copiar(planes);
    },

    async obtenerContenidoLanding() {
      llamadas.obtenerContenidoLanding += 1;
      verificarLectura();
      return copiar(contenidoLanding);
    },

    // --- Controles de prueba -------------------------------------------------

    simularFalloLectura(activo = true) {
      fallos.lectura = activo;
    },
    simularFalloEscritura(activo = true) {
      fallos.escritura = activo;
    },
    simularEspacioInsuficiente(activo = true) {
      fallos.espacioInsuficiente = activo;
    },
    entrenamientosAlmacenados() {
      return copiar(almacenados);
    },
    fijarEntrenamientos(nuevos) {
      almacenados = copiar(nuevos);
    },
    llamadas,
  };
}
