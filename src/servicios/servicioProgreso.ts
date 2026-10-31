/**
 * ServicioProgreso: avance e historial de cada cuenta.
 *
 * Es la única puerta de la aplicación a los datos propios de un Usuario: el
 * avance en curso de cada Entrenamiento y el historial de sesiones terminadas.
 *
 * Decisiones de diseño relevantes:
 *
 * - **Aislamiento por cuenta.** Todo método recibe el correo de la cuenta y
 *   opera exclusivamente sobre su partición. El correo es la clave porque el
 *   ServicioAutenticacion ya garantiza que no haya dos cuentas con el mismo
 *   (4.6), y porque la Sesion lo lleva, de modo que la vista no necesita
 *   consultar la Cuenta para saber de quién es el progreso. La contrapartida es
 *   que el correo de una cuenta no puede cambiarse sin migrar su progreso: por
 *   eso la gestión de usuarios del Panel_Admin no permite editarlo.
 * - **Un solo sobre.** Todo el progreso vive bajo una única clave, con la forma
 *   `{version, porCorreo}`. Una clave por cuenta dispersaría el estado y haría
 *   imposible saber qué limpiar al eliminar una cuenta.
 * - **Avance derivable, nunca porcentajes.** Se guardan los identificadores de
 *   los Ejercicios completados, no el porcentaje: si el Administrador edita los
 *   Ejercicios de un Entrenamiento, el avance se recalcula contra los vigentes
 *   en lugar de quedar en un número que ya no significa nada.
 * - **Avance vacío equivale a ausencia.** Desmarcar el último Ejercicio borra la
 *   entrada en lugar de guardar una lista vacía.
 * - **Tope de historial.** Se conservan las `TOPE_HISTORIAL` sesiones más
 *   recientes, porque el almacenamiento del navegador tiene cuota y una cuenta
 *   activa lo haría crecer sin límite.
 * - **Degradación a memoria.** Si el almacenamiento no está disponible o rechaza
 *   la escritura, el estado sigue vivo en memoria durante la visita y la
 *   operación no se interrumpe (8.8). Perder el progreso de una sesión es
 *   preferible a dejar el Reproductor inutilizable.
 * - **Copias, nunca referencias.** Ningún método devuelve una referencia al
 *   estado interno.
 */

import { ErrorAlmacenamiento } from '../dominio/errores';
import {
  calcularEstadisticas,
  ordenarPorFechaDescendente,
  type EstadisticasHistorial,
} from '../dominio/historial';
import {
  crearIdentificador,
  crearProgresoCuenta,
  crearProgresoEntrenamientoGuardado,
  crearSesionCompletada,
  type Borrador,
  type ProgresoCuenta,
  type ProgresoEntrenamientoGuardado,
  type SesionCompletada,
} from '../dominio/modelos';
import {
  CLAVES_ALMACENAMIENTO,
  type AlmacenamientoLocal,
} from '../infra/almacenamientoLocal';
import type { Reloj } from '../infra/reloj';

/** Versión del sobre con el que se serializa el progreso. */
const VERSION_PROGRESO = 1;

/** Sesiones completadas que se conservan por cuenta, de la más reciente hacia atrás. */
export const TOPE_HISTORIAL = 200;

/** Progreso de cada cuenta, indexado por correo. */
export type ProgresoPorCorreo = Record<string, ProgresoCuenta>;

/** Progreso simulado con el que sembrar el primer arranque. */
export type DatosInicialesProgreso = {
  porCorreo?: ProgresoPorCorreo;
};

export type ServicioProgreso = {
  /** Avance guardado de un Entrenamiento para esa cuenta, o nulo si no hay. */
  obtenerAvance: (
    correo: string,
    idEntrenamiento: string,
  ) => Promise<ProgresoEntrenamientoGuardado | null>;
  /** Conserva los Ejercicios completados. Una lista vacía olvida el avance. */
  guardarAvance: (
    correo: string,
    idEntrenamiento: string,
    completados: readonly string[],
  ) => Promise<ProgresoEntrenamientoGuardado>;
  /** Historial de la cuenta, de la sesión más reciente a la más antigua. */
  obtenerHistorial: (correo: string) => Promise<SesionCompletada[]>;
  /** Agrega una sesión terminada al historial de la cuenta. */
  registrarSesionCompletada: (
    correo: string,
    datos: Borrador<SesionCompletada>,
  ) => Promise<SesionCompletada>;
  /** Acumulado de las sesiones completadas de la cuenta. */
  obtenerEstadisticas: (correo: string) => Promise<EstadisticasHistorial>;
  /** Descarta todo el progreso de una cuenta. Idempotente. */
  olvidarCuenta: (correo: string) => Promise<void>;
};

