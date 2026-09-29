/**
 * Autoverificación de los generadores de dominio: confirma que producen
 * instancias dentro de los rangos declarados y que las variantes inválidas
 * violan exactamente la regla que prometen. Un generador mal construido haría
 * pasar propiedades falsas.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { esTipoVideoAdmitido } from '../tiposDominio';
import {
  arbAnchoVentana,
  arbArchivoVideo,
  arbArchivoVideoConContenido,
  arbCorreoInvalido,
  arbCorreoValido,
  arbCuenta,
  arbEjercicio,
  arbEntrenamiento,
  arbEntrenamientoInvalidoPorRegla,
  arbListaEntrenamientos,
  arbListaPlanes,
  arbPlan,
  arbRutaNoDeclarada,
  esRutaDeclarada,
  CAMPO_POR_REGLA,
  FUENTES_VIDEO,
  LIMITE_VIDEO_BYTES,
  NIVELES,
  PERIODICIDADES,
  REGLAS_ENTRENAMIENTO_INVALIDO,
  TIPOS_VIDEO_ADMITIDOS,
} from './generadoresDominio';

const CONFIGURACION = { numRuns: 100, seed: 1 };

describe('generadores de dominio', () => {
  it('Dado el generador de ejercicios Cuando se generan cien ejercicios Entonces todos tienen nombre no vacío y series repeticiones y descanso dentro de sus rangos', () => {
    // Cubre: 10.8
    fc.assert(
      fc.property(arbEjercicio(), (ejercicio) => {
        expect(ejercicio.nombre.trim().length).toBeGreaterThan(0);
        expect(ejercicio.nombre.length).toBeLessThanOrEqual(60);
        expect(ejercicio.series).toBeGreaterThanOrEqual(1);
        expect(ejercicio.series).toBeLessThanOrEqual(20);
        expect(ejercicio.repeticiones).toBeGreaterThanOrEqual(1);
        expect(ejercicio.repeticiones).toBeLessThanOrEqual(100);
        expect(ejercicio.descansoSegundos).toBeGreaterThanOrEqual(0);
        expect(ejercicio.descansoSegundos).toBeLessThanOrEqual(300);
      }),
      CONFIGURACION,
    );
  });

  it('Dado el generador de entrenamientos válidos Cuando se generan cien entrenamientos Entonces todos cumplen los límites del repositorio y la coherencia de su fuente de video', () => {
    // Cubre: 10.8
    fc.assert(
      fc.property(arbEntrenamiento(), (entrenamiento) => {
        expect(entrenamiento.titulo.trim().length).toBeGreaterThan(0);
        expect(entrenamiento.titulo.length).toBeLessThanOrEqual(120);
        expect(entrenamiento.descripcion.length).toBeLessThanOrEqual(1000);
        expect(NIVELES).toContain(entrenamiento.nivel);
        expect(FUENTES_VIDEO).toContain(entrenamiento.fuenteVideo);
        expect(Number.isInteger(entrenamiento.duracionMinutos)).toBe(true);
        expect(entrenamiento.duracionMinutos).toBeGreaterThanOrEqual(1);
        expect(entrenamiento.duracionMinutos).toBeLessThanOrEqual(240);
        expect(entrenamiento.ejercicios.length).toBeGreaterThanOrEqual(1);
        expect(entrenamiento.ejercicios.length).toBeLessThanOrEqual(50);
        if (entrenamiento.fuenteVideo === 'enlace') {
          expect(entrenamiento.enlaceVideo).not.toBe('');
          expect(entrenamiento.videoArchivo).toBeNull();
        } else {
          expect(entrenamiento.enlaceVideo).toBe('');
          expect(esTipoVideoAdmitido(entrenamiento.videoArchivo?.tipo ?? '')).toBe(
            true,
          );
        }
      }),
      CONFIGURACION,
    );
  });

  it('Dada la lista de reglas de invalidez Cuando se genera un entrenamiento inválido por cada regla Entonces cada caso informa la regla y el campo afectado', () => {
    // Cubre: 10.8
    fc.assert(
      fc.property(
        fc
          .constantFrom(...REGLAS_ENTRENAMIENTO_INVALIDO)
          .chain((regla) => arbEntrenamientoInvalidoPorRegla(regla)),
        (caso) => {
          expect(REGLAS_ENTRENAMIENTO_INVALIDO).toContain(caso.regla);
          expect(caso.campo).toBe(CAMPO_POR_REGLA[caso.regla]);
          expect(caso.entrenamiento).toHaveProperty('id');
        },
      ),
      CONFIGURACION,
    );
  });

  it('Dado el generador de entrenamientos inválidos por título excedido Cuando se generan cien casos Entonces todos tienen un título de ciento veintiún caracteres', () => {
    // Cubre: 10.8
    fc.assert(
      fc.property(
        arbEntrenamientoInvalidoPorRegla('tituloExcedeLimite'),
        (caso) => {
          expect(caso.entrenamiento.titulo).toHaveLength(121);
        },
      ),
      CONFIGURACION,
    );
  });

  it('Dado el generador de listas de entrenamientos Cuando se generan cien listas Entonces los identificadores de cada lista son únicos y la lista vacía es alcanzable', () => {
    // Cubre: 10.8
    let huboListaVacia = false;
    fc.assert(
      fc.property(arbListaEntrenamientos(), (lista) => {
        if (lista.length === 0) huboListaVacia = true;
        const identificadores = new Set(lista.map((e) => e.id));
        expect(identificadores.size).toBe(lista.length);
      }),
      CONFIGURACION,
    );
    expect(huboListaVacia).toBe(true);
  });

  it('Dado el generador de planes Cuando se generan cien planes Entonces el precio tiene a lo sumo dos decimales dentro del rango y las prestaciones son entre tres y ocho', () => {
    // Cubre: 10.8
    fc.assert(
      fc.property(arbPlan(), (plan) => {
        expect(plan.precio).toBeGreaterThanOrEqual(1);
        expect(plan.precio).toBeLessThanOrEqual(999999);
        expect(Math.round(plan.precio * 100)).toBeCloseTo(plan.precio * 100, 6);
        expect(PERIODICIDADES).toContain(plan.periodicidad);
        expect(plan.prestaciones.length).toBeGreaterThanOrEqual(3);
        expect(plan.prestaciones.length).toBeLessThanOrEqual(8);
      }),
      CONFIGURACION,
    );
  });

  it('Dado el generador de listas de planes con un recomendado Cuando se generan cien listas de tres planes Entonces exactamente un plan está marcado como recomendado', () => {
    // Cubre: 10.8
    fc.assert(
      fc.property(
        arbListaPlanes({ cantidad: 3, cantidadRecomendados: 1 }),
        (planes) => {
          expect(planes.filter((plan) => plan.recomendado)).toHaveLength(1);
        },
      ),
      CONFIGURACION,
    );
  });

  it('Dado el generador de listas de planes sin recomendados Cuando se generan cien listas Entonces ningún plan está marcado como recomendado', () => {
    // Cubre: 10.8
    fc.assert(
      fc.property(arbListaPlanes({ cantidadRecomendados: 0 }), (planes) => {
        expect(planes.some((plan) => plan.recomendado)).toBe(false);
      }),
      CONFIGURACION,
    );
  });

  it('Dado el generador de cuentas Cuando se generan cien cuentas Entonces el nombre y la contraseña respetan sus rangos y el correo tiene formato válido', () => {
    // Cubre: 10.8
    const formato = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    fc.assert(
      fc.property(arbCuenta(), (cuenta) => {
        expect(cuenta.nombre.length).toBeGreaterThanOrEqual(2);
        expect(cuenta.nombre.length).toBeLessThanOrEqual(60);
        expect(cuenta.contrasenia.length).toBeGreaterThanOrEqual(8);
        expect(cuenta.contrasenia.length).toBeLessThanOrEqual(64);
        expect(cuenta.correo).toMatch(formato);
        expect(cuenta.correo.length).toBeGreaterThanOrEqual(6);
        expect(cuenta.correo.length).toBeLessThanOrEqual(254);
      }),
      CONFIGURACION,
    );
  });

  it('Dado el generador de correos válidos Cuando se generan cien correos Entonces todos tienen entre seis y doscientos cincuenta y cuatro caracteres', () => {
    // Cubre: 10.8
    fc.assert(
      fc.property(arbCorreoValido, (correo) => {
        expect(correo.length).toBeGreaterThanOrEqual(6);
        expect(correo.length).toBeLessThanOrEqual(254);
      }),
      CONFIGURACION,
    );
  });

  it('Dado el generador de correos inválidos Cuando se generan cien correos Entonces ninguno cumple simultáneamente el formato y el rango de longitud exigidos', () => {
    // Cubre: 10.8
    const formato = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    fc.assert(
      fc.property(arbCorreoInvalido, (correo) => {
        const cumpleFormato = formato.test(correo);
        const cumpleLongitud = correo.length >= 6 && correo.length <= 254;
        expect(cumpleFormato && cumpleLongitud).toBe(false);
      }),
      CONFIGURACION,
    );
  });

  it('Dado el generador de archivos admitidos Cuando se generan cien archivos Entonces todos tienen tipo admitido y tamaño menor o igual al límite', () => {
    // Cubre: 10.8
    fc.assert(
      fc.property(arbArchivoVideo({ admitido: true }), (archivo) => {
        expect(TIPOS_VIDEO_ADMITIDOS).toContain(archivo.tipo);
        expect(archivo.tamanioBytes).toBeLessThanOrEqual(LIMITE_VIDEO_BYTES);
      }),
      CONFIGURACION,
    );
  });

  it('Dado el generador de archivos no admitidos Cuando se generan cien archivos Entonces cada uno falla por tipo no admitido o por exceder el límite de tamaño', () => {
    // Cubre: 10.8
    fc.assert(
      fc.property(arbArchivoVideo({ admitido: false }), (archivo) => {
        const tipoInvalido = !esTipoVideoAdmitido(archivo.tipo);
        const tamanioInvalido = archivo.tamanioBytes > LIMITE_VIDEO_BYTES;
        expect(tipoInvalido || tamanioInvalido).toBe(true);
      }),
      CONFIGURACION,
    );
  });

  it('Dado el generador de archivos con contenido Cuando se generan cien archivos Entonces el tamaño declarado coincide con la cantidad de bytes generados', () => {
    // Cubre: 10.8
    fc.assert(
      fc.property(arbArchivoVideoConContenido(), (archivo) => {
        expect(archivo.tamanioBytes).toBe(archivo.contenido.length);
      }),
      CONFIGURACION,
    );
  });

  it('Dado el generador de anchos de ventana móviles Cuando se generan cien anchos Entonces todos quedan entre trescientos veinte y setecientos sesenta y siete', () => {
    // Cubre: 10.8
    fc.assert(
      fc.property(arbAnchoVentana({ franja: 'movil' }), (ancho) => {
        expect(ancho).toBeGreaterThanOrEqual(320);
        expect(ancho).toBeLessThanOrEqual(767);
      }),
      CONFIGURACION,
    );
  });

  it('Dado el generador de rutas no declaradas Cuando se generan cien rutas Entonces ninguna coincide con una ruta declarada de la plataforma', () => {
    // Cubre: 10.8
    fc.assert(
      fc.property(arbRutaNoDeclarada, (ruta) => {
        expect(esRutaDeclarada(ruta)).toBe(false);
      }),
      CONFIGURACION,
    );
  });
});
