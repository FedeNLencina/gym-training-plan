/**
 * Tests de las secciones estáticas de la Landing_Page.
 *
 * La Landing_Page compone siete secciones (Hero, Beneficios, Catálogo
 * destacado, Cómo funciona, Testimonios, Planes y Preguntas frecuentes) y el
 * `PieDePagina` del `LayoutPublico` aporta la octava (Pie de página). Por eso
 * el orden y la unicidad de los ocho encabezados se verifican sobre la vista
 * completa, montando el árbol de rutas en la raíz, tal como lo compone `App`.
 *
 * Los tests de contenido del Hero, de las cantidades mínimas y del pie se
 * montan sobre la vista más acotada que basta para el criterio: `LandingPage`
 * bajo `MemoryRouter` para los CTA, y `PieDePagina` para los datos de contacto.
 *
 * Consultas sólo por rol, texto o etiqueta accesible.
 */

import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { crearContenidoLanding } from '../datos/contenidoLanding';
import { crearEntrenamientosSimulados } from '../datos/entrenamientosSimulados';
import { HERO_LANDING } from '../datos/heroLanding';
import { ProveedorAvisos } from '../estado/ContextoAvisos';
import { ProveedorServicios } from '../estado/ContextoServicios';
import { ProveedorSesion } from '../estado/ContextoSesion';
import PieDePagina from '../layout/PieDePagina';
import { ArbolRutas, RUTAS } from '../rutas/definicionRutas';
import type { ServicioAutenticacion } from '../servicios/servicioAutenticacion';
import { crearRelojFalso } from '../tests/dobles/relojFalso';
import { crearRepositorioEnMemoria } from '../tests/dobles/repositorioEnMemoria';
import LandingPage from './LandingPage';

/** Los ocho encabezados de la Landing_Page en el orden de arriba hacia abajo. */
const ENCABEZADOS_EN_ORDEN = [
  'Beneficios del método',
  'Catálogo destacado de entrenamientos',
  'Cómo funciona la Plataforma',
  'Testimonios',
  'Planes',
  'Preguntas frecuentes',
  'Pie de página',
];

const servicioSinSesion: ServicioAutenticacion = {
  async registrar() {
    throw new Error('no usado');
  },
  async ingresar() {
    throw new Error('no usado');
  },
  async cerrarSesion() {},
  async restaurarSesion() {
    return null;
  },
  cuentaDe() {
    return null;
  },
};

/**
 * Servicios de datos y tiempo sustituidos por dobles: un repositorio en memoria
 * sembrado con los Entrenamientos simulados y un reloj falso, de modo que el
 * Catálogo destacado obtenga material y las secciones estáticas no dependan de
 * la persistencia real del navegador.
 */
function servicios(): {
  repositorio: ReturnType<typeof crearRepositorioEnMemoria>;
  reloj: ReturnType<typeof crearRelojFalso>;
} {
  return {
    repositorio: crearRepositorioEnMemoria({
      entrenamientos: crearEntrenamientosSimulados(),
    }),
    reloj: crearRelojFalso(),
  };
}

function renderizarLandingCompleta(): void {
  const { repositorio, reloj } = servicios();
  render(
    <MemoryRouter initialEntries={[RUTAS.inicio]}>
      <ProveedorSesion servicio={servicioSinSesion}>
        <ProveedorServicios repositorio={repositorio} reloj={reloj}>
          <ProveedorAvisos>
            <ArbolRutas />
          </ProveedorAvisos>
        </ProveedorServicios>
      </ProveedorSesion>
    </MemoryRouter>,
  );
}

function renderizarLanding(): void {
  const { repositorio, reloj } = servicios();
  render(
    <MemoryRouter initialEntries={[RUTAS.inicio]}>
      <ProveedorServicios repositorio={repositorio} reloj={reloj}>
        <LandingPage />
      </ProveedorServicios>
    </MemoryRouter>,
  );
}

