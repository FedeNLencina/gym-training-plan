/**
 * Errores de dominio emulados para los dobles de prueba.
 *
 * Decisión deliberada: `src/dominio/errores.ts` todavía no existe (se crea en la
 * tarea 2.1). Para que los dobles no dependan de módulos no escritos, aquí se
 * construyen `Error` nativos cuyo `name` y `nombre` coinciden exactamente con
 * los nombres documentados en el diseño (`ErrorValidacion`,
 * `ErrorAlmacenamiento`, `ErrorEspacioInsuficiente`, `ErrorVideoAusente`,
 * `ErrorCarga`). Las pruebas deben comparar por `error.nombre`, no por
 * `instanceof`, de modo que la llegada de las clases reales no invalide nada:
 * cuando existan, bastará sustituir esta fábrica sin tocar los dobles.
 */

/** Nombres de error de dominio usados por los dobles. */
export const NOMBRES_ERROR = Object.freeze({
  validacion: 'ErrorValidacion',
  almacenamiento: 'ErrorAlmacenamiento',
  espacioInsuficiente: 'ErrorEspacioInsuficiente',
  videoAusente: 'ErrorVideoAusente',
  carga: 'ErrorCarga',
} as const);

export type NombreError = (typeof NOMBRES_ERROR)[keyof typeof NOMBRES_ERROR];

/** Error de dominio emulado: `Error` nativo con el campo `nombre` en español. */
export type ErrorDominio = Error & {
  nombre: NombreError;
  campos?: readonly string[];
};

/**
 * Crea un error con nombre de dominio.
 *
 * @param nombre Nombre del error de dominio.
 * @param mensaje Mensaje legible.
 * @param extra Campos adicionales (por ejemplo `campos`).
 */
export function crearErrorDominio(
  nombre: NombreError,
  mensaje: string,
  extra: Record<string, unknown> = {},
): ErrorDominio {
  const error = new Error(mensaje) as ErrorDominio;
  error.name = nombre;
  error.nombre = nombre;
  Object.assign(error, extra);
  return error;
}

export const errorCarga = (mensaje = 'Fallo de lectura simulado'): ErrorDominio =>
  crearErrorDominio(NOMBRES_ERROR.carga, mensaje);

export const errorAlmacenamiento = (
  mensaje = 'Fallo de escritura simulado',
): ErrorDominio => crearErrorDominio(NOMBRES_ERROR.almacenamiento, mensaje);

export const errorEspacioInsuficiente = (
  mensaje = 'Espacio insuficiente simulado',
): ErrorDominio =>
  crearErrorDominio(NOMBRES_ERROR.espacioInsuficiente, mensaje);

export const errorVideoAusente = (mensaje = 'Video ausente'): ErrorDominio =>
  crearErrorDominio(NOMBRES_ERROR.videoAusente, mensaje);

export const errorValidacion = (
  campos: readonly string[],
  mensaje = 'Entrenamiento inválido',
): ErrorDominio =>
  crearErrorDominio(NOMBRES_ERROR.validacion, mensaje, { campos });
