import { describe, expect, it } from 'vitest';

import {
  ErrorAlmacenamiento,
  ErrorEspacioInsuficiente,
} from '../dominio/errores';
import {
  CLAVES_ALMACENAMIENTO,
  crearAlmacenamientoLocal,
  type MedioClaveValor,
} from './almacenamientoLocal';

/**
 * Doble de `localStorage`. Guarda las cadenas en memoria y permite inyectar el
 * fallo exacto que arroja el navegador: rechazo de lectura y rechazo de
 * escritura con el error que se le indique (cuota u otro).
 */
type OpcionesMedioFalso = {
  inicial?: Record<string, string>;
  errorLectura?: unknown;
  errorEscritura?: unknown;
  errorBorrado?: unknown;
};

type MedioFalso = MedioClaveValor & {
  contenido: () => Record<string, string>;
};

function crearMedioFalso({
  inicial = {},
  errorLectura,
  errorEscritura,
  errorBorrado,
}: OpcionesMedioFalso = {}): MedioFalso {
  const datos = new Map<string, string>(Object.entries(inicial));

  return {
    getItem(clave) {
      if (errorLectura !== undefined) throw errorLectura;
      const valor = datos.get(clave);
      return valor === undefined ? null : valor;
    },
    setItem(clave, valor) {
      if (errorEscritura !== undefined) throw errorEscritura;
      datos.set(clave, valor);
    },
    removeItem(clave) {
      if (errorBorrado !== undefined) throw errorBorrado;
      datos.delete(clave);
    },
    contenido() {
      return Object.fromEntries(datos);
    },
  };
}

/** Error de cuota tal como lo lanzan los navegadores basados en Chromium. */
const errorDeCuota = (): DOMException =>
  new DOMException('quota exceeded', 'QuotaExceededError');

/** Variante histórica de Firefox: nombre propio y código 1014. */
const errorDeCuotaFirefox = (): DOMException =>
  new DOMException('persistent storage full', 'NS_ERROR_DOM_QUOTA_REACHED');

