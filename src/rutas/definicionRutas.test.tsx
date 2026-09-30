/**
 * Tests del árbol de rutas de la Plataforma.
 *
 * Cada test entra directamente a una dirección con `MemoryRouter` (una sola
 * dirección de entrada por corrida) y verifica que la Plataforma presenta la
 * vista asociada a esa ruta, o la vista de página inexistente cuando la ruta no
 * está declarada. Las consultas se hacen sólo por rol o por texto accesible.
 *
 * El árbol se monta bajo `LayoutPublico`, de modo que la Navbar permanece
 * visible incluso en la ruta inexistente (2.1, 2.15). En esta tarea las vistas
 * son marcadores de posición: su contenido definitivo corresponde a tareas
 * posteriores. Basta con que cada ruta resuelva a su vista distinguible.
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { HERO_LANDING } from '../datos/heroLanding';
import { ProveedorAvisos } from '../estado/ContextoAvisos';
import { ProveedorServicios } from '../estado/ContextoServicios';
import { ProveedorSesion } from '../estado/ContextoSesion';
import type { ServicioAutenticacion } from '../servicios/servicioAutenticacion';
import { crearRelojFalso } from '../tests/dobles/relojFalso';
import { crearRepositorioEnMemoria } from '../tests/dobles/repositorioEnMemoria';
import { ArbolRutas, RUTAS } from './definicionRutas';

/**
 * Doble mínimo del ServicioAutenticacion: la Navbar de `LayoutPublico` consulta
 * la sesión, de modo que el árbol se monta bajo el proveedor de sesión (sin
 * sesión activa) y el de avisos, tal como los compone `App`.
 */
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

function entrarEn(direccion: string): void {
  render(
    <MemoryRouter initialEntries={[direccion]}>
      <ProveedorSesion servicio={servicioSinSesion}>
        <ProveedorServicios
          repositorio={crearRepositorioEnMemoria()}
          reloj={crearRelojFalso()}
        >
          <ProveedorAvisos>
            <ArbolRutas />
          </ProveedorAvisos>
        </ProveedorServicios>
      </ProveedorSesion>
    </MemoryRouter>,
  );
}

describe('Árbol de rutas', () => {
  it('Dado la dirección de entrada raíz, Cuando la Plataforma la resuelve, Entonces presenta la vista de la Landing_Page', () => {
    // Cubre: 2.12
    entrarEn(RUTAS.inicio);

    expect(
      screen.getByRole('heading', { level: 1, name: HERO_LANDING.titular }),
    ).toBeInTheDocument();
  });

  it('Dado la dirección del catálogo, Cuando la Plataforma la resuelve, Entonces presenta la vista del Catalogo_Entrenamientos', () => {
    // Cubre: 2.12
    entrarEn(RUTAS.entrenamientos);

    expect(
      screen.getByRole('heading', { name: 'Catálogo de entrenamientos' }),
    ).toBeInTheDocument();
  });

  it('Dado la dirección del detalle de un Entrenamiento, Cuando la Plataforma la resuelve, Entonces presenta la vista del Reproductor', () => {
    // Cubre: 2.12
    entrarEn('/entrenamientos/abc-123');

    expect(
      screen.getByRole('heading', { name: 'Reproductor de entrenamiento' }),
    ).toBeInTheDocument();
  });

  it('Dado la dirección de registro, Cuando la Plataforma la resuelve, Entonces presenta la vista de Registro', () => {
    // Cubre: 2.12
    entrarEn(RUTAS.registro);

    expect(
      screen.getByRole('heading', { name: 'Registro' }),
    ).toBeInTheDocument();
  });

  it('Dado la dirección de ingreso, Cuando la Plataforma la resuelve, Entonces presenta la vista de Ingresar', () => {
    // Cubre: 2.12
    entrarEn(RUTAS.ingresar);

    expect(
      screen.getByRole('heading', { name: 'Iniciar sesión' }),
    ).toBeInTheDocument();
  });

  it('Dado un Visitante sin sesión Cuando la Plataforma resuelve la dirección del panel de administración Entonces redirige a la vista de ingreso', async () => {
    // Cubre: 2.12, 7.8
    entrarEn(RUTAS.admin);

    expect(
      await screen.findByRole('heading', { name: 'Iniciar sesión' }),
    ).toBeInTheDocument();
  });

  it('Dado una dirección que no coincide con ninguna ruta declarada, Cuando la Plataforma la resuelve, Entonces presenta el mensaje de página no encontrada', () => {
    // Cubre: 2.15
    entrarEn('/una-ruta-que-no-existe');

    expect(
      screen.getByRole('heading', { name: 'Página no encontrada' }),
    ).toBeInTheDocument();
  });

  it('Dado una dirección inexistente, Cuando la Plataforma la resuelve, Entonces conserva una acción para volver al inicio hacia la raíz', () => {
    // Cubre: 2.15
    entrarEn('/otra-inexistente');

    expect(
      screen.getByRole('link', { name: 'Volver al inicio' }),
    ).toHaveAttribute('href', RUTAS.inicio);
  });
});
