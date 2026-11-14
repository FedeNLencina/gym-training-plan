import { test } from '@playwright/test';

// Punto de partida de los agentes de Playwright (planner y generator):
// deja la app abierta en el inicio, sin sesión y con los datos de la semilla.
test.describe('Semilla', () => {
  test('seed', async ({ page }) => {
    await page.goto('/');
  });
});