describe('Landing_Page: secciones estáticas', () => {
  it('Dado la Landing_Page, Cuando se presenta, Entonces expone ocho encabezados accesibles de texto único en el orden fijado', () => {
    // Cubre: 1.1
    renderizarLandingCompleta();

    const seccionHero = screen.getByRole('heading', {
      level: 1,
      name: HERO_LANDING.titular,
    });
    const seccionesRestantes = screen
      .getAllByRole('heading', { level: 2 })
      .map((elemento) => elemento.textContent);
    const todos = [seccionHero.textContent, ...seccionesRestantes];
    expect(todos).toEqual([HERO_LANDING.titular, ...ENCABEZADOS_EN_ORDEN]);
    expect(new Set(todos).size).toBe(todos.length);
  });

  it('Dado la sección Hero, Cuando se presenta, Entonces su titular tiene entre 1 y 80 caracteres', () => {
    // Cubre: 1.2
    renderizarLanding();

    const titular = screen.getByRole('heading', {
      level: 1,
      name: HERO_LANDING.titular,
    });
    const longitud = (titular.textContent ?? '').length;
    expect(longitud).toBeGreaterThanOrEqual(1);
    expect(longitud).toBeLessThanOrEqual(80);
  });

  it('Dado la sección Hero, Cuando se presenta, Entonces su subtitular tiene entre 40 y 200 caracteres', () => {
    // Cubre: 1.2
    renderizarLanding();

    const subtitular = screen.getByText(HERO_LANDING.subtitular);
    const longitud = (subtitular.textContent ?? '').length;
    expect(longitud).toBeGreaterThanOrEqual(40);
    expect(longitud).toBeLessThanOrEqual(200);
  });

  it('Dado la sección Hero, Cuando se presenta, Entonces el CTA primario "Comenzar ahora" declara destino /registro', () => {
    // Cubre: 1.2
    renderizarLanding();

    expect(
      screen.getByRole('link', { name: 'Comenzar ahora' }),
    ).toHaveAttribute('href', RUTAS.registro);
  });

  it('Dado la sección Hero, Cuando se presenta, Entonces el CTA secundario "Ver entrenamientos" declara destino /entrenamientos', () => {
    // Cubre: 1.3
    renderizarLanding();

    expect(
      screen.getByRole('link', { name: 'Ver entrenamientos' }),
    ).toHaveAttribute('href', RUTAS.entrenamientos);
  });

  it('Dado la sección Beneficios del método, Cuando se presenta, Entonces expone al menos tres beneficios', () => {
    // Cubre: 1.9
    renderizarLanding();

    const beneficios = crearContenidoLanding().beneficios;
    expect(beneficios.length).toBeGreaterThanOrEqual(3);
    for (const beneficio of beneficios) {
      expect(screen.getByText(beneficio.titulo)).toBeInTheDocument();
    }
  });

  it('Dado la sección Testimonios, Cuando se presenta, Entonces expone al menos tres testimonios con nombre y texto', () => {
    // Cubre: 1.9
    renderizarLanding();

    const testimonios = crearContenidoLanding().testimonios;
    expect(testimonios.length).toBeGreaterThanOrEqual(3);
    for (const testimonio of testimonios) {
      expect(screen.getByText(testimonio.nombre)).toBeInTheDocument();
      expect(screen.getByText(testimonio.texto)).toBeInTheDocument();
    }
  });

  it('Dado la sección Preguntas frecuentes, Cuando se presenta, Entonces expone al menos cuatro pares de pregunta y respuesta', () => {
    // Cubre: 1.9
    renderizarLanding();

    const preguntas = crearContenidoLanding().preguntasFrecuentes;
    expect(preguntas.length).toBeGreaterThanOrEqual(4);
    for (const par of preguntas) {
      expect(screen.getByText(par.pregunta)).toBeInTheDocument();
      expect(screen.getByText(par.respuesta)).toBeInTheDocument();
    }
  });

  it('Dado la Landing_Page, Cuando se presenta, Entonces no incluye ningún elemento de imagen que referencie un archivo', () => {
    // Cubre: 1.4
    renderizarLanding();

    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  it('Dado el Pie de página, Cuando se presenta, Entonces expone correo, teléfono, dirección y al menos tres redes sociales', () => {
    // Cubre: 1.5
    render(
      <MemoryRouter>
        <PieDePagina />
      </MemoryRouter>,
    );

    const contacto = crearContenidoLanding().contacto;
    const pie = screen.getByRole('contentinfo');
    expect(within(pie).getByText(contacto.correo)).toBeInTheDocument();
    expect(within(pie).getByText(contacto.telefono)).toBeInTheDocument();
    expect(within(pie).getByText(contacto.direccion)).toBeInTheDocument();
    const redes = within(pie).getAllByRole('link');
    expect(redes.length).toBeGreaterThanOrEqual(3);
  });
});
