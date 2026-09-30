/**
 * Tests unitarios de las validaciones de dominio.
 *
 * Se verifican los límites exactos (un valor dentro y un valor fuera en cada
 * borde) y los campos ausentes, porque son los casos que los criterios 8.7 y
 * 8.14 exigen rechazar nombrando el campo inválido.
 *
 * Cubre: 4.1, 8.7, 8.14
 */

import { describe, it, expect } from 'vitest';

import { ErrorValidacion } from './errores';
import {
  crearCuenta,
  crearEjercicio,
  crearEntrenamiento,
  type Ejercicio,
  type Entrenamiento,
} from './modelos';
import {
  LIMITES_CUENTA,
  LIMITES_EJERCICIO,
  LIMITES_ENTRENAMIENTO,
  esCorreoValido,
  validarCorreo,
  validarCuenta,
  validarEjercicio,
  validarEntrenamiento,
} from './validaciones';

/** Entrenamiento válido con un Ejercicio válido, base de cada caso. */
function entrenamientoValido(
  cambios: Partial<Entrenamiento> = {},
): Entrenamiento {
  return crearEntrenamiento({
    titulo: 'Fuerza total',
    descripcion: 'Rutina de cuerpo completo',
    categoria: 'Fuerza',
    nivel: 'Intermedio',
    duracionMinutos: 45,
    fuenteVideo: 'enlace',
    enlaceVideo: 'https://www.youtube.com/watch?v=abc',
    ejercicios: [ejercicioValido()],
    ...cambios,
  });
}

function ejercicioValido(): Ejercicio {
  return crearEjercicio({
    nombre: 'Sentadilla',
    series: 4,
    repeticiones: 10,
    descansoSegundos: 60,
  });
}

/** Ejercicio con cambios arbitrarios, incluso de tipo inválido. */
function ejercicioDudoso(
  cambios: Record<string, unknown> = {},
): Record<string, unknown> {
  return { ...ejercicioValido(), ...cambios };
}

/** Aplica cambios arbitrarios (incluso de tipo inválido) sobre la base. */
function entrenamientoDudoso(
  cambios: Record<string, unknown>,
): Record<string, unknown> {
  return { ...entrenamientoValido(), ...cambios };
}

function texto(longitud: number): string {
  return 'a'.repeat(longitud);
}

