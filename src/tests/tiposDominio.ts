/**
 * Tipos y constantes de dominio **provisionales** para la infraestructura de
 * pruebas.
 *
 * Decisión deliberada: `src/dominio/modelos.ts` todavía no existe (se crea en la
 * tarea 2.1). Para que los dobles y los generadores no dependan de módulos aún
 * no escritos, aquí se declaran los tipos de los modelos y las constantes de
 * dominio que las pruebas necesitan. Cuando exista `dominio/modelos.ts`, este
 * archivo debe pasar a reexportar desde allí, no a duplicar: los nombres se
 * eligieron idénticos a los del diseño para que la sustitución sea mecánica.
 *
 * Cubre: 10.8
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
