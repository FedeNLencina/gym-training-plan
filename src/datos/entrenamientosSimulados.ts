/**
 * Semilla de Entrenamientos publicados.
 *
 * Es el conjunto que el Repositorio_Datos devuelve y conserva cuando el
 * almacenamiento local está vacío o su contenido no es deserializable (8.3,
 * 8.5). Son 8 Entrenamientos, dentro del rango de 6 a 12 que fija el criterio
 * 8.3, todos en estado `publicado` para que la Landing_Page y el
 * Catalogo_Entrenamientos tengan material desde el primer arranque.
 *
 * Todos usan `fuenteVideo: 'enlace'` a propósito: la Fuente_Video `archivo`
 * depende de un Blob en IndexedDB, y una semilla no puede traer binarios. Los
 * enlaces son marcadores de posición con formato de dirección web válida.
 *
 * La variedad de categoría, nivel y duración no es decorativa: los filtros del
 * Catalogo_Entrenamientos necesitan que cada valor de la unión esté
 * representado para que sus resultados sean distinguibles entre sí.
 *
 * Cubre: 1.7, 8.3, 8.5
 */

import {
  crearEjercicio,
  crearEntrenamiento,
  type Ejercicio,
  type Entrenamiento,
} from '../dominio/modelos';

/** Borrador de Ejercicio de la semilla: identificador derivado, resto explícito. */
type EjercicioSemilla = {
  nombre: string;
  series: number;
  repeticiones: number;
  descansoSegundos: number;
};

/**
 * Construye los Ejercicios con identificadores estables `<idEntrenamiento>-e<n>`
 * en lugar de aleatorios, para que dos lecturas de la semilla produzcan los
 * mismos identificadores y las pruebas no dependan de `crypto.randomUUID()`.
 */
function crearEjerciciosSemilla(
  idEntrenamiento: string,
  borradores: readonly EjercicioSemilla[],
): Ejercicio[] {
  return borradores.map((borrador, indice) =>
    crearEjercicio({ ...borrador, id: `${idEntrenamiento}-e${indice + 1}` }),
  );
}

/**
 * Base de los Enlace_Video de la semilla. Apunta a archivos `.mp4` en un
 * dominio reservado `example`: así `resolverEmbebido` los reconoce como fuente
 * nativa y ninguna prueba depende de una plataforma real.
 */
const ENLACE_BASE = 'https://videos.atlasgym.example/entrenamientos';

/** Campos propios de cada Entrenamiento de la semilla. */
type EntrenamientoSemilla = Omit<
  Entrenamiento,
  'ejercicios' | 'estado' | 'fuenteVideo' | 'enlaceVideo' | 'videoArchivo'
> & { ejercicios: readonly EjercicioSemilla[] };

