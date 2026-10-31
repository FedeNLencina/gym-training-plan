/**
 * Semilla de cuentas de prueba.
 *
 * Son las cuentas con las que se siembra el almacenamiento en el primer
 * arranque, para poder recorrer la Plataforma con cada rol y cada situación de
 * plan sin tener que registrarse a mano cada vez que se limpia el navegador.
 *
 * No incluye al Administrador principal: esa cuenta no es un dato de prueba
 * sino una invariante de la Plataforma, vive en el ServicioAutenticacion y se
 * reinyecta en cada lectura para que un almacenamiento vaciado no deje la
 * Plataforma sin Administrador. Acá se agregan un segundo Administrador y los
 * Usuarios de prueba.
 *
 * La semilla cubre a propósito las cuatro situaciones de plan que la interfaz
 * trata distinto: plan recomendado, plan básico, plan integral y cuenta sin
 * plan. `diego` queda además sin progreso, para poder probar el estado vacío de
 * "Mi progreso".
 *
 * ADVERTENCIA DE SEGURIDAD: las contraseñas están en claro porque este
 * prototipo no tiene backend y el ServicioAutenticacion verifica credenciales
 * en el navegador. Son credenciales de prueba, públicas y descartables: al
 * incorporar backend, esta semilla desaparece junto con la verificación local.
 *
 * Los identificadores son estables y no aleatorios, para que el progreso
 * simulado y las pruebas puedan referenciarlos.
 */

import { crearCuenta, type Cuenta } from '../dominio/modelos';

/**
 * Contraseña compartida por todas las cuentas de prueba. Cumple el mínimo de 8
 * caracteres que exige `validarCuenta`, de modo que cada cuenta sembrada
 * represente un estado que el formulario de registro también podría producir.
 */
export const CONTRASENIA_SIMULADA = 'AtlasPrueba2024';

/**
 * Correos de la semilla, expuestos para el README y para las pruebas que
 * necesitan referirse a una cuenta concreta sin repetir la cadena.
 */
export const CORREOS_SIMULADOS = Object.freeze({
  entrenador: 'entrenador@atlasgym.com',
  ana: 'ana@atlasgym.com',
  bruno: 'bruno@atlasgym.com',
  carla: 'carla@atlasgym.com',
  diego: 'diego@atlasgym.com',
} as const);

const SEMILLA: readonly Cuenta[] = [
  {
    id: 'cuenta-entrenador',
    nombre: 'Lucía Entrenadora',
    correo: CORREOS_SIMULADOS.entrenador,
    contrasenia: CONTRASENIA_SIMULADA,
    rol: 'administrador',
    idPlan: null,
  },
  {
    id: 'cuenta-ana',
    nombre: 'Ana Pérez',
    correo: CORREOS_SIMULADOS.ana,
    contrasenia: CONTRASENIA_SIMULADA,
    rol: 'usuario',
    idPlan: 'plan-progreso',
  },
  {
    id: 'cuenta-bruno',
    nombre: 'Bruno Giménez',
    correo: CORREOS_SIMULADOS.bruno,
    contrasenia: CONTRASENIA_SIMULADA,
    rol: 'usuario',
    idPlan: 'plan-base',
  },
  {
    id: 'cuenta-carla',
    nombre: 'Carla Ríos',
    correo: CORREOS_SIMULADOS.carla,
    contrasenia: CONTRASENIA_SIMULADA,
    rol: 'usuario',
    idPlan: 'plan-integral',
  },
  {
    id: 'cuenta-diego',
    nombre: 'Diego Sosa',
    correo: CORREOS_SIMULADOS.diego,
    contrasenia: CONTRASENIA_SIMULADA,
    // Sin plan: la interfaz debe tratar la ausencia de plan sin romperse.
    idPlan: null,
    rol: 'usuario',
  },
];

/**
 * Cuentas simuladas. Construye instancias nuevas por llamada para que ningún
 * consumidor mute la semilla.
 */
export function crearCuentasSimuladas(): Cuenta[] {
  return SEMILLA.map((cuenta) => crearCuenta(cuenta));
}

/** Cantidad de cuentas de prueba sembradas, sin contar al Administrador principal. */
export const CANTIDAD_CUENTAS_SIMULADAS = SEMILLA.length;
