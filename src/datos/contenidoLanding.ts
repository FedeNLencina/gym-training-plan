/**
 * Contenido textual de la Landing_Page.
 *
 * Todo el texto es marcador de posición redactado en español y no referencia
 * ningún archivo de imagen, tal como exige el criterio 1.4: los espacios
 * visuales se construyen con los tokens del Tema_Atlas, no con recursos
 * externos. Los datos de contacto son ficticios y usan el dominio reservado
 * `example` para que nadie los confunda con datos reales de un gimnasio.
 *
 * Los pasos del método viven aquí y no en `ContenidoLanding` porque son
 * estructura fija de la sección "Cómo funciona" (1.4) y no un dato que el
 * Repositorio_Datos deba devolver ni persistir.
 *
 * Cubre: 1.4, 1.5, 1.9
 */

import type { ContenidoLanding } from '../dominio/modelos';

/** Paso del método presentado en la sección "Cómo funciona la Plataforma". */
export type PasoMetodo = {
  orden: number;
  titulo: string;
  descripcion: string;
};

export const PASOS_METODO: readonly PasoMetodo[] = Object.freeze([
  {
    orden: 1,
    titulo: 'Creás tu cuenta',
    descripcion:
      'Te registrás con tu nombre, tu correo y una contraseña. No pedimos datos de pago en esta etapa.',
  },
  {
    orden: 2,
    titulo: 'Elegís tu plan',
    descripcion:
      'Comparás los planes por objetivo, periodicidad y prestaciones, y te queda asociado el que elijas.',
  },
  {
    orden: 3,
    titulo: 'Entrenás con la guía en pantalla',
    descripcion:
      'Cada entrenamiento trae el video del ejercicio, las series, las repeticiones y el descanso sugerido.',
  },
  {
    orden: 4,
    titulo: 'Seguís tu avance',
    descripcion:
      'Marcás cada ejercicio completado y la Plataforma calcula el porcentaje de avance de la sesión.',
  },
] as const);

const CONTENIDO: ContenidoLanding = {
  beneficios: [
    {
      titulo: 'Rutinas con explicación en video',
      descripcion:
        'Cada ejercicio viene con su video, sus series y sus repeticiones, así entrenás sin adivinar la técnica.',
    },
    {
      titulo: 'Progresión por nivel',
      descripcion:
        'Los entrenamientos están clasificados en principiante, intermedio y avanzado para que subas de escalón cuando estés listo.',
    },
    {
      titulo: 'Entrenás en el horario que tengas',
      descripcion:
        'Hay sesiones de 15 a 90 minutos, de modo que una semana cargada no se convierte en una semana perdida.',
    },
    {
      titulo: 'Avance visible sesión a sesión',
      descripcion:
        'Marcás cada ejercicio terminado y ves el porcentaje de la sesión completado en el momento.',
    },
  ],
  testimonios: [
    {
      nombre: 'Lucía Fernández',
      texto:
        'Venía entrenando sola y sin orden. Con las rutinas por nivel dejé de improvisar y en tres meses subí las cargas en sentadilla.',
    },
    {
      nombre: 'Martín Quiroga',
      texto:
        'Los videos me resolvieron la técnica del peso muerto, que era lo que más me frenaba. Ahora entreno sin dolor de espalda.',
    },
    {
      nombre: 'Carolina Ibáñez',
      texto:
        'Trabajo por turnos y necesitaba flexibilidad. Las sesiones de veinte minutos me permiten cumplir igual en las semanas complicadas.',
    },
    {
      nombre: 'Diego Salvatierra',
      texto:
        'El seguimiento del avance me mantiene enganchado. Ver la sesión completa al cien por ciento es la parte que más me motiva.',
    },
  ],
  preguntasFrecuentes: [
    {
      pregunta: '¿Necesito ir a un gimnasio para seguir los entrenamientos?',
      respuesta:
        'No en todos los casos. Las sesiones de movilidad y funcional se hacen con poco equipamiento, mientras que las de fuerza e hipertrofia sí suponen barras, mancuernas y máquinas.',
    },
    {
      pregunta: '¿Qué pasa si soy principiante y nunca entrené?',
      respuesta:
        'Empezás por los entrenamientos de nivel principiante, que traen menos series y descansos más largos, y avanzás de nivel cuando completás las sesiones con buena técnica.',
    },
    {
      pregunta: '¿Puedo cambiar de plan más adelante?',
      respuesta:
        'Sí. El plan queda asociado a tu cuenta y podés pasar a otro cuando quieras, sin perder el avance registrado en los entrenamientos.',
    },
    {
      pregunta: '¿La asesoría en línea es en vivo?',
      respuesta:
        'La asesoría de los planes que la incluyen se coordina por mensajes y revisión de los videos que envíes, con respuesta dentro de las 48 horas hábiles.',
    },
    {
      pregunta: '¿Se cobra algo al registrarse?',
      respuesta:
        'No. El registro no solicita ningún pago: elegís el plan y queda anotado como tu preferencia para coordinar después con el entrenador.',
    },
  ],
  contacto: {
    correo: 'contacto@atlasgym.example',
    telefono: '+54 11 5555 0000',
    direccion: 'Avenida Siempre Viva 1234, Ciudad Ejemplo',
    redes: [
      { nombre: 'Instagram', url: 'https://instagram.example/atlasgym' },
      { nombre: 'Facebook', url: 'https://facebook.example/atlasgym' },
      { nombre: 'YouTube', url: 'https://youtube.example/@atlasgym' },
      { nombre: 'WhatsApp', url: 'https://wa.example/5491155550000' },
    ],
  },
};

/**
 * Contenido de la Landing_Page. Devuelve una copia profunda de las listas para
 * que ninguna vista pueda mutar el contenido compartido.
 */
export function crearContenidoLanding(): ContenidoLanding {
  return {
    beneficios: CONTENIDO.beneficios.map((beneficio) => ({ ...beneficio })),
    testimonios: CONTENIDO.testimonios.map((testimonio) => ({ ...testimonio })),
    preguntasFrecuentes: CONTENIDO.preguntasFrecuentes.map((par) => ({ ...par })),
    contacto: {
      ...CONTENIDO.contacto,
      redes: CONTENIDO.contacto.redes.map((red) => ({ ...red })),
    },
  };
}

/** Pasos del método, como copia, para la sección "Cómo funciona". */
export function crearPasosMetodo(): PasoMetodo[] {
  return PASOS_METODO.map((paso) => ({ ...paso }));
}