export type OpcionesServicioProgreso = {
  almacenamiento: AlmacenamientoLocal;
  reloj: Reloj;
  datosIniciales?: DatosInicialesProgreso;
};

// --- Serialización -----------------------------------------------------------

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

/** Deserializa sin propagar: todo contenido inválido equivale a ausencia. */
function interpretar(contenido: string | null): unknown {
  if (contenido === null) return null;
  try {
    return JSON.parse(contenido) as unknown;
  } catch {
    return null;
  }
}

/** Acota un valor deserializado a un avance guardado, o lo descarta. */
function deserializarAvance(
  valor: unknown,
): ProgresoEntrenamientoGuardado | null {
  if (!esRegistro(valor)) return null;
  const { idEntrenamiento, completados, actualizadoEn } = valor;
  if (typeof idEntrenamiento !== 'string' || !Array.isArray(completados)) {
    return null;
  }
  return crearProgresoEntrenamientoGuardado({
    idEntrenamiento,
    completados: completados.filter(
      (id): id is string => typeof id === 'string',
    ),
    actualizadoEn:
      typeof actualizadoEn === 'string' ? actualizadoEn : undefined,
  });
}

/** Acota un valor deserializado a una sesión completada, o lo descarta. */
function deserializarSesion(valor: unknown): SesionCompletada | null {
  if (!esRegistro(valor)) return null;
  const {
    id,
    idEntrenamiento,
    tituloEntrenamiento,
    completadoEn,
    ejerciciosCompletados,
    ejerciciosTotales,
  } = valor;
  if (typeof id !== 'string' || typeof idEntrenamiento !== 'string') {
    return null;
  }
  return crearSesionCompletada({
    id,
    idEntrenamiento,
    tituloEntrenamiento:
      typeof tituloEntrenamiento === 'string' ? tituloEntrenamiento : '',
    completadoEn: typeof completadoEn === 'string' ? completadoEn : undefined,
    ejerciciosCompletados:
      typeof ejerciciosCompletados === 'number' ? ejerciciosCompletados : 0,
    ejerciciosTotales:
      typeof ejerciciosTotales === 'number' ? ejerciciosTotales : 0,
  });
}

/** Acota el progreso de una cuenta, descartando lo que no tenga la forma esperada. */
function deserializarProgresoCuenta(valor: unknown): ProgresoCuenta | null {
  if (!esRegistro(valor)) return null;

  const crudoPorEntrenamiento = esRegistro(valor.porEntrenamiento)
    ? valor.porEntrenamiento
    : {};
  const porEntrenamiento: Record<string, ProgresoEntrenamientoGuardado> = {};
  for (const [id, crudo] of Object.entries(crudoPorEntrenamiento)) {
    const avance = deserializarAvance(crudo);
    // Un avance cuya clave no coincide con su Entrenamiento se descarta: no hay
    // forma de saber cuál de los dos identificadores es el correcto.
    if (avance !== null && avance.idEntrenamiento === id) {
      porEntrenamiento[id] = avance;
    }
  }

  const crudoHistorial = Array.isArray(valor.historial) ? valor.historial : [];
  const historial = crudoHistorial
    .map(deserializarSesion)
    .filter((sesion): sesion is SesionCompletada => sesion !== null);

  return { porEntrenamiento, historial };
}

// --- Copias ------------------------------------------------------------------

function copiarAvance(
  avance: ProgresoEntrenamientoGuardado,
): ProgresoEntrenamientoGuardado {
  return { ...avance, completados: [...avance.completados] };
}

function copiarProgresoCuenta(progreso: ProgresoCuenta): ProgresoCuenta {
  return {
    porEntrenamiento: Object.fromEntries(
      Object.entries(progreso.porEntrenamiento).map(([id, avance]) => [
        id,
        copiarAvance(avance),
      ]),
    ),
    historial: progreso.historial.map((sesion) => ({ ...sesion })),
  };
}

function copiarPorCorreo(porCorreo: ProgresoPorCorreo): ProgresoPorCorreo {
  return Object.fromEntries(
    Object.entries(porCorreo).map(([correo, progreso]) => [
      correo,
      copiarProgresoCuenta(progreso),
    ]),
  );
}

// --- Fábrica -----------------------------------------------------------------

