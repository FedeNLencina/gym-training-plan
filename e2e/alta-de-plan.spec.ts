// spec: specs/pedido-de-plan.md
// seed: e2e/seed.spec.ts

import { expect, test, type Locator, type Page } from '@playwright/test';

import { CORREO_ADMIN } from '../src/datos/semilla';
import { cambiarDeUsuario, ingresar } from './apoyo/sesion';

/** Con la sesión del administrador abierta, va a Administración > Usuarios. */
async function abrirUsuarios(page: Page): Promise<void> {
  await page
    .getByRole('navigation', { name: 'Principal' })
    .getByRole('link', { name: 'Administración' })
    .click();
  await expect(page).toHaveURL(/\/admin$/);
  await page
    .getByRole('tablist', { name: 'Secciones de administración' })
    .getByRole('tab', { name: 'Usuarios' })
    .click();

  await expect(page).toHaveURL(/\/admin\?seccion=usuarios$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Administración' })).toBeVisible();
}

function filaDe(page: Page, nombre: string): Locator {
  return page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: nombre }) });
}

test.describe('Alta de plan', () => {
  test('Ciclo completo: el usuario solicita, el administrador da de alta y el usuario accede a su nivel', async ({
    page,
  }) => {
    // 1. Diego (sin plan) solicita el «Plan Intermedio».
    await page.goto('/ingresar');
    await ingresar(page, 'diego@atlasgym.com');
    await expect(page.getByTitle('Sesión iniciada')).toHaveText('Diego Sosa');

    await page.goto('/planes');
    await expect(page.getByRole('heading', { level: 1, name: 'Planes' })).toBeVisible();
    const intermedio = page.getByRole('article', { name: 'Plan Intermedio' });
    await intermedio.getByRole('button', { name: 'Adquirir plan' }).click();
    await expect(intermedio.getByText('Solicitud pendiente')).toBeVisible();

    // 2. El administrador ingresa y ve la solicitud en Administración > Usuarios.
    await cambiarDeUsuario(page, CORREO_ADMIN);
    await abrirUsuarios(page);

    const filaDiego = filaDe(page, 'Diego Sosa');
    const planDeDiego = filaDiego.getByRole('combobox', { name: 'Plan activo de Diego Sosa' });

    await expect(filaDiego.getByText('Pidió Intermedio')).toBeVisible();
    await expect(filaDiego.getByRole('button', { name: 'Rechazar' })).toBeVisible();
    // «Sin plan» es la opción con valor vacío.
    await expect(planDeDiego).toHaveValue('');

    // 3. En la fila de Diego, pulsar «Dar de alta».
    await filaDiego.getByRole('button', { name: 'Dar de alta' }).click();

    await expect(planDeDiego).toHaveValue('plan-intermedio');
    await expect(filaDiego.getByRole('cell', { name: 'Sin solicitud' })).toBeVisible();
    await expect(filaDiego.getByRole('button', { name: 'Dar de alta' })).toHaveCount(0);
    await expect(filaDiego.getByRole('button', { name: 'Rechazar' })).toHaveCount(0);

    // 4. Diego vuelve a ingresar.
    await cambiarDeUsuario(page, 'diego@atlasgym.com');
    await expect(page.getByTitle('Sesión iniciada')).toHaveText('Diego Sosa');

    // 5. En Planes, el Intermedio es su plan actual.
    await page.goto('/planes');
    await expect(page.getByRole('heading', { level: 1, name: 'Planes' })).toBeVisible();

    await expect(intermedio.getByText('Tu plan actual')).toBeVisible();
    await expect(page.getByText('Solicitud pendiente')).toHaveCount(0);
    await expect(
      page.getByRole('article', { name: 'Plan Básico' }).getByRole('button', { name: 'Cambiar a este plan' }),
    ).toBeVisible();
    await expect(
      page.getByRole('article', { name: 'Plan Avanzado' }).getByRole('button', { name: 'Cambiar a este plan' }),
    ).toBeVisible();

    // 6. En Entrenamientos accede a su nivel y a los anteriores, no al Avanzado.
    await page.goto('/entrenamientos');
    await expect(page.getByRole('heading', { level: 1, name: 'Entrenamientos' })).toBeVisible();

    await expect(page.getByText('Todavía no tenés un plan activo')).toHaveCount(0);
    await expect(
      page
        .getByRole('article', { name: 'Intervalos de alta intensidad' })
        .getByRole('link', { name: 'Ver entrenamiento' }),
    ).toBeVisible();
    await expect(
      page
        .getByRole('article', { name: 'Movilidad de cadera y hombros' })
        .getByRole('link', { name: 'Ver entrenamiento' }),
    ).toBeVisible();

    const pesoMuerto = page.getByRole('article', { name: 'Peso muerto con barra' });
    await expect(pesoMuerto.getByText('Requiere el plan Avanzado.')).toBeVisible();
    await expect(pesoMuerto.getByRole('link', { name: 'Ver entrenamiento' })).toHaveCount(0);
  });

  test('El administrador rechaza una solicitud y el usuario conserva su plan actual', async ({
    page,
  }) => {
    // 1. El administrador abre Usuarios: Bruno tiene Básico y pidió Avanzado (semilla).
    await page.goto('/ingresar');
    await ingresar(page, CORREO_ADMIN);
    await abrirUsuarios(page);

    const filaBruno = filaDe(page, 'Bruno Giménez');
    const planDeBruno = filaBruno.getByRole('combobox', { name: 'Plan activo de Bruno Giménez' });

    await expect(planDeBruno).toHaveValue('plan-basico');
    await expect(filaBruno.getByText('Pidió Avanzado')).toBeVisible();
    await expect(filaBruno.getByRole('button', { name: 'Dar de alta' })).toBeVisible();

    // 2. En la fila de Bruno, pulsar «Rechazar».
    await filaBruno.getByRole('button', { name: 'Rechazar' }).click();

    await expect(filaBruno.getByRole('cell', { name: 'Sin solicitud' })).toBeVisible();
    await expect(planDeBruno).toHaveValue('plan-basico');

    // 3. Bruno ingresa y abre Planes: conserva el Básico y ya no tiene solicitud.
    await cambiarDeUsuario(page, 'bruno@atlasgym.com');
    await expect(page.getByTitle('Sesión iniciada')).toHaveText('Bruno Giménez');

    await page.goto('/planes');
    await expect(page.getByRole('heading', { level: 1, name: 'Planes' })).toBeVisible();

    await expect(
      page.getByRole('article', { name: 'Plan Básico' }).getByText('Tu plan actual'),
    ).toBeVisible();
    await expect(
      page.getByRole('article', { name: 'Plan Avanzado' }).getByRole('button', { name: 'Cambiar a este plan' }),
    ).toBeVisible();
    await expect(page.getByText('Solicitud pendiente')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Cancelar solicitud' })).toHaveCount(0);

    // 4. En Entrenamientos sigue con el acceso del Básico.
    await page.goto('/entrenamientos');
    await expect(page.getByRole('heading', { level: 1, name: 'Entrenamientos' })).toBeVisible();

    await expect(
      page
        .getByRole('article', { name: 'Zona media: estabilidad' })
        .getByRole('link', { name: 'Ver entrenamiento' }),
    ).toBeVisible();

    const pesoMuerto = page.getByRole('article', { name: 'Peso muerto con barra' });
    await expect(pesoMuerto.getByText('Requiere el plan Avanzado.')).toBeVisible();
    await expect(pesoMuerto.getByRole('link', { name: 'Ver entrenamiento' })).toHaveCount(0);
  });
});
