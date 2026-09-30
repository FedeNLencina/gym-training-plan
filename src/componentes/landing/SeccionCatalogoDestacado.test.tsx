/**
 * Tests de SeccionCatalogoDestacado.
 *
 * El Catálogo destacado presenta a lo sumo 3 Entrenamientos publicados
 * (min(n, 3)), cada uno con título, categoría, nivel de dificultad y duración en
 * minutos (1.7), y ante lista vacía o fallo de lectura presenta el mensaje "No
 * hay entrenamientos destacados por el momento" sin dejar de ser una sección más
 * de la Landing_Page (1.8).
 *
 * El componente lee sus datos de `useEntrenamientos`, que toma el
 * Repositorio_Datos y el reloj del ContextoServicios. Las pruebas inyectan un
 * repositorio en memoria y un reloj falso a través del proveedor, y controlan el
 * paso del tiempo para provocar el vencimiento del plazo de carga. Consultas
 * sólo por rol, texto o etiqueta accesible; una única interacción por test.
 */
import { act, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { crearEntrenamiento, type Entrenamiento } from '../../dominio/modelos';
import { ProveedorServicios } from '../../estado/ContextoServicios';
import { PLAZO_CARGA_MS } from '../../estado/useEntrenamientos';
import { crearRelojFalso } from '../../tests/dobles/relojFalso';
import { crearRepositorioEnMemoria } from '../../tests/dobles/repositorioEnMemoria';
import SeccionCatalogoDestacado from './SeccionCatalogoDestacado';

const MENSAJE_VACIO = 'No hay entrenamientos destacados por el momento';
const TITULO_SECCION = 'Catálogo destacado de entrenamientos';

/** Construye n Entrenamientos publicados distinguibles por su título. */
function entrenamientosPublicados(cantidad: number): Entrenamiento[] {
  return Array.from({ length: cantidad }, (_, indice) =>
    crearEntrenamiento({
      id: `ent-${indice + 1}`,
      titulo: `Entrenamiento ${indice + 1}`,
      categoria: 'Fuerza',
      nivel: 'Intermedio',
      duracionMinutos: 30 + indice,
      estado: 'publicado',
    }),
  );
}

function renderizar(entrenamientos: Entrenamiento[]): {
  reloj: ReturnType<typeof crearRelojFalso>;
} {
  const repositorio = crearRepositorioEnMemoria({ entrenamientos });
  const reloj = crearRelojFalso();
  render(
    <ProveedorServicios repositorio={repositorio} reloj={reloj}>
      <SeccionCatalogoDestacado />
    </ProveedorServicios>,
  );
  return { reloj };
}

/** La sección accesible del Catálogo destacado, para acotar las consultas. */
function seccionDestacada(): HTMLElement {
  return screen.getByRole('region', { name: TITULO_SECCION });
}

describe('SeccionCatalogoDestacado', () => {
  it('Dado ocho Entrenamientos publicados Cuando la lectura se resuelve Entonces presenta exactamente tres', async () => {
    // Cubre: 1.7
    renderizar(entrenamientosPublicados(8));

    expect(await screen.findByText('Entrenamiento 1')).toBeInTheDocument();
    const seccion = seccionDestacada();
    const tarjetas = within(seccion).getAllByRole('heading', { level: 3 });
    expect(tarjetas).toHaveLength(3);
  });

  it('Dado dos Entrenamientos publicados Cuando la lectura se resuelve Entonces presenta los dos disponibles', async () => {
    // Cubre: 1.7
    renderizar(entrenamientosPublicados(2));

    expect(await screen.findByText('Entrenamiento 1')).toBeInTheDocument();
    const seccion = seccionDestacada();
    expect(within(seccion).getAllByRole('heading', { level: 3 })).toHaveLength(
      2,
    );
    expect(within(seccion).getByText('Entrenamiento 2')).toBeInTheDocument();
  });

  it('Dado un Entrenamiento publicado Cuando la lectura se resuelve Entonces presenta su título, categoría, nivel y duración en minutos', async () => {
    // Cubre: 1.7
    renderizar([
      crearEntrenamiento({
        id: 'ent-unico',
        titulo: 'Fuerza total',
        categoria: 'Fuerza',
        nivel: 'Avanzado',
        duracionMinutos: 45,
        estado: 'publicado',
      }),
    ]);

    expect(await screen.findByText('Fuerza total')).toBeInTheDocument();
    const seccion = seccionDestacada();
    expect(within(seccion).getByText('Fuerza')).toBeInTheDocument();
    expect(within(seccion).getByText('Avanzado')).toBeInTheDocument();
    expect(within(seccion).getByText('45 min')).toBeInTheDocument();
  });

  it('Dado un repositorio sin Entrenamientos Cuando la lectura se resuelve Entonces presenta el mensaje de vacío', async () => {
    // Cubre: 1.8
    renderizar([]);

    expect(await screen.findByText(MENSAJE_VACIO)).toBeInTheDocument();
    expect(
      within(seccionDestacada()).queryByRole('heading', { level: 3 }),
    ).not.toBeInTheDocument();
  });

  it('Dado un repositorio que falla la lectura Cuando la lectura se rechaza Entonces presenta el mensaje de vacío', async () => {
    // Cubre: 1.8
    const repositorio = crearRepositorioEnMemoria({
      entrenamientos: entrenamientosPublicados(3),
    });
    repositorio.simularFalloLectura();
    const reloj = crearRelojFalso();
    render(
      <ProveedorServicios repositorio={repositorio} reloj={reloj}>
        <SeccionCatalogoDestacado />
      </ProveedorServicios>,
    );

    expect(await screen.findByText(MENSAJE_VACIO)).toBeInTheDocument();
  });

  it('Dado un repositorio que no responde Cuando vence el plazo de carga Entonces presenta el mensaje de vacío', async () => {
    // Cubre: 1.8
    const repositorio = crearRepositorioEnMemoria({
      entrenamientos: entrenamientosPublicados(3),
    });
    repositorio.obtenerEntrenamientos = () =>
      new Promise<Entrenamiento[]>(() => undefined);
    const reloj = crearRelojFalso();
    render(
      <ProveedorServicios repositorio={repositorio} reloj={reloj}>
        <SeccionCatalogoDestacado />
      </ProveedorServicios>,
    );

    await act(async () => {
      reloj.avanzar(PLAZO_CARGA_MS);
    });

    expect(screen.getByText(MENSAJE_VACIO)).toBeInTheDocument();
  });

  it('Dado cualquier estado de carga Cuando se presenta la sección Entonces conserva su encabezado accesible', async () => {
    // Cubre: 1.8
    renderizar([]);

    expect(
      await screen.findByRole('heading', { level: 2, name: TITULO_SECCION }),
    ).toBeInTheDocument();
  });
});
