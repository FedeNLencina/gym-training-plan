/**
 * Propiedades del AlmacenVideos: la ida y vuelta binaria del Archivo_Video y el
 * rechazo de toda lectura de un identificador sin video conservado.
 *
 * Las propiedades corren sobre un doble de `BaseIndexedDb` con la misma forma
 * que la base real (`crearBaseIndexedDb`, ya probada en `baseIndexedDb.test.ts`)
 * para observar el estado almacenado sin depender de IndexedDB del entorno.
 */

import { describe, expect, it } from 'vitest';
import fc from 'fast-check';

import { ErrorVideoAusente } from '../dominio/errores';
import type { BaseIndexedDb, RegistroVideo } from '../infra/baseIndexedDb';
import {
  arbArchivoVideo,
  construirArchivo,
} from '../tests/generadores/generadoresDominio';
import { crearAlmacenVideos } from './almacenVideos';

const CONFIGURACION = { numRuns: 100, seed: 1 };

type BaseFalsa = {
  base: BaseIndexedDb;
  registros: Map<string, RegistroVideo>;
};

function crearBaseFalsa(): BaseFalsa {
  const registros = new Map<string, RegistroVideo>();
  return {
    base: {
      async guardar(registro) {
        registros.set(registro.idEntrenamiento, registro);
      },
      async obtener(idEntrenamiento) {
        return registros.get(idEntrenamiento);
      },
      async borrar(idEntrenamiento) {
        registros.delete(idEntrenamiento);
      },
      async cerrar() {},
    },
    registros,
  };
}

/**
 * Bytes de un `Blob`, para comparar contenido y no referencias. Se leen con
 * `FileReader` porque el `Blob` del entorno de pruebas no expone
 * `arrayBuffer()`, `text()` ni `stream()`, a diferencia del navegador, y
 * envolverlo en `Response` serializa el objeto en lugar de leer sus bytes.
 *
 * Se escucha `loadend`, que ocurre siempre al terminar la lectura, con éxito,
 * con error o por cancelación: así la promesa se resuelve o se rechaza en todos
 * los casos y la lectura nunca queda pendiente.
 */
async function bytesDe(contenido: Blob): Promise<Uint8Array> {
  const lector = new FileReader();
  const leido = await new Promise<ArrayBuffer>((resolver, rechazar) => {
    lector.addEventListener('loadend', () => {
      if (lector.error || !(lector.result instanceof ArrayBuffer)) {
        rechazar(new Error('Lectura de bytes fallida'));
        return;
      }
      resolver(lector.result);
    });
    lector.readAsArrayBuffer(contenido);
  });
  return new Uint8Array(leido);
}

/** Retrato observable del estado almacenado, comparable entre dos instantes. */
function retratoDe(registros: Map<string, RegistroVideo>) {
  return [...registros.entries()].map(([clave, registro]) => ({
    clave,
    idEntrenamiento: registro.idEntrenamiento,
    tipo: registro.tipo,
    tamanioBytes: registro.tamanioBytes,
    nombre: registro.nombre,
    blob: registro.blob,
  }));
}

describe('propiedades del almacén de videos', () => {
  it('Dado un contenido binario de tipo admitido y tamaño dentro del límite Cuando se conserva bajo un identificador de Entrenamiento y se lee a continuación Entonces devuelve idéntico tipo idéntico tamaño e idéntico contenido binario', async () => {
    // Feature: training-platform-landing, Property 48: Ida y vuelta binaria del Archivo_Video
    // Cubre: 8.10, 8.11
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        arbArchivoVideo({ admitido: true, conContenido: true }),
        async (idEntrenamiento, descriptor) => {
          const { base } = crearBaseFalsa();
          const almacen = crearAlmacenVideos({ base });
          const archivo = construirArchivo(descriptor) as File;

          const confirmacion = await almacen.guardarVideo(
            idEntrenamiento,
            archivo,
          );
          const leido = await almacen.obtenerVideo(idEntrenamiento);

          expect(confirmacion).toEqual({
            tipo: descriptor.tipo,
            tamanioBytes: descriptor.tamanioBytes,
          });
          expect(leido.type).toBe(descriptor.tipo);
          expect(leido.size).toBe(descriptor.tamanioBytes);
          expect(descriptor.contenido).not.toBeNull();
          expect([...(await bytesDe(leido))]).toEqual([
            ...(descriptor.contenido ?? []),
          ]);
        },
      ),
      CONFIGURACION,
    );
  });

  it('Dado un identificador de Entrenamiento sin Archivo_Video conservado Cuando se solicita su lectura Entonces falla indicando la ausencia del video y deja el estado almacenado sin cambios', async () => {
    // Feature: training-platform-landing, Property 49: Toda lectura de un Archivo_Video ausente falla sin alterar el estado
    // Cubre: 8.13
    await fc.assert(
      fc.asyncProperty(
        fc.uniqueArray(fc.uuid(), { minLength: 0, maxLength: 3 }),
        fc.uuid(),
        arbArchivoVideo({ admitido: true, conContenido: true }),
        async (idsConservados, idConsultado, descriptor) => {
          fc.pre(!idsConservados.includes(idConsultado));

          const { base, registros } = crearBaseFalsa();
          const almacen = crearAlmacenVideos({ base });
          for (const id of idsConservados) {
            await almacen.guardarVideo(id, construirArchivo(descriptor) as File);
          }
          const previo = retratoDe(registros);

          const fallo = await almacen
            .obtenerVideo(idConsultado)
            .catch((error: unknown) => error);

          expect(fallo).toBeInstanceOf(ErrorVideoAusente);
          expect((fallo as ErrorVideoAusente).message.length).toBeGreaterThan(0);
          expect(retratoDe(registros)).toEqual(previo);
        },
      ),
      CONFIGURACION,
    );
  });
});
