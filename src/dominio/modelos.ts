/** Modelos de la plataforma. Sin lógica: sólo formas de datos. */

export const NIVELES = ['basico', 'intermedio', 'avanzado'] as const;
export type Nivel = (typeof NIVELES)[number];

export const ETIQUETA_NIVEL: Readonly<Record<Nivel, string>> = {
  basico: 'Básico',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

export type Rol = 'usuario' | 'administrador';

export type Plan = {
  id: string;
  nombre: string;
  descripcion: string;
  /** Precio mensual en pesos. */
  precio: number;
  /** Nivel más alto de entrenamientos que habilita. */
  nivel: Nivel;
  beneficios: string[];
};

export type Video =
  | { tipo: 'enlace'; url: string }
  | { tipo: 'archivo'; idArchivo: string; nombreArchivo: string };

export type Entrenamiento = {
  id: string;
  titulo: string;
  descripcion: string;
  nivel: Nivel;
  duracionMin: number;
  video: Video;
};

export type Cuenta = {
  id: string;
  nombre: string;
  correo: string;
  contrasenia: string;
  rol: Rol;
  /** Plan activo: lo asigna el administrador al confirmar el pago. */
  idPlan: string | null;
  /** Plan pedido por el usuario, a la espera del alta. */
  idPlanSolicitado: string | null;
};

export type Paso = { titulo: string; texto: string };
export type Pregunta = { pregunta: string; respuesta: string };

export type ContenidoLanding = {
  heroTitulo: string;
  heroTexto: string;
  pasos: Paso[];
  preguntas: Pregunta[];
  instruccionesPago: string;
};

export type Datos = {
  cuentas: Cuenta[];
  planes: Plan[];
  entrenamientos: Entrenamiento[];
  contenido: ContenidoLanding;
  /** Id de la cuenta con sesión abierta. */
  idSesion: string | null;
};
