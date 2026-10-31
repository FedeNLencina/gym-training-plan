/**
 * Tests de la persistencia del avance en `useProgresoEntrenamiento`.
 *
 * Las pruebas del cálculo del avance viven en `useProgresoEntrenamiento.test`,
 * que ejercita el hook sin persistencia. Acá se prueba la otra mitad: que el
 * avance se recupere al volver a abrir el Entrenamiento, que se conserve al
 * marcar, que la sesión terminada entre al historial y —sobre todo— que nada de
 * eso se filtre entre cuentas.
 *
 * El ServicioProgreso es el real, montado sobre un medio clave/valor en
 * memoria, porque lo que importa acá es la integración del hook con el servicio
 * y no el servicio aislado.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  crearAlmacenamientoLocal,
  type MedioClaveValor,
} from '../infra/almacenamientoLocal';
import { crearEjercicio, type Ejercicio } from '../dominio/modelos';
import { crearRelojFalso } from '../tests/dobles/relojFalso';
import {
  crearServicioProgreso,
  type ServicioProgreso,
} from '../servicios/servicioProgreso';
import {
  useProgresoEntrenamiento,
  type PersistenciaProgreso,
} from './useProgresoEntrenamiento';

const ANA = 'ana@atlasgym.com';
const BRUNO = 'bruno@atlasgym.com';
const ID_ENTRENAMIENTO = 'ent-1';

/** Ejercicios con identificadores estables `ej-0`, `ej-1`, ... */
function crearEjercicios(cantidad: number): Ejercicio[] {
  return Array.from({ length: cantidad }, (_, indice) =>
    crearEjercicio({
      id: `ej-${indice}`,
      nombre: `Ejercicio ${indice + 1}`,
      series: 3,
      repeticiones: 10,
      descansoSegundos: 60,
    }),
  );
}

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

