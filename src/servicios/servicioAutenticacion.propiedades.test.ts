/**
 * Tests de propiedad del ServicioAutenticacion.
 *
 * El almacenamiento es el adaptador real `crearAlmacenamientoLocal` montado
 * sobre un medio clave/valor en memoria, reconstruido en cada iteración: cada
 * caso generado arranca con la Plataforma recién cargada, sin cuentas más que la
 * del Administrador sembrado.
 *
 * Cubre: 4.1, 4.3, 4.4, 4.7, 4.12
 */

import fc from 'fast-check';
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
  arbCorreoInvalido,
  arbCorreoValido,
  arbCuenta,
  arbTexto,
  arbTextoDeLongitud,
  arbTextoEnBlanco,
} from '../tests/generadores/generadoresDominio';
import {
  CREDENCIALES_ADMINISTRADOR,
  crearServicioAutenticacion,
  type ServicioAutenticacion,
} from './servicioAutenticacion';

const CONFIGURACION = { numRuns: 100, seed: 1 };

type MedioFalso = MedioClaveValor & {
  fijar: (clave: string, valor: string) => void;
};

function crearMedioFalso(): MedioFalso {
  const datos = new Map<string, string>();
  return {
    getItem: (clave) => datos.get(clave) ?? null,
    setItem: (clave, valor) => {
      datos.set(clave, valor);
    },
    removeItem: (clave) => {
      datos.delete(clave);
    },
    fijar: (clave, valor) => {
      datos.set(clave, valor);
    },
  };
}

// --- Generadores de campos de registro ---------------------------------------

/** Valor de un campo del formulario junto con su validez esperada. */
type CampoGenerado = { valor: string; valido: boolean };

const valido = (valor: string): CampoGenerado => ({ valor, valido: true });
const invalido = (valor: string): CampoGenerado => ({ valor, valido: false });

/**
 * Nombre dentro o fuera del rango de 2 a 60 caracteres. Los válidos se filtran
 * para que el recorte no los deje por debajo del mínimo; los inválidos son
 * blancos, de un carácter o de 61 caracteres (uno por encima del máximo).
 */
const arbNombreCampo: fc.Arbitrary<CampoGenerado> = fc.oneof(
  arbTexto(2, 60)
    .filter((nombre) => nombre.trim().length >= 2)
    .map(valido),
  fc
    .oneof(arbTextoEnBlanco, arbTextoDeLongitud(1), arbTextoDeLongitud(61))
    .map(invalido),
);

/** Correo válido distinto del sembrado, o correo que incumple el formato. */
const arbCorreoCampo: fc.Arbitrary<CampoGenerado> = fc.oneof(
  arbCorreoValido
    .filter((correo) => correo !== CREDENCIALES_ADMINISTRADOR.correo)
    .map(valido),
  arbCorreoInvalido.map(invalido),
);

/** Contraseña dentro o fuera del rango de 8 a 64 caracteres. */
const arbContraseniaCampo: fc.Arbitrary<CampoGenerado> = fc.oneof(
  arbTexto(8, 64).map(valido),
  fc
    .oneof(arbTextoEnBlanco, arbTextoDeLongitud(7), arbTextoDeLongitud(65))
    .map(invalido),
);

/** Cuenta registrable: datos válidos, rol Usuario y nombre no recortable. */
const arbCuentaRegistrable = arbCuenta({ rol: 'usuario' }).filter(
  (cuenta) =>
    cuenta.nombre.trim().length >= 2 &&
    cuenta.correo !== CREDENCIALES_ADMINISTRADOR.correo,
);

// --- Generadores de sesión persistida inválida --------------------------------

/**
 * Variante de contenido persistido que la Plataforma debe descartar: texto que
 * no es JSON, JSON que no tiene la forma de una Sesion, sesión bien formada
 * cuyo correo no pertenece a ninguna cuenta, y sesión cuyo rol no coincide con
 * el de su cuenta.
 */
type VarianteSesionInvalida =
  | { clase: 'textoNoJson'; texto: string }
  | { clase: 'jsonSinFormaDeSesion'; texto: string }
  | { clase: 'correoSinCuenta'; texto: string }
  | { clase: 'rolQueNoCoincide' };

const arbTextoNoJson: fc.Arbitrary<string> = fc.oneof(
  fc.constantFrom(
    '{esto no es json',
    'undefined',
    '{"correo":',
    '[1,2',
    'sesión',
  ),
  fc
    .string({ maxLength: 20 })
    .filter((texto) => {
      try {
        JSON.parse(texto);
        return false;
      } catch {
        return true;
      }
    }),
);

