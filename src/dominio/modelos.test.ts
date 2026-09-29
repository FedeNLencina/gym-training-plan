/**
 * Tests de los constructores y constantes de dominio.
 *
 * Cubre: 8.7, 8.14
 */

import { describe, it, expect } from 'vitest';

import {
  CATEGORIAS,
  ESTADOS_ENTRENAMIENTO,
  FUENTES_VIDEO,
  LIMITE_VIDEO_BYTES,
  NIVELES,
  PERIODICIDADES,
  ROLES,
  TIPOS_VIDEO_ADMITIDOS,
  crearCuenta,
  crearEjercicio,
  crearEntrenamiento,
  crearIdentificador,
  crearPlan,
  crearSesion,
  esTipoVideoAdmitido,
} from './modelos';

describe('constantes de dominio', () => {
  it('Dado el dominio Cuando se leen las uniones cerradas Entonces contienen los valores del diseño', () => {
    expect(NIVELES).toEqual(['Principiante', 'Intermedio', 'Avanzado']);
    expect(FUENTES_VIDEO).toEqual(['enlace', 'archivo']);
    expect(ESTADOS_ENTRENAMIENTO).toEqual(['publicado', 'borrador']);
    expect(PERIODICIDADES).toEqual(['mensual', 'trimestral', 'anual']);
    expect(ROLES).toEqual(['usuario', 'administrador']);
    expect(CATEGORIAS.length).toBeGreaterThanOrEqual(3);
  });

  it('Dado el límite de Archivo_Video Cuando se lee Entonces vale 52428800 bytes', () => {
    expect(LIMITE_VIDEO_BYTES).toBe(52428800);
  });

  it('Dado un tipo MIME Cuando se consulta si es admitido Entonces sólo acepta los de la lista', () => {
    expect(TIPOS_VIDEO_ADMITIDOS).toEqual(['video/mp4', 'video/webm']);
    expect(esTipoVideoAdmitido('video/mp4')).toBe(true);
    expect(esTipoVideoAdmitido('video/webm')).toBe(true);
    expect(esTipoVideoAdmitido('video/avi')).toBe(false);
    expect(esTipoVideoAdmitido('')).toBe(false);
  });

  it('Dadas las constantes de dominio Cuando se intenta mutarlas Entonces permanecen inalteradas', () => {
    expect(Object.isFrozen(NIVELES)).toBe(true);
    expect(Object.isFrozen(FUENTES_VIDEO)).toBe(true);
    expect(Object.isFrozen(PERIODICIDADES)).toBe(true);
  });
});

describe('crearIdentificador', () => {
  it('Dado el dominio Cuando se crean dos identificadores Entonces son cadenas no vacías y distintas', () => {
    const uno = crearIdentificador();
    const otro = crearIdentificador();
    expect(uno).not.toBe('');
    expect(otro).not.toBe('');
    expect(uno).not.toBe(otro);
  });
});

describe('crearEjercicio', () => {
  it('Dado ningún dato Cuando se crea un Ejercicio Entonces recibe id propio y valores por omisión', () => {
    const ejercicio = crearEjercicio();
    expect(ejercicio.id).not.toBe('');
    expect(ejercicio).toMatchObject({
      nombre: '',
      series: 1,
      repeticiones: 1,
      descansoSegundos: 0,
    });
  });

  it('Dados datos completos Cuando se crea un Ejercicio Entonces conserva cada campo recibido', () => {
    const ejercicio = crearEjercicio({
      id: 'ej-1',
      nombre: 'Sentadilla búlgara',
      series: 4,
      repeticiones: 12,
      descansoSegundos: 90,
    });
    expect(ejercicio).toEqual({
      id: 'ej-1',
      nombre: 'Sentadilla búlgara',
      series: 4,
      repeticiones: 12,
      descansoSegundos: 90,
    });
  });
});

