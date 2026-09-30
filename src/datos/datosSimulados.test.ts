/**
 * Verificación de la semilla de datos.
 *
 * La semilla es el estado inicial de toda la Plataforma: si un Entrenamiento
 * sembrado no pasa `validarEntrenamiento`, el Repositorio_Datos lo descartaría
 * en la primera escritura, y si hubiera dos planes recomendados la
 * Seccion_Planes apagaría el destaque por completo (3.5). De ahí que estas
 * reglas se prueben sobre los datos concretos y no sólo sobre los tipos.
 */

import { describe, it, expect } from 'vitest';
import {
  CATEGORIAS,
  NIVELES,
  PERIODICIDADES,
  type Entrenamiento,
} from '../dominio/modelos';
import { validarEntrenamiento } from '../dominio/validaciones';
import { esEnlaceVideoValido, resolverEmbebido } from '../dominio/enlacesVideo';
import {
  CANTIDAD_ENTRENAMIENTOS_SIMULADOS,
  crearEntrenamientosSimulados,
} from './entrenamientosSimulados';
import {
  CANTIDAD_PLANES_SIMULADOS,
  LIMITES_PLAN,
  crearPlanesSimulados,
} from './planesSimulados';
import {
  PASOS_METODO,
  crearContenidoLanding,
  crearPasosMetodo,
} from './contenidoLanding';

/** Cantidad de decimales de un precio, sin arrastrar error de punto flotante. */
function decimalesDe(valor: number): number {
  const texto = valor.toString();
  const punto = texto.indexOf('.');
  return punto === -1 ? 0 : texto.length - punto - 1;
}

function categoriasDe(entrenamientos: readonly Entrenamiento[]): Set<string> {
  return new Set(entrenamientos.map((entrenamiento) => entrenamiento.categoria));
}

