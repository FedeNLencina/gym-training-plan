/**
 * Tests del LayoutPublico, la Navbar, el menú móvil y el pie de página.
 *
 * El layout se monta bajo un `MemoryRouter` con un árbol mínimo de rutas y
 * bajo los proveedores de sesión y de avisos, sustituyendo el
 * ServicioAutenticacion por un doble. Las consultas se hacen sólo por rol o por
 * texto accesible y cada test contiene una única interacción del usuario.
 *
 * La Navbar debe estar presente y ordenada en toda vista pública (2.1), marcar
 * con `aria-current` exactamente la ruta activa (2.6), presentar el botón "Menú"
 * por debajo de 768 px con `aria-expanded` (2.7, 2.8), reflejar la sesión activa
 * (4.8, 4.9), exponer el acceso al Panel_Admin sólo con rol administrador (7.1),
 * y combinar navegación con desplazamiento en "Inicio" y "Planes" (2.2, 2.3,
 * 2.5, 2.9). El menú móvil se cierra al cruzar el umbral de 768 px (2.10).
 */

import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactElement } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { crearSesion, type Sesion } from '../dominio/modelos';
import type {
  Credenciales,
  DatosRegistro,
  ServicioAutenticacion,
} from '../servicios/servicioAutenticacion';
import { ProveedorSesion } from '../estado/ContextoSesion';
import { ProveedorAvisos } from '../estado/ContextoAvisos';
import { crearCuenta } from '../dominio/modelos';
import LayoutPublico from './LayoutPublico';

// --- Doble del ServicioAutenticacion ----------------------------------------

function crearServicioFalso(sesionPersistida: Sesion | null): {
  servicio: ServicioAutenticacion;
  cierres: () => number;
} {
  let cierres = 0;
  const servicio: ServicioAutenticacion = {
    async registrar({ nombre, correo, idPlan = null }: DatosRegistro) {
      return crearSesion(crearCuenta({ nombre, correo, rol: 'usuario', idPlan }));
    },
    async ingresar({ correo }: Credenciales) {
      return { correo, nombre: 'Cuenta', rol: 'usuario' };
    },
    async cerrarSesion() {
      cierres += 1;
    },
    async restaurarSesion() {
      return sesionPersistida;
    },
    cuentaDe() {
      return null;
    },
  };
  return { servicio, cierres: () => cierres };
}

// --- matchMedia controlable -------------------------------------------------

type OyenteMedios = (evento: MediaQueryListEvent) => void;

let esEscritorio = false;
let oyentes: OyenteMedios[] = [];

