/**
 * Tests de la semilla de cuentas y del progreso simulado.
 *
 * Estas pruebas no ejercitan comportamiento de la Plataforma: verifican que los
 * datos de prueba sean coherentes. Una semilla incoherente —un correo
 * duplicado, una contraseña que el registro rechazaría, un plan inexistente o
 * un avance que apunta a un Ejercicio que no existe— produce fallos difíciles
 * de rastrear al probar a mano, porque la Plataforma se ve bien hasta que se
 * toca la pantalla equivocada.
 */

import { describe, expect, it } from 'vitest';

import { validarCuenta } from '../dominio/validaciones';
import {
  crearAlmacenamientoLocal,
  type MedioClaveValor,
} from '../infra/almacenamientoLocal';
import { crearServicioAutenticacion } from '../servicios/servicioAutenticacion';
import { crearServicioProgreso } from '../servicios/servicioProgreso';
import { crearRelojFalso } from '../tests/dobles/relojFalso';
import {
  CANTIDAD_CUENTAS_SIMULADAS,
  CONTRASENIA_SIMULADA,
  CORREOS_SIMULADOS,
  crearCuentasSimuladas,
} from './cuentasSimuladas';
import { crearEntrenamientosSimulados } from './entrenamientosSimulados';
import { crearPlanesSimulados } from './planesSimulados';
import { crearProgresoSimulado } from './progresoSimulado';

const cuentas = crearCuentasSimuladas();
const entrenamientos = crearEntrenamientosSimulados();
const planes = crearPlanesSimulados();
const progreso = crearProgresoSimulado();

/** Identificadores de Ejercicio existentes, por Entrenamiento. */
const ejerciciosPorEntrenamiento = new Map(
  entrenamientos.map((entrenamiento) => [
    entrenamiento.id,
    new Set(entrenamiento.ejercicios.map((ejercicio) => ejercicio.id)),
  ]),
);

describe('crearCuentasSimuladas', () => {
  it('Dada la semilla Cuando se construye Entonces no repite ningún correo', () => {
    const correos = cuentas.map((cuenta) => cuenta.correo);

    expect(new Set(correos).size).toBe(correos.length);
  });

  it('Dada la semilla Cuando se construye Entonces incluye al menos un administrador', () => {
    expect(
      cuentas.some((cuenta) => cuenta.rol === 'administrador'),
    ).toBe(true);
  });

  it('Dada la semilla Cuando se construye Entonces incluye al menos un usuario', () => {
    expect(cuentas.some((cuenta) => cuenta.rol === 'usuario')).toBe(true);
  });

  it('Dada la semilla Cuando se valida cada cuenta Entonces todas pasan las reglas del registro', () => {
    // Si una contraseña sembrada no cumpliera `validarCuenta`, la cuenta
    // existiría pero nadie podría crearla desde el formulario: la semilla
    // dejaría de representar un estado alcanzable de la Plataforma.
    const invalidas = cuentas
      .filter((cuenta) => validarCuenta(cuenta) !== null)
      .map((cuenta) => cuenta.correo);

    expect(invalidas).toEqual([]);
  });

  it('Dada la semilla Cuando se construye Entonces todo plan referenciado existe', () => {
    const idsPlan = new Set(planes.map((plan) => plan.id));
    const colgados = cuentas
      .filter((cuenta) => cuenta.idPlan !== null && !idsPlan.has(cuenta.idPlan))
      .map((cuenta) => cuenta.correo);

    expect(colgados).toEqual([]);
  });

  it('Dada la semilla Cuando se construye dos veces Entonces produce los mismos identificadores', () => {
    // Identificadores estables: las pruebas y el progreso simulado los
    // referencian, así que no pueden venir de `crypto.randomUUID()`.
    expect(crearCuentasSimuladas().map((cuenta) => cuenta.id)).toEqual(
      cuentas.map((cuenta) => cuenta.id),
    );
  });

  it('Dada la semilla Cuando se muta el resultado Entonces una construcción nueva queda intacta', () => {
    const primera = crearCuentasSimuladas();
    primera[0].nombre = 'Mutado';

    expect(crearCuentasSimuladas()[0].nombre).not.toBe('Mutado');
  });

  it('Dados los correos publicados Cuando se comparan con la semilla Entonces coinciden con cuentas reales', () => {
    const correos = new Set(cuentas.map((cuenta) => cuenta.correo));

    expect(
      Object.values(CORREOS_SIMULADOS).filter(
        (correo) => !correos.has(correo),
      ),
    ).toEqual([]);
  });
});

