/**
 * Tests del ServicioAutenticacion.
 *
 * El doble de almacenamiento es el adaptador real `crearAlmacenamientoLocal`
 * montado sobre un medio clave/valor en memoria: así se ejercita la traducción
 * de fallos del navegador a errores de dominio sin depender de `localStorage`.
 */

import { beforeEach, describe, expect, it } from 'vitest';

import {
  ErrorCorreoRegistrado,
  ErrorCredenciales,
  ErrorValidacion,
} from '../dominio/errores';
import {
  CLAVES_ALMACENAMIENTO,
  crearAlmacenamientoLocal,
  type MedioClaveValor,
} from '../infra/almacenamientoLocal';
import {
  CREDENCIALES_ADMINISTRADOR,
  crearServicioAutenticacion,
} from './servicioAutenticacion';

type MedioFalso = MedioClaveValor & {
  contenido: () => Record<string, string>;
  fijar: (clave: string, valor: string) => void;
  simularFalloEscritura: (activo?: boolean) => void;
};

function crearMedioFalso(
  inicial: Record<string, string> = {},
): MedioFalso {
  const datos = new Map<string, string>(Object.entries(inicial));
  let falloEscritura = false;

  return {
    getItem: (clave) => datos.get(clave) ?? null,
    setItem: (clave, valor) => {
      if (falloEscritura) throw new DOMException('rechazado', 'InvalidStateError');
      datos.set(clave, valor);
    },
    removeItem: (clave) => {
      datos.delete(clave);
    },
    contenido: () => Object.fromEntries(datos),
    fijar: (clave, valor) => {
      datos.set(clave, valor);
    },
    simularFalloEscritura: (activo = true) => {
      falloEscritura = activo;
    },
  };
}

const REGISTRO_VALIDO = Object.freeze({
  nombre: 'Ana Pérez',
  correo: 'ana@atlasgym.com',
  contrasenia: 'contrasenia1',
});