describe('almacenamientoLocal', () => {
  describe('leer', () => {
    it('Dado un medio con la clave de sesión guardada Cuando se lee esa clave Entonces devuelve la cadena conservada', () => {
      // Cubre: 8.8
      const medio = crearMedioFalso({
        inicial: { [CLAVES_ALMACENAMIENTO.sesion]: '{"correo":"ana@atlas.com"}' },
      });
      const almacenamiento = crearAlmacenamientoLocal({ medio });

      const leido = almacenamiento.leer(CLAVES_ALMACENAMIENTO.sesion);

      expect(leido).toBe('{"correo":"ana@atlas.com"}');
    });

    it('Dado un medio sin la clave pedida Cuando se lee esa clave Entonces devuelve nulo sin lanzar error', () => {
      // Cubre: 8.8
      const almacenamiento = crearAlmacenamientoLocal({
        medio: crearMedioFalso(),
      });

      const leido = almacenamiento.leer(CLAVES_ALMACENAMIENTO.entrenamientos);

      expect(leido).toBeNull();
    });

    it('Dada la ausencia de la API de almacenamiento Cuando se lee una clave Entonces falla con ErrorAlmacenamiento', () => {
      // Cubre: 8.8
      const almacenamiento = crearAlmacenamientoLocal({ medio: null });

      const leer = (): string | null =>
        almacenamiento.leer(CLAVES_ALMACENAMIENTO.entrenamientos);

      expect(leer).toThrow(ErrorAlmacenamiento);
    });

    it('Dado un medio que rechaza la lectura Cuando se lee una clave Entonces falla con ErrorAlmacenamiento y no con espacio insuficiente', () => {
      // Cubre: 8.8
      const almacenamiento = crearAlmacenamientoLocal({
        medio: crearMedioFalso({ errorLectura: new Error('acceso denegado') }),
      });

      const leer = (): string | null =>
        almacenamiento.leer(CLAVES_ALMACENAMIENTO.cuentas);

      expect(leer).toThrow(ErrorAlmacenamiento);
      expect(leer).not.toThrow(ErrorEspacioInsuficiente);
    });
  });

  describe('escribir', () => {
    it('Dado un medio disponible Cuando se escribe una clave Entonces el medio conserva exactamente esa cadena', () => {
      // Cubre: 8.8
      const medio = crearMedioFalso();
      const almacenamiento = crearAlmacenamientoLocal({ medio });

      almacenamiento.escribir(CLAVES_ALMACENAMIENTO.entrenamientos, '{"version":1}');

      expect(medio.contenido()).toEqual({
        [CLAVES_ALMACENAMIENTO.entrenamientos]: '{"version":1}',
      });
    });

    it('Dada la ausencia de la API de almacenamiento Cuando se escribe una clave Entonces falla con ErrorAlmacenamiento', () => {
      // Cubre: 8.8
      const almacenamiento = crearAlmacenamientoLocal({ medio: null });

      const escribir = (): void =>
        almacenamiento.escribir(CLAVES_ALMACENAMIENTO.entrenamientos, '{}');

      expect(escribir).toThrow(ErrorAlmacenamiento);
    });

    it('Dado un medio con la cuota agotada Cuando se escribe una clave Entonces falla con ErrorEspacioInsuficiente y deja intacto el contenido previo', () => {
      // Cubre: 8.8
      const medio = crearMedioFalso({
        inicial: { [CLAVES_ALMACENAMIENTO.entrenamientos]: '{"version":1}' },
        errorEscritura: errorDeCuota(),
      });
      const almacenamiento = crearAlmacenamientoLocal({ medio });

      const escribir = (): void =>
        almacenamiento.escribir(CLAVES_ALMACENAMIENTO.entrenamientos, '{"version":2}');

      expect(escribir).toThrow(ErrorEspacioInsuficiente);
      expect(medio.contenido()).toEqual({
        [CLAVES_ALMACENAMIENTO.entrenamientos]: '{"version":1}',
      });
    });

    it('Dado un medio que agota la cuota con el nombre de error de Firefox Cuando se escribe una clave Entonces falla con ErrorEspacioInsuficiente', () => {
      // Cubre: 8.8
      const almacenamiento = crearAlmacenamientoLocal({
        medio: crearMedioFalso({ errorEscritura: errorDeCuotaFirefox() }),
      });

      const escribir = (): void =>
        almacenamiento.escribir(CLAVES_ALMACENAMIENTO.cuentas, '{}');

      expect(escribir).toThrow(ErrorEspacioInsuficiente);
    });

    it('Dado un medio que rechaza la escritura por un motivo ajeno a la cuota Cuando se escribe una clave Entonces falla con ErrorAlmacenamiento', () => {
      // Cubre: 8.8
      const almacenamiento = crearAlmacenamientoLocal({
        medio: crearMedioFalso({ errorEscritura: new Error('medio de sólo lectura') }),
      });

      const escribir = (): void =>
        almacenamiento.escribir(CLAVES_ALMACENAMIENTO.cuentas, '{}');

      expect(escribir).toThrow(ErrorAlmacenamiento);
      expect(escribir).not.toThrow(ErrorEspacioInsuficiente);
    });
  });

  describe('borrar', () => {
    it('Dado un medio con la clave de sesión guardada Cuando se borra esa clave Entonces el medio queda sin esa clave', () => {
      // Cubre: 8.8
      const medio = crearMedioFalso({
        inicial: { [CLAVES_ALMACENAMIENTO.sesion]: '{"correo":"ana@atlas.com"}' },
      });
      const almacenamiento = crearAlmacenamientoLocal({ medio });

      almacenamiento.borrar(CLAVES_ALMACENAMIENTO.sesion);

      expect(medio.contenido()).toEqual({});
    });

    it('Dado un medio sin la clave pedida Cuando se borra esa clave Entonces la operación termina sin error y sin cambios', () => {
      // Cubre: 8.8
      const medio = crearMedioFalso({
        inicial: { [CLAVES_ALMACENAMIENTO.cuentas]: '{"version":1}' },
      });
      const almacenamiento = crearAlmacenamientoLocal({ medio });

      almacenamiento.borrar(CLAVES_ALMACENAMIENTO.sesion);

      expect(medio.contenido()).toEqual({
        [CLAVES_ALMACENAMIENTO.cuentas]: '{"version":1}',
      });
    });

    it('Dada la ausencia de la API de almacenamiento Cuando se borra una clave Entonces falla con ErrorAlmacenamiento', () => {
      // Cubre: 8.8
      const almacenamiento = crearAlmacenamientoLocal({ medio: null });

      const borrar = (): void =>
        almacenamiento.borrar(CLAVES_ALMACENAMIENTO.sesion);

      expect(borrar).toThrow(ErrorAlmacenamiento);
    });

    it('Dado un medio que rechaza el borrado Cuando se borra una clave Entonces falla con ErrorAlmacenamiento', () => {
      // Cubre: 8.8
      const almacenamiento = crearAlmacenamientoLocal({
        medio: crearMedioFalso({ errorBorrado: new Error('acceso denegado') }),
      });

      const borrar = (): void =>
        almacenamiento.borrar(CLAVES_ALMACENAMIENTO.sesion);

      expect(borrar).toThrow(ErrorAlmacenamiento);
    });
  });

  describe('disponible', () => {
    it('Dado un medio que responde a la prueba de escritura Cuando se consulta la disponibilidad Entonces informa que el almacenamiento está disponible', () => {
      // Cubre: 8.8
      const almacenamiento = crearAlmacenamientoLocal({
        medio: crearMedioFalso(),
      });

      const disponible = almacenamiento.disponible();

      expect(disponible).toBe(true);
    });

    it('Dada la ausencia de la API de almacenamiento Cuando se consulta la disponibilidad Entonces informa que el almacenamiento no está disponible', () => {
      // Cubre: 8.8
      const almacenamiento = crearAlmacenamientoLocal({ medio: null });

      const disponible = almacenamiento.disponible();

      expect(disponible).toBe(false);
    });

    it('Dado un medio con la cuota agotada Cuando se consulta la disponibilidad Entonces informa que el almacenamiento no está disponible', () => {
      // Cubre: 8.8
      const almacenamiento = crearAlmacenamientoLocal({
        medio: crearMedioFalso({ errorEscritura: errorDeCuota() }),
      });

      const disponible = almacenamiento.disponible();

      expect(disponible).toBe(false);
    });
  });

  describe('medio del navegador', () => {
    it('Dado el entorno de pruebas con localStorage real Cuando se escribe y se lee la misma clave Entonces devuelve la cadena conservada', () => {
      // Cubre: 8.8
      const almacenamiento = crearAlmacenamientoLocal();
      window.localStorage.clear();

      almacenamiento.escribir(CLAVES_ALMACENAMIENTO.entrenamientos, '{"version":1}');

      expect(almacenamiento.leer(CLAVES_ALMACENAMIENTO.entrenamientos)).toBe(
        '{"version":1}',
      );
      window.localStorage.clear();
    });
  });
});
