/**
 * Jerarquía de errores de dominio.
 *
 * Cada error lleva un `nombre` estable para que las vistas decidan el mensaje a
 * partir del tipo y no del texto del error. Se expone tanto `name` (para las
 * herramientas del entorno) como `nombre` (para la comparación en español que
 * usan los dobles de prueba), siempre con el mismo valor.
 *
 * Cubre: 8.7, 8.14
 */

/** Nombres de los errores de dominio. */
export const NOMBRES_ERROR_DOMINIO = Object.freeze([
  'ErrorValidacion',
  'ErrorCorreoRegistrado',
  'ErrorCredenciales',
  'ErrorAlmacenamiento',
  'ErrorEspacioInsuficiente',
  'ErrorVideoAusente',
  'ErrorCarga',
] as const);

export type NombreErrorDominio = (typeof NOMBRES_ERROR_DOMINIO)[number];

/** Raíz de la jerarquía: nunca se lanza directamente. */
export class ErrorDominio extends Error {
  readonly nombre: NombreErrorDominio;

  constructor(nombre: NombreErrorDominio, mensaje: string) {
    super(mensaje);
    this.name = nombre;
    this.nombre = nombre;
    // `Error` rompe la cadena de prototipos al transpilar a objetivos viejos;
    // restablecerla mantiene válido el `instanceof` de cada subclase.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Mapa de campo inválido a mensaje presentable junto al control afectado. */
export type CamposInvalidos = Readonly<Record<string, string>>;

/**
 * Entrada que no cumple las reglas de dominio. Lleva el detalle por campo, que
 * es lo que permite a los formularios señalar cada control por separado.
 */
export class ErrorValidacion extends ErrorDominio {
  readonly campos: CamposInvalidos;

  constructor(campos: CamposInvalidos = {}, mensaje = 'Datos inválidos') {
    super('ErrorValidacion', mensaje);
    this.campos = Object.freeze({ ...campos });
  }
}

export class ErrorCorreoRegistrado extends ErrorDominio {
  constructor(mensaje = 'El correo ya está registrado') {
    super('ErrorCorreoRegistrado', mensaje);
  }
}

export class ErrorCredenciales extends ErrorDominio {
  constructor(mensaje = 'Credenciales incorrectas') {
    super('ErrorCredenciales', mensaje);
  }
}

/** Fallo de persistencia: el almacenamiento no está disponible o rechaza. */
export class ErrorAlmacenamiento extends ErrorDominio {
  constructor(
    mensaje = 'No pudimos guardar los cambios',
    nombre: NombreErrorDominio = 'ErrorAlmacenamiento',
  ) {
    super(nombre, mensaje);
  }
}

/**
 * Cuota agotada. Especializa `ErrorAlmacenamiento` porque todo tratamiento de
 * fallo de persistencia debe alcanzarlo también.
 */
export class ErrorEspacioInsuficiente extends ErrorAlmacenamiento {
  constructor(
    mensaje = 'No pudimos guardar el video: el almacenamiento del navegador está lleno',
  ) {
    super(mensaje, 'ErrorEspacioInsuficiente');
  }
}

export class ErrorVideoAusente extends ErrorDominio {
  constructor(mensaje = 'Video no disponible') {
    super('ErrorVideoAusente', mensaje);
  }
}

/** Fallo o vencimiento de plazo al leer datos. */
export class ErrorCarga extends ErrorDominio {
  constructor(mensaje = 'No pudimos cargar los datos') {
    super('ErrorCarga', mensaje);
  }
}

/** Predicado de tipo para el tratamiento uniforme de fallos en las vistas. */
export function esErrorDominio(valor: unknown): valor is ErrorDominio {
  return valor instanceof ErrorDominio;
}