describe('entrenamientos simulados', () => {
  it('Dada la semilla de entrenamientos Cuando se la construye Entonces trae ocho entrenamientos, cantidad dentro del rango de seis a doce', () => {
    // Cubre: 8.3
    const entrenamientos = crearEntrenamientosSimulados();

    expect(entrenamientos).toHaveLength(8);
    expect(CANTIDAD_ENTRENAMIENTOS_SIMULADOS).toBe(8);
    expect(entrenamientos.length).toBeGreaterThanOrEqual(6);
    expect(entrenamientos.length).toBeLessThanOrEqual(12);
  });

  it('Dada la semilla de entrenamientos Cuando se valida cada uno con las reglas del repositorio Entonces ninguno reporta campos inválidos', () => {
    // Cubre: 8.3, 8.7
    for (const entrenamiento of crearEntrenamientosSimulados()) {
      expect(validarEntrenamiento(entrenamiento)).toBeNull();
    }
  });

  it('Dada la semilla de entrenamientos Cuando se revisan estado y fuente de video Entonces todos están publicados, son de fuente enlace y tienen enlace no vacío sin archivo asociado', () => {
    // Cubre: 1.7, 8.3
    for (const entrenamiento of crearEntrenamientosSimulados()) {
      expect(entrenamiento.estado).toBe('publicado');
      expect(entrenamiento.fuenteVideo).toBe('enlace');
      expect(entrenamiento.enlaceVideo.length).toBeGreaterThan(0);
      expect(esEnlaceVideoValido(entrenamiento.enlaceVideo)).toBe(true);
      expect(resolverEmbebido(entrenamiento.enlaceVideo).clase).not.toBe(
        'ninguno',
      );
      expect(entrenamiento.videoArchivo).toBeNull();
    }
  });

  it('Dada la semilla de entrenamientos Cuando se agrupan categoría, nivel y duración Entonces hay variedad en los tres atributos y cada categoría y nivel del dominio está representado', () => {
    // Cubre: 1.7, 8.3
    const entrenamientos = crearEntrenamientosSimulados();
    const niveles = new Set(entrenamientos.map((e) => e.nivel));
    const duraciones = new Set(entrenamientos.map((e) => e.duracionMinutos));

    expect(categoriasDe(entrenamientos).size).toBeGreaterThanOrEqual(4);
    expect(niveles.size).toBe(NIVELES.length);
    expect(duraciones.size).toBeGreaterThanOrEqual(6);
    for (const categoria of categoriasDe(entrenamientos)) {
      expect(CATEGORIAS as readonly string[]).toContain(categoria);
    }
  });

  it('Dada la semilla de entrenamientos Cuando se revisan identificadores y ejercicios Entonces los identificadores son únicos y cada entrenamiento trae al menos un ejercicio con nombre', () => {
    // Cubre: 8.3
    const entrenamientos = crearEntrenamientosSimulados();
    const identificadores = entrenamientos.map((e) => e.id);
    const identificadoresEjercicios = entrenamientos.flatMap((e) =>
      e.ejercicios.map((ejercicio) => ejercicio.id),
    );

    expect(new Set(identificadores).size).toBe(entrenamientos.length);
    expect(new Set(identificadoresEjercicios).size).toBe(
      identificadoresEjercicios.length,
    );
    for (const entrenamiento of entrenamientos) {
      expect(entrenamiento.ejercicios.length).toBeGreaterThanOrEqual(1);
      for (const ejercicio of entrenamiento.ejercicios) {
        expect(ejercicio.nombre.trim().length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('Dada la semilla de entrenamientos Cuando un consumidor muta la lista devuelta Entonces la siguiente construcción no queda afectada', () => {
    // Cubre: 8.3
    const primera = crearEntrenamientosSimulados();
    primera.pop();
    primera[0].titulo = 'mutado';
    primera[0].ejercicios.length = 0;

    const segunda = crearEntrenamientosSimulados();

    expect(segunda).toHaveLength(8);
    expect(segunda[0].titulo).not.toBe('mutado');
    expect(segunda[0].ejercicios.length).toBeGreaterThanOrEqual(1);
  });
});

describe('planes simulados', () => {
  it('Dada la semilla de planes Cuando se la construye Entonces trae cuatro planes, cantidad dentro del rango de tres a seis', () => {
    // Cubre: 3.1
    const planes = crearPlanesSimulados();

    expect(planes).toHaveLength(4);
    expect(CANTIDAD_PLANES_SIMULADOS).toBe(4);
    expect(planes.length).toBeGreaterThanOrEqual(3);
    expect(planes.length).toBeLessThanOrEqual(6);
  });

  it('Dada la semilla de planes Cuando se revisan nombre, objetivo, precio, periodicidad y prestaciones Entonces todos caen dentro de los límites de la sección de planes', () => {
    // Cubre: 3.1
    for (const plan of crearPlanesSimulados()) {
      expect(plan.nombre.length).toBeGreaterThanOrEqual(
        LIMITES_PLAN.nombreMinimo,
      );
      expect(plan.nombre.length).toBeLessThanOrEqual(LIMITES_PLAN.nombreMaximo);
      expect(plan.objetivo.length).toBeGreaterThanOrEqual(
        LIMITES_PLAN.objetivoMinimo,
      );
      expect(plan.objetivo.length).toBeLessThanOrEqual(
        LIMITES_PLAN.objetivoMaximo,
      );
      expect(plan.precio).toBeGreaterThanOrEqual(LIMITES_PLAN.precioMinimo);
      expect(plan.precio).toBeLessThanOrEqual(LIMITES_PLAN.precioMaximo);
      expect(decimalesDe(plan.precio)).toBeLessThanOrEqual(
        LIMITES_PLAN.decimalesPrecio,
      );
      expect(PERIODICIDADES as readonly string[]).toContain(plan.periodicidad);
      expect(plan.prestaciones.length).toBeGreaterThanOrEqual(
        LIMITES_PLAN.prestacionesMinimas,
      );
      expect(plan.prestaciones.length).toBeLessThanOrEqual(
        LIMITES_PLAN.prestacionesMaximas,
      );
      for (const prestacion of plan.prestaciones) {
        expect(prestacion.length).toBeGreaterThanOrEqual(
          LIMITES_PLAN.prestacionMinima,
        );
        expect(prestacion.length).toBeLessThanOrEqual(
          LIMITES_PLAN.prestacionMaxima,
        );
      }
    }
  });

  it('Dada la semilla de planes Cuando se cuentan los planes recomendados Entonces hay exactamente uno', () => {
    // Cubre: 3.4
    const recomendados = crearPlanesSimulados().filter(
      (plan) => plan.recomendado,
    );

    expect(recomendados).toHaveLength(1);
  });

  it('Dada la semilla de planes Cuando se revisan asesoría y alimentación Entonces cada plan declara ambos valores como booleanos y existe al menos un plan con cada combinación de interés', () => {
    // Cubre: 3.2
    const planes = crearPlanesSimulados();

    for (const plan of planes) {
      expect(typeof plan.incluyeAsesoria).toBe('boolean');
      expect(typeof plan.incluyeAlimentacion).toBe('boolean');
    }
    expect(planes.some((plan) => plan.incluyeAsesoria)).toBe(true);
    expect(planes.some((plan) => !plan.incluyeAsesoria)).toBe(true);
    expect(planes.some((plan) => plan.incluyeAlimentacion)).toBe(true);
    expect(planes.some((plan) => !plan.incluyeAlimentacion)).toBe(true);
  });

  it('Dada la semilla de planes Cuando un consumidor muta las prestaciones devueltas Entonces la siguiente construcción no queda afectada', () => {
    // Cubre: 3.1
    const primera = crearPlanesSimulados();
    const cantidadOriginal = primera[0].prestaciones.length;
    primera[0].prestaciones.push('prestación agregada por error');

    expect(crearPlanesSimulados()[0].prestaciones).toHaveLength(
      cantidadOriginal,
    );
  });
});

describe('contenido de la landing', () => {
  it('Dado el contenido de la landing Cuando se cuentan beneficios, testimonios y preguntas frecuentes Entonces hay al menos tres beneficios, tres testimonios y cuatro pares de pregunta y respuesta', () => {
    // Cubre: 1.9
    const contenido = crearContenidoLanding();

    expect(contenido.beneficios.length).toBeGreaterThanOrEqual(3);
    expect(contenido.testimonios.length).toBeGreaterThanOrEqual(3);
    expect(contenido.preguntasFrecuentes.length).toBeGreaterThanOrEqual(4);
  });

  it('Dado el contenido de la landing Cuando se revisa cada bloque de texto Entonces todos los títulos, nombres, textos, preguntas y respuestas tienen contenido', () => {
    // Cubre: 1.4, 1.9
    const contenido = crearContenidoLanding();

    for (const beneficio of contenido.beneficios) {
      expect(beneficio.titulo.trim().length).toBeGreaterThan(0);
      expect(beneficio.descripcion.trim().length).toBeGreaterThan(0);
    }
    for (const testimonio of contenido.testimonios) {
      expect(testimonio.nombre.trim().length).toBeGreaterThan(0);
      expect(testimonio.texto.trim().length).toBeGreaterThan(0);
    }
    for (const par of contenido.preguntasFrecuentes) {
      expect(par.pregunta.trim().length).toBeGreaterThan(0);
      expect(par.respuesta.trim().length).toBeGreaterThan(0);
    }
  });

  it('Dado el contenido de la landing Cuando se revisan los datos de contacto Entonces trae correo, teléfono, dirección y al menos tres redes sociales con nombre y dirección web', () => {
    // Cubre: 1.5
    const { contacto } = crearContenidoLanding();

    expect(contacto.correo).toMatch(/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/);
    expect(contacto.telefono.trim().length).toBeGreaterThan(0);
    expect(contacto.direccion.trim().length).toBeGreaterThan(0);
    expect(contacto.redes.length).toBeGreaterThanOrEqual(3);
    for (const red of contacto.redes) {
      expect(red.nombre.trim().length).toBeGreaterThan(0);
      expect(red.url.startsWith('https://')).toBe(true);
    }
  });

  it('Dados los pasos del método Cuando se los construye Entonces hay al menos tres pasos numerados de forma consecutiva desde uno, cada uno con título y descripción', () => {
    // Cubre: 1.4
    const pasos = crearPasosMetodo();

    expect(pasos.length).toBeGreaterThanOrEqual(3);
    expect(pasos).toHaveLength(PASOS_METODO.length);
    pasos.forEach((paso, indice) => {
      expect(paso.orden).toBe(indice + 1);
      expect(paso.titulo.trim().length).toBeGreaterThan(0);
      expect(paso.descripcion.trim().length).toBeGreaterThan(0);
    });
  });

  it('Dado el contenido de la landing Cuando un consumidor muta las listas devueltas Entonces la siguiente construcción no queda afectada', () => {
    // Cubre: 1.9
    const primera = crearContenidoLanding();
    const cantidadBeneficios = primera.beneficios.length;
    const cantidadRedes = primera.contacto.redes.length;
    primera.beneficios.pop();
    primera.contacto.redes.pop();
    primera.contacto.correo = 'mutado@ejemplo.test';

    const segunda = crearContenidoLanding();

    expect(segunda.beneficios).toHaveLength(cantidadBeneficios);
    expect(segunda.contacto.redes).toHaveLength(cantidadRedes);
    expect(segunda.contacto.correo).not.toBe('mutado@ejemplo.test');
  });
});
