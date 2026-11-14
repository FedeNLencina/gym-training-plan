// spec: specs/pedido-de-plan.md
// seed: e2e/seed.spec.ts

import { expect, test, type Locator, type Page } from '@playwright/test';

import { CONTRASENIA_PRUEBA } from '../src/datos/semilla';
import { ingresar } from './apoyo/sesion';

const INSTRUCCIONES_DE_PAGO =
  'Transferí el importe del plan al alias ATLAS.GYM.PLANES y enviá el comprobante a pagos@atlasgym.com. Te damos de alta en el día.';

const PLANES = [
  { nombre: 'Plan Básico', precio: '$ 15.000 por mes' },
  { nombre: 'Plan Intermedio', precio: '$ 22.000 por mes' },
  { nombre: 'Plan Avanzado', precio: '$ 30.000 por mes' },
];

function tarjetas(page: Page): { basico: Locator; intermedio: Locator; avanzado: Locator } {
  return {
    basico: page.getByRole('article', { name: 'Plan Básico' }),
    intermedio: page.getByRole('article', { name: 'Plan Intermedio' }),
    avanzado: page.getByRole('article', { name: 'Plan Avanzado' }),
  };
}

/** Ingresa con la cuenta indicada y deja abierta la página de Planes. */
async function abrirPlanesComo(page: Page, correo: string, nombre: string): Promise<void> {
  await page.goto('/ingresar');
  await ingresar(page, correo);
  await expect(page.getByTitle('Sesión iniciada')).toHaveText(nombre);

  await page.goto('/planes');
  await expect(page).toHaveURL(/\/planes$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Planes' })).toBeVisible();
}

test.describe('Solicitud de plan', () => {
  test('Visitante ve los planes y vuelve a Planes tras iniciar sesión', async ({ page }) => {
    // 1. Sin sesión, ir a /planes.
    await page.goto('/planes');

    await expect(page.getByRole('heading', { level: 1, name: 'Planes' })).toBeVisible();
    await expect(
      page.getByText('Para adquirir uno, primero iniciá sesión o registrate.'),
    ).toBeVisible();
    for (const { nombre, precio } of PLANES) {
      const tarjeta = page.getByRole('article', { name: nombre });
      await expect(tarjeta.getByText(precio)).toBeVisible();
      await expect(tarjeta.getByRole('link', { name: 'Iniciá sesión para adquirirlo' })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: 'Adquirir plan' })).toHaveCount(0);

    // 2. En «Plan Intermedio», pulsar «Iniciá sesión para adquirirlo».
    await page
      .getByRole('article', { name: 'Plan Intermedio' })
      .getByRole('link', { name: 'Iniciá sesión para adquirirlo' })
      .click();

    await expect(page).toHaveURL(/\/ingresar$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeVisible();

    // 3. Ingresar: vuelve a Planes, no al destino por defecto.
    await page.getByLabel('Correo', { exact: true }).fill('diego@atlasgym.com');
    await page.getByLabel('Contraseña', { exact: true }).fill(CONTRASENIA_PRUEBA);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page).toHaveURL(/\/planes$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Planes' })).toBeVisible();
    await expect(page.getByTitle('Sesión iniciada')).toHaveText('Diego Sosa');
    for (const { nombre } of PLANES) {
      await expect(
        page.getByRole('article', { name: nombre }).getByRole('button', { name: 'Adquirir plan' }),
      ).toBeVisible();
    }
    await expect(page.getByRole('link', { name: 'Iniciá sesión para adquirirlo' })).toHaveCount(0);
    await expect(
      page.getByText('Para adquirir uno, primero iniciá sesión o registrate.'),
    ).toHaveCount(0);
  });

  test('Usuario sin plan solicita un plan y la solicitud persiste', async ({ page }) => {
    // 1. Diego (sin plan) abre Planes.
    await abrirPlanesComo(page, 'diego@atlasgym.com', 'Diego Sosa');
    const { basico, intermedio, avanzado } = tarjetas(page);

    await expect(basico.getByRole('button', { name: 'Adquirir plan' })).toBeVisible();
    await expect(intermedio.getByRole('button', { name: 'Adquirir plan' })).toBeVisible();
    await expect(avanzado.getByRole('button', { name: 'Adquirir plan' })).toBeVisible();

    // 2. En «Plan Intermedio», pulsar «Adquirir plan».
    await intermedio.getByRole('button', { name: 'Adquirir plan' }).click();

    await expect(intermedio.getByText('Solicitud pendiente')).toBeVisible();
    await expect(intermedio.getByText(INSTRUCCIONES_DE_PAGO)).toBeVisible();
    await expect(intermedio.getByRole('button', { name: 'Cancelar solicitud' })).toBeVisible();

    // 3. Los otros planes siguen disponibles y ninguno figura como activo.
    await expect(basico.getByRole('button', { name: 'Adquirir plan' })).toBeVisible();
    await expect(avanzado.getByRole('button', { name: 'Adquirir plan' })).toBeVisible();
    await expect(page.getByText('Tu plan actual')).toHaveCount(0);

    // 4. Recargar: la sesión y la solicitud persisten.
    await page.reload();

    await expect(page.getByTitle('Sesión iniciada')).toHaveText('Diego Sosa');
    await expect(intermedio.getByText('Solicitud pendiente')).toBeVisible();
    await expect(intermedio.getByText(INSTRUCCIONES_DE_PAGO)).toBeVisible();

    // 5. Ir a Entrenamientos: la solicitud pendiente todavía no habilita nada.
    await page
      .getByRole('navigation', { name: 'Principal' })
      .getByRole('link', { name: 'Entrenamientos' })
      .click();

    await expect(page).toHaveURL(/\/entrenamientos$/);
    await expect(
      page.getByText(
        'Todavía no tenés un plan activo. Tu solicitud está pendiente: vas a poder entrenar cuando confirmemos el pago.',
      ),
    ).toBeVisible();
    await expect(
      page
        .getByRole('article', { name: 'Movilidad de cadera y hombros' })
        .getByText('Requiere el plan Básico.'),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver entrenamiento' })).toHaveCount(0);
  });

  test('Usuario cancela su solicitud pendiente', async ({ page }) => {
    // 1. Diego solicita el «Plan Avanzado».
    await abrirPlanesComo(page, 'diego@atlasgym.com', 'Diego Sosa');
    const { basico, intermedio, avanzado } = tarjetas(page);

    await avanzado.getByRole('button', { name: 'Adquirir plan' }).click();
    await expect(avanzado.getByText('Solicitud pendiente')).toBeVisible();

    // 2. En «Plan Avanzado», pulsar «Cancelar solicitud».
    await avanzado.getByRole('button', { name: 'Cancelar solicitud' }).click();

    await expect(page.getByText('Solicitud pendiente')).toHaveCount(0);
    await expect(page.getByText(INSTRUCCIONES_DE_PAGO)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Cancelar solicitud' })).toHaveCount(0);
    await expect(basico.getByRole('button', { name: 'Adquirir plan' })).toBeVisible();
    await expect(intermedio.getByRole('button', { name: 'Adquirir plan' })).toBeVisible();
    await expect(avanzado.getByRole('button', { name: 'Adquirir plan' })).toBeVisible();

    // 3. Recargar y abrir Entrenamientos: la cancelación persiste.
    await page.reload();

    await expect(avanzado.getByRole('button', { name: 'Adquirir plan' })).toBeVisible();
    await expect(page.getByText('Solicitud pendiente')).toHaveCount(0);

    await page.goto('/entrenamientos');
    await expect(page).toHaveURL(/\/entrenamientos$/);
    const aviso = page.getByText('Todavía no tenés un plan activo. Elegí uno para empezar a entrenar.');
    await expect(aviso).toBeVisible();
    await expect(aviso.getByRole('link', { name: 'Ver planes' })).toBeVisible();
    await expect(page.getByText('Tu solicitud está pendiente')).toHaveCount(0);
  });

  test('Usuario con plan pide cambio y conserva su plan y su acceso mientras está pendiente', async ({
    page,
  }) => {
    // 1. Ana (Intermedio) abre Planes.
    await abrirPlanesComo(page, 'ana@atlasgym.com', 'Ana Pérez');
    const { basico, intermedio, avanzado } = tarjetas(page);

    await expect(intermedio.getByText('Tu plan actual')).toBeVisible();
    await expect(basico.getByRole('button', { name: 'Cambiar a este plan' })).toBeVisible();
    await expect(avanzado.getByRole('button', { name: 'Cambiar a este plan' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Adquirir plan' })).toHaveCount(0);

    // 2. En «Plan Avanzado», pulsar «Cambiar a este plan».
    await avanzado.getByRole('button', { name: 'Cambiar a este plan' }).click();

    await expect(avanzado.getByText('Solicitud pendiente')).toBeVisible();
    await expect(avanzado.getByText(INSTRUCCIONES_DE_PAGO)).toBeVisible();
    await expect(avanzado.getByRole('button', { name: 'Cancelar solicitud' })).toBeVisible();
    await expect(intermedio.getByText('Tu plan actual')).toBeVisible();
    await expect(basico.getByRole('button', { name: 'Cambiar a este plan' })).toBeVisible();

    // 3. Ir a Entrenamientos: sigue con el acceso del plan activo, no del solicitado.
    await page.goto('/entrenamientos');
    await expect(page).toHaveURL(/\/entrenamientos$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Entrenamientos' })).toBeVisible();

    await expect(page.getByText('Todavía no tenés un plan activo')).toHaveCount(0);
    await expect(
      page
        .getByRole('article', { name: 'Fuerza con mancuernas: tren superior' })
        .getByRole('link', { name: 'Ver entrenamiento' }),
    ).toBeVisible();

    const pesoMuerto = page.getByRole('article', { name: 'Peso muerto con barra' });
    await expect(pesoMuerto.getByText('Requiere el plan Avanzado.')).toBeVisible();
    await expect(pesoMuerto.getByRole('link', { name: 'Ver entrenamiento' })).toHaveCount(0);
  });

  test('Usuario con solicitud pendiente ve su estado y al pedir otro plan reemplaza la anterior', async ({
    page,
  }) => {
    // 1. Bruno (Básico, pidió Avanzado) abre Planes.
    await abrirPlanesComo(page, 'bruno@atlasgym.com', 'Bruno Giménez');
    const { basico, intermedio, avanzado } = tarjetas(page);

    await expect(basico.getByText('Tu plan actual')).toBeVisible();
    await expect(avanzado.getByText('Solicitud pendiente')).toBeVisible();
    await expect(avanzado.getByText(INSTRUCCIONES_DE_PAGO)).toBeVisible();
    await expect(avanzado.getByRole('button', { name: 'Cancelar solicitud' })).toBeVisible();
    await expect(intermedio.getByRole('button', { name: 'Cambiar a este plan' })).toBeVisible();

    // 2. En «Plan Intermedio», pulsar «Cambiar a este plan»: reemplaza la solicitud anterior.
    await intermedio.getByRole('button', { name: 'Cambiar a este plan' }).click();

    await expect(intermedio.getByText('Solicitud pendiente')).toBeVisible();
    await expect(intermedio.getByRole('button', { name: 'Cancelar solicitud' })).toBeVisible();
    await expect(avanzado.getByRole('button', { name: 'Cambiar a este plan' })).toBeVisible();
    await expect(basico.getByText('Tu plan actual')).toBeVisible();
    await expect(page.getByText('Solicitud pendiente')).toHaveCount(1);

    // 3. Recargar: sólo queda pendiente el Intermedio.
    await page.reload();

    await expect(intermedio.getByText('Solicitud pendiente')).toBeVisible();
    await expect(avanzado.getByRole('button', { name: 'Cambiar a este plan' })).toBeVisible();
    await expect(basico.getByText('Tu plan actual')).toBeVisible();
    await expect(page.getByText('Solicitud pendiente')).toHaveCount(1);
  });
});
