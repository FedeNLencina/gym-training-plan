/**
 * ServicioAutenticacion: registro, ingreso, cierre y restauración de sesión.
 *
 * ADVERTENCIA DE SEGURIDAD: las contraseñas se guardan en claro en el
 * almacenamiento local del navegador. Esto es admisible únicamente porque este
 * prototipo no tiene backend ni datos reales, y la verificación de credenciales
 * no puede ocurrir en ningún otro lugar. Al incorporar backend, la verificación
 * y el resguardo de contraseñas deben moverse al servidor y esta capa debe
 * limitarse a delegar en él.
 *
 * El servicio mantiene las cuentas en memoria como fuente de verdad y persiste
 * en el almacenamiento con el mejor esfuerzo: si el navegador no ofrece la API
 * o rechaza la escritura, la sesión sigue funcionando durante la visita en curso
 * en lugar de dejar la Plataforma inutilizable.
 *
 * Cubre: 4.1, 4.2, 4.3, 4.5, 4.6, 4.7, 4.10, 4.11, 4.12, 7.1
 */

import {
  ErrorAlmacenamiento,
  ErrorCorreoRegistrado,
  ErrorCredenciales,
} from '../dominio/errores';
import {
  ROLES,
  crearCuenta,
  crearSesion,
  type Cuenta,
  type Rol,
  type Sesion,
} from '../dominio/modelos';
import { validarCuenta } from '../dominio/validaciones';
import {
  CLAVES_ALMACENAMIENTO,
  type AlmacenamientoLocal,
} from '../infra/almacenamientoLocal';

/** Versión del sobre con el que se serializan las cuentas. */
const VERSION_CUENTAS = 1;

/**
 * Credenciales de la cuenta sembrada con rol `administrador`. El Administrador
 * no se registra: es el dueño de la Plataforma y su cuenta viene con ella.
 * Estas credenciales están documentadas en el `README` del prototipo (7.1).
 */
export const CREDENCIALES_ADMINISTRADOR = Object.freeze({
  correo: 'admin@atlasgym.com',
  contrasenia: 'AtlasGym2024',
} as const);

/** Cuenta sembrada del Administrador. */
function crearCuentaAdministrador(): Cuenta {
  return crearCuenta({
    id: 'cuenta-administrador',
    nombre: 'Administrador Atlas',
    correo: CREDENCIALES_ADMINISTRADOR.correo,
    contrasenia: CREDENCIALES_ADMINISTRADOR.contrasenia,
    rol: 'administrador',
    idPlan: null,
  });
}

export type DatosRegistro = {
  nombre: string;
  correo: string;
  contrasenia: string;
  /** Plan elegido en la Seccion_Planes, si el registro llegó desde un CTA. */
  idPlan?: string | null;
};

export type Credenciales = {
  correo: string;
  contrasenia: string;
};

export type ServicioAutenticacion = {
  registrar: (datos: DatosRegistro) => Promise<Sesion>;
  ingresar: (credenciales: Credenciales) => Promise<Sesion>;
  cerrarSesion: () => Promise<void>;
  restaurarSesion: () => Promise<Sesion | null>;
  /** Copia de la cuenta con ese correo, para aserciones y para el Panel_Admin. */
  cuentaDe: (correo: string) => Cuenta | null;
};

export type OpcionesServicioAutenticacion = {
  almacenamiento: AlmacenamientoLocal;
};

// --- Serialización -----------------------------------------------------------

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esRol(valor: unknown): valor is Rol {
  return typeof valor === 'string' && (ROLES as readonly string[]).includes(valor);
}

/** Acota un valor deserializado a una Cuenta, o lo descarta. */
function deserializarCuenta(valor: unknown): Cuenta | null {
  if (!esRegistro(valor)) return null;
  const { id, nombre, correo, contrasenia, rol, idPlan } = valor;
  if (
    typeof id !== 'string' ||
    typeof nombre !== 'string' ||
    typeof correo !== 'string' ||
    typeof contrasenia !== 'string' ||
    !esRol(rol)
  ) {
    return null;
  }
  return crearCuenta({
    id,
    nombre,
    correo,
    contrasenia,
    rol,
    idPlan: typeof idPlan === 'string' ? idPlan : null,
  });
}

/** Acota un valor deserializado a una Sesion, o lo descarta (4.12). */
function deserializarSesion(valor: unknown): Sesion | null {
  if (!esRegistro(valor)) return null;
  const { correo, nombre, rol } = valor;
  if (typeof correo !== 'string' || typeof nombre !== 'string' || !esRol(rol)) {
    return null;
  }
  return { correo, nombre, rol };
}

