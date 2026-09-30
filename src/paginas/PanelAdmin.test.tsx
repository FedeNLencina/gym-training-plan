/**
 * Tests de PanelAdmin.
 *
 * El Panel_Admin presenta el listado de Entrenamientos administrables cuando la
 * sesión activa tiene rol administrador (7.1) y queda tras la guarda de acceso
 * `RutaProtegida`: una sesión con rol Usuario que solicita `/admin` es devuelta a
 * `/entrenamientos` con el aviso "No tenés permisos para esta sección" y sin
 * tocar la sesión (7.2).
 *
 * La vista se monta bajo un `MemoryRouter` con el árbol mínimo `/admin` y
 * `/entrenamientos`, bajo los proveedores de sesión, de avisos y de servicios,
 * sustituyendo el ServicioAutenticacion y el Repositorio_Datos por dobles.
 * Consultas sólo por rol, texto o etiqueta accesible; una sola interacción por
 * test.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { crearEntrenamiento, type Entrenamiento, type Sesion } from '../dominio/modelos';
import { ProveedorAvisos, RegionAvisos } from '../estado/ContextoAvisos';
import { ProveedorServicios } from '../estado/ContextoServicios';
import { ProveedorSesion } from '../estado/ContextoSesion';
import { RutaProtegida } from '../rutas/RutaProtegida';
import type { ServicioAutenticacion } from '../servicios/servicioAutenticacion';
import { crearRelojFalso } from '../tests/dobles/relojFalso';
import { crearRepositorioEnMemoria } from '../tests/dobles/repositorioEnMemoria';
import PanelAdmin, { TITULO_PANEL_ADMIN } from './PanelAdmin';

const SESION_ADMIN: Sesion = {
  correo: 'admin@atlasgym.example',
  nombre: 'Admin Atlas',
  rol: 'administrador',
};

const SESION_USUARIO: Sesion = {
  correo: 'ana@atlasgym.example',
  nombre: 'Ana Pérez',
  rol: 'usuario',
};

function servicioConSesion(sesion: Sesion | null): ServicioAutenticacion {
  return {
    async registrar() {
      throw new Error('no usado');
    },
    async ingresar() {
      throw new Error('no usado');
    },
    async cerrarSesion() {},
    async restaurarSesion() {
      return sesion;
    },
    cuentaDe() {
      return null;
    },
  };
}

/** Vista de destino de la redirección, para observar el cambio de ruta. */
function DestinoCatalogo(): ReactElement {
  const location = useLocation();
  return <p>{`Ruta: ${location.pathname}`}</p>;
}

type OpcionesRender = {
  sesion: Sesion | null;
  entrenamientos?: Entrenamiento[];
};

function renderizar({ sesion, entrenamientos = [] }: OpcionesRender): {
  repositorio: ReturnType<typeof crearRepositorioEnMemoria>;
} {
  const repositorio = crearRepositorioEnMemoria({ entrenamientos });
  const reloj = crearRelojFalso();
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <ProveedorSesion servicio={servicioConSesion(sesion)}>
        <ProveedorAvisos>
          <ProveedorServicios repositorio={repositorio} reloj={reloj}>
            <RegionAvisos />
            <Routes>
              <Route
                path="/admin"
                element={
                  <RutaProtegida rolRequerido="administrador">
                    <PanelAdmin />
                  </RutaProtegida>
                }
              />
              <Route path="/entrenamientos" element={<DestinoCatalogo />} />
            </Routes>
          </ProveedorServicios>
        </ProveedorAvisos>
      </ProveedorSesion>
    </MemoryRouter>,
  );
  return { repositorio };
}

describe('PanelAdmin', () => {
  it('Dado una sesión con rol administrador Cuando abre el Panel_Admin Entonces presenta el listado de Entrenamientos administrables', async () => {
    // Cubre: 7.1
    renderizar({
      sesion: SESION_ADMIN,
      entrenamientos: [crearEntrenamiento({ id: 'e1', titulo: 'Fuerza total' })],
    });

    expect(await screen.findByText('Fuerza total')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: TITULO_PANEL_ADMIN }),
    ).toBeInTheDocument();
  });

  it('Dado una sesión con rol usuario Cuando solicita el Panel_Admin Entonces la devuelve al catálogo con el aviso de permisos', async () => {
    // Cubre: 7.2
    renderizar({ sesion: SESION_USUARIO });

    expect(await screen.findByText('Ruta: /entrenamientos')).toBeInTheDocument();
    expect(
      screen.getByText('No tenés permisos para esta sección'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: TITULO_PANEL_ADMIN }),
    ).not.toBeInTheDocument();
  });

  it('Dado un Entrenamiento administrable Cuando el Administrador confirma su eliminación Entonces lo quita del catálogo y presenta "Entrenamiento eliminado"', async () => {
    // Cubre: 7.6
    const usuario = userEvent.setup();
    const { repositorio } = renderizar({
      sesion: SESION_ADMIN,
      entrenamientos: [
        crearEntrenamiento({ id: 'e1', titulo: 'Fuerza total' }),
        crearEntrenamiento({ id: 'e2', titulo: 'Cardio express' }),
      ],
    });
    await usuario.click(
      await screen.findByRole('button', { name: 'Eliminar Fuerza total' }),
    );

    await usuario.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }),
    );

    expect(await screen.findByText('Entrenamiento eliminado')).toBeInTheDocument();
    expect(screen.queryByText('Fuerza total')).not.toBeInTheDocument();
    expect(screen.getByText('Cardio express')).toBeInTheDocument();
    expect(repositorio.llamadas.eliminarEntrenamiento).toEqual(['e1']);
  });

  it('Dado un Entrenamiento administrable Cuando el Administrador cancela su eliminación Entonces lo conserva sin cambios y no lo elimina', async () => {
    // Cubre: 7.9
    const usuario = userEvent.setup();
    const { repositorio } = renderizar({
      sesion: SESION_ADMIN,
      entrenamientos: [crearEntrenamiento({ id: 'e1', titulo: 'Fuerza total' })],
    });
    await usuario.click(
      await screen.findByRole('button', { name: 'Eliminar Fuerza total' }),
    );

    await usuario.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }),
    );

    expect(screen.getByText('Fuerza total')).toBeInTheDocument();
    expect(repositorio.llamadas.eliminarEntrenamiento).toEqual([]);
  });
});
