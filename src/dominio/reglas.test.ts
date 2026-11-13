import { describe, expect, it } from 'vitest';

import type { Cuenta, Entrenamiento, Plan } from './modelos';
import {
  filtrarPorNivel,
  fuenteDeVideo,
  nivelDeAcceso,
  ordenarPorPrecio,
  puedeVer,
  validarEntrenamiento,
  validarPlan,
  validarRegistro,
} from './reglas';

const plan = (id: string, precio: number, nivel: Plan['nivel']): Plan => ({
  id,
  nombre: id,
  descripcion: 'd',
  precio,
  nivel,
  beneficios: [],
});

const PLANES = [
  plan('avanzado', 30000, 'avanzado'),
  plan('basico', 15000, 'basico'),
  plan('intermedio', 22000, 'intermedio'),
];

const cuenta = (parcial: Partial<Cuenta>): Cuenta => ({
  id: 'c',
  nombre: 'Ana',
  correo: 'ana@x.com',
  contrasenia: '12345678',
  rol: 'usuario',
  idPlan: null,
  idPlanSolicitado: null,
  ...parcial,
});

describe('ordenarPorPrecio', () => {
  it('ordena del más barato al más caro sin mutar la lista original', () => {
    const ordenados = ordenarPorPrecio(PLANES);
    expect(ordenados.map((p) => p.id)).toEqual(['basico', 'intermedio', 'avanzado']);
    expect(PLANES[0].id).toBe('avanzado');
  });
});

describe('nivelDeAcceso', () => {
  it('es null sin sesión o sin plan activo', () => {
    expect(nivelDeAcceso(null, PLANES)).toBeNull();
    expect(nivelDeAcceso(cuenta({}), PLANES)).toBeNull();
  });

  it('no cuenta el plan solicitado: sólo el activo', () => {
    expect(nivelDeAcceso(cuenta({ idPlanSolicitado: 'avanzado' }), PLANES)).toBeNull();
  });

  it('es el nivel del plan activo', () => {
    expect(nivelDeAcceso(cuenta({ idPlan: 'intermedio' }), PLANES)).toBe('intermedio');
  });

  it('el administrador accede a todo', () => {
    expect(nivelDeAcceso(cuenta({ rol: 'administrador' }), PLANES)).toBe('avanzado');
  });
});

describe('puedeVer', () => {
  it('habilita el nivel propio y los inferiores', () => {
    expect(puedeVer('intermedio', 'basico')).toBe(true);
    expect(puedeVer('intermedio', 'intermedio')).toBe(true);
    expect(puedeVer('intermedio', 'avanzado')).toBe(false);
  });

  it('sin plan no habilita nada', () => {
    expect(puedeVer(null, 'basico')).toBe(false);
  });
});

describe('filtrarPorNivel', () => {
  const entrenamientos = [
    { id: '1', nivel: 'basico' },
    { id: '2', nivel: 'avanzado' },
    { id: '3', nivel: 'basico' },
  ] as Entrenamiento[];

  it('devuelve todos con el filtro "todos"', () => {
    expect(filtrarPorNivel(entrenamientos, 'todos')).toHaveLength(3);
  });

  it('devuelve sólo los del nivel pedido', () => {
    expect(filtrarPorNivel(entrenamientos, 'basico').map((e) => e.id)).toEqual(['1', '3']);
  });
});

describe('validarRegistro', () => {
  it('acepta datos válidos', () => {
    expect(
      validarRegistro({ nombre: 'Ana', correo: 'ana@x.com', contrasenia: '12345678' }),
    ).toEqual({});
  });

  it('señala cada campo inválido', () => {
    const campos = validarRegistro({ nombre: ' ', correo: 'ana', contrasenia: '123' });
    expect(Object.keys(campos).sort()).toEqual(['contrasenia', 'correo', 'nombre']);
  });
});

describe('validarPlan', () => {
  it('exige nombre y un precio mayor a cero', () => {
    const campos = validarPlan({ nombre: '', descripcion: 'd', precio: 0 });
    expect(Object.keys(campos).sort()).toEqual(['nombre', 'precio']);
  });
});

describe('validarEntrenamiento', () => {
  it('exige título, duración positiva y un enlace web válido', () => {
    const campos = validarEntrenamiento({
      titulo: '',
      duracionMin: 0,
      video: { tipo: 'enlace', url: 'no es un enlace' },
    });
    expect(Object.keys(campos).sort()).toEqual(['duracionMin', 'titulo', 'video']);
  });

  it('acepta un video subido como archivo', () => {
    expect(
      validarEntrenamiento({
        titulo: 'Piernas',
        duracionMin: 30,
        video: { tipo: 'archivo', idArchivo: 'a', nombreArchivo: 'a.mp4' },
      }),
    ).toEqual({});
  });
});

describe('fuenteDeVideo', () => {
  it('convierte enlaces de YouTube a su dirección embebible', () => {
    const esperado = { clase: 'embebido', url: 'https://www.youtube.com/embed/abc123' };
    expect(fuenteDeVideo('https://www.youtube.com/watch?v=abc123')).toEqual(esperado);
    expect(fuenteDeVideo('https://youtu.be/abc123')).toEqual(esperado);
  });

  it('convierte enlaces de Vimeo', () => {
    expect(fuenteDeVideo('https://vimeo.com/12345')).toEqual({
      clase: 'embebido',
      url: 'https://player.vimeo.com/video/12345',
    });
  });

  it('trata cualquier otro enlace web como archivo de video', () => {
    expect(fuenteDeVideo('https://cdn.x.com/v.mp4')).toEqual({
      clase: 'nativo',
      url: 'https://cdn.x.com/v.mp4',
    });
  });

  it('rechaza lo que no es un enlace web', () => {
    expect(fuenteDeVideo('javascript:alert(1)')).toEqual({ clase: 'ninguno' });
  });
});