describe('validarEntrenamiento', () => {
  it('Dado un Entrenamiento válido Cuando se valida Entonces no devuelve error', () => {
    // Cubre: 8.7
    const resultado = validarEntrenamiento(entrenamientoValido());

    expect(resultado).toBeNull();
  });

  it('Dado un valor que no es un objeto Cuando se valida Entonces devuelve ErrorValidacion', () => {
    // Cubre: 8.7
    const resultado = validarEntrenamiento(null);

    expect(resultado).toBeInstanceOf(ErrorValidacion);
    expect(Object.keys(resultado?.campos ?? {}).length).toBeGreaterThan(0);
  });

  it('Dado un Entrenamiento sin los campos obligatorios Cuando se valida Entonces nombra cada campo ausente', () => {
    // Cubre: 8.7
    const resultado = validarEntrenamiento({});

    expect(resultado?.campos).toEqual(
      expect.objectContaining({
        titulo: expect.any(String),
        categoria: expect.any(String),
        nivel: expect.any(String),
        duracionMinutos: expect.any(String),
        ejercicios: expect.any(String),
        fuenteVideo: expect.any(String),
      }),
    );
  });

  it('Dado un título en blanco Cuando se valida Entonces devuelve error en el título', () => {
    // Cubre: 8.7
    const resultado = validarEntrenamiento(entrenamientoDudoso({ titulo: '   ' }));

    expect(Object.keys(resultado?.campos ?? {})).toEqual(['titulo']);
  });

  it('Dado un título de 120 caracteres Cuando se valida Entonces no devuelve error', () => {
    // Cubre: 8.7
    const resultado = validarEntrenamiento(
      entrenamientoValido({ titulo: texto(LIMITES_ENTRENAMIENTO.tituloMaximo) }),
    );

    expect(resultado).toBeNull();
  });

  it('Dado un título de 121 caracteres Cuando se valida Entonces devuelve error en el título', () => {
    // Cubre: 8.7
    const resultado = validarEntrenamiento(
      entrenamientoValido({
        titulo: texto(LIMITES_ENTRENAMIENTO.tituloMaximo + 1),
      }),
    );

    expect(Object.keys(resultado?.campos ?? {})).toEqual(['titulo']);
  });

  it('Dada una descripción vacía Cuando se valida Entonces no devuelve error', () => {
    // Cubre: 8.7
    const resultado = validarEntrenamiento(entrenamientoValido({ descripcion: '' }));

    expect(resultado).toBeNull();
  });

  it('Dada una descripción de 1000 caracteres Cuando se valida Entonces no devuelve error', () => {
    // Cubre: 8.7
    const resultado = validarEntrenamiento(
      entrenamientoValido({
        descripcion: texto(LIMITES_ENTRENAMIENTO.descripcionMaxima),
      }),
    );

    expect(resultado).toBeNull();
  });

  it('Dada una descripción de 1001 caracteres Cuando se valida Entonces devuelve error en la descripción', () => {
    // Cubre: 8.7
    const resultado = validarEntrenamiento(
      entrenamientoValido({
        descripcion: texto(LIMITES_ENTRENAMIENTO.descripcionMaxima + 1),
      }),
    );

    expect(Object.keys(resultado?.campos ?? {})).toEqual(['descripcion']);
  });

  it('Dada una categoría en blanco Cuando se valida Entonces devuelve error en la categoría', () => {
    // Cubre: 8.7
    const resultado = validarEntrenamiento(
      entrenamientoDudoso({ categoria: '  ' }),
    );

    expect(Object.keys(resultado?.campos ?? {})).toEqual(['categoria']);
  });

  it('Dado un nivel fuera de la lista Cuando se valida Entonces devuelve error en el nivel', () => {
    // Cubre: 8.7
    const resultado = validarEntrenamiento(
      entrenamientoDudoso({ nivel: 'Experto' }),
    );

    expect(Object.keys(resultado?.campos ?? {})).toEqual(['nivel']);
  });

  it('Dada una duración de 1 minuto Cuando se valida Entonces no devuelve error', () => {
    // Cubre: 8.7
    const resultado = validarEntrenamiento(
      entrenamientoValido({
        duracionMinutos: LIMITES_ENTRENAMIENTO.duracionMinima,
      }),
    );

    expect(resultado).toBeNull();
  });

  it('Dada una duración de 240 minutos Cuando se valida Entonces no devuelve error', () => {
    // Cubre: 8.7
    const resultado = validarEntrenamiento(
      entrenamientoValido({
        duracionMinutos: LIMITES_ENTRENAMIENTO.duracionMaxima,
      }),
    );

    expect(resultado).toBeNull();
  });

  it('Dada una duración de 0 minutos Cuando se valida Entonces devuelve error en la duración', () => {
    // Cubre: 8.7
    const resultado = validarEntrenamiento(
      entrenamientoValido({ duracionMinutos: 0 }),
    );

    expect(Object.keys(resultado?.campos ?? {})).toEqual(['duracionMinutos']);
  });

  it('Dada una duración de 241 minutos Cuando se valida Entonces devuelve error en la duración', () => {
    // Cubre: 8.7
    const resultado = validarEntrenamiento(
      entrenamientoValido({
        duracionMinutos: LIMITES_ENTRENAMIENTO.duracionMaxima + 1,
      }),
    );

    expect(Object.keys(resultado?.campos ?? {})).toEqual(['duracionMinutos']);
  });

  it('Dada una duración no entera Cuando se valida Entonces devuelve error en la duración', () => {
    // Cubre: 8.7
    const resultado = validarEntrenamiento(
      entrenamientoValido({ duracionMinutos: 30.5 }),
    );

    expect(Object.keys(resultado?.campos ?? {})).toEqual(['duracionMinutos']);
  });

  it('Dada una lista de Ejercicios vacía Cuando se valida Entonces devuelve error en los Ejercicios', () => {
    // Cubre: 8.7
    const resultado = validarEntrenamiento(entrenamientoValido({ ejercicios: [] }));

    expect(Object.keys(resultado?.campos ?? {})).toEqual(['ejercicios']);
  });

  it('Dada una lista de 50 Ejercicios Cuando se valida Entonces no devuelve error', () => {
    // Cubre: 8.7
    const ejercicios = Array.from(
      { length: LIMITES_ENTRENAMIENTO.ejerciciosMaximos },
      () => ejercicioValido(),
    );

    const resultado = validarEntrenamiento(entrenamientoValido({ ejercicios }));

    expect(resultado).toBeNull();
  });

  it('Dada una lista de 51 Ejercicios Cuando se valida Entonces devuelve error en los Ejercicios', () => {
    // Cubre: 8.7
    const ejercicios = Array.from(
      { length: LIMITES_ENTRENAMIENTO.ejerciciosMaximos + 1 },
      () => ejercicioValido(),
    );

    const resultado = validarEntrenamiento(entrenamientoValido({ ejercicios }));

    expect(Object.keys(resultado?.campos ?? {})).toEqual(['ejercicios']);
  });

  it('Dada una Fuente_Video distinta de enlace y archivo Cuando se valida Entonces devuelve error en la Fuente_Video', () => {
    // Cubre: 8.14
    const resultado = validarEntrenamiento(
      entrenamientoDudoso({ fuenteVideo: 'ambos' }),
    );

    expect(Object.keys(resultado?.campos ?? {})).toEqual(['fuenteVideo']);
  });

  it('Dada una Fuente_Video archivo Cuando se valida Entonces no devuelve error', () => {
    // Cubre: 8.14
    const resultado = validarEntrenamiento(
      entrenamientoValido({
        fuenteVideo: 'archivo',
        videoArchivo: { nombre: 'rutina.mp4', tipo: 'video/mp4', tamanioBytes: 1024 },
      }),
    );

    expect(resultado).toBeNull();
  });

  it('Dado un Entrenamiento inválido en varios campos Cuando se valida Entonces devuelve todos los campos', () => {
    // Cubre: 8.7, 8.14
    const resultado = validarEntrenamiento(
      entrenamientoDudoso({
        titulo: '',
        duracionMinutos: 1000,
        fuenteVideo: 'url',
      }),
    );

    expect(Object.keys(resultado?.campos ?? {}).sort()).toEqual([
      'duracionMinutos',
      'fuenteVideo',
      'titulo',
    ]);
  });

  it('Dado un ErrorValidacion devuelto Cuando se intenta mutar su mapa Entonces permanece inalterado', () => {
    // Cubre: 8.7
    const resultado = validarEntrenamiento({});

    expect(Object.isFrozen(resultado?.campos)).toBe(true);
  });
});