const arbJsonSinFormaDeSesion: fc.Arbitrary<string> = fc.oneof(
  fc.constantFrom('null', '42', '"texto"', 'true', '[]', '{}'),
  fc
    .record({
      correo: fc.oneof(fc.integer(), fc.constant(null)),
      nombre: fc.string({ maxLength: 10 }),
      rol: fc.constant('usuario'),
    })
    .map((valor) => JSON.stringify(valor)),
  fc
    .record({
      correo: arbCorreoValido,
      nombre: fc.string({ maxLength: 10 }),
      rol: fc.constantFrom('', 'invitado', 'root', 'ADMINISTRADOR'),
    })
    .map((valor) => JSON.stringify(valor)),
  arbCorreoValido.map((correo) => JSON.stringify({ correo })),
  arbCorreoValido.map((correo) =>
    JSON.stringify([{ correo, nombre: 'Ana', rol: 'usuario' }]),
  ),
);

const arbVarianteSesionInvalida: fc.Arbitrary<VarianteSesionInvalida> = fc.oneof(
  arbTextoNoJson.map((texto) => ({ clase: 'textoNoJson' as const, texto })),
  arbJsonSinFormaDeSesion.map((texto) => ({
    clase: 'jsonSinFormaDeSesion' as const,
    texto,
  })),
  fc
    .tuple(arbCorreoValido, arbTexto(2, 30), fc.constantFrom('usuario', 'administrador'))
    .map(([correo, nombre, rol]) => ({
      clase: 'correoSinCuenta' as const,
      texto: JSON.stringify({ correo: `nadie.${correo}`, nombre, rol }),
    })),
  fc.constant({ clase: 'rolQueNoCoincide' as const }),
);

