/**
 * Tests de RutaProtegida.
 *
 * La guarda cubre cuatro situaciones. Sin sesión, la ruta protegida redirige a
 * `/ingresar` con el aviso "Iniciá sesión para continuar" (2.13, 6.8, 7.8). Con
 * rol Usuario sobre una ruta que exige Administrador, redirige a
 * `/entrenamientos` sin tocar la sesión y con el aviso "No tenés permisos para
 * esta sección" (7.2). Con sesión activa pero un `:id` que no figura entre los
 * publicados, redirige a `/entrenamientos` con "El entrenamiento solicitado no
 * existe" (2.14). Mientras la sesión se está restaurando desde el navegador, no
 * decide: presenta un indicador de carga sin redirigir (4.11).
 *
 * El ServicioAutenticacion se sustituye por un doble que permite diferir la
 * restauración, único modo de observar el estado `restaurando`. Las consultas se
 * hacen sólo por rol y por texto, y cada test contiene una única interacción o
 * un único montaje.
 *
 * Cubre: 2.13, 2.14, 6.8, 7.2, 7.8
 */

import { render, screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { crearCuenta, crearSesion, type Sesion } from '../dominio/modelos';
import type {
  Credenciales,
  DatosRegistro,
  ServicioAutenticacion,
} from '../servicios/servicioAutenticacion';
import { ProveedorAvisos, RegionAvisos } from '../estado/ContextoAvisos';
import { ProveedorSesion } from '../estado/ContextoSesion';
import { RutaProtegida } from './RutaProtegida';

// --- Doble del ServicioAutenticacion ----------------------------------------

type OpcionesServicioFalso = {
  /** Sesión persistida devuelta por `restaurarSesion`. */
  sesionPersistida?: Sesion | null;
  /** Cuando es verdadero, la restauración nunca resuelve (queda `restaurando`). */
  diferirRestauracion?: boolean;
};

function crearServicioFalso({
  sesionPersistida = null,
  diferirRestauracion = false,
}: OpcionesServicioFalso = {}): ServicioAutenticacion {
  return {
    async registrar({ nombre, correo, idPlan = null }: DatosRegistro) {
      return crearSesion(crearCuenta({ nombre, correo, rol: 'usuario', idPlan }));
    },
    async ingresar({ correo }: Credenciales) {
      return { correo, nombre: 'Cuenta existente', rol: 'usuario' };
    },
    async cerrarSesion() {},
    async restaurarSesion() {
      if (diferirRestauracion) {
        await new Promise<void>(() => {});
      }
      return sesionPersistida;
    },
    cuentaDe() {
      return null;
    },
  };
}

// --- Vistas de destino -------------------------------------------------------

function Reproductor(): ReactElement {
  return <h1>Reproductor de entrenamiento</h1>;
}

function Panel(): ReactElement {
  return <h1>Panel de administración</h1>;
}

type OpcionesRender = {
  entradaInicial: string;
  sesionPersistida?: Sesion | null;
  diferirRestauracion?: boolean;
  /** Guarda del reproductor: exige sesión y verifica el `:id`. */
  guardaDetalle?: ReactNode;
  /** Guarda del panel: exige rol administrador. */
  guardaPanel?: ReactNode;
};

function renderizar({
  entradaInicial,
  sesionPersistida = null,
  diferirRestauracion = false,
  guardaDetalle,
  guardaPanel,
}: OpcionesRender) {
  const servicio = crearServicioFalso({ sesionPersistida, diferirRestauracion });
  return render(
    <MemoryRouter initialEntries={[entradaInicial]}>
      <ProveedorAvisos>
        <ProveedorSesion servicio={servicio}>
          <RegionAvisos />
          <Routes>
            <Route
              path="/entrenamientos/:id"
              element={guardaDetalle ?? <Reproductor />}
            />
            <Route path="/admin" element={guardaPanel ?? <Panel />} />
            <Route
              path="/entrenamientos"
              element={<h1>Catálogo de entrenamientos</h1>}
            />
            <Route path="/ingresar" element={<h1>Iniciar sesión</h1>} />
          </Routes>
        </ProveedorSesion>
      </ProveedorAvisos>
    </MemoryRouter>,
  );
}

const SESION_USUARIO: Sesion = {
  correo: 'ana@correo.com',
  nombre: 'Ana',
  rol: 'usuario',
};

const SESION_ADMIN: Sesion = {
  correo: 'admin@atlasgym.com',
  nombre: 'Administrador Atlas',
  rol: 'administrador',
};

describe('RutaProtegida', () => {
  it('Dado un visitante sin sesión Cuando entra a un detalle de entrenamiento Entonces es enviado a iniciar sesión con el aviso correspondiente', async () => {
    // Cubre: 2.13, 6.8, 7.8
    renderizar({
      entradaInicial: '/entrenamientos/e1',
      sesionPersistida: null,
      guardaDetalle: (
        <RutaProtegida idsPublicados={['e1']}>
          <Reproductor />
        </RutaProtegida>
      ),
    });
    expect(
      await screen.findByRole('heading', { name: 'Iniciar sesión' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Iniciá sesión para continuar',
    );
  });

  it('Dado un usuario con rol Usuario Cuando entra al panel de administración Entonces es enviado al catálogo con el aviso de permisos', async () => {
    // Cubre: 7.2
    renderizar({
      entradaInicial: '/admin',
      sesionPersistida: SESION_USUARIO,
      guardaPanel: (
        <RutaProtegida rolRequerido="administrador">
          <Panel />
        </RutaProtegida>
      ),
    });
    expect(
      await screen.findByRole('heading', { name: 'Catálogo de entrenamientos' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'No tenés permisos para esta sección',
    );
  });

  it('Dado un usuario con sesión activa Cuando entra a un detalle con identificador inexistente Entonces vuelve al catálogo con el aviso de entrenamiento inexistente', async () => {
    // Cubre: 2.14
    renderizar({
      entradaInicial: '/entrenamientos/fantasma',
      sesionPersistida: SESION_USUARIO,
      guardaDetalle: (
        <RutaProtegida idsPublicados={['e1', 'e2']}>
          <Reproductor />
        </RutaProtegida>
      ),
    });
    expect(
      await screen.findByRole('heading', { name: 'Catálogo de entrenamientos' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'El entrenamiento solicitado no existe',
    );
  });

  it('Dada una sesión que se está restaurando Cuando se entra a una ruta protegida Entonces se presenta un indicador de carga sin redirigir', async () => {
    // Cubre: 4.11
    renderizar({
      entradaInicial: '/entrenamientos/e1',
      sesionPersistida: SESION_ADMIN,
      diferirRestauracion: true,
      guardaDetalle: (
        <RutaProtegida idsPublicados={['e1']}>
          <Reproductor />
        </RutaProtegida>
      ),
    });
    expect(await screen.findByText(/Cargando/)).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Iniciar sesión' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Reproductor de entrenamiento' }),
    ).not.toBeInTheDocument();
  });

  it('Dado un usuario con sesión activa Cuando entra a un detalle con identificador publicado Entonces accede al reproductor', async () => {
    // Cubre: 2.14
    renderizar({
      entradaInicial: '/entrenamientos/e1',
      sesionPersistida: SESION_USUARIO,
      guardaDetalle: (
        <RutaProtegida idsPublicados={['e1']}>
          <Reproductor />
        </RutaProtegida>
      ),
    });
    expect(
      await screen.findByRole('heading', { name: 'Reproductor de entrenamiento' }),
    ).toBeInTheDocument();
  });
});