describe('validarEjercicio', () => {
  it('Dado un Ejercicio válido Cuando se valida Entonces no devuelve error', () => {
    // Cubre: 8.7
    const resultado = validarEjercicio(ejercicioValido());

    expect(resultado).toBeNull();
  });

  it('Dado un Ejercicio sin campos Cuando se valida Entonces nombra cada campo ausente', () => {
    // Cubre: 8.7
    const resultado = validarEjercicio({});

    expect(Object.keys(resultado?.campos ?? {}).sort()).toEqual([
      'descansoSegundos',
      'nombre',
      'repeticiones',
      'series',
    ]);
  });

  it('Dado un nombre de 3 caracteres Cuando se valida Entonces no devuelve error', () => {
    // Cubre: 8.7
    const resultado = validarEjercicio(
      ejercicioDudoso({ nombre: texto(LIMITES_EJERCICIO.nombreMinimo) }),
    );

    expect(resultado).toBeNull();
  });

  it('Dado un nombre de 2 caracteres Cuando se valida Entonces devuelve error en el nombre', () => {
    // Cubre: 8.7
    const resultado = validarEjercicio(
      ejercicioDudoso({ nombre: texto(LIMITES_EJERCICIO.nombreMinimo - 1) }),
    );

    expect(Object.keys(resultado?.campos ?? {})).toEqual(['nombre']);
  });

  it('Dado un nombre de 61 caracteres Cuando se valida Entonces devuelve error en el nombre', () => {
    // Cubre: 8.7
    const resultado = validarEjercicio(
      ejercicioDudoso({ nombre: texto(LIMITES_EJERCICIO.nombreMaximo + 1) }),
    );

    expect(Object.keys(resultado?.campos ?? {})).toEqual(['nombre']);
  });

  it('Dadas series y repeticiones en los extremos válidos Cuando se valida Entonces no devuelve error', () => {
    // Cubre: 8.7
    const resultado = validarEjercicio(
      ejercicioDudoso({
        series: LIMITES_EJERCICIO.seriesMaximas,
        repeticiones: LIMITES_EJERCICIO.repeticionesMinimas,
        descansoSegundos: LIMITES_EJERCICIO.descansoMaximo,
      }),
    );

    expect(resultado).toBeNull();
  });

  it('Dadas series en 0 Cuando se valida Entonces devuelve error en las series', () => {
    // Cubre: 8.7
    const resultado = validarEjercicio(ejercicioDudoso({ series: 0 }));

    expect(Object.keys(resultado?.campos ?? {})).toEqual(['series']);
  });

  it('Dadas repeticiones en 101 Cuando se valida Entonces devuelve error en las repeticiones', () => {
    // Cubre: 8.7
    const resultado = validarEjercicio(
      ejercicioDudoso({
        repeticiones: LIMITES_EJERCICIO.repeticionesMaximas + 1,
      }),
    );

    expect(Object.keys(resultado?.campos ?? {})).toEqual(['repeticiones']);
  });

  it('Dado un descanso de 0 segundos Cuando se valida Entonces no devuelve error', () => {
    // Cubre: 8.7
    const resultado = validarEjercicio(ejercicioDudoso({ descansoSegundos: 0 }));

    expect(resultado).toBeNull();
  });

  it('Dado un descanso de 301 segundos Cuando se valida Entonces devuelve error en el descanso', () => {
    // Cubre: 8.7
    const resultado = validarEjercicio(
      ejercicioDudoso({
        descansoSegundos: LIMITES_EJERCICIO.descansoMaximo + 1,
      }),
    );

    expect(Object.keys(resultado?.campos ?? {})).toEqual(['descansoSegundos']);
  });

  it('Dado un descanso no entero Cuando se valida Entonces devuelve error en el descanso', () => {
    // Cubre: 8.7
    const resultado = validarEjercicio(ejercicioDudoso({ descansoSegundos: 45.5 }));

    expect(Object.keys(resultado?.campos ?? {})).toEqual(['descansoSegundos']);
  });
});