function instalarMatchMedia(escritorio: boolean): void {
  esEscritorio = escritorio;
  oyentes = [];
  window.matchMedia = vi.fn().mockImplementation((consulta: string) => ({
    matches: esEscritorio,
    media: consulta,
    onchange: null,
    addEventListener: (_: string, oyente: OyenteMedios) => {
      oyentes.push(oyente);
    },
    removeEventListener: (_: string, oyente: OyenteMedios) => {
      oyentes = oyentes.filter((o) => o !== oyente);
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  })) as unknown as typeof window.matchMedia;
}

function cruzarAEscritorio(): void {
  esEscritorio = true;
  act(() => {
    oyentes.forEach((oyente) => {
      oyente({ matches: true } as MediaQueryListEvent);
    });
  });
}

// --- Componente que revela la ruta actual -----------------------------------

function RutaActual(): ReactElement {
  const location = useLocation();
  return <p>{`Ruta: ${location.pathname}${location.hash}`}</p>;
}

function montar(direccion: string, sesion: Sesion | null): {
  cierres: () => number;
} {
  const { servicio, cierres } = crearServicioFalso(sesion);
  render(
    <MemoryRouter initialEntries={[direccion]}>
      <ProveedorSesion servicio={servicio}>
        <ProveedorAvisos>
          <Routes>
            <Route element={<LayoutPublico />}>
              <Route path="/" element={<RutaActual />} />
              <Route path="entrenamientos" element={<RutaActual />} />
              <Route path="registro" element={<RutaActual />} />
              <Route path="ingresar" element={<RutaActual />} />
              <Route path="admin" element={<RutaActual />} />
            </Route>
          </Routes>
        </ProveedorAvisos>
      </ProveedorSesion>
    </MemoryRouter>,
  );
  return { cierres };
}

beforeEach(() => {
  instalarMatchMedia(true);
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Navbar: presencia y orden', () => {
  it('Dado la vista del catálogo, Cuando se presenta la Navbar, Entonces expone Inicio, Entrenamientos y Planes en ese orden', async () => {
    // Cubre: 2.1
    montar('/entrenamientos', null);

    const navegacion = await screen.findByRole('navigation', {
      name: 'Principal',
    });
    const enlaces = within(navegacion)
      .getAllByRole('link')
      .map((enlace) => enlace.textContent);
    expect(enlaces.slice(0, 3)).toEqual(['Inicio', 'Entrenamientos', 'Planes']);
  });

  it('Dado la vista de ruta inexistente montada bajo el layout, Cuando se presenta, Entonces la Navbar permanece visible', async () => {
    // Cubre: 2.1
    montar('/registro', null);

    expect(
      await screen.findByRole('link', { name: 'Inicio' }),
    ).toBeInTheDocument();
  });
});

describe('Navbar: destinos de los elementos', () => {
  it('Dado la Navbar, Cuando se consulta el elemento Entrenamientos, Entonces su destino es /entrenamientos', async () => {
    // Cubre: 2.4
    montar('/', null);

    expect(
      await screen.findByRole('link', { name: 'Entrenamientos' }),
    ).toHaveAttribute('href', '/entrenamientos');
  });
});

describe('Navbar: página actual', () => {
  it('Dado la vista del catálogo, Cuando se presenta la Navbar, Entonces sólo Entrenamientos marca la página actual', async () => {
    // Cubre: 2.6
    montar('/entrenamientos', null);

    const marcados = (await screen.findAllByRole('link')).filter(
      (enlace) => enlace.getAttribute('aria-current') === 'page',
    );
    expect(marcados.map((enlace) => enlace.textContent)).toEqual([
      'Entrenamientos',
    ]);
  });

  it('Dado la vista de inicio, Cuando se presenta la Navbar, Entonces sólo Inicio marca la página actual', async () => {
    // Cubre: 2.6
    montar('/', null);

    const marcados = (await screen.findAllByRole('link')).filter(
      (enlace) => enlace.getAttribute('aria-current') === 'page',
    );
    expect(marcados.map((enlace) => enlace.textContent)).toEqual(['Inicio']);
  });
});

describe('Navbar: acciones según la sesión', () => {
  it('Dado que no hay sesión activa, Cuando se presenta la Navbar, Entonces ofrece Iniciar sesión y Registrarme', async () => {
    // Cubre: 4.9
    montar('/', null);

    expect(
      await screen.findByRole('link', { name: 'Iniciar sesión' }),
    ).toHaveAttribute('href', '/ingresar');
    expect(screen.getByRole('link', { name: 'Registrarme' })).toHaveAttribute(
      'href',
      '/registro',
    );
  });

  it('Dado una sesión activa, Cuando se presenta la Navbar, Entonces muestra el nombre de la cuenta y la acción de cerrar sesión', async () => {
    // Cubre: 4.8
    montar('/', { correo: 'ana@atlasgym.example', nombre: 'Ana Pérez', rol: 'usuario' });

    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Cerrar sesión' }),
    ).toBeInTheDocument();
  });

  it('Dado una sesión activa, Cuando el usuario cierra la sesión, Entonces navega a la raíz y el servicio borra la sesión persistida', async () => {
    // Cubre: 4.10
    const { cierres } = montar('/entrenamientos', {
      correo: 'ana@atlasgym.example',
      nombre: 'Ana Pérez',
      rol: 'usuario',
    });
    await screen.findByText('Ana Pérez');

    await userEvent.click(
      screen.getByRole('button', { name: 'Cerrar sesión' }),
    );

    expect(await screen.findByText('Ruta: /')).toBeInTheDocument();
    expect(cierres()).toBe(1);
  });

  it('Dado una sesión sin rol administrador, Cuando se presenta la Navbar, Entonces no expone el acceso al Panel de administración', async () => {
    // Cubre: 7.1
    montar('/', { correo: 'ana@atlasgym.example', nombre: 'Ana Pérez', rol: 'usuario' });
    await screen.findByText('Ana Pérez');

    expect(
      screen.queryByRole('link', { name: 'Panel de administración' }),
    ).not.toBeInTheDocument();
  });

  it('Dado una sesión con rol administrador, Cuando se presenta la Navbar, Entonces expone el acceso al Panel de administración hacia /admin', async () => {
    // Cubre: 7.1
    montar('/', {
      correo: 'admin@atlasgym.example',
      nombre: 'Admin Atlas',
      rol: 'administrador',
    });

    expect(
      await screen.findByRole('link', { name: 'Panel de administración' }),
    ).toHaveAttribute('href', '/admin');
  });
});

