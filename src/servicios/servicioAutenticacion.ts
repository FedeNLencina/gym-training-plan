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
  ErrorOperacionNoPermitida,
  ErrorValidacion,
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

/**
 * Cuenta tal como la ve la gestión de usuarios del Panel_Admin: todo lo que
 * hace falta para listar y administrar, sin la contraseña. El tipo existe para
 * que la contraseña no pueda salir del servicio por descuido.
 */
export type ResumenCuenta = {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  idPlan: string | null;
};

export type ServicioAutenticacion = {
  registrar: (datos: DatosRegistro) => Promise<Sesion>;
  ingresar: (credenciales: Credenciales) => Promise<Sesion>;
  cerrarSesion: () => Promise<void>;
  restaurarSesion: () => Promise<Sesion | null>;
  /** Copia de la cuenta con ese correo, para aserciones y para el Panel_Admin. */
  cuentaDe: (correo: string) => Cuenta | null;
  /** Cuentas existentes, sin contraseñas, para la gestión de usuarios. */
  listarCuentas: () => Promise<ResumenCuenta[]>;
  /** Cambia el rol de una cuenta. Falla si dejaría la Plataforma sin Administrador. */
  cambiarRol: (correo: string, rol: Rol) => Promise<ResumenCuenta>;
  /** Asigna o quita el plan de una cuenta. */
  cambiarPlan: (correo: string, idPlan: string | null) => Promise<ResumenCuenta>;
  /** Elimina una cuenta. Idempotente; no admite eliminar al Administrador principal. */
  eliminarCuenta: (correo: string) => Promise<void>;
};

/** Cuentas de prueba con las que sembrar el primer arranque. */
export type DatosInicialesAutenticacion = {
  cuentas?: readonly Cuenta[];
};

