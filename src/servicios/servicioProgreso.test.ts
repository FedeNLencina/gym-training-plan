/**
 * Tests del ServicioProgreso.
 *
 * Lo que estas pruebas fijan, antes que cualquier otra cosa, es el aislamiento:
 * el avance y el historial de una cuenta no pueden filtrarse a otra. El resto
 * —persistencia entre visitas, siembra del primer arranque y tolerancia a un
 * almacenamiento caído— sigue el mismo criterio que el Repositorio_Datos.
 *
 * El doble de almacenamiento es el adaptador real `crearAlmacenamientoLocal`
 * montado sobre un medio clave/valor en memoria, y el tiempo viene del reloj
 * falso, de modo que las marcas `actualizadoEn` sean deterministas.
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { crearProgresoCuenta, crearSesionCompletada } from '../dominio/modelos';
import {
  CLAVES_ALMACENAMIENTO,
  crearAlmacenamientoLocal,
  type MedioClaveValor,
} from '../infra/almacenamientoLocal';
import { crearRelojFalso, type RelojFalso } from '../tests/dobles/relojFalso';
import {
  TOPE_HISTORIAL,
  crearServicioProgreso,
  type ServicioProgreso,
} from './servicioProgreso';

const ANA = 'ana@atlasgym.com';
const BRUNO = 'bruno@atlasgym.com';

type MedioFalso = MedioClaveValor & {
  fijar: (clave: string, valor: string) => void;
  crudo: (clave: string) => string | null;
  simularFalloEscritura: (activo?: boolean) => void;
};

function crearMedioFalso(): MedioFalso {
  const datos = new Map<string, string>();
  let falloEscritura = false;

  return {
    getItem: (clave) => datos.get(clave) ?? null,
    setItem: (clave, valor) => {
      if (falloEscritura) {
        throw new DOMException('rechazado', 'InvalidStateError');
      }
      datos.set(clave, valor);
    },
    removeItem: (clave) => {
      datos.delete(clave);
    },
    fijar: (clave, valor) => {
      datos.set(clave, valor);
    },
    crudo: (clave) => datos.get(clave) ?? null,
    simularFalloEscritura: (activo = true) => {
      falloEscritura = activo;
    },
  };
}

describe('ServicioProgreso', () => {
  let medio: MedioFalso;
  let reloj: RelojFalso;

  /** Servicio sobre el medio en curso, sin progreso sembrado. */
  const crearServicio = (): ServicioProgreso =>
    crearServicioProgreso({
      almacenamiento: crearAlmacenamientoLocal({ medio }),
      reloj,
    });

  beforeEach(() => {
    medio = crearMedioFalso();
    // Instante fijo y legible: 2026-01-01T00:00:00.000Z.
    reloj = crearRelojFalso({ ahoraInicial: Date.parse('2026-01-01T00:00:00.000Z') });
  });

  describe('aislamiento entre cuentas', () => {
    it('Dado el avance de una cuenta Cuando otra cuenta consulta el mismo Entrenamiento Entonces no ve ese avance', async () => {
      const servicio = crearServicio();
      await servicio.guardarAvance(ANA, 'ent-1', ['ej-1', 'ej-2']);

      const avanceDeBruno = await servicio.obtenerAvance(BRUNO, 'ent-1');

      expect(avanceDeBruno).toBeNull();
    });

    it('Dado el historial de una cuenta Cuando otra cuenta consulta su historial Entonces lo recibe vacío', async () => {
      const servicio = crearServicio();
      await servicio.registrarSesionCompletada(ANA, {
        idEntrenamiento: 'ent-1',
        tituloEntrenamiento: 'Fuerza',
        ejerciciosCompletados: 3,
        ejerciciosTotales: 3,
      });

      const historialDeBruno = await servicio.obtenerHistorial(BRUNO);

      expect(historialDeBruno).toEqual([]);
    });

    it('Dadas dos cuentas con avance en el mismo Entrenamiento Cuando se consulta cada una Entonces cada avance es el propio', async () => {
      const servicio = crearServicio();
      await servicio.guardarAvance(ANA, 'ent-1', ['ej-1']);
      await servicio.guardarAvance(BRUNO, 'ent-1', ['ej-2', 'ej-3']);

      const avance = await servicio.obtenerAvance(ANA, 'ent-1');

      expect(avance?.completados).toEqual(['ej-1']);
    });

    it('Dadas dos cuentas con avance Cuando se guarda el de una Entonces no borra el de la otra', async () => {
      const servicio = crearServicio();
      await servicio.guardarAvance(BRUNO, 'ent-1', ['ej-2']);

      await servicio.guardarAvance(ANA, 'ent-1', ['ej-1']);

      expect((await servicio.obtenerAvance(BRUNO, 'ent-1'))?.completados).toEqual(
        ['ej-2'],
      );
    });
  });

  describe('guardarAvance', () => {
    it('Dado ningún avance previo Cuando se guarda Entonces conserva los Ejercicios completados', async () => {
      const servicio = crearServicio();

      const avance = await servicio.guardarAvance(ANA, 'ent-1', ['ej-1', 'ej-2']);

      expect(avance.completados).toEqual(['ej-1', 'ej-2']);
    });

    it('Dado un avance con identificadores repetidos Cuando se guarda Entonces descarta los duplicados', async () => {
      const servicio = crearServicio();

      const avance = await servicio.guardarAvance(ANA, 'ent-1', [
        'ej-1',
        'ej-1',
        'ej-2',
      ]);

      expect(avance.completados).toEqual(['ej-1', 'ej-2']);
    });

    it('Dado el reloj inyectado Cuando se guarda un avance Entonces registra su instante', async () => {
      const servicio = crearServicio();

      const avance = await servicio.guardarAvance(ANA, 'ent-1', ['ej-1']);

      expect(avance.actualizadoEn).toBe('2026-01-01T00:00:00.000Z');
    });

    it('Dado un avance previo Cuando se guarda otro para el mismo Entrenamiento Entonces lo reemplaza', async () => {
      const servicio = crearServicio();
      await servicio.guardarAvance(ANA, 'ent-1', ['ej-1', 'ej-2']);

      await servicio.guardarAvance(ANA, 'ent-1', ['ej-3']);

      expect((await servicio.obtenerAvance(ANA, 'ent-1'))?.completados).toEqual([
        'ej-3',
      ]);
    });

    it('Dado un avance en dos Entrenamientos Cuando se guarda uno Entonces el otro queda intacto', async () => {
      const servicio = crearServicio();
      await servicio.guardarAvance(ANA, 'ent-1', ['ej-1']);

      await servicio.guardarAvance(ANA, 'ent-2', ['ej-9']);

      expect((await servicio.obtenerAvance(ANA, 'ent-1'))?.completados).toEqual([
        'ej-1',
      ]);
    });

    it('Dado un avance guardado Cuando se construye el servicio de nuevo Entonces el avance persiste', async () => {
      await crearServicio().guardarAvance(ANA, 'ent-1', ['ej-1']);

      const avance = await crearServicio().obtenerAvance(ANA, 'ent-1');

      expect(avance?.completados).toEqual(['ej-1']);
    });

    it('Dado un avance vacío Cuando se guarda Entonces olvida el avance del Entrenamiento', async () => {
      // Desmarcar el último Ejercicio equivale a no tener avance: guardar una
      // entrada vacía sólo haría crecer el almacenamiento sin aportar nada.
      const servicio = crearServicio();
      await servicio.guardarAvance(ANA, 'ent-1', ['ej-1']);

      await servicio.guardarAvance(ANA, 'ent-1', []);

      expect(await servicio.obtenerAvance(ANA, 'ent-1')).toBeNull();
    });
  });

  describe('obtenerAvance', () => {
    it('Dada una cuenta sin avance Cuando se consulta Entonces devuelve nulo', async () => {
      const servicio = crearServicio();

      expect(await servicio.obtenerAvance(ANA, 'ent-1')).toBeNull();
    });

    it('Dado un avance guardado Cuando se muta el resultado Entonces el estado del servicio queda intacto', async () => {
      const servicio = crearServicio();
      const avance = await servicio.guardarAvance(ANA, 'ent-1', ['ej-1']);
      avance.completados.push('ej-colado');

      expect((await servicio.obtenerAvance(ANA, 'ent-1'))?.completados).toEqual([
        'ej-1',
      ]);
    });
  });

  describe('registrarSesionCompletada', () => {
    it('Dada una sesión terminada Cuando se registra Entonces aparece en el historial de la cuenta', async () => {
      const servicio = crearServicio();

      await servicio.registrarSesionCompletada(ANA, {
        idEntrenamiento: 'ent-1',
        tituloEntrenamiento: 'Fuerza de tren superior',
        ejerciciosCompletados: 4,
        ejerciciosTotales: 4,
      });

      expect(await servicio.obtenerHistorial(ANA)).toHaveLength(1);
    });

    it('Dada una sesión sin identificador Cuando se registra Entonces le asigna uno', async () => {
      const servicio = crearServicio();

      const sesion = await servicio.registrarSesionCompletada(ANA, {
        idEntrenamiento: 'ent-1',
        tituloEntrenamiento: 'Fuerza',
        ejerciciosCompletados: 1,
        ejerciciosTotales: 1,
      });

      expect(sesion.id).not.toBe('');
    });

    it('Dado el reloj inyectado Cuando se registra una sesión Entonces fecha la sesión con ese instante', async () => {
      const servicio = crearServicio();

      const sesion = await servicio.registrarSesionCompletada(ANA, {
        idEntrenamiento: 'ent-1',
        tituloEntrenamiento: 'Fuerza',
        ejerciciosCompletados: 1,
        ejerciciosTotales: 1,
      });

      expect(sesion.completadoEn).toBe('2026-01-01T00:00:00.000Z');
    });

    it('Dadas dos sesiones Cuando se consulta el historial Entonces la más reciente va primera', async () => {
      const servicio = crearServicio();
      await servicio.registrarSesionCompletada(ANA, {
        idEntrenamiento: 'ent-vieja',
        tituloEntrenamiento: 'Vieja',
        ejerciciosCompletados: 1,
        ejerciciosTotales: 1,
      });
      reloj.avanzar(60_000);
      await servicio.registrarSesionCompletada(ANA, {
        idEntrenamiento: 'ent-nueva',
        tituloEntrenamiento: 'Nueva',
        ejerciciosCompletados: 1,
        ejerciciosTotales: 1,
      });

      const historial = await servicio.obtenerHistorial(ANA);

      expect(historial[0].idEntrenamiento).toBe('ent-nueva');
    });

    it('Dada una sesión registrada Cuando se construye el servicio de nuevo Entonces el historial persiste', async () => {
      await crearServicio().registrarSesionCompletada(ANA, {
        idEntrenamiento: 'ent-1',
        tituloEntrenamiento: 'Fuerza',
        ejerciciosCompletados: 2,
        ejerciciosTotales: 2,
      });

      expect(await crearServicio().obtenerHistorial(ANA)).toHaveLength(1);
    });

    it('Dado un historial en el tope Cuando se registra otra sesión Entonces descarta la más antigua', async () => {
      // El historial vive en el almacenamiento del navegador: sin tope, una
      // cuenta activa lo haría crecer sin límite hasta agotar la cuota.
      const historial = Array.from({ length: TOPE_HISTORIAL }, (_, indice) =>
        crearSesionCompletada({
          id: `ses-${indice}`,
          idEntrenamiento: 'ent-1',
          tituloEntrenamiento: 'Vieja',
          completadoEn: new Date(1000 + indice).toISOString(),
          ejerciciosCompletados: 1,
          ejerciciosTotales: 1,
        }),
      );
      medio.fijar(
        CLAVES_ALMACENAMIENTO.progreso,
        JSON.stringify({
          version: 1,
          porCorreo: { [ANA]: crearProgresoCuenta({ historial }) },
        }),
      );
      const servicio = crearServicio();

      await servicio.registrarSesionCompletada(ANA, {
        idEntrenamiento: 'ent-nueva',
        tituloEntrenamiento: 'Nueva',
        ejerciciosCompletados: 1,
        ejerciciosTotales: 1,
      });

      const guardado = await servicio.obtenerHistorial(ANA);
      expect(guardado).toHaveLength(TOPE_HISTORIAL);
      expect(guardado.some((sesion) => sesion.id === 'ses-0')).toBe(false);
    });
  });

  describe('obtenerEstadisticas', () => {
    it('Dada una cuenta sin historial Cuando se consultan las estadísticas Entonces devuelve el acumulado en cero', async () => {
      const servicio = crearServicio();

      const estadisticas = await servicio.obtenerEstadisticas(ANA);

      expect(estadisticas.sesionesCompletadas).toBe(0);
      expect(estadisticas.ultimaSesionEn).toBeNull();
    });

    it('Dadas dos sesiones del mismo Entrenamiento Cuando se consultan las estadísticas Entonces cuenta un solo Entrenamiento distinto', async () => {
      const servicio = crearServicio();
      for (const indice of [1, 2]) {
        reloj.avanzar(indice * 1000);
        await servicio.registrarSesionCompletada(ANA, {
          idEntrenamiento: 'ent-1',
          tituloEntrenamiento: 'Fuerza',
          ejerciciosCompletados: 3,
          ejerciciosTotales: 3,
        });
      }

      const estadisticas = await servicio.obtenerEstadisticas(ANA);

      expect(estadisticas.sesionesCompletadas).toBe(2);
      expect(estadisticas.entrenamientosDistintos).toBe(1);
      expect(estadisticas.ejerciciosCompletados).toBe(6);
    });
  });

  describe('olvidarCuenta', () => {
    it('Dada una cuenta con progreso Cuando se la olvida Entonces su avance desaparece', async () => {
      const servicio = crearServicio();
      await servicio.guardarAvance(ANA, 'ent-1', ['ej-1']);

      await servicio.olvidarCuenta(ANA);

      expect(await servicio.obtenerAvance(ANA, 'ent-1')).toBeNull();
    });

    it('Dada una cuenta con progreso Cuando se la olvida Entonces su historial desaparece', async () => {
      const servicio = crearServicio();
      await servicio.registrarSesionCompletada(ANA, {
        idEntrenamiento: 'ent-1',
        tituloEntrenamiento: 'Fuerza',
        ejerciciosCompletados: 1,
        ejerciciosTotales: 1,
      });

      await servicio.olvidarCuenta(ANA);

      expect(await servicio.obtenerHistorial(ANA)).toEqual([]);
    });

    it('Dadas dos cuentas con progreso Cuando se olvida una Entonces la otra queda intacta', async () => {
      const servicio = crearServicio();
      await servicio.guardarAvance(ANA, 'ent-1', ['ej-1']);
      await servicio.guardarAvance(BRUNO, 'ent-1', ['ej-2']);

      await servicio.olvidarCuenta(ANA);

      expect((await servicio.obtenerAvance(BRUNO, 'ent-1'))?.completados).toEqual(
        ['ej-2'],
      );
    });

    it('Dada una cuenta sin progreso Cuando se la olvida Entonces no falla', async () => {
      const servicio = crearServicio();

      await expect(servicio.olvidarCuenta(ANA)).resolves.toBeUndefined();
    });

    it('Dada una cuenta olvidada Cuando se construye el servicio de nuevo Entonces sigue sin progreso', async () => {
      await crearServicio().guardarAvance(ANA, 'ent-1', ['ej-1']);
      await crearServicio().olvidarCuenta(ANA);

      expect(await crearServicio().obtenerAvance(ANA, 'ent-1')).toBeNull();
    });
  });

  describe('siembra de progreso simulado', () => {
    const SEMILLA = {
      [ANA]: crearProgresoCuenta({
        historial: [
          crearSesionCompletada({
            id: 'ses-sembrada',
            idEntrenamiento: 'ent-1',
            tituloEntrenamiento: 'Sembrada',
            completadoEn: '2025-12-01T10:00:00.000Z',
            ejerciciosCompletados: 2,
            ejerciciosTotales: 2,
          }),
        ],
      }),
    };

    const crearServicioSembrado = (): ServicioProgreso =>
      crearServicioProgreso({
        almacenamiento: crearAlmacenamientoLocal({ medio }),
        reloj,
        datosIniciales: { porCorreo: SEMILLA },
      });

    it('Dado un almacenamiento vacío Cuando se construye con progreso inicial Entonces la cuenta sembrada tiene su historial', async () => {
      const servicio = crearServicioSembrado();

      expect(await servicio.obtenerHistorial(ANA)).toHaveLength(1);
    });

    it('Dado un almacenamiento vacío Cuando se construye con progreso inicial Entonces una cuenta ajena a la semilla queda sin progreso', async () => {
      const servicio = crearServicioSembrado();

      expect(await servicio.obtenerHistorial(BRUNO)).toEqual([]);
    });

    it('Dado progreso ya almacenado Cuando se construye con progreso inicial Entonces no siembra encima', async () => {
      await crearServicio().guardarAvance(BRUNO, 'ent-9', ['ej-9']);

      const servicio = crearServicioSembrado();

      expect(await servicio.obtenerHistorial(ANA)).toEqual([]);
    });

    it('Dado un almacenamiento corrupto Cuando se construye con progreso inicial Entonces siembra de nuevo', async () => {
      medio.fijar(CLAVES_ALMACENAMIENTO.progreso, '{esto no es json');

      const servicio = crearServicioSembrado();

      expect(await servicio.obtenerHistorial(ANA)).toHaveLength(1);
    });
  });

  describe('almacenamiento degradado', () => {
    it('Dado un contenido no deserializable Cuando se consulta el avance Entonces lo trata como ausencia de progreso', async () => {
      medio.fijar(CLAVES_ALMACENAMIENTO.progreso, '{esto no es json');
      const servicio = crearServicio();

      expect(await servicio.obtenerAvance(ANA, 'ent-1')).toBeNull();
    });

    it('Dado un sobre con progreso de forma inesperada Cuando se consulta el historial Entonces descarta lo ilegible', async () => {
      medio.fijar(
        CLAVES_ALMACENAMIENTO.progreso,
        JSON.stringify({ version: 1, porCorreo: { [ANA]: 'no es un progreso' } }),
      );
      const servicio = crearServicio();

      expect(await servicio.obtenerHistorial(ANA)).toEqual([]);
    });

    it('Dado un medio que rechaza toda escritura Cuando se guarda un avance Entonces el avance sigue vivo en la visita', async () => {
      // 8.8: un almacenamiento caído no puede dejar la Plataforma inutilizable.
      const servicio = crearServicio();
      medio.simularFalloEscritura();

      await servicio.guardarAvance(ANA, 'ent-1', ['ej-1']);

      expect((await servicio.obtenerAvance(ANA, 'ent-1'))?.completados).toEqual([
        'ej-1',
      ]);
    });

    it('Dado un medio sin API de almacenamiento Cuando se guarda un avance Entonces no propaga el fallo', async () => {
      const servicio = crearServicioProgreso({
        almacenamiento: crearAlmacenamientoLocal({ medio: null }),
        reloj,
      });

      await expect(
        servicio.guardarAvance(ANA, 'ent-1', ['ej-1']),
      ).resolves.toBeDefined();
    });
  });
});