describe('validarCorreo', () => {
  it('Dado un correo con formato texto@dominio.extension Cuando se valida Entonces no devuelve error', () => {
    // Cubre: 4.1
    const resultado = validarCorreo('persona@dominio.com');

    expect(resultado).toBeNull();
    expect(esCorreoValido('persona@dominio.com')).toBe(true);
  });

  it('Dado un correo con subdominio y extensión compuesta Cuando se valida Entonces no devuelve error', () => {
    // Cubre: 4.1
    const resultado = validarCorreo('persona@mail.dominio.com.ar');

    expect(resultado).toBeNull();
  });

  it('Dado un correo ausente Cuando se valida Entonces devuelve error en el correo', () => {
    // Cubre: 4.1
    const resultado = validarCorreo(undefined);

    expect(resultado?.campos).toEqual({ correo: expect.any(String) });
  });

  it('Dado un correo de 6 caracteres Cuando se valida Entonces no devuelve error', () => {
    // Cubre: 4.1
    const resultado = validarCorreo('a@b.io');

    expect(resultado).toBeNull();
  });

  it('Dado un correo de 5 caracteres Cuando se valida Entonces devuelve error en el correo', () => {
    // Cubre: 4.1
    const resultado = validarCorreo('a@b.c');

    expect(resultado?.campos).toEqual({ correo: expect.any(String) });
  });

  it('Dado un correo de 255 caracteres Cuando se valida Entonces devuelve error en el correo', () => {
    // Cubre: 4.1
    const correo = `${texto(255 - '@dominio.com'.length)}@dominio.com`;

    const resultado = validarCorreo(correo);

    expect(correo).toHaveLength(255);
    expect(resultado?.campos).toEqual({ correo: expect.any(String) });
  });

  it('Dado un correo de 254 caracteres Cuando se valida Entonces no devuelve error', () => {
    // Cubre: 4.1
    const resultado = validarCorreo(
      `${texto(254 - '@dominio.com'.length)}@dominio.com`,
    );

    expect(resultado).toBeNull();
  });

  it('Dados correos con formato inválido Cuando se consulta el predicado Entonces los rechaza', () => {
    // Cubre: 4.1
    const invalidos = [
      '',
      '   ',
      'persona.dominio.com',
      'persona@sinextension',
      'persona@.com',
      '@dominio.com',
      'persona@a@b.com',
      'con espacio@dominio.com',
      'persona@dominio.',
    ];

    expect(invalidos.filter(esCorreoValido)).toEqual([]);
  });
});

