/**
 * Modelos, constantes y constructores del dominio.
 *
 * Los modelos son objetos planos serializables en JSON. Las uniones cerradas se
 * derivan de las constantes con `as const`, de modo que la lista disponible en
 * tiempo de ejecución y el tipo disponible en compilación no puedan divergir.
 *
 * Los constructores normalizan un borrador parcial (lo que llega de un
 * formulario o de la semilla de datos) a un modelo completo. No validan: la
 * validación vive en `validaciones.ts` y es la que produce `ErrorValidacion`.
 *
 * Cubre: 8.7, 8.14
 */

// --- Uniones cerradas --------------------------------------------------------

export const NIVELES = Object.freeze([
  'Principiante',
  'Intermedio',
  'Avanzado',
] as const);
export type Nivel = (typeof NIVELES)[number];

export const FUENTES_VIDEO = Object.freeze(['enlace', 'archivo'] as const);
export type FuenteVideo = (typeof FUENTES_VIDEO)[number];

export const ESTADOS_ENTRENAMIENTO = Object.freeze([
  'publicado',
  'borrador',
] as const);
export type EstadoEntrenamiento = (typeof ESTADOS_ENTRENAMIENTO)[number];

export const PERIODICIDADES = Object.freeze([
  'mensual',
  'trimestral',
  'anual',
] as const);
export type Periodicidad = (typeof PERIODICIDADES)[number];

export const ROLES = Object.freeze(['usuario', 'administrador'] as const);
export type Rol = (typeof ROLES)[number];

export const CATEGORIAS = Object.freeze([
  'Fuerza',
  'Cardio',
  'Movilidad',
  'Funcional',
  'Hipertrofia',
] as const);
export type Categoria = (typeof CATEGORIAS)[number];

// --- Archivo_Video -----------------------------------------------------------

/** Tamaño máximo admitido para un Archivo_Video, en bytes. */
export const LIMITE_VIDEO_BYTES = 52428800;

export const TIPOS_VIDEO_ADMITIDOS = Object.freeze([
  'video/mp4',
  'video/webm',
] as const);
export type TipoVideoAdmitido = (typeof TIPOS_VIDEO_ADMITIDOS)[number];

/** Predicado de tipo: acota una cadena arbitraria a los tipos admitidos. */
export function esTipoVideoAdmitido(tipo: string): tipo is TipoVideoAdmitido {
  return (TIPOS_VIDEO_ADMITIDOS as readonly string[]).includes(tipo);
}

// --- Modelos -----------------------------------------------------------------

/**
 * Los modelos se declaran como alias de tipo (no interfaces) a propósito: así
 * admiten firma de índice implícita y pueden entregarse donde se espera un
 * registro genérico, algo que las pruebas necesitan para inspeccionar campos.
 */

export type Ejercicio = {
  id: string;
  nombre: string;
  series: number;
  repeticiones: number;
  descansoSegundos: number;
};

export type VideoArchivo = {
  nombre: string;
  tipo: string;
  tamanioBytes: number;
};

export type Entrenamiento = {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  nivel: Nivel;
  duracionMinutos: number;
  estado: EstadoEntrenamiento;
  fuenteVideo: FuenteVideo;
  enlaceVideo: string;
  videoArchivo: VideoArchivo | null;
  ejercicios: Ejercicio[];
};

/**
 * Entrenamiento posiblemente inválido, tal como llega desde la interfaz o desde
 * un generador de casos inválidos. No se tipa como `Entrenamiento` porque su
 * razón de ser es violar el tipo: la validación ocurre en tiempo de ejecución y
 * es justamente lo que los criterios 8.7 y 8.14 exigen verificar.
 */
export type EntrenamientoDudoso = Record<string, unknown>;

export type Plan = {
  id: string;
  nombre: string;
  objetivo: string;
  precio: number;
  periodicidad: Periodicidad;
  prestaciones: string[];
  incluyeAsesoria: boolean;
  incluyeAlimentacion: boolean;
  recomendado: boolean;
};

export type Cuenta = {
  id: string;
  nombre: string;
  correo: string;
  contrasenia: string;
  rol: Rol;
  idPlan: string | null;
};

