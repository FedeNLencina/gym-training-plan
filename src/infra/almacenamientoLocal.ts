/**
 * Adaptador de `localStorage`: única puerta de la aplicación al almacenamiento
 * de cadenas del navegador.
 *
 * Es la capa que conoce la API del navegador y traduce sus fallos a errores de
 * dominio, de modo que ni los servicios ni las vistas tengan que interpretar
 * `DOMException`. Dos fallos se distinguen porque el criterio 8.8 los trata
 * distinto de cara al usuario: la cuota agotada devuelve
 * `ErrorEspacioInsuficiente` y cualquier otro rechazo, incluida la ausencia de
 * la API, devuelve `ErrorAlmacenamiento`.
 *
 * El medio se inyecta para poder sustituirlo por un doble en las pruebas.
 *
 * Cubre: 8.8
 */

import {
  ErrorAlmacenamiento,
  ErrorEspacioInsuficiente,
} from '../dominio/errores';

/** Porción de la API de `Storage` que usa la Plataforma. */
export type MedioClaveValor = {
  getItem: (clave: string) => string | null;
  setItem: (clave: string, valor: string) => void;
  removeItem: (clave: string) => void;
};

export type AlmacenamientoLocal = {
  /** Devuelve la cadena guardada, o nulo si la clave no existe. */
  leer: (clave: string) => string | null;
  /** Conserva la cadena bajo la clave dada. */
  escribir: (clave: string, valor: string) => void;
  /** Quita la clave; sobre una clave ausente no hace nada. */
  borrar: (clave: string) => void;
  /** Indica si el medio admite escrituras, sin propagar ningún error. */
  disponible: () => boolean;
};

/** Claves del almacenamiento local (diseño: Claves de almacenamiento). */
export const CLAVES_ALMACENAMIENTO = Object.freeze({
  entrenamientos: 'atlas.entrenamientos',
  cuentas: 'atlas.cuentas',
  sesion: 'atlas.sesion',
} as const);

/** Clave descartable con la que se sondea la disponibilidad del medio. */
const CLAVE_SONDEO = 'atlas.sondeo';

/** Nombres con los que los navegadores señalan la cuota agotada. */
const NOMBRES_CUOTA = ['QuotaExceededError', 'NS_ERROR_DOM_QUOTA_REACHED'];

/** Códigos heredados de `DOMException` para la cuota agotada. */
const CODIGOS_CUOTA = [22, 1014];

function esErrorDeCuota(fallo: unknown): boolean {
  if (!(fallo instanceof DOMException)) return false;
  return NOMBRES_CUOTA.includes(fallo.name) || CODIGOS_CUOTA.includes(fallo.code);
}

/**
 * Obtiene `localStorage` del navegador. El acceso mismo puede lanzar cuando el
 * navegador bloquea el almacenamiento por configuración de privacidad, así que
 * la ausencia se representa como `null` en lugar de propagarse.
 */
export function obtenerMedioDelNavegador(): MedioClaveValor | null {
  try {
    const medio: unknown = globalThis.localStorage;
    return medio === undefined || medio === null
      ? null
      : (medio as MedioClaveValor);
  } catch {
    return null;
  }
}

export type OpcionesAlmacenamientoLocal = {
  /** Medio a usar; `null` representa la ausencia de la API. */
  medio?: MedioClaveValor | null;
};

export function crearAlmacenamientoLocal({
  medio = obtenerMedioDelNavegador(),
}: OpcionesAlmacenamientoLocal = {}): AlmacenamientoLocal {
  /** Traduce todo fallo del navegador al error de dominio correspondiente. */
  const traducir = (fallo: unknown): ErrorAlmacenamiento =>
    esErrorDeCuota(fallo)
      ? new ErrorEspacioInsuficiente()
      : new ErrorAlmacenamiento();

  const exigirMedio = (): MedioClaveValor => {
    if (medio === null) throw new ErrorAlmacenamiento();
    return medio;
  };

  return {
    leer(clave) {
      const activo = exigirMedio();
      try {
        return activo.getItem(clave);
      } catch (fallo) {
        throw traducir(fallo);
      }
    },

    escribir(clave, valor) {
      const activo = exigirMedio();
      try {
        activo.setItem(clave, valor);
      } catch (fallo) {
        // El rechazo de `setItem` deja el contenido previo intacto: no hay nada
        // que revertir, sólo que informar.
        throw traducir(fallo);
      }
    },

    borrar(clave) {
      const activo = exigirMedio();
      try {
        activo.removeItem(clave);
      } catch (fallo) {
        throw traducir(fallo);
      }
    },

    disponible() {
      if (medio === null) return false;
      try {
        medio.setItem(CLAVE_SONDEO, '1');
        medio.removeItem(CLAVE_SONDEO);
        return true;
      } catch {
        return false;
      }
    },
  };
}