describe('crearProgresoSimulado', () => {
  it('Dado el progreso simulado Cuando se construye Entonces toda cuenta referenciada existe en la semilla', () => {
    const correos = new Set(cuentas.map((cuenta) => cuenta.correo));
    const desconocidos = Object.keys(progreso).filter(
      (correo) => !correos.has(correo),
    );

    expect(desconocidos).toEqual([]);
  });

  it('Dado el progreso simulado Cuando se construye Entonces todo Entrenamiento con avance existe', () => {
    const idsAvance = Object.values(progreso).flatMap((cuenta) =>
      Object.keys(cuenta.porEntrenamiento),
    );
    const desconocidos = idsAvance.filter(
      (id) => !ejerciciosPorEntrenamiento.has(id),
    );

    expect(desconocidos).toEqual([]);
  });

  it('Dado el progreso simulado Cuando se construye Entonces todo Ejercicio completado pertenece a su Entrenamiento', () => {
    const colgados = Object.values(progreso).flatMap((cuenta) =>
      Object.values(cuenta.porEntrenamiento).flatMap((avance) =>
        avance.completados.filter(
          (idEjercicio) =>
            !(
              ejerciciosPorEntrenamiento
                .get(avance.idEntrenamiento)
                ?.has(idEjercicio) ?? false
            ),
        ),
      ),
    );

    expect(colgados).toEqual([]);
  });

  it('Dado el progreso simulado Cuando se construye Entonces el avance guardado coincide con su Entrenamiento', () => {
    const descalzados = Object.values(progreso).flatMap((cuenta) =>
      Object.entries(cuenta.porEntrenamiento)
        .filter(([clave, avance]) => clave !== avance.idEntrenamiento)
        .map(([clave]) => clave),
    );

    expect(descalzados).toEqual([]);
  });

  it('Dado el progreso simulado Cuando se construye Entonces todo Entrenamiento del historial existe', () => {
    const desconocidos = Object.values(progreso)
      .flatMap((cuenta) => cuenta.historial)
      .filter((sesion) => !ejerciciosPorEntrenamiento.has(sesion.idEntrenamiento))
      .map((sesion) => sesion.idEntrenamiento);

    expect(desconocidos).toEqual([]);
  });

  it('Dado el progreso simulado Cuando se construye Entonces cada sesión del historial está completa', () => {
    // Una sesión sólo entra al historial al completarse, así que el recuento de
    // completados debe igualar el total.
    const incoherentes = Object.values(progreso)
      .flatMap((cuenta) => cuenta.historial)
      .filter(
        (sesion) =>
          sesion.ejerciciosTotales <= 0 ||
          sesion.ejerciciosCompletados !== sesion.ejerciciosTotales,
      )
      .map((sesion) => sesion.id);

    expect(incoherentes).toEqual([]);
  });

  it('Dado el progreso simulado Cuando se construye Entonces toda fecha del historial es legible', () => {
    const ilegibles = Object.values(progreso)
      .flatMap((cuenta) => cuenta.historial)
      .filter((sesion) => Number.isNaN(Date.parse(sesion.completadoEn)))
      .map((sesion) => sesion.id);

    expect(ilegibles).toEqual([]);
  });

  it('Dado el progreso simulado Cuando se construye Entonces no repite identificadores de sesión', () => {
    const ids = Object.values(progreso).flatMap((cuenta) =>
      cuenta.historial.map((sesion) => sesion.id),
    );

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('Dado el progreso simulado Cuando se muta el resultado Entonces una construcción nueva queda intacta', () => {
    const primera = crearProgresoSimulado();
    const algunCorreo = Object.keys(primera)[0];
    primera[algunCorreo].historial = [];

    expect(crearProgresoSimulado()[algunCorreo].historial.length).toBeGreaterThan(
      0,
    );
  });

  it('Dado el progreso simulado Cuando se busca una cuenta sin actividad Entonces hay al menos una cuenta sin progreso', () => {
    // El estado vacío de "Mi progreso" también tiene que poder probarse a mano.
    const conProgreso = new Set(Object.keys(progreso));
    const sinProgreso = cuentas.filter(
      (cuenta) => cuenta.rol === 'usuario' && !conProgreso.has(cuenta.correo),
    );

    expect(sinProgreso.length).toBeGreaterThan(0);
  });
});

describe('integración de la semilla con los servicios reales', () => {
  // Las pruebas anteriores verifican que la semilla sea coherente, y las del
  // ServicioAutenticacion que la siembra funcione con una semilla de prueba.
  // Acá se cierra el hueco entre las dos: que la semilla real, cargada por los
  // servicios reales, produzca cuentas con las que de verdad se pueda entrar.

  /** Medio clave/valor en memoria, para no depender de `localStorage`. */
  function crearMedioFalso(): MedioClaveValor {
    const datos = new Map<string, string>();
    return {
      getItem: (clave) => datos.get(clave) ?? null,
      setItem: (clave, valor) => {
        datos.set(clave, valor);
      },
      removeItem: (clave) => {
        datos.delete(clave);
      },
    };
  }

  const crearServicio = (
    medio: MedioClaveValor,
  ): ReturnType<typeof crearServicioAutenticacion> =>
    crearServicioAutenticacion({
      almacenamiento: crearAlmacenamientoLocal({ medio }),
      datosIniciales: { cuentas: crearCuentasSimuladas() },
    });

  it.each(Object.values(CORREOS_SIMULADOS))(
    'Dada la semilla real Cuando se ingresa con %s Entonces abre la sesión',
    async (correo) => {
      const servicio = crearServicio(crearMedioFalso());

      const sesion = await servicio.ingresar({
        correo,
        contrasenia: CONTRASENIA_SIMULADA,
      });

      expect(sesion.correo).toBe(correo);
    },
  );

  it('Dada la semilla real Cuando se listan las cuentas Entonces incluye al Administrador principal y a las sembradas', async () => {
    const servicio = crearServicio(crearMedioFalso());

    const listadas = await servicio.listarCuentas();

    expect(listadas).toHaveLength(CANTIDAD_CUENTAS_SIMULADAS + 1);
  });

  it('Dada la semilla real Cuando se construye el servicio dos veces Entonces no duplica cuentas', async () => {
    const medio = crearMedioFalso();
    crearServicio(medio);

    const listadas = await crearServicio(medio).listarCuentas();

    expect(new Set(listadas.map((cuenta) => cuenta.correo)).size).toBe(
      listadas.length,
    );
  });

  it('Dado el progreso simulado real Cuando lo carga el ServicioProgreso Entonces cada cuenta recupera su historial', async () => {
    const servicio = crearServicioProgreso({
      almacenamiento: crearAlmacenamientoLocal({ medio: crearMedioFalso() }),
      reloj: crearRelojFalso(),
      datosIniciales: { porCorreo: crearProgresoSimulado() },
    });

    const historialDeAna = await servicio.obtenerHistorial(
      CORREOS_SIMULADOS.ana,
    );

    expect(historialDeAna).toHaveLength(
      progreso[CORREOS_SIMULADOS.ana].historial.length,
    );
  });

  it('Dado el progreso simulado real Cuando lo carga el ServicioProgreso Entonces una cuenta sin semilla queda sin historial', async () => {
    const servicio = crearServicioProgreso({
      almacenamiento: crearAlmacenamientoLocal({ medio: crearMedioFalso() }),
      reloj: crearRelojFalso(),
      datosIniciales: { porCorreo: crearProgresoSimulado() },
    });

    expect(
      await servicio.obtenerHistorial(CORREOS_SIMULADOS.diego),
    ).toEqual([]);
  });

  it('Dado el progreso simulado real Cuando se consulta el avance sembrado de una cuenta Entonces lo recupera', async () => {
    const servicio = crearServicioProgreso({
      almacenamiento: crearAlmacenamientoLocal({ medio: crearMedioFalso() }),
      reloj: crearRelojFalso(),
      datosIniciales: { porCorreo: crearProgresoSimulado() },
    });

    const avance = await servicio.obtenerAvance(
      CORREOS_SIMULADOS.carla,
      'ent-funcional-cuerpo-completo',
    );

    expect(avance?.completados).toHaveLength(4);
  });
});