/** Deserializa sin propagar: todo contenido inválido equivale a ausencia. */
function interpretar(contenido: string | null): unknown {
  if (contenido === null) return null;
  try {
    return JSON.parse(contenido) as unknown;
  } catch {
    return null;
  }
}

// --- Fábrica -----------------------------------------------------------------

export function crearServicioAutenticacion({
  almacenamiento,
}: OpcionesServicioAutenticacion): ServicioAutenticacion {
  /** Lectura tolerante: un almacenamiento caído no impide usar la Plataforma. */
  const leer = (clave: string): string | null => {
    try {
      return almacenamiento.leer(clave);
    } catch (fallo) {
      if (fallo instanceof ErrorAlmacenamiento) return null;
      throw fallo;
    }
  };

  /** Escritura con el mejor esfuerzo: el fallo de persistencia no interrumpe. */
  const escribir = (clave: string, valor: string): void => {
    try {
      almacenamiento.escribir(clave, valor);
    } catch (fallo) {
      if (!(fallo instanceof ErrorAlmacenamiento)) throw fallo;
    }
  };

  const borrar = (clave: string): void => {
    try {
      almacenamiento.borrar(clave);
    } catch (fallo) {
      if (!(fallo instanceof ErrorAlmacenamiento)) throw fallo;
    }
  };

  /**
   * Cuentas almacenadas, con la cuenta del Administrador siempre presente: la
   * semilla se reinyecta en cada lectura para que un almacenamiento vaciado o
   * corrupto no deje la Plataforma sin Administrador.
   */
  const cargarCuentas = (): Cuenta[] => {
    const sobre = interpretar(leer(CLAVES_ALMACENAMIENTO.cuentas));
    const crudas =
      esRegistro(sobre) && Array.isArray(sobre.cuentas) ? sobre.cuentas : [];
    const cuentas = crudas
      .map(deserializarCuenta)
      .filter((cuenta): cuenta is Cuenta => cuenta !== null)
      .filter((cuenta) => cuenta.rol !== 'administrador');
    return [crearCuentaAdministrador(), ...cuentas];
  };

  let cuentas: Cuenta[] = cargarCuentas();

  const persistirCuentas = (): void => {
    escribir(
      CLAVES_ALMACENAMIENTO.cuentas,
      JSON.stringify({ version: VERSION_CUENTAS, cuentas }),
    );
  };

  const persistirSesion = (sesion: Sesion): void => {
    escribir(CLAVES_ALMACENAMIENTO.sesion, JSON.stringify(sesion));
  };

  /** Búsqueda por coincidencia exacta del correo (4.6). */
  const buscarPorCorreo = (correo: string): Cuenta | undefined =>
    cuentas.find((cuenta) => cuenta.correo === correo);

  return {
    async registrar({ nombre, correo, contrasenia, idPlan = null }) {
      const error = validarCuenta({ nombre, correo, contrasenia });
      if (error !== null) throw error;

      if (buscarPorCorreo(correo) !== undefined) {
        throw new ErrorCorreoRegistrado();
      }

      const cuenta = crearCuenta({
        nombre,
        correo,
        contrasenia,
        rol: 'usuario',
        idPlan,
      });
      cuentas = [...cuentas, cuenta];
      persistirCuentas();

      const sesion = crearSesion(cuenta);
      persistirSesion(sesion);
      return sesion;
    },

    async ingresar({ correo, contrasenia }) {
      const cuenta = buscarPorCorreo(correo);
      // Coincidencia exacta de correo y contraseña: cualquier desvío es un
      // fallo de credenciales, sin distinguir correo inexistente de
      // contraseña equivocada (4.7).
      if (cuenta === undefined || cuenta.contrasenia !== contrasenia) {
        throw new ErrorCredenciales();
      }

      const sesion = crearSesion(cuenta);
      persistirSesion(sesion);
      return sesion;
    },

    async cerrarSesion() {
      borrar(CLAVES_ALMACENAMIENTO.sesion);
    },

    async restaurarSesion() {
      const sesion = deserializarSesion(
        interpretar(leer(CLAVES_ALMACENAMIENTO.sesion)),
      );
      if (sesion === null) {
        // Cubre el contenido no deserializable y el que no tiene la forma de
        // una Sesion: en ambos casos se descarta lo persistido (4.12).
        borrar(CLAVES_ALMACENAMIENTO.sesion);
        return null;
      }

      const cuenta = buscarPorCorreo(sesion.correo);
      if (cuenta === undefined || cuenta.rol !== sesion.rol) {
        borrar(CLAVES_ALMACENAMIENTO.sesion);
        return null;
      }

      return crearSesion(cuenta);
    },

    cuentaDe(correo) {
      const cuenta = buscarPorCorreo(correo);
      return cuenta === undefined ? null : { ...cuenta };
    },
  };
}