describe('useProgresoEntrenamiento con persistencia', () => {
  let servicio: ServicioProgreso;

  /** Persistencia para una cuenta sobre el Entrenamiento de prueba. */
  const persistenciaDe = (correo: string): PersistenciaProgreso => ({
    servicio,
    correo,
    idEntrenamiento: ID_ENTRENAMIENTO,
    tituloEntrenamiento: 'Fuerza de tren superior',
  });

  /** Monta el hook ya rehidratado, para que el "Dado" sea un estado estable. */
  const dadoHookRehidratado = async (
    ejercicios: Ejercicio[],
    correo = ANA,
  ): Promise<ReturnType<typeof renderHook<ReturnType<typeof useProgresoEntrenamiento>, unknown>>> => {
    const vista = renderHook(() =>
      useProgresoEntrenamiento(ejercicios, persistenciaDe(correo)),
    );
    await waitFor(() => {
      expect(vista.result.current.rehidratando).toBe(false);
    });
    return vista;
  };

  beforeEach(() => {
    servicio = crearServicioProgreso({
      almacenamiento: crearAlmacenamientoLocal({ medio: crearMedioFalso() }),
      reloj: crearRelojFalso({
        ahoraInicial: Date.parse('2026-01-01T00:00:00.000Z'),
      }),
    });
  });

  describe('rehidratación', () => {
    it('Dado un avance guardado Cuando se monta el hook Entonces recupera los Ejercicios completados', async () => {
      await servicio.guardarAvance(ANA, ID_ENTRENAMIENTO, ['ej-0', 'ej-2']);

      const { result } = await dadoHookRehidratado(crearEjercicios(4));

      expect(result.current.completados).toEqual(['ej-0', 'ej-2']);
    });

    it('Dado un avance guardado Cuando se monta el hook Entonces el porcentaje refleja ese avance', async () => {
      await servicio.guardarAvance(ANA, ID_ENTRENAMIENTO, ['ej-0', 'ej-1']);

      const { result } = await dadoHookRehidratado(crearEjercicios(4));

      expect(result.current.porcentaje).toBe(50);
    });

    it('Dado ningún avance guardado Cuando se monta el hook Entonces arranca sin Ejercicios completados', async () => {
      const { result } = await dadoHookRehidratado(crearEjercicios(3));

      expect(result.current.completados).toEqual([]);
    });

    it('Dado el montaje del hook Cuando todavía no terminó la rehidratación Entonces lo señala', () => {
      // Sin esta señal, la vista presentaría 0 % durante un instante y pisaría
      // el avance real con una escritura vacía.
      const { result } = renderHook(() =>
        useProgresoEntrenamiento(crearEjercicios(3), persistenciaDe(ANA)),
      );

      expect(result.current.rehidratando).toBe(true);
    });

    it('Dado un avance con Ejercicios ajenos al Entrenamiento Cuando se monta el hook Entonces no los cuenta', async () => {
      // El Administrador pudo haber quitado un Ejercicio después de que el
      // Usuario lo completara.
      await servicio.guardarAvance(ANA, ID_ENTRENAMIENTO, ['ej-0', 'ej-borrado']);

      const { result } = await dadoHookRehidratado(crearEjercicios(2));

      expect(result.current.cantidadCompletados).toBe(1);
    });

    it('Dado el hook sin persistencia Cuando se monta Entonces no queda rehidratando', () => {
      const { result } = renderHook(() =>
        useProgresoEntrenamiento(crearEjercicios(2)),
      );

      expect(result.current.rehidratando).toBe(false);
    });
  });

  describe('conservación del avance', () => {
    it('Dado un hook rehidratado Cuando se marca un Ejercicio Entonces conserva el avance', async () => {
      const { result } = await dadoHookRehidratado(crearEjercicios(4));

      await act(async () => {
        result.current.marcarCompletado('ej-1');
      });

      await waitFor(async () => {
        const avance = await servicio.obtenerAvance(ANA, ID_ENTRENAMIENTO);
        expect(avance?.completados).toEqual(['ej-1']);
      });
    });

    it('Dado un Ejercicio marcado Cuando se lo desmarca Entonces el avance conservado queda vacío', async () => {
      await servicio.guardarAvance(ANA, ID_ENTRENAMIENTO, ['ej-1']);
      const { result } = await dadoHookRehidratado(crearEjercicios(4));

      await act(async () => {
        result.current.desmarcarCompletado('ej-1');
      });

      await waitFor(async () => {
        expect(await servicio.obtenerAvance(ANA, ID_ENTRENAMIENTO)).toBeNull();
      });
    });

    it('Dado un hook sin cambios Cuando termina la rehidratación Entonces no pisa el avance guardado', async () => {
      await servicio.guardarAvance(ANA, ID_ENTRENAMIENTO, ['ej-0']);

      await dadoHookRehidratado(crearEjercicios(4));

      const avance = await servicio.obtenerAvance(ANA, ID_ENTRENAMIENTO);
      expect(avance?.completados).toEqual(['ej-0']);
    });
  });

  describe('aislamiento entre cuentas', () => {
    it('Dado el avance de una cuenta Cuando otra cuenta abre el mismo Entrenamiento Entonces no ve ese avance', async () => {
      await servicio.guardarAvance(ANA, ID_ENTRENAMIENTO, ['ej-0', 'ej-1']);

      const { result } = await dadoHookRehidratado(crearEjercicios(4), BRUNO);

      expect(result.current.completados).toEqual([]);
    });

    it('Dado el avance de una cuenta Cuando otra marca un Ejercicio Entonces el avance de la primera queda intacto', async () => {
      await servicio.guardarAvance(ANA, ID_ENTRENAMIENTO, ['ej-0']);
      const { result } = await dadoHookRehidratado(crearEjercicios(4), BRUNO);

      await act(async () => {
        result.current.marcarCompletado('ej-3');
      });

      await waitFor(async () => {
        const avance = await servicio.obtenerAvance(ANA, ID_ENTRENAMIENTO);
        expect(avance?.completados).toEqual(['ej-0']);
      });
    });
  });

  describe('registro de la sesión completada', () => {
    it('Dado un Entrenamiento casi terminado Cuando se marca el último Ejercicio Entonces registra la sesión en el historial', async () => {
      await servicio.guardarAvance(ANA, ID_ENTRENAMIENTO, ['ej-0']);
      const { result } = await dadoHookRehidratado(crearEjercicios(2));

      await act(async () => {
        result.current.marcarCompletado('ej-1');
      });

      await waitFor(async () => {
        expect(await servicio.obtenerHistorial(ANA)).toHaveLength(1);
      });
    });

    it('Dado un Entrenamiento casi terminado Cuando se completa Entonces la sesión registrada lleva su título y su recuento', async () => {
      await servicio.guardarAvance(ANA, ID_ENTRENAMIENTO, ['ej-0']);
      const { result } = await dadoHookRehidratado(crearEjercicios(2));

      await act(async () => {
        result.current.marcarCompletado('ej-1');
      });

      await waitFor(async () => {
        const [sesion] = await servicio.obtenerHistorial(ANA);
        expect(sesion).toMatchObject({
          idEntrenamiento: ID_ENTRENAMIENTO,
          tituloEntrenamiento: 'Fuerza de tren superior',
          ejerciciosCompletados: 2,
          ejerciciosTotales: 2,
        });
      });
    });

    it('Dada una sesión ya completada Cuando se desmarca y se vuelve a marcar Entonces no duplica el registro', async () => {
      // Corregir un tilde mal puesto no es terminar el entrenamiento otra vez.
      const { result } = await dadoHookRehidratado(crearEjercicios(1));
      await act(async () => {
        result.current.marcarCompletado('ej-0');
      });
      await waitFor(async () => {
        expect(await servicio.obtenerHistorial(ANA)).toHaveLength(1);
      });
      await act(async () => {
        result.current.desmarcarCompletado('ej-0');
      });

      await act(async () => {
        result.current.marcarCompletado('ej-0');
      });

      await waitFor(async () => {
        expect(await servicio.obtenerHistorial(ANA)).toHaveLength(1);
      });
    });

    it('Dado un avance ya completo al rehidratar Cuando se monta el hook Entonces no registra una sesión nueva', async () => {
      // Volver a abrir un Entrenamiento terminado no suma una sesión.
      await servicio.guardarAvance(ANA, ID_ENTRENAMIENTO, ['ej-0']);

      await dadoHookRehidratado(crearEjercicios(1));

      expect(await servicio.obtenerHistorial(ANA)).toEqual([]);
    });

    it('Dado un Entrenamiento sin Ejercicios Cuando se monta el hook Entonces no registra ninguna sesión', async () => {
      await dadoHookRehidratado([]);

      expect(await servicio.obtenerHistorial(ANA)).toEqual([]);
    });
  });
});