export function crearServicioProgreso({
  almacenamiento,
  reloj,
  datosIniciales = {},
}: OpcionesServicioProgreso): ServicioProgreso {
  const semilla = datosIniciales.porCorreo ?? {};

  /** Lectura tolerante: un almacenamiento caído equivale a no tener progreso. */
  const leer = (): string | null => {
    try {
      return almacenamiento.leer(CLAVES_ALMACENAMIENTO.progreso);
    } catch (fallo) {
      if (fallo instanceof ErrorAlmacenamiento) return null;
      throw fallo;
    }
  };

  /**
   * Escritura con el mejor esfuerzo. El progreso es un dato valioso pero no
   * crítico: perderlo es preferible a interrumpir el entrenamiento en curso
   * (8.8).
   */
  const persistir = (): void => {
    try {
      almacenamiento.escribir(
        CLAVES_ALMACENAMIENTO.progreso,
        JSON.stringify({ version: VERSION_PROGRESO, porCorreo: memoria }),
      );
    } catch (fallo) {
      if (!(fallo instanceof ErrorAlmacenamiento)) throw fallo;
    }
  };

  /**
   * Progreso almacenado. La presencia del sobre distingue el primer arranque
   * —donde corresponde sembrar— de un estado legítimo sin progreso, igual que
   * en el ServicioAutenticacion.
   */
  const cargar = (): { porCorreo: ProgresoPorCorreo; sembrado: boolean } => {
    const sobre = interpretar(leer());
    const crudoPorCorreo = esRegistro(sobre) ? sobre.porCorreo : null;

    if (!esRegistro(crudoPorCorreo)) {
      return {
        porCorreo: copiarPorCorreo(semilla),
        sembrado: Object.keys(semilla).length > 0,
      };
    }

    const porCorreo: ProgresoPorCorreo = {};
    for (const [correo, crudo] of Object.entries(crudoPorCorreo)) {
      const progreso = deserializarProgresoCuenta(crudo);
      if (progreso !== null) porCorreo[correo] = progreso;
    }
    return { porCorreo, sembrado: false };
  };

  const cargaInicial = cargar();
  let memoria: ProgresoPorCorreo = cargaInicial.porCorreo;

  if (cargaInicial.sembrado) persistir();

  /** Partición de la cuenta, creándola vacía si no existía. */
  const particion = (correo: string): ProgresoCuenta => {
    const existente = memoria[correo];
    if (existente !== undefined) return existente;
    const nueva = crearProgresoCuenta();
    memoria[correo] = nueva;
    return nueva;
  };

  /** Partición de la cuenta sin crearla, para las consultas. */
  const particionSiExiste = (correo: string): ProgresoCuenta | null =>
    memoria[correo] ?? null;

  return {
    async obtenerAvance(correo, idEntrenamiento) {
      const avance = particionSiExiste(correo)?.porEntrenamiento[
        idEntrenamiento
      ];
      return avance === undefined ? null : copiarAvance(avance);
    },

    async guardarAvance(correo, idEntrenamiento, completados) {
      const avance = crearProgresoEntrenamientoGuardado({
        idEntrenamiento,
        completados: [...completados],
        actualizadoEn: new Date(reloj.ahora()).toISOString(),
      });

      const propia = particion(correo);
      if (avance.completados.length === 0) {
        // Sin Ejercicios completados no hay avance que recordar.
        delete propia.porEntrenamiento[idEntrenamiento];
      } else {
        propia.porEntrenamiento[idEntrenamiento] = avance;
      }
      persistir();

      return copiarAvance(avance);
    },

    async obtenerHistorial(correo) {
      const propia = particionSiExiste(correo);
      if (propia === null) return [];
      return ordenarPorFechaDescendente(propia.historial).map((sesion) => ({
        ...sesion,
      }));
    },

    async registrarSesionCompletada(correo, datos) {
      const sesion = crearSesionCompletada({
        ...datos,
        id: datos.id ?? crearIdentificador(),
        completadoEn:
          datos.completadoEn ?? new Date(reloj.ahora()).toISOString(),
      });

      const propia = particion(correo);
      // Se conservan las más recientes: el orden descendente deja al frente lo
      // que hay que mantener y el tope recorta la cola.
      propia.historial = ordenarPorFechaDescendente([
        sesion,
        ...propia.historial,
      ]).slice(0, TOPE_HISTORIAL);
      persistir();

      return { ...sesion };
    },

    async obtenerEstadisticas(correo) {
      return calcularEstadisticas(particionSiExiste(correo)?.historial ?? []);
    },

    async olvidarCuenta(correo) {
      if (memoria[correo] === undefined) return;
      delete memoria[correo];
      persistir();
    },
  };
}
