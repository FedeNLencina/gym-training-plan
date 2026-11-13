/**
 * Persistencia simulada en el navegador.
 *
 * Los datos de la plataforma viven en localStorage como un único documento
 * JSON; los archivos de video subidos por el administrador van a IndexedDB,
 * porque localStorage no admite binarios ni el tamaño de un video.
 *
 * Este módulo es el único punto que habría que reemplazar para conectar un
 * backend real.
 */

import { openDB, type IDBPDatabase } from 'idb';

import { crearSemilla } from '../datos/semilla';
import type { Datos } from '../dominio/modelos';

const CLAVE_DATOS = 'atlas-training:datos:v1';

export function cargarDatos(): Datos {
  try {
    const guardado = localStorage.getItem(CLAVE_DATOS);
    if (guardado !== null) return JSON.parse(guardado) as Datos;
  } catch {
    // Almacenamiento ilegible o bloqueado: se arranca desde la semilla.
  }
  return crearSemilla();
}

export function guardarDatos(datos: Datos): void {
  try {
    localStorage.setItem(CLAVE_DATOS, JSON.stringify(datos));
  } catch {
    // Sin almacenamiento disponible los cambios duran lo que dure la pestaña.
  }
}

const ALMACEN_VIDEOS = 'videos';
let base: Promise<IDBPDatabase> | null = null;

function abrirBase(): Promise<IDBPDatabase> {
  base ??= openDB('atlas-training', 1, {
    upgrade(db) {
      db.createObjectStore(ALMACEN_VIDEOS);
    },
  });
  return base;
}

export async function guardarVideo(id: string, archivo: Blob): Promise<void> {
  await (await abrirBase()).put(ALMACEN_VIDEOS, archivo, id);
}

export async function leerVideo(id: string): Promise<Blob | null> {
  return ((await (await abrirBase()).get(ALMACEN_VIDEOS, id)) as Blob | undefined) ?? null;
}

export async function borrarVideo(id: string): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  await (await abrirBase()).delete(ALMACEN_VIDEOS, id);
}

export function nuevoId(prefijo: string): string {
  const azar =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefijo}-${azar}`;
}