const SEMILLA: readonly EntrenamientoSemilla[] = [
  {
    id: 'ent-fuerza-tren-superior',
    titulo: 'Fuerza de tren superior',
    descripcion:
      'Sesión de empuje y tracción con cargas moderadas para construir base de fuerza en pecho, espalda y hombros.',
    categoria: 'Fuerza',
    nivel: 'Intermedio',
    duracionMinutos: 55,
    ejercicios: [
      { nombre: 'Press de banca', series: 4, repeticiones: 8, descansoSegundos: 120 },
      { nombre: 'Remo con barra', series: 4, repeticiones: 10, descansoSegundos: 90 },
      { nombre: 'Press militar', series: 3, repeticiones: 10, descansoSegundos: 90 },
      { nombre: 'Dominadas asistidas', series: 3, repeticiones: 8, descansoSegundos: 120 },
    ],
  },
  {
    id: 'ent-cardio-intervalos',
    titulo: 'Cardio por intervalos',
    descripcion:
      'Bloques cortos de alta intensidad alternados con caminata activa para mejorar la capacidad aeróbica.',
    categoria: 'Cardio',
    nivel: 'Principiante',
    duracionMinutos: 25,
    ejercicios: [
      { nombre: 'Trote suave en cinta', series: 1, repeticiones: 1, descansoSegundos: 60 },
      { nombre: 'Sprint en cinta', series: 8, repeticiones: 1, descansoSegundos: 90 },
      { nombre: 'Caminata en pendiente', series: 2, repeticiones: 1, descansoSegundos: 30 },
    ],
  },
  {
    id: 'ent-movilidad-matinal',
    titulo: 'Movilidad matinal',
    descripcion:
      'Rutina breve de rango articular para empezar el día sin rigidez en cadera, columna y hombros.',
    categoria: 'Movilidad',
    nivel: 'Principiante',
    duracionMinutos: 15,
    ejercicios: [
      { nombre: 'Gato y camello', series: 2, repeticiones: 12, descansoSegundos: 20 },
      { nombre: 'Apertura torácica en el piso', series: 2, repeticiones: 10, descansoSegundos: 20 },
      { nombre: 'Estocada con rotación', series: 2, repeticiones: 8, descansoSegundos: 30 },
    ],
  },
  {
    id: 'ent-funcional-cuerpo-completo',
    titulo: 'Funcional de cuerpo completo',
    descripcion:
      'Circuito con patrones de empuje, tracción, bisagra y acarreo, pensado para transferir al movimiento diario.',
    categoria: 'Funcional',
    nivel: 'Intermedio',
    duracionMinutos: 40,
    ejercicios: [
      { nombre: 'Swing con mancuerna', series: 4, repeticiones: 15, descansoSegundos: 60 },
      { nombre: 'Estocada caminando', series: 3, repeticiones: 12, descansoSegundos: 60 },
      { nombre: 'Flexiones de brazos', series: 3, repeticiones: 12, descansoSegundos: 60 },
      { nombre: 'Caminata del granjero', series: 3, repeticiones: 1, descansoSegundos: 90 },
      { nombre: 'Plancha frontal', series: 3, repeticiones: 1, descansoSegundos: 45 },
    ],
  },
  {
    id: 'ent-hipertrofia-piernas',
    titulo: 'Hipertrofia de piernas',
    descripcion:
      'Volumen alto sobre cuádriceps, isquiotibiales y glúteos, con descansos amplios entre series pesadas.',
    categoria: 'Hipertrofia',
    nivel: 'Avanzado',
    duracionMinutos: 75,
    ejercicios: [
      { nombre: 'Sentadilla con barra', series: 5, repeticiones: 8, descansoSegundos: 180 },
      { nombre: 'Peso muerto rumano', series: 4, repeticiones: 10, descansoSegundos: 150 },
      { nombre: 'Prensa de piernas', series: 4, repeticiones: 12, descansoSegundos: 120 },
      { nombre: 'Elevación de talones', series: 4, repeticiones: 15, descansoSegundos: 60 },
    ],
  },
  {
    id: 'ent-fuerza-core',
    titulo: 'Fuerza de zona media',
    descripcion:
      'Trabajo antiextensión y antirrotación para sostener la columna bajo carga en el resto de los entrenamientos.',
    categoria: 'Fuerza',
    nivel: 'Principiante',
    duracionMinutos: 30,
    ejercicios: [
      { nombre: 'Plancha lateral', series: 3, repeticiones: 1, descansoSegundos: 45 },
      { nombre: 'Rueda abdominal', series: 3, repeticiones: 10, descansoSegundos: 60 },
      { nombre: 'Insecto muerto', series: 3, repeticiones: 12, descansoSegundos: 45 },
    ],
  },
  {
    id: 'ent-cardio-resistencia',
    titulo: 'Resistencia aeróbica continua',
    descripcion:
      'Sesión larga a ritmo sostenido para ampliar la base aeróbica sin acumular fatiga de alta intensidad.',
    categoria: 'Cardio',
    nivel: 'Avanzado',
    duracionMinutos: 90,
    ejercicios: [
      { nombre: 'Bicicleta fija a ritmo constante', series: 1, repeticiones: 1, descansoSegundos: 0 },
      { nombre: 'Remo ergómetro continuo', series: 2, repeticiones: 1, descansoSegundos: 120 },
    ],
  },
  {
    id: 'ent-movilidad-cadera',
    titulo: 'Movilidad de cadera profunda',
    descripcion:
      'Secuencia sostenida para ganar rango en flexión y rotación de cadera antes de sentadillas pesadas.',
    categoria: 'Movilidad',
    nivel: 'Intermedio',
    duracionMinutos: 20,
    ejercicios: [
      { nombre: 'Sentadilla profunda sostenida', series: 3, repeticiones: 1, descansoSegundos: 40 },
      { nombre: 'Rotación de cadera en cuadrupedia', series: 3, repeticiones: 10, descansoSegundos: 30 },
      { nombre: 'Estiramiento de psoas', series: 2, repeticiones: 1, descansoSegundos: 30 },
      { nombre: 'Mariposa activa', series: 2, repeticiones: 12, descansoSegundos: 30 },
    ],
  },
];

/**
 * Entrenamientos simulados iniciales. Se construye una instancia nueva por
 * llamada para que ningún consumidor pueda mutar la semilla compartida.
 */
export function crearEntrenamientosSimulados(): Entrenamiento[] {
  return SEMILLA.map((semilla) =>
    crearEntrenamiento({
      ...semilla,
      estado: 'publicado',
      fuenteVideo: 'enlace',
      enlaceVideo: `${ENLACE_BASE}/${semilla.id}.mp4`,
      videoArchivo: null,
      ejercicios: crearEjerciciosSemilla(semilla.id, semilla.ejercicios),
    }),
  );
}

/** Cantidad de Entrenamientos de la semilla, dentro del rango 6 a 12 (8.3). */
export const CANTIDAD_ENTRENAMIENTOS_SIMULADOS = SEMILLA.length;
