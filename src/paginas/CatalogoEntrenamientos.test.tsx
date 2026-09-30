/**
 * Tests de CatalogoEntrenamientos.
 *
 * El catálogo presenta los Entrenamientos publicados (5.1), permite filtrar por
 * categoría y por nivel de forma conjuntiva mostrando el recuento (5.2, 5.3,
 * 5.9), presenta el mensaje de conjunto vacío con la acción "Quitar filtros"
 * cuando ningún publicado coincide (5.4), presenta el indicador de carga con los
 * filtros deshabilitados (5.5), presenta el mensaje de error con "Reintentar"
 * conservando los filtros (5.6, 5.7, 5.10) y, sin sesión, no expone ningún
 * enlace al detalle (5.8). Con la lista publicada vacía y sin filtros presenta
 * el mensaje correspondiente y ningún control de filtro (5.11).
 *
 * Los datos llegan de `useEntrenamientos`, alimentado por el ContextoServicios
 * con un repositorio en memoria y un reloj falso. La sesión llega del
 * ContextoSesion con un ServicioAutenticacion doble. Consultas sólo por rol,
 * texto o etiqueta accesible; una sola interacción por test.
 */
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { crearEntrenamiento, type Entrenamiento } from '../dominio/modelos';
import type { Sesion } from '../dominio/modelos';
import { ProveedorServicios } from '../estado/ContextoServicios';
import { ProveedorSesion } from '../estado/ContextoSesion';
import { PLAZO_CARGA_MS } from '../estado/useEntrenamientos';
import type { ServicioAutenticacion } from '../servicios/servicioAutenticacion';
import { crearRelojFalso } from '../tests/dobles/relojFalso';
import { crearRepositorioEnMemoria } from '../tests/dobles/repositorioEnMemoria';
import CatalogoEntrenamientos from './CatalogoEntrenamientos';

