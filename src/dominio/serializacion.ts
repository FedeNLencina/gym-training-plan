/**
 * Serialización de Entrenamientos para el almacenamiento local.
 *
 * El contenido se guarda dentro del sobre `{ version: 1, entrenamientos }`. El
 * campo `version` permite descartar sin ambigüedad un formato desconocido
 * (8.5) en lugar de intentar interpretarlo.
 *
 * `deserializarEntrenamientos` distingue dos situaciones distintas:
 *
 * - Devuelve `null` cuando el contenido no es utilizable como sobre: ausente,
 *   no deserializable como JSON, versión desconocida o lista ausente. Quien
 *   llama (el Repositorio_Datos) decide entonces sembrar los datos simulados.
 * - Devuelve la lista de Entrenamientos válidos cuando el sobre es legible,
 *   descartando de a uno los elementos que no cumplen la estructura.
 *
 * La normalización reconstruye cada Entrenamiento con `crearEntrenamiento`, de
 * modo que los campos ajenos al modelo no sobrevivan a la lectura.
 *
 * Cubre: 8.4, 8.5
 */

import {
  ESTADOS_ENTRENAMIENTO,
  crearEntrenamiento,
  type Entrenamiento,
  type EstadoEntrenamiento,
  type FuenteVideo,
  type Nivel,
  type VideoArchivo,
} from './modelos';
import { validarEjercicio, validarEntrenamiento } from './validaciones';

/** Versión del formato del sobre de Entrenamientos. */
export const VERSION_ENTRENAMIENTOS = 1;

/** Sobre versionado tal como se guarda en el almacenamiento local. */
export type SobreEntrenamientos = {
  version: typeof VERSION_ENTRENAMIENTOS;
  entrenamientos: Entrenamiento[];
};

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esTextoConContenido(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0;
}

/**
 * Normaliza el metadato del Archivo_Video. Devuelve `undefined` para señalar
 * una estructura inválida, distinguiéndolo de `null`, que es la ausencia
 * legítima de archivo mientras la carga está pendiente.
 */
function normalizarVideoArchivo(valor: unknown): VideoArchivo | null | undefined {
  if (valor === null || valor === undefined) return null;
  if (!esRegistro(valor)) return undefined;

  const { nombre, tipo, tamanioBytes } = valor;
  if (typeof nombre !== 'string') return undefined;
  if (typeof tipo !== 'string') return undefined;
  if (
    typeof tamanioBytes !== 'number' ||
    !Number.isInteger(tamanioBytes) ||
    tamanioBytes < 0
  ) {
    return undefined;
  }

  return { nombre, tipo, tamanioBytes };
}

/**
 * Reconstruye un Entrenamiento a partir de contenido almacenado, o devuelve
 * `null` cuando no cumple la estructura del modelo.
 */
function normalizarEntrenamiento(valor: unknown): Entrenamiento | null {
  if (!esRegistro(valor)) return null;
  if (validarEntrenamiento(valor) !== null) return null;
  if (!esTextoConContenido(valor.id)) return null;

  const { estado } = valor;
  if (
    typeof estado !== 'string' ||
    !(ESTADOS_ENTRENAMIENTO as readonly string[]).includes(estado)
  ) {
    return null;
  }

  const videoArchivo = normalizarVideoArchivo(valor.videoArchivo);
  if (videoArchivo === undefined) return null;

  // `validarEntrenamiento` ya garantizó que es un arreglo de 1 a 50 elementos.
  const crudos = valor.ejercicios as readonly unknown[];
  const ejercicios = [];
  for (const crudo of crudos) {
    if (!esRegistro(crudo)) return null;
    if (validarEjercicio(crudo) !== null) return null;
    if (!esTextoConContenido(crudo.id)) return null;
    ejercicios.push({
      id: crudo.id,
      nombre: crudo.nombre as string,
      series: crudo.series as number,
      repeticiones: crudo.repeticiones as number,
      descansoSegundos: crudo.descansoSegundos as number,
    });
  }

  const enlaceVideo = valor.enlaceVideo;

  return crearEntrenamiento({
    id: valor.id,
    titulo: valor.titulo as string,
    descripcion: typeof valor.descripcion === 'string' ? valor.descripcion : '',
    categoria: valor.categoria as string,
    nivel: valor.nivel as Nivel,
    duracionMinutos: valor.duracionMinutos as number,
    estado: estado as EstadoEntrenamiento,
    fuenteVideo: valor.fuenteVideo as FuenteVideo,
    enlaceVideo: typeof enlaceVideo === 'string' ? enlaceVideo : '',
    videoArchivo,
    ejercicios,
  });
}

/** Serializa la lista de Entrenamientos dentro del sobre versionado. */
export function serializarEntrenamientos(
  entrenamientos: readonly Entrenamiento[],
): string {
  const sobre: SobreEntrenamientos = {
    version: VERSION_ENTRENAMIENTOS,
    entrenamientos: [...entrenamientos],
  };
  return JSON.stringify(sobre);
}

/**
 * Deserializa el sobre versionado. Devuelve `null` cuando el contenido no es
 * utilizable, y la lista de Entrenamientos válidos en caso contrario.
 */
export function deserializarEntrenamientos(
  contenido: string | null | undefined,
): Entrenamiento[] | null {
  if (typeof contenido !== 'string' || contenido.trim().length === 0) {
    return null;
  }

  let analizado: unknown;
  try {
    analizado = JSON.parse(contenido);
  } catch {
    return null;
  }

  if (!esRegistro(analizado)) return null;
  if (analizado.version !== VERSION_ENTRENAMIENTOS) return null;
  if (!Array.isArray(analizado.entrenamientos)) return null;

  const validos: Entrenamiento[] = [];
  for (const crudo of analizado.entrenamientos) {
    const entrenamiento = normalizarEntrenamiento(crudo);
    if (entrenamiento !== null) validos.push(entrenamiento);
  }
  return validos;
}
