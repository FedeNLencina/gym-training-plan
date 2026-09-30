/**
 * Tests de SeccionPlanes y TarjetaPlan.
 *
 * La Seccion_Planes presenta cada plan completo —nombre, objetivo, precio con
 * dos decimales, periodicidad y prestaciones (3.1)—, con "incluido"/"no
 * incluido" para la asesoría y la alimentación (3.2), un CTA "Elegir plan" hacia
 * `/registro?plan={id}` sin solicitar pago (3.3) y el destaque "Recomendado" si
 * y sólo si hay exactamente un plan recomendado (3.4, 3.5). Ante lista vacía
 * (3.6), carga (3.7) o fallo (3.8) presenta el mensaje correspondiente sin CTA,
 * y en el fallo ofrece "Reintentar".
 *
 * El componente lee sus datos de `usePlanes`, que toma el Repositorio_Datos y el
 * reloj del ContextoServicios. Las pruebas inyectan un repositorio en memoria y
 * un reloj falso a través del proveedor, y montan bajo `MemoryRouter` para que
 * el CTA sea un enlace real. Consultas sólo por rol, texto o etiqueta accesible;
 * una única interacción por test.
 */
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { crearPlan, type Plan } from '../../dominio/modelos';
import { ProveedorServicios } from '../../estado/ContextoServicios';
import { PLAZO_CARGA_MS } from '../../estado/useEntrenamientos';
import { crearRelojFalso } from '../../tests/dobles/relojFalso';
import { crearRepositorioEnMemoria } from '../../tests/dobles/repositorioEnMemoria';
import SeccionPlanes, { MENSAJE_PLANES_VACIO } from './SeccionPlanes';

const MENSAJE_ERROR = 'No pudimos cargar los planes';
const TITULO_SECCION = 'Planes';

function planEjemplo(datos: Partial<Plan> = {}): Plan {
  return crearPlan({
    id: 'plan-base',
    nombre: 'Plan Base',
    objetivo: 'Empezar a entrenar con una rutina guiada',
    precio: 14999,
    periodicidad: 'mensual',
    prestaciones: ['Acceso a los entrenamientos', 'Seguimiento de avance'],
    incluyeAsesoria: false,
    incluyeAlimentacion: false,
    recomendado: false,
    ...datos,
  });
}

function renderizar(
  planes: Plan[],
  opciones: { fallaLectura?: boolean; nuncaResponde?: boolean } = {},
): {
  reloj: ReturnType<typeof crearRelojFalso>;
  repositorio: ReturnType<typeof crearRepositorioEnMemoria>;
} {
  const repositorio = crearRepositorioEnMemoria({ planes });
  if (opciones.fallaLectura === true) repositorio.simularFalloLectura();
  if (opciones.nuncaResponde === true) {
    repositorio.obtenerPlanes = () => new Promise<Plan[]>(() => undefined);
  }
  const reloj = crearRelojFalso();
  render(
    <MemoryRouter>
      <ProveedorServicios repositorio={repositorio} reloj={reloj}>
        <SeccionPlanes />
      </ProveedorServicios>
    </MemoryRouter>,
  );
  return { reloj, repositorio };
}

/** La sección accesible de Planes, para acotar las consultas. */
function seccionPlanes(): HTMLElement {
  return screen.getByRole('region', { name: TITULO_SECCION });
}