export type OpcionesServicioAutenticacion = {
  almacenamiento: AlmacenamientoLocal;
  datosIniciales?: DatosInicialesAutenticacion;
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
  datosIniciales = {},
}: OpcionesServicioAutenticacion): ServicioAutenticacion {
  /**
   * Cuentas de prueba del primer arranque, sin la copia del Administrador
   * principal: ésa se reinyecta aparte y duplicarla rompería la unicidad del
   * correo.
   */
  const semilla = (datosIniciales.cuentas ?? []).filter(
    (cuenta) => cuenta.correo !== CREDENCIALES_ADMINISTRADOR.correo,
  );

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
   * Cuentas almacenadas, con la cuenta del Administrador principal siempre
   * presente: se reinyecta en cada lectura para que un almacenamiento vaciado o
   * corrupto no deje la Plataforma sin Administrador.
   *
   * Sólo se descarta la copia almacenada del Administrador principal, no la de
   * todo administrador: una cuenta que el Panel_Admin promovió a administrador
   * tiene que conservar ese rol al recargar.
   *
   * La presencia del sobre distingue dos estados que no son lo mismo:
   *
   * - **Sobre ausente o ilegible**: primer arranque, o almacenamiento corrupto.
   *   Corresponde sembrar las cuentas de prueba.
   * - **Sobre presente, incluso con la lista vacía**: estado legítimo en que el
   *   Administrador eliminó todas las cuentas de Usuario. Sembrar acá
   *   resucitaría cuentas que alguien eliminó a propósito.
   */
  const cargarCuentas = (): { cuentas: Cuenta[]; sembradas: boolean } => {
    const sobre = interpretar(leer(CLAVES_ALMACENAMIENTO.cuentas));
    const sobreUtilizable = esRegistro(sobre) && Array.isArray(sobre.cuentas);

    if (!sobreUtilizable) {
      return {
        cuentas: [crearCuentaAdministrador(), ...semilla.map(crearCuenta)],
        sembradas: semilla.length > 0,
      };
    }

    const guardadas = (sobre.cuentas as unknown[])
      .map(deserializarCuenta)
      .filter((cuenta): cuenta is Cuenta => cuenta !== null)
      .filter((cuenta) => cuenta.correo !== CREDENCIALES_ADMINISTRADOR.correo);

    return { cuentas: [crearCuentaAdministrador(), ...guardadas], sembradas: false };
  };

  const cargaInicial = cargarCuentas();
  let cuentas: Cuenta[] = cargaInicial.cuentas;

  const persistirCuentas = (): void => {
    escribir(
      CLAVES_ALMACENAMIENTO.cuentas,
      JSON.stringify({ version: VERSION_CUENTAS, cuentas }),
    );
  };

  // La siembra se conserva con el mejor esfuerzo: `escribir` ya absorbe el
  // fallo del medio, de modo que un almacenamiento caído deje las cuentas de
  // prueba vivas en memoria durante la visita en lugar de impedir el arranque.
  if (cargaInicial.sembradas) persistirCuentas();

  const persistirSesion = (sesion: Sesion): void => {
    escribir(CLAVES_ALMACENAMIENTO.sesion, JSON.stringify(sesion));
  };

  /** Búsqueda por coincidencia exacta del correo (4.6). */
  const buscarPorCorreo = (correo: string): Cuenta | undefined =>
    cuentas.find((cuenta) => cuenta.correo === correo);

  /** Proyecta una Cuenta a su resumen, descartando la contraseña. */
  const resumir = (cuenta: Cuenta): ResumenCuenta => ({
    id: cuenta.id,
    nombre: cuenta.nombre,
    correo: cuenta.correo,
    rol: cuenta.rol,
    idPlan: cuenta.idPlan,
  });

  /** Cuenta exigida por una operación de gestión, o `ErrorValidacion`. */
  const exigirCuenta = (correo: string): Cuenta => {
    const cuenta = buscarPorCorreo(correo);
    if (cuenta === undefined) {
      throw new ErrorValidacion({
        correo: 'No existe una cuenta con ese correo',
      });
    }
    return cuenta;
  };

  const esAdministradorPrincipal = (cuenta: Cuenta): boolean =>
    cuenta.correo === CREDENCIALES_ADMINISTRADOR.correo;

  const cantidadAdministradores = (): number =>
    cuentas.filter((cuenta) => cuenta.rol === 'administrador').length;

  /** Reemplaza una cuenta por su versión modificada y persiste el conjunto. */
  const reemplazar = (cuenta: Cuenta, cambios: Partial<Cuenta>): Cuenta => {
    const actualizada: Cuenta = { ...cuenta, ...cambios };
    cuentas = cuentas.map((existente) =>
      existente.correo === cuenta.correo ? actualizada : existente,
    );
    persistirCuentas();
    return actualizada;
  };

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

    async listarCuentas() {
      return cuentas.map(resumir);
    },

    async cambiarRol(correo, rol) {
      if (!(ROLES as readonly string[]).includes(rol)) {
        throw new ErrorValidacion({
          rol: `El rol debe ser uno de ${ROLES.join(' o ')}`,
        });
      }

      const cuenta = exigirCuenta(correo);

      // El Administrador principal se reinyecta como administrador en cada
      // lectura: degradarlo guardaría un rol que la próxima carga desmentiría.
      if (esAdministradorPrincipal(cuenta) && rol !== 'administrador') {
        throw new ErrorOperacionNoPermitida(
          'No podés quitarle el rol de administrador a la cuenta principal',
        );
      }

      // Sin ningún Administrador, nadie podría volver a gestionar la Plataforma.
      if (
        cuenta.rol === 'administrador' &&
        rol !== 'administrador' &&
        cantidadAdministradores() <= 1
      ) {
        throw new ErrorOperacionNoPermitida(
          'La plataforma necesita al menos un administrador',
        );
      }

      return resumir(reemplazar(cuenta, { rol }));
    },

    async cambiarPlan(correo, idPlan) {
      const cuenta = exigirCuenta(correo);
      return resumir(reemplazar(cuenta, { idPlan }));
    },

    async eliminarCuenta(correo) {
      const cuenta = buscarPorCorreo(correo);
      // Borrado idempotente: un correo ausente no altera nada.
      if (cuenta === undefined) return;

      if (esAdministradorPrincipal(cuenta)) {
        throw new ErrorOperacionNoPermitida(
          'No podés eliminar la cuenta del administrador principal',
        );
      }

      if (cuenta.rol === 'administrador' && cantidadAdministradores() <= 1) {
        throw new ErrorOperacionNoPermitida(
          'La plataforma necesita al menos un administrador',
        );
      }

      cuentas = cuentas.filter((existente) => existente.correo !== correo);
      persistirCuentas();
    },
  };
}