describe('validarCuenta', () => {
  const cuentaValida = crearCuenta({
    nombre: 'Ana',
    correo: 'ana@dominio.com',
    contrasenia: 'contrasenia1',
  });

  it('Dada una Cuenta válida Cuando se valida Entonces no devuelve error', () => {
    // Cubre: 4.1
    const resultado = validarCuenta(cuentaValida);

    expect(resultado).toBeNull();
  });

  it('Dada una Cuenta sin campos Cuando se valida Entonces nombra los tres campos obligatorios', () => {
    // Cubre: 4.1
    const resultado = validarCuenta({});

    expect(Object.keys(resultado?.campos ?? {}).sort()).toEqual([
      'contrasenia',
      'correo',
      'nombre',
    ]);
  });

  it('Dado un nombre de 2 caracteres Cuando se valida Entonces no devuelve error', () => {
    // Cubre: 4.1
    const resultado = validarCuenta({
      ...cuentaValida,
      nombre: texto(LIMITES_CUENTA.nombreMinimo),
    });

    expect(resultado).toBeNull();
  });

  it('Dado un nombre de 1 carácter Cuando se valida Entonces devuelve error en el nombre', () => {
    // Cubre: 4.1
    const resultado = validarCuenta({ ...cuentaValida, nombre: 'A' });

    expect(Object.keys(resultado?.campos ?? {})).toEqual(['nombre']);
  });

  it('Dado un nombre de 60 caracteres Cuando se valida Entonces no devuelve error', () => {
    // Cubre: 4.1
    const resultado = validarCuenta({
      ...cuentaValida,
      nombre: texto(LIMITES_CUENTA.nombreMaximo),
    });

    expect(resultado).toBeNull();
  });

  it('Dado un nombre de 61 caracteres Cuando se valida Entonces devuelve error en el nombre', () => {
    // Cubre: 4.1
    const resultado = validarCuenta({
      ...cuentaValida,
      nombre: texto(LIMITES_CUENTA.nombreMaximo + 1),
    });

    expect(Object.keys(resultado?.campos ?? {})).toEqual(['nombre']);
  });

  it('Dado un nombre de sólo espacios Cuando se valida Entonces devuelve error en el nombre', () => {
    // Cubre: 4.1
    const resultado = validarCuenta({ ...cuentaValida, nombre: '     ' });

    expect(Object.keys(resultado?.campos ?? {})).toEqual(['nombre']);
  });

  it('Dada una contraseña de 8 caracteres Cuando se valida Entonces no devuelve error', () => {
    // Cubre: 4.1
    const resultado = validarCuenta({
      ...cuentaValida,
      contrasenia: texto(LIMITES_CUENTA.contraseniaMinima),
    });

    expect(resultado).toBeNull();
  });

  it('Dada una contraseña de 7 caracteres Cuando se valida Entonces devuelve error en la contraseña', () => {
    // Cubre: 4.1
    const resultado = validarCuenta({
      ...cuentaValida,
      contrasenia: texto(LIMITES_CUENTA.contraseniaMinima - 1),
    });

    expect(Object.keys(resultado?.campos ?? {})).toEqual(['contrasenia']);
  });

  it('Dada una contraseña de 64 caracteres Cuando se valida Entonces no devuelve error', () => {
    // Cubre: 4.1
    const resultado = validarCuenta({
      ...cuentaValida,
      contrasenia: texto(LIMITES_CUENTA.contraseniaMaxima),
    });

    expect(resultado).toBeNull();
  });

  it('Dada una contraseña de 65 caracteres Cuando se valida Entonces devuelve error en la contraseña', () => {
    // Cubre: 4.1
    const resultado = validarCuenta({
      ...cuentaValida,
      contrasenia: texto(LIMITES_CUENTA.contraseniaMaxima + 1),
    });

    expect(Object.keys(resultado?.campos ?? {})).toEqual(['contrasenia']);
  });

  it('Dado un correo con formato inválido Cuando se valida la Cuenta Entonces devuelve error en el correo', () => {
    // Cubre: 4.1
    const resultado = validarCuenta({
      ...cuentaValida,
      correo: 'ana@sinextension',
    });

    expect(Object.keys(resultado?.campos ?? {})).toEqual(['correo']);
  });

  it('Dado un rol fuera de la lista Cuando se valida la Cuenta Entonces devuelve error en el rol', () => {
    // Cubre: 4.1
    const resultado = validarCuenta({ ...cuentaValida, rol: 'superusuario' });

    expect(Object.keys(resultado?.campos ?? {})).toEqual(['rol']);
  });
});
