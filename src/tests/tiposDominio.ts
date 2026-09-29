/**
 * Puente de compatibilidad para la infraestructura de pruebas.
 *
 * Los tipos y constantes de dominio ya viven en `src/dominio/modelos.ts` (tarea
 * 2.1). Este archivo sólo reexporta desde allí para que los dobles y los
 * generadores escritos en la tarea 1.3 sigan importando de una sola ruta, sin
 * duplicar definición alguna.
 *
 * Cubre: 10.8
 */

export {
  CATEGORIAS,
  ESTADOS_ENTRENAMIENTO,
  FUENTES_VIDEO,
  LIMITE_VIDEO_BYTES,
  NIVELES,
  PERIODICIDADES,
  ROLES,
  TIPOS_VIDEO_ADMITIDOS,
  crearCuenta,
  crearEjercicio,
  crearEntrenamiento,
  crearIdentificador,
  crearPlan,
  crearSesion,
  esTipoVideoAdmitido,
} from '../dominio/modelos';

export type {
  Beneficio,
  Borrador,
  Categoria,
  ContenidoLanding,
  Cuenta,
  DatosContacto,
  Ejercicio,
  EnlaceSocial,
  Entrenamiento,
  EntrenamientoDudoso,
  EstadoEntrenamiento,
  FuenteVideo,
  Nivel,
  Periodicidad,
  Plan,
  PreguntaFrecuente,
  Rol,
  Sesion,
  Testimonio,
  TipoVideoAdmitido,
  VideoArchivo,
} from '../dominio/modelos';