describe('ServicioAutenticacion (propiedades)', () => {
  let medio: MedioFalso;

  const crearServicio = (): ServicioAutenticacion =>
    crearServicioAutenticacion({
      almacenamiento: crearAlmacenamientoLocal({ medio }),
    });

  /** Reinicia el almacenamiento: cada iteración es una carga limpia. */
  const reiniciar = (): ServicioAutenticacion => {
    medio = crearMedioFalso();
    return crearServicio();
  };

  const leerSesionCruda = (): string | null =>
    medio.getItem(CLAVES_ALMACENAMIENTO.sesion);

  /** Cantidad de cuentas persistidas, sin contar la del Administrador. */
  const contarCuentasPersistidas = (): number => {
    const crudo = medio.getItem(CLAVES_ALMACENAMIENTO.cuentas);
    if (crudo === null) return 0;
    const sobre: unknown = JSON.parse(crudo);
    if (
      typeof sobre !== 'object' ||
      sobre === null ||
      !Array.isArray((sobre as { cuentas?: unknown }).cuentas)
    ) {
      return 0;
    }
    return (sobre as { cuentas: unknown[] }).cuentas.length;
  };

  beforeEach(() => {
    medio = crearMedioFalso();
  });

  // Feature: training-platform-landing, Property 13: La validación de registro acepta exactamente las entradas válidas
  it('Dada una terna de nombre, correo y contraseña, Cuando se registra, Entonces se acepta si y sólo si los tres campos cumplen sus límites, y si no señala exactamente los campos que incumplen sin crear la cuenta', async () => {
    // Cubre: 7.2
    await fc.assert(
      fc.asyncProperty(
        arbNombreCampo,
        arbCorreoCampo,
        arbContraseniaCampo,
        async (nombre, correo, contrasenia) => {
          const servicio = reiniciar();
          const datos = {
            nombre: nombre.valor,
            correo: correo.valor,
            contrasenia: contrasenia.valor,
          };
          const copia = { ...datos };
          const invalidos = [
            ['nombre', nombre] as const,
            ['correo', correo] as const,
            ['contrasenia', contrasenia] as const,
          ]
            .filter(([, campo]) => !campo.valido)
            .map(([nombreCampo]) => nombreCampo);

          const fallo: unknown = await servicio
            .registrar(datos)
            .then(() => null)
            .catch((error: unknown) => error);

          if (invalidos.length === 0) {
            expect(fallo).toBeNull();
            expect(servicio.cuentaDe(datos.correo)).not.toBeNull();
            return;
          }

          expect(fallo).toBeInstanceOf(ErrorValidacion);
          const campos =
            fallo instanceof ErrorValidacion ? Object.keys(fallo.campos) : [];
          // Un mensaje por cada campo que incumple y ninguno por los que cumplen.
          expect(campos.sort()).toEqual([...invalidos].sort());
          // La cuenta no se crea y los valores ingresados quedan intactos.
          expect(servicio.cuentaDe(datos.correo)).toBeNull();
          expect(contarCuentasPersistidas()).toBe(0);
          expect(leerSesionCruda()).toBeNull();
          expect(datos).toEqual(copia);
        },
      ),
      CONFIGURACION,
    );
  });

  // Feature: training-platform-landing, Property 15: El correo registrado es único
  it('Dada una cuenta existente, Cuando se intenta registrar otra cuenta con ese mismo correo, Entonces rechaza con el mensaje de correo ya registrado, deja la cantidad de cuentas sin cambios y no inicia sesión', async () => {
    // Cubre: 7.3
    await fc.assert(
      fc.asyncProperty(
        arbCuentaRegistrable,
        arbTexto(2, 60).filter((nombre) => nombre.trim().length >= 2),
        arbTexto(8, 64),
        async (cuenta, otroNombre, otraContrasenia) => {
          const servicio = reiniciar();
          await servicio.registrar({
            nombre: cuenta.nombre,
            correo: cuenta.correo,
            contrasenia: cuenta.contrasenia,
          });
          await servicio.cerrarSesion();
          const cuentasPrevias = contarCuentasPersistidas();
          const datos = {
            nombre: otroNombre,
            correo: cuenta.correo,
            contrasenia: otraContrasenia,
          };
          const copia = { ...datos };

          const fallo: unknown = await servicio
            .registrar(datos)
            .then(() => null)
            .catch((error: unknown) => error);

          expect(fallo).toBeInstanceOf(ErrorCorreoRegistrado);
          expect((fallo as Error).message).toBe('El correo ya está registrado');
          expect(contarCuentasPersistidas()).toBe(cuentasPrevias);
          expect(leerSesionCruda()).toBeNull();
          // La cuenta existente conserva sus datos y los ingresados no se pierden.
          expect(servicio.cuentaDe(cuenta.correo)?.nombre).toBe(cuenta.nombre);
          expect(datos).toEqual(copia);
        },
      ),
      CONFIGURACION,
    );
  });

  // Feature: training-platform-landing, Property 17: Las credenciales no coincidentes no abren sesión
  it('Dado un par de correo y contraseña que no coincide con ninguna cuenta, Cuando se intenta ingresar, Entonces rechaza con el mensaje de credenciales incorrectas y la sesión permanece sin iniciar', async () => {
    // Cubre: 7.4
    await fc.assert(
      fc.asyncProperty(
        arbCuentaRegistrable,
        fc.constantFrom('correoInexistente', 'contraseniaDistinta'),
        arbCorreoValido,
        arbTexto(8, 64),
        async (cuenta, desvio, correoAjeno, contraseniaAjena) => {
          const servicio = reiniciar();
          await servicio.registrar({
            nombre: cuenta.nombre,
            correo: cuenta.correo,
            contrasenia: cuenta.contrasenia,
          });
          await servicio.cerrarSesion();

          const credenciales =
            desvio === 'correoInexistente'
              ? {
                  correo: `nadie.${correoAjeno}`,
                  contrasenia: contraseniaAjena,
                }
              : {
                  correo: cuenta.correo,
                  contrasenia: `${cuenta.contrasenia}-distinta`,
                };
          const copia = { ...credenciales };

          const fallo: unknown = await servicio
            .ingresar(credenciales)
            .then(() => null)
            .catch((error: unknown) => error);

          expect(fallo).toBeInstanceOf(ErrorCredenciales);
          expect((fallo as Error).message).toBe('Credenciales incorrectas');
          // Sin sesión iniciada ni persistida, y el correo ingresado intacto.
          expect(leerSesionCruda()).toBeNull();
          expect(await servicio.restaurarSesion()).toBeNull();
          expect(credenciales).toEqual(copia);
        },
      ),
      CONFIGURACION,
    );
  });

  // Feature: training-platform-landing, Property 19: Toda sesión persistida inválida se descarta
  it('Dado un contenido persistido que no es una sesión válida de una cuenta existente, Cuando la Plataforma restaura la sesión, Entonces carga sin sesión activa y descarta ese contenido del navegador', async () => {
    // Cubre: 7.5
    await fc.assert(
      fc.asyncProperty(
        arbCuentaRegistrable,
        arbVarianteSesionInvalida,
        async (cuenta, variante) => {
          const servicio = reiniciar();
          await servicio.registrar({
            nombre: cuenta.nombre,
            correo: cuenta.correo,
            contrasenia: cuenta.contrasenia,
          });
          const contenido =
            variante.clase === 'rolQueNoCoincide'
              ? JSON.stringify({
                  correo: cuenta.correo,
                  nombre: cuenta.nombre,
                  rol: 'administrador',
                })
              : variante.texto;
          medio.fijar(CLAVES_ALMACENAMIENTO.sesion, contenido);

          const restaurada = await crearServicio().restaurarSesion();

          expect(restaurada).toBeNull();
          expect(leerSesionCruda()).toBeNull();
        },
      ),
      CONFIGURACION,
    );
  });
});