describe('SeccionPlanes', () => {
  it('Dado un plan Cuando la lectura se resuelve Entonces presenta su nombre, objetivo, precio con dos decimales, periodicidad y prestaciones', async () => {
    // Cubre: 3.1
    renderizar([
      planEjemplo({
        prestaciones: ['Acceso total', 'Rutina semanal', 'Seguimiento'],
      }),
    ]);

    expect(await screen.findByText('Plan Base')).toBeInTheDocument();
    const seccion = seccionPlanes();
    expect(
      within(seccion).getByText('Empezar a entrenar con una rutina guiada'),
    ).toBeInTheDocument();
    expect(within(seccion).getByText('$14999.00 / mensual')).toBeInTheDocument();
    expect(within(seccion).getByText('Acceso total')).toBeInTheDocument();
    expect(within(seccion).getByText('Rutina semanal')).toBeInTheDocument();
    expect(within(seccion).getByText('Seguimiento')).toBeInTheDocument();
  });

  it('Dado un plan sin asesoría ni alimentación Cuando la lectura se resuelve Entonces presenta "no incluido" para ambas', async () => {
    // Cubre: 3.2
    renderizar([
      planEjemplo({ incluyeAsesoria: false, incluyeAlimentacion: false }),
    ]);

    expect(await screen.findByText('Plan Base')).toBeInTheDocument();
    expect(within(seccionPlanes()).getAllByText('no incluido')).toHaveLength(2);
  });

  it('Dado un plan con asesoría y alimentación Cuando la lectura se resuelve Entonces presenta "incluido" para ambas', async () => {
    // Cubre: 3.2
    renderizar([
      planEjemplo({ incluyeAsesoria: true, incluyeAlimentacion: true }),
    ]);

    expect(await screen.findByText('Plan Base')).toBeInTheDocument();
    expect(within(seccionPlanes()).getAllByText('incluido')).toHaveLength(2);
  });

  it('Dado un plan Cuando la lectura se resuelve Entonces su CTA "Elegir plan" apunta a /registro con el identificador del plan', async () => {
    // Cubre: 3.3
    renderizar([planEjemplo({ id: 'plan-progreso' })]);

    expect(await screen.findByText('Plan Base')).toBeInTheDocument();
    expect(
      within(seccionPlanes()).getByRole('link', { name: 'Elegir plan' }),
    ).toHaveAttribute('href', '/registro?plan=plan-progreso');
  });

  it('Dada una lista con exactamente un plan recomendado Cuando la lectura se resuelve Entonces presenta una sola etiqueta "Recomendado"', async () => {
    // Cubre: 3.4
    renderizar([
      planEjemplo({ id: 'plan-1', nombre: 'Plan 1', recomendado: false }),
      planEjemplo({ id: 'plan-2', nombre: 'Plan 2', recomendado: true }),
      planEjemplo({ id: 'plan-3', nombre: 'Plan 3', recomendado: false }),
    ]);

    expect(await screen.findByText('Plan 2')).toBeInTheDocument();
    expect(
      within(seccionPlanes()).getAllByText('Recomendado'),
    ).toHaveLength(1);
  });

  it('Dada una lista con dos planes recomendados Cuando la lectura se resuelve Entonces no presenta ninguna etiqueta "Recomendado"', async () => {
    // Cubre: 3.5
    renderizar([
      planEjemplo({ id: 'plan-1', nombre: 'Plan 1', recomendado: true }),
      planEjemplo({ id: 'plan-2', nombre: 'Plan 2', recomendado: true }),
      planEjemplo({ id: 'plan-3', nombre: 'Plan 3', recomendado: false }),
    ]);

    expect(await screen.findByText('Plan 1')).toBeInTheDocument();
    expect(
      within(seccionPlanes()).queryByText('Recomendado'),
    ).not.toBeInTheDocument();
  });

  it('Dada una lista de planes vacía Cuando la lectura se resuelve Entonces presenta el mensaje de vacío sin CTA "Elegir plan"', async () => {
    // Cubre: 3.6
    renderizar([]);

    expect(await screen.findByText(MENSAJE_PLANES_VACIO)).toBeInTheDocument();
    expect(
      within(seccionPlanes()).queryByRole('link', { name: 'Elegir plan' }),
    ).not.toBeInTheDocument();
  });

  it('Dado un repositorio que no responde Cuando aún no llegó la respuesta Entonces presenta un indicador de carga sin CTA "Elegir plan"', () => {
    // Cubre: 3.7
    renderizar([planEjemplo()], { nuncaResponde: true });

    expect(within(seccionPlanes()).getByRole('status')).toBeInTheDocument();
    expect(
      within(seccionPlanes()).queryByRole('link', { name: 'Elegir plan' }),
    ).not.toBeInTheDocument();
  });

  it('Dado un repositorio que falla la lectura Cuando la lectura se rechaza Entonces presenta el mensaje de error con la acción "Reintentar" y sin CTA "Elegir plan"', async () => {
    // Cubre: 3.8
    renderizar([planEjemplo()], { fallaLectura: true });

    expect(await screen.findByText(MENSAJE_ERROR)).toBeInTheDocument();
    const seccion = seccionPlanes();
    expect(
      within(seccion).getByRole('button', { name: 'Reintentar' }),
    ).toBeInTheDocument();
    expect(
      within(seccion).queryByRole('link', { name: 'Elegir plan' }),
    ).not.toBeInTheDocument();
  });

  it('Dado el mensaje de error presentado Cuando se activa "Reintentar" y la lectura ya no falla Entonces presenta los planes', async () => {
    // Cubre: 3.8
    const { repositorio } = renderizar([planEjemplo()], { fallaLectura: true });
    expect(await screen.findByText(MENSAJE_ERROR)).toBeInTheDocument();
    repositorio.simularFalloLectura(false);

    await userEvent.click(
      within(seccionPlanes()).getByRole('button', { name: 'Reintentar' }),
    );

    expect(await screen.findByText('Plan Base')).toBeInTheDocument();
  });

  it('Dado un repositorio que no responde Cuando vence el plazo de carga Entonces presenta el mensaje de error con la acción "Reintentar"', async () => {
    // Cubre: 3.8
    const { reloj } = renderizar([planEjemplo()], { nuncaResponde: true });

    await act(async () => {
      reloj.avanzar(PLAZO_CARGA_MS);
    });

    expect(screen.getByText(MENSAJE_ERROR)).toBeInTheDocument();
    expect(
      within(seccionPlanes()).getByRole('button', { name: 'Reintentar' }),
    ).toBeInTheDocument();
  });
});
