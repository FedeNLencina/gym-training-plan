/**
 * Contenido textual de la sección Hero de la Landing_Page.
 *
 * El titular respeta el límite de 1 a 80 caracteres y el subtitular el de 40 a
 * 200 caracteres que fija el criterio 1.2. Vive como constante propia para que
 * los tests puedan afirmar el contenido exacto por texto accesible, sin recurrir
 * a selectores. Es marcador de posición en español, sin datos reales.
 *
 * Cubre: 1.2
 */

export const HERO_LANDING = Object.freeze({
  titular: 'Entrená con Atlas Gym, tu método guiado en video',
  subtitular:
    'Rutinas por nivel con el video de cada ejercicio, sus series y su descanso, para que entrenes con guía clara desde la primera sesión.',
} as const);