const SESION_USUARIO: Sesion = {
  correo: 'ana@ejemplo.com',
  nombre: 'Ana',
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

type OpcionesRender = {
  entrenamientos?: Entrenamiento[];
  sesion?: Sesion | null;
  repositorio?: ReturnType<typeof crearRepositorioEnMemoria>;
  reloj?: ReturnType<typeof crearRelojFalso>;
};

function renderizar({
  entrenamientos = [],
  sesion = null,
  repositorio = crearRepositorioEnMemoria({ entrenamientos }),
  reloj = crearRelojFalso(),
}: OpcionesRender = {}): {
  repositorio: ReturnType<typeof crearRepositorioEnMemoria>;
  reloj: ReturnType<typeof crearRelojFalso>;
} {
  render(
    <MemoryRouter>
      <ProveedorSesion servicio={servicioConSesion(sesion)}>
        <ProveedorServicios repositorio={repositorio} reloj={reloj}>
          <CatalogoEntrenamientos />
        </ProveedorServicios>
      </ProveedorSesion>
    </MemoryRouter>,
  );
  return { repositorio, reloj };
}

/** Construye un Entrenamiento publicado distinguible por su título. */
function publicado(datos: Partial<Entrenamiento>): Entrenamiento {
  return crearEntrenamiento({ estado: 'publicado', ...datos });
}

const CATALOGO_VARIADO: Entrenamiento[] = [
  publicado({
    id: 'e1',
    titulo: 'Fuerza uno',
    categoria: 'Fuerza',
    nivel: 'Principiante',
  }),
  publicado({
    id: 'e2',
    titulo: 'Fuerza dos',
    categoria: 'Fuerza',
    nivel: 'Avanzado',
  }),
  publicado({
    id: 'e3',
    titulo: 'Cardio uno',
    categoria: 'Cardio',
    nivel: 'Principiante',
  }),
];

describe('CatalogoEntrenamientos', () => {
  it('Dado publicados y borradores Cuando la lectura se resuelve Entonces presenta sólo los publicados', async () => {
    // Cubre: 5.1
    renderizar({
      entrenamientos: [
        publicado({ id: 'e1', titulo: 'Publicado uno' }),
        crearEntrenamiento({
          id: 'b1',
          titulo: 'Borrador uno',
          estado: 'borrador',
        }),
      ],
    });

    expect(await screen.findByText('Publicado uno')).toBeInTheDocument();
    expect(screen.queryByText('Borrador uno')).not.toBeInTheDocument();
  });

  it('Dado un catálogo variado Cuando el usuario filtra por categoría y por nivel Entonces presenta sólo la intersección con su recuento', async () => {
    // Cubre: 5.2, 5.3, 5.9
    renderizar({ entrenamientos: CATALOGO_VARIADO });
    await screen.findByText('Fuerza uno');

    await userEvent.selectOptions(screen.getByLabelText('Categoría'), 'Fuerza');
    await userEvent.selectOptions(
      screen.getByLabelText('Nivel'),
      'Principiante',
    );

    expect(screen.getByText('Fuerza uno')).toBeInTheDocument();
    expect(screen.queryByText('Fuerza dos')).not.toBeInTheDocument();
    expect(screen.queryByText('Cardio uno')).not.toBeInTheDocument();
    expect(screen.getByText('1 entrenamiento')).toBeInTheDocument();
  });

  it('Dado una combinación de filtros sin coincidencias Cuando el usuario la aplica Entonces presenta el mensaje de conjunto vacío y la acción para quitar filtros', async () => {
    // Cubre: 5.4
    renderizar({ entrenamientos: CATALOGO_VARIADO });
    await screen.findByText('Fuerza uno');
    await userEvent.selectOptions(screen.getByLabelText('Categoría'), 'Cardio');

    await userEvent.selectOptions(screen.getByLabelText('Nivel'), 'Avanzado');

    expect(
      screen.getByText('No encontramos entrenamientos con esos filtros'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Quitar filtros' }),
    ).toBeInTheDocument();
  });

  it('Dado un conjunto vacío por filtros Cuando el usuario quita los filtros Entonces restaura el conjunto completo', async () => {
    // Cubre: 5.4
    renderizar({ entrenamientos: CATALOGO_VARIADO });
    await screen.findByText('Fuerza uno');
    await userEvent.selectOptions(screen.getByLabelText('Categoría'), 'Cardio');
    await userEvent.selectOptions(
      screen.getByLabelText('Nivel'),
      'Avanzado',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Quitar filtros' }));

    expect(screen.getByText('Fuerza uno')).toBeInTheDocument();
    expect(screen.getByText('Cardio uno')).toBeInTheDocument();
    expect(screen.getByLabelText('Categoría')).toHaveValue('Todos');
    expect(screen.getByLabelText('Nivel')).toHaveValue('Todos');
  });

  it('Dado un repositorio que no responde Cuando el catálogo carga Entonces presenta el indicador de carga con los filtros deshabilitados', () => {
    // Cubre: 5.5
    const repositorio = crearRepositorioEnMemoria();
    repositorio.obtenerEntrenamientos = () =>
      new Promise<Entrenamiento[]>(() => undefined);
    renderizar({ repositorio });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Categoría')).toBeDisabled();
    expect(screen.getByLabelText('Nivel')).toBeDisabled();
  });

  it('Dado un repositorio que falla la lectura Cuando la lectura se rechaza Entonces presenta el mensaje de error con la acción de reintento', async () => {
    // Cubre: 5.6
    const repositorio = crearRepositorioEnMemoria({
      entrenamientos: CATALOGO_VARIADO,
    });
    repositorio.simularFalloLectura();
    renderizar({ repositorio });

    expect(
      await screen.findByText('No pudimos cargar los entrenamientos'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reintentar' }),
    ).toBeInTheDocument();
  });

  it('Dado un error de carga Cuando el usuario reintenta Entonces vuelve a solicitar la lista', async () => {
    // Cubre: 5.7
    const repositorio = crearRepositorioEnMemoria({
      entrenamientos: CATALOGO_VARIADO,
    });
    repositorio.simularFalloLectura();
    renderizar({ repositorio });
    await screen.findByRole('button', { name: 'Reintentar' });
    repositorio.simularFalloLectura(false);

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Fuerza uno')).toBeInTheDocument();
    expect(repositorio.llamadas.obtenerEntrenamientos).toBeGreaterThan(1);
  });

  it('Dado un repositorio que no responde Cuando vence el plazo de carga Entonces presenta el mensaje de error', async () => {
    // Cubre: 5.10
    const repositorio = crearRepositorioEnMemoria();
    repositorio.obtenerEntrenamientos = () =>
      new Promise<Entrenamiento[]>(() => undefined);
    const { reloj } = renderizar({ repositorio });

    await act(async () => {
      reloj.avanzar(PLAZO_CARGA_MS);
    });

    expect(
      screen.getByText('No pudimos cargar los entrenamientos'),
    ).toBeInTheDocument();
  });

  it('Dado un catálogo publicado vacío sin filtros Cuando la lectura se resuelve Entonces presenta el mensaje de catálogo vacío sin controles de filtro', async () => {
    // Cubre: 5.11
    renderizar({ entrenamientos: [] });

    expect(
      await screen.findByText('Todavía no hay entrenamientos publicados'),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Categoría')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Nivel')).not.toBeInTheDocument();
  });

  it('Dado que no hay sesión activa Cuando la lectura se resuelve Entonces ninguna tarjeta enlaza al detalle', async () => {
    // Cubre: 5.8
    renderizar({ entrenamientos: [publicado({ id: 'e1', titulo: 'Fuerza uno' })] });
    await screen.findByText('Fuerza uno');
    const lista = screen.getByRole('list');

    expect(
      within(lista).getByRole('link', { name: 'Registrate para entrenar' }),
    ).toBeInTheDocument();
    expect(
      within(lista).queryByRole('link', {
        name: (_nombre, elemento) =>
          (elemento.getAttribute('href') ?? '').startsWith('/entrenamientos/'),
      }),
    ).not.toBeInTheDocument();
  });

  it('Dado una sesión activa Cuando la lectura se resuelve Entonces cada tarjeta enlaza al detalle del Entrenamiento', async () => {
    // Cubre: 5.8
    renderizar({
      entrenamientos: [publicado({ id: 'e1', titulo: 'Fuerza uno' })],
      sesion: SESION_USUARIO,
    });

    expect(
      await screen.findByRole('link', { name: /Fuerza uno/ }),
    ).toHaveAttribute('href', '/entrenamientos/e1');
  });
});