describe('Navbar: navegación con desplazamiento', () => {
  it('Dado una ruta distinta de la raíz, Cuando el visitante activa Inicio, Entonces navega a la raíz', async () => {
    // Cubre: 2.2
    montar('/entrenamientos', null);
    await screen.findByRole('link', { name: 'Inicio' });

    await userEvent.click(screen.getByRole('link', { name: 'Inicio' }));

    expect(await screen.findByText('Ruta: /')).toBeInTheDocument();
  });

  it('Dado que la ruta actual es la raíz, Cuando el visitante activa Inicio, Entonces desplaza la ventana a la posición vertical 0', async () => {
    // Cubre: 2.3
    montar('/', null);
    await screen.findByRole('link', { name: 'Inicio' });

    await userEvent.click(screen.getByRole('link', { name: 'Inicio' }));

    expect(window.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ top: 0 }),
    );
  });

  it('Dado una ruta distinta de la raíz, Cuando el visitante activa Planes, Entonces navega a la raíz con el ancla de planes', async () => {
    // Cubre: 2.5
    montar('/entrenamientos', null);
    await screen.findByRole('link', { name: 'Planes' });

    await userEvent.click(screen.getByRole('link', { name: 'Planes' }));

    expect(await screen.findByText('Ruta: /#planes')).toBeInTheDocument();
  });
});

describe('Menú móvil', () => {
  it('Dado un ancho menor a 768 px, Cuando se presenta la Navbar, Entonces el botón Menú está cerrado', async () => {
    // Cubre: 2.7
    instalarMatchMedia(false);
    montar('/', null);

    expect(
      await screen.findByRole('button', { name: 'Menú' }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('Dado el menú cerrado en ancho móvil, Cuando el visitante activa el botón Menú, Entonces el atributo aria-expanded pasa a true', async () => {
    // Cubre: 2.7
    instalarMatchMedia(false);
    montar('/', null);
    await screen.findByRole('button', { name: 'Menú' });

    await userEvent.click(screen.getByRole('button', { name: 'Menú' }));

    expect(screen.getByRole('button', { name: 'Menú' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('Dado el menú desplegado en ancho móvil, Cuando el visitante activa un elemento del menú, Entonces el menú se cierra y ejecuta la navegación', async () => {
    // Cubre: 2.8
    instalarMatchMedia(false);
    montar('/', null);
    await userEvent.click(await screen.findByRole('button', { name: 'Menú' }));

    await userEvent.click(
      screen.getByRole('link', { name: 'Entrenamientos' }),
    );

    expect(await screen.findByText('Ruta: /entrenamientos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Menú' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('Dado el menú desplegado en ancho móvil, Cuando la ventana cruza el umbral de 768 px, Entonces el botón Menú deja de presentarse y los elementos quedan fijos', async () => {
    // Cubre: 2.10
    instalarMatchMedia(false);
    montar('/', null);
    await userEvent.click(await screen.findByRole('button', { name: 'Menú' }));

    cruzarAEscritorio();

    expect(
      await screen.findByRole('link', { name: 'Entrenamientos' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Menú' }),
    ).not.toBeInTheDocument();
  });
});

describe('PieDePagina', () => {
  it('Dado cualquier vista pública, Cuando se presenta el layout, Entonces incluye el pie de página como región de cierre', async () => {
    // Cubre: 2.1
    montar('/', null);

    expect(await screen.findByRole('contentinfo')).toBeInTheDocument();
  });
});