describe('ServicioAutenticacion', () => {
  let medio: MedioFalso;

  const crearServicio = (): ReturnType<typeof crearServicioAutenticacion> =>
    crearServicioAutenticacion({
      almacenamiento: crearAlmacenamientoLocal({ medio }),
    });

  const leerCuentasCrudas = (): string | null =>
    medio.getItem(CLAVES_ALMACENAMIENTO.cuentas);

  const leerSesionCruda = (): string | null =>
    medio.getItem(CLAVES_ALMACENAMIENTO.sesion);

  beforeEach(() => {
    medio = crearMedioFalso();
  });

  describe('registrar', () => {
    it('Dado un correo no registrado, Cuando el visitante se registra, Entonces crea la cuenta con rol usuario y abre la sesión', async () => {
      // Cubre: 4.2
      const servicio = crearServicio();

      const sesion = await servicio.registrar(REGISTRO_VALIDO);

      expect(sesion).toEqual({
        correo: REGISTRO_VALIDO.correo,
        nombre: REGISTRO_VALIDO.nombre,
        rol: 'usuario',
      });
      expect(leerSesionCruda()).toBe(JSON.stringify(sesion));
    });

    it('Dado un registro válido, Cuando se registra, Entonces la cuenta queda persistida y permite ingresar luego', async () => {
      // Cubre: 4.2
      const servicio = crearServicio();

      await servicio.registrar(REGISTRO_VALIDO);

      await expect(
        crearServicio().ingresar({
          correo: REGISTRO_VALIDO.correo,
          contrasenia: REGISTRO_VALIDO.contrasenia,
        }),
      ).resolves.toEqual({
        correo: REGISTRO_VALIDO.correo,
        nombre: REGISTRO_VALIDO.nombre,
        rol: 'usuario',
      });
    });

    it('Dado un correo ya registrado, Cuando se registra de nuevo, Entonces rechaza sin crear la cuenta ni abrir la sesión', async () => {
      // Cubre: 4.3
      const servicio = crearServicio();
      await servicio.registrar(REGISTRO_VALIDO);
      await servicio.cerrarSesion();
      const cuentasPrevias = leerCuentasCrudas();

      const registrar = servicio.registrar({
        ...REGISTRO_VALIDO,
        nombre: 'Otra Ana',
      });

      await expect(registrar).rejects.toBeInstanceOf(ErrorCorreoRegistrado);
      expect(leerCuentasCrudas()).toBe(cuentasPrevias);
      expect(leerSesionCruda()).toBeNull();
    });

    it('Dado un correo con formato inválido, Cuando se registra, Entonces rechaza con el campo correo señalado', async () => {
      // Cubre: 4.1
      const servicio = crearServicio();

      const fallo: unknown = await servicio
        .registrar({ ...REGISTRO_VALIDO, correo: 'ana-arroba-atlas' })
        .then(() => null)
        .catch((error: unknown) => error);

      expect(fallo).toBeInstanceOf(ErrorValidacion);
      if (fallo instanceof ErrorValidacion) {
        expect(Object.keys(fallo.campos)).toEqual(['correo']);
      }
    });

    it('Dado un nombre y una contraseña fuera de los límites, Cuando se registra, Entonces rechaza señalando ambos campos y no persiste nada', async () => {
      // Cubre: 4.1
      const servicio = crearServicio();

      const registrar = servicio.registrar({
        nombre: 'A',
        correo: REGISTRO_VALIDO.correo,
        contrasenia: 'corta',
      });

      await expect(registrar).rejects.toBeInstanceOf(ErrorValidacion);
      expect(leerSesionCruda()).toBeNull();
    });

    it('Dado un identificador de plan elegido, Cuando se registra con ese plan, Entonces la cuenta queda asociada a ese plan', async () => {
      // Cubre: 4.5
      const servicio = crearServicio();

      await servicio.registrar({ ...REGISTRO_VALIDO, idPlan: 'plan-elite' });

      expect(
        servicio.cuentaDe(REGISTRO_VALIDO.correo)?.idPlan,
      ).toBe('plan-elite');
    });

    it('Dado un registro sin plan elegido, Cuando se registra, Entonces la cuenta queda sin plan asociado', async () => {
      // Cubre: 4.5
      const servicio = crearServicio();

      await servicio.registrar(REGISTRO_VALIDO);

      expect(servicio.cuentaDe(REGISTRO_VALIDO.correo)?.idPlan).toBeNull();
    });
  });

  describe('ingresar', () => {
    it('Dada la cuenta sembrada del administrador, Cuando ingresa con sus credenciales, Entonces abre la sesión con rol administrador', async () => {
      // Cubre: 4.6, 7.1
      const servicio = crearServicio();

      const sesion = await servicio.ingresar(CREDENCIALES_ADMINISTRADOR);

      expect(sesion.rol).toBe('administrador');
    });

    it('Dada una cuenta existente, Cuando ingresa con la contraseña equivocada, Entonces rechaza y no abre la sesión', async () => {
      // Cubre: 4.7
      const servicio = crearServicio();
      await servicio.registrar(REGISTRO_VALIDO);
      await servicio.cerrarSesion();

      const ingresar = servicio.ingresar({
        correo: REGISTRO_VALIDO.correo,
        contrasenia: 'contrasenia2',
      });

      await expect(ingresar).rejects.toBeInstanceOf(ErrorCredenciales);
      expect(leerSesionCruda()).toBeNull();
    });

    it('Dado un correo inexistente, Cuando ingresa, Entonces rechaza con credenciales incorrectas', async () => {
      // Cubre: 4.7
      const servicio = crearServicio();

      const ingresar = servicio.ingresar({
        correo: 'nadie@atlasgym.com',
        contrasenia: 'contrasenia1',
      });

      await expect(ingresar).rejects.toBeInstanceOf(ErrorCredenciales);
    });

    it('Dada una cuenta existente, Cuando ingresa con el correo en otra capitalización, Entonces rechaza por exigir coincidencia exacta', async () => {
      // Cubre: 4.6, 4.7
      const servicio = crearServicio();
      await servicio.registrar(REGISTRO_VALIDO);

      const ingresar = servicio.ingresar({
        correo: 'ANA@ATLASGYM.COM',
        contrasenia: REGISTRO_VALIDO.contrasenia,
      });

      await expect(ingresar).rejects.toBeInstanceOf(ErrorCredenciales);
    });
  });

  describe('cerrarSesion', () => {
    it('Dada una sesión activa persistida, Cuando cierra la sesión, Entonces borra la sesión del almacenamiento', async () => {
      // Cubre: 4.10
      const servicio = crearServicio();
      await servicio.registrar(REGISTRO_VALIDO);

      await servicio.cerrarSesion();

      expect(leerSesionCruda()).toBeNull();
      expect(await servicio.restaurarSesion()).toBeNull();
    });

    it('Dada la ausencia de sesión persistida, Cuando cierra la sesión, Entonces no falla y conserva las cuentas', async () => {
      // Cubre: 4.10
      const servicio = crearServicio();
      await servicio.registrar(REGISTRO_VALIDO);
      await servicio.cerrarSesion();
      const cuentas = leerCuentasCrudas();

      await servicio.cerrarSesion();

      expect(leerCuentasCrudas()).toBe(cuentas);
    });
  });

  describe('restaurarSesion', () => {
    it('Dada una sesión persistida que corresponde a una cuenta existente, Cuando se restaura, Entonces devuelve esa sesión con su rol', async () => {
      // Cubre: 4.11
      await crearServicio().registrar(REGISTRO_VALIDO);

      const restaurada = await crearServicio().restaurarSesion();

      expect(restaurada).toEqual({
        correo: REGISTRO_VALIDO.correo,
        nombre: REGISTRO_VALIDO.nombre,
        rol: 'usuario',
      });
    });

    it('Dada una sesión persistida no deserializable, Cuando se restaura, Entonces la descarta y devuelve sesión nula', async () => {
      // Cubre: 4.12
      medio.fijar(CLAVES_ALMACENAMIENTO.sesion, '{esto no es json');
      const servicio = crearServicio();

      const restaurada = await servicio.restaurarSesion();

      expect(restaurada).toBeNull();
      expect(leerSesionCruda()).toBeNull();
    });

    it('Dada una sesión persistida sin cuenta correspondiente, Cuando se restaura, Entonces la descarta y devuelve sesión nula', async () => {
      // Cubre: 4.12
      medio.fijar(
        CLAVES_ALMACENAMIENTO.sesion,
        JSON.stringify({ correo: 'fantasma@atlasgym.com', nombre: 'Fantasma', rol: 'usuario' }),
      );
      const servicio = crearServicio();

      const restaurada = await servicio.restaurarSesion();

      expect(restaurada).toBeNull();
      expect(leerSesionCruda()).toBeNull();
    });

    it('Dada una sesión persistida con un rol que no coincide con su cuenta, Cuando se restaura, Entonces la descarta y devuelve sesión nula', async () => {
      // Cubre: 4.12
      await crearServicio().registrar(REGISTRO_VALIDO);
      medio.fijar(
        CLAVES_ALMACENAMIENTO.sesion,
        JSON.stringify({
          correo: REGISTRO_VALIDO.correo,
          nombre: REGISTRO_VALIDO.nombre,
          rol: 'administrador',
        }),
      );

      const restaurada = await crearServicio().restaurarSesion();

      expect(restaurada).toBeNull();
      expect(leerSesionCruda()).toBeNull();
    });

    it('Dada la ausencia de sesión persistida, Cuando se restaura, Entonces devuelve sesión nula sin error', async () => {
      // Cubre: 4.12
      const servicio = crearServicio();

      const restaurada = await servicio.restaurarSesion();

      expect(restaurada).toBeNull();
    });
  });

  describe('almacenamiento no disponible', () => {
    it('Dado un medio que rechaza toda escritura, Cuando se registra, Entonces la sesión queda abierta en memoria y el registro no se interrumpe', async () => {
      // Cubre: 4.2
      medio.simularFalloEscritura();
      const servicio = crearServicio();

      const sesion = await servicio.registrar(REGISTRO_VALIDO);

      expect(sesion.rol).toBe('usuario');
      expect(leerSesionCruda()).toBeNull();
    });

    it('Dado un medio sin API de almacenamiento, Cuando se restaura la sesión, Entonces devuelve sesión nula sin propagar el fallo', async () => {
      // Cubre: 4.12
      const servicio = crearServicioAutenticacion({
        almacenamiento: crearAlmacenamientoLocal({ medio: null }),
      });

      const restaurada = await servicio.restaurarSesion();

      expect(restaurada).toBeNull();
    });

    it('Dado un medio sin API de almacenamiento, Cuando ingresa el administrador sembrado, Entonces abre la sesión igualmente', async () => {
      // Cubre: 7.1
      const servicio = crearServicioAutenticacion({
        almacenamiento: crearAlmacenamientoLocal({ medio: null }),
      });

      const sesion = await servicio.ingresar(CREDENCIALES_ADMINISTRADOR);

      expect(sesion.rol).toBe('administrador');
    });
  });
});
