/**
 * Datos iniciales con los que arranca la plataforma la primera vez que se abre
 * en un navegador. Después, todo lo que cambie el administrador se guarda
 * encima de esta semilla.
 *
 * ADVERTENCIA: las contraseñas están en claro porque el prototipo no tiene
 * backend y verifica las credenciales en el navegador. Son cuentas de prueba,
 * públicas y descartables.
 */

import type { Datos } from '../dominio/modelos';

export const CONTRASENIA_PRUEBA = 'AtlasPrueba2024';
export const CORREO_ADMIN = 'admin@atlasgym.com';
export const ID_ADMIN_PRINCIPAL = 'cuenta-admin';

/** Video de muestra de dominio público (MDN); el administrador lo reemplaza. */
const VIDEO_MUESTRA = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

const entrenamiento = (
  id: string,
  titulo: string,
  nivel: Datos['entrenamientos'][number]['nivel'],
  duracionMin: number,
  descripcion: string,
): Datos['entrenamientos'][number] => ({
  id,
  titulo,
  nivel,
  duracionMin,
  descripcion,
  video: { tipo: 'enlace', url: VIDEO_MUESTRA },
});

export function crearSemilla(): Datos {
  return {
    idSesion: null,
    cuentas: [
      {
        id: ID_ADMIN_PRINCIPAL,
        nombre: 'Administración Atlas',
        correo: CORREO_ADMIN,
        contrasenia: CONTRASENIA_PRUEBA,
        rol: 'administrador',
        idPlan: null,
        idPlanSolicitado: null,
      },
      {
        id: 'cuenta-ana',
        nombre: 'Ana Pérez',
        correo: 'ana@atlasgym.com',
        contrasenia: CONTRASENIA_PRUEBA,
        rol: 'usuario',
        idPlan: 'plan-intermedio',
        idPlanSolicitado: null,
      },
      {
        id: 'cuenta-bruno',
        nombre: 'Bruno Giménez',
        correo: 'bruno@atlasgym.com',
        contrasenia: CONTRASENIA_PRUEBA,
        rol: 'usuario',
        idPlan: 'plan-basico',
        idPlanSolicitado: 'plan-avanzado',
      },
      {
        id: 'cuenta-diego',
        nombre: 'Diego Sosa',
        correo: 'diego@atlasgym.com',
        contrasenia: CONTRASENIA_PRUEBA,
        rol: 'usuario',
        idPlan: null,
        idPlanSolicitado: null,
      },
    ],
    planes: [
      {
        id: 'plan-basico',
        nombre: 'Básico',
        descripcion: 'Para arrancar: técnica, movilidad y rutinas cortas de cuerpo completo.',
        precio: 15000,
        nivel: 'basico',
        beneficios: ['Entrenamientos de nivel básico', 'Rutinas de 20 a 30 minutos', 'Sin equipamiento'],
      },
      {
        id: 'plan-intermedio',
        nombre: 'Intermedio',
        descripcion: 'Para quien ya entrena y quiere sumar carga y volumen con criterio.',
        precio: 22000,
        nivel: 'intermedio',
        beneficios: [
          'Entrenamientos básicos e intermedios',
          'Trabajo de fuerza con mancuernas',
          'Circuitos de alta intensidad',
        ],
      },
      {
        id: 'plan-avanzado',
        nombre: 'Avanzado',
        descripcion: 'Acceso completo: fuerza máxima, levantamientos y acondicionamiento exigente.',
        precio: 30000,
        nivel: 'avanzado',
        beneficios: [
          'Todos los entrenamientos',
          'Levantamientos con barra',
          'Bloques de fuerza y potencia',
        ],
      },
    ],
    entrenamientos: [
      entrenamiento('ent-movilidad', 'Movilidad de cadera y hombros', 'basico', 20,
        'Entrada en calor completa para preparar las articulaciones antes de cargar peso.'),
      entrenamiento('ent-cuerpo-completo', 'Cuerpo completo sin equipamiento', 'basico', 25,
        'Sentadillas, flexiones y planchas en un circuito de cuatro vueltas.'),
      entrenamiento('ent-core', 'Zona media: estabilidad', 'basico', 15,
        'Planchas, bicho muerto y puente de glúteos para sostener mejor cada levantamiento.'),
      entrenamiento('ent-mancuernas', 'Fuerza con mancuernas: tren superior', 'intermedio', 35,
        'Press, remo y vuelos en series de 8 a 12 repeticiones.'),
      entrenamiento('ent-hiit', 'Intervalos de alta intensidad', 'intermedio', 30,
        'Bloques de 40 segundos de trabajo por 20 de pausa. Terminás sin aire.'),
      entrenamiento('ent-piernas', 'Piernas: sentadilla y zancadas', 'intermedio', 40,
        'Progresión de sentadilla goblet, zancadas caminando y peso muerto rumano.'),
      entrenamiento('ent-peso-muerto', 'Peso muerto con barra', 'avanzado', 50,
        'Técnica, series de aproximación y cinco series pesadas de tres repeticiones.'),
      entrenamiento('ent-potencia', 'Potencia: cargada y envión', 'avanzado', 45,
        'Levantamientos olímpicos por partes para ganar velocidad debajo de la barra.'),
    ],
    contenido: {
      heroTitulo: 'Entrená con un plan, no con suerte',
      heroTexto:
        'Rutinas en video ordenadas por nivel. Elegís tu plan, entrenás donde quieras y subís de nivel cuando estés listo.',
      pasos: [
        { titulo: 'Creá tu cuenta', texto: 'Registrate con tu nombre, correo y una contraseña.' },
        { titulo: 'Elegí tu plan', texto: 'Compará los planes y pedí el que va con tu nivel.' },
        { titulo: 'Confirmá el pago', texto: 'Pagás por transferencia y te damos de alta en el día.' },
        { titulo: 'Entrená', texto: 'Entrás a los entrenamientos de tu nivel y de los anteriores.' },
      ],
      preguntas: [
        {
          pregunta: '¿Puedo cambiar de plan?',
          respuesta:
            'Sí. Desde Planes pedís el plan nuevo cuando quieras. Seguís con el actual hasta que confirmemos el cambio.',
        },
        {
          pregunta: '¿Qué entrenamientos incluye cada plan?',
          respuesta:
            'Cada plan incluye los entrenamientos de su nivel y los de los niveles anteriores. El Avanzado incluye todos.',
        },
        {
          pregunta: '¿Cómo pago?',
          respuesta:
            'Por transferencia. Al pedir un plan te mostramos los datos y, cuando recibimos el pago, activamos tu cuenta.',
        },
        {
          pregunta: '¿Necesito equipamiento?',
          respuesta:
            'El plan Básico no usa equipamiento. El Intermedio usa mancuernas y el Avanzado, barra y discos.',
        },
      ],
      instruccionesPago:
        'Transferí el importe del plan al alias ATLAS.GYM.PLANES y enviá el comprobante a pagos@atlasgym.com. Te damos de alta en el día.',
    },
  };
}