export type Sesion = {
  correo: string;
  nombre: string;
  rol: Rol;
};

export type Beneficio = { titulo: string; descripcion: string };
export type Testimonio = { nombre: string; texto: string };
export type PreguntaFrecuente = { pregunta: string; respuesta: string };
export type EnlaceSocial = { nombre: string; url: string };

export type DatosContacto = {
  correo: string;
  telefono: string;
  direccion: string;
  redes: EnlaceSocial[];
};

export type ContenidoLanding = {
  beneficios: Beneficio[];
  testimonios: Testimonio[];
  preguntasFrecuentes: PreguntaFrecuente[];
  contacto: DatosContacto;
};

// --- Constructores -----------------------------------------------------------

/** Borrador de un modelo: los campos que el llamador decide fijar. */
export type Borrador<M> = Partial<M>;

let contadorIdentificadores = 0;

/**
 * Identificador único. Usa `crypto.randomUUID()` cuando está disponible y cae a
 * un contador con marca de tiempo en entornos que no lo exponen (jsdom viejo,
 * contextos no seguros), para que el dominio nunca dependa de esa API.
 */
export function crearIdentificador(): string {
  const cripto: Crypto | undefined = globalThis.crypto;
  if (cripto !== undefined && typeof cripto.randomUUID === 'function') {
    return cripto.randomUUID();
  }
  contadorIdentificadores += 1;
  return `id-${Date.now().toString(36)}-${contadorIdentificadores}`;
}

export function crearEjercicio(datos: Borrador<Ejercicio> = {}): Ejercicio {
  return {
    id: datos.id ?? crearIdentificador(),
    nombre: datos.nombre ?? '',
    series: datos.series ?? 1,
    repeticiones: datos.repeticiones ?? 1,
    descansoSegundos: datos.descansoSegundos ?? 0,
  };
}

/**
 * Construye un Entrenamiento coherente con su Fuente_Video: con `enlace` el
 * metadato de archivo queda nulo y con `archivo` el enlace queda vacío, tal
 * como fija el modelo de datos. Así ningún Entrenamiento declara dos fuentes.
 */
export function crearEntrenamiento(
  datos: Borrador<Entrenamiento> = {},
): Entrenamiento {
  const fuenteVideo = datos.fuenteVideo ?? 'enlace';
  const esArchivo = fuenteVideo === 'archivo';
  return {
    id: datos.id ?? crearIdentificador(),
    titulo: datos.titulo ?? '',
    descripcion: datos.descripcion ?? '',
    categoria: datos.categoria ?? '',
    nivel: datos.nivel ?? 'Principiante',
    duracionMinutos: datos.duracionMinutos ?? 1,
    estado: datos.estado ?? 'publicado',
    fuenteVideo,
    enlaceVideo: esArchivo ? '' : (datos.enlaceVideo ?? ''),
    videoArchivo: esArchivo ? (datos.videoArchivo ?? null) : null,
    ejercicios: [...(datos.ejercicios ?? [])],
  };
}

export function crearPlan(datos: Borrador<Plan> = {}): Plan {
  return {
    id: datos.id ?? crearIdentificador(),
    nombre: datos.nombre ?? '',
    objetivo: datos.objetivo ?? '',
    precio: datos.precio ?? 0,
    periodicidad: datos.periodicidad ?? 'mensual',
    prestaciones: [...(datos.prestaciones ?? [])],
    incluyeAsesoria: datos.incluyeAsesoria ?? false,
    incluyeAlimentacion: datos.incluyeAlimentacion ?? false,
    recomendado: datos.recomendado ?? false,
  };
}

export function crearCuenta(datos: Borrador<Cuenta> = {}): Cuenta {
  return {
    id: datos.id ?? crearIdentificador(),
    nombre: datos.nombre ?? '',
    correo: datos.correo ?? '',
    contrasenia: datos.contrasenia ?? '',
    rol: datos.rol ?? 'usuario',
    idPlan: datos.idPlan ?? null,
  };
}

/** Proyecta una Cuenta a su Sesion, descartando la contraseña. */
export function crearSesion(cuenta: Cuenta): Sesion {
  return { correo: cuenta.correo, nombre: cuenta.nombre, rol: cuenta.rol };
}