describe('crearEntrenamiento', () => {
  it('Dado ningún dato Cuando se crea un Entrenamiento Entonces queda publicado con fuente de enlace y sin ejercicios', () => {
    const entrenamiento = crearEntrenamiento();
    expect(entrenamiento.id).not.toBe('');
    expect(entrenamiento).toMatchObject({
      titulo: '',
      descripcion: '',
      categoria: '',
      nivel: 'Principiante',
      duracionMinutos: 1,
      estado: 'publicado',
      fuenteVideo: 'enlace',
      enlaceVideo: '',
      videoArchivo: null,
      ejercicios: [],
    });
  });

  it('Dada fuente de archivo Cuando se crea un Entrenamiento con enlace Entonces el enlace queda vacío', () => {
    const entrenamiento = crearEntrenamiento({
      fuenteVideo: 'archivo',
      enlaceVideo: 'https://videos.example/uno.mp4',
      videoArchivo: { nombre: 'uno.mp4', tipo: 'video/mp4', tamanioBytes: 10 },
    });
    expect(entrenamiento.enlaceVideo).toBe('');
    expect(entrenamiento.videoArchivo).toEqual({
      nombre: 'uno.mp4',
      tipo: 'video/mp4',
      tamanioBytes: 10,
    });
  });

  it('Dada fuente de enlace Cuando se crea un Entrenamiento con metadatos de archivo Entonces el archivo queda nulo', () => {
    const entrenamiento = crearEntrenamiento({
      fuenteVideo: 'enlace',
      enlaceVideo: 'https://videos.example/uno.mp4',
      videoArchivo: { nombre: 'uno.mp4', tipo: 'video/mp4', tamanioBytes: 10 },
    });
    expect(entrenamiento.videoArchivo).toBeNull();
    expect(entrenamiento.enlaceVideo).toBe('https://videos.example/uno.mp4');
  });

  it('Dada una lista de Ejercicios Cuando se crea un Entrenamiento Entonces la copia no comparte referencia', () => {
    const ejercicios = [crearEjercicio({ nombre: 'Remo' })];
    const entrenamiento = crearEntrenamiento({ ejercicios });
    expect(entrenamiento.ejercicios).toEqual(ejercicios);
    expect(entrenamiento.ejercicios).not.toBe(ejercicios);
  });
});

describe('crearPlan', () => {
  it('Dado ningún dato Cuando se crea un Plan Entonces queda mensual, sin prestaciones y no recomendado', () => {
    const plan = crearPlan();
    expect(plan.id).not.toBe('');
    expect(plan).toMatchObject({
      nombre: '',
      objetivo: '',
      precio: 0,
      periodicidad: 'mensual',
      prestaciones: [],
      incluyeAsesoria: false,
      incluyeAlimentacion: false,
      recomendado: false,
    });
  });

  it('Dadas prestaciones Cuando se crea un Plan Entonces la lista se copia', () => {
    const prestaciones = ['Rutinas semanales'];
    const plan = crearPlan({ prestaciones });
    expect(plan.prestaciones).toEqual(prestaciones);
    expect(plan.prestaciones).not.toBe(prestaciones);
  });
});

describe('crearCuenta y crearSesion', () => {
  it('Dado ningún rol Cuando se crea una Cuenta Entonces el rol es usuario y no tiene plan', () => {
    const cuenta = crearCuenta({ correo: 'ana@atlas.com', contrasenia: 'clave1234' });
    expect(cuenta.id).not.toBe('');
    expect(cuenta).toMatchObject({
      nombre: '',
      correo: 'ana@atlas.com',
      contrasenia: 'clave1234',
      rol: 'usuario',
      idPlan: null,
    });
  });

  it('Dada una Cuenta Cuando se crea su Sesion Entonces no incluye la contraseña', () => {
    const cuenta = crearCuenta({
      nombre: 'Ana',
      correo: 'ana@atlas.com',
      contrasenia: 'clave1234',
      rol: 'administrador',
    });
    const sesion = crearSesion(cuenta);
    expect(sesion).toEqual({
      correo: 'ana@atlas.com',
      nombre: 'Ana',
      rol: 'administrador',
    });
    expect(Object.keys(sesion)).not.toContain('contrasenia');
  });
});
