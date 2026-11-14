---
name: e2e-testing
description: Directrices para pruebas end-to-end con Playwright sobre la app corriendo en un navegador real. Activar al crear, modificar o depurar specs en e2e/, al cubrir un flujo completo de usuario (ingreso, registro, pedido de plan, administración) o cuando se pida un test e2e o de Playwright.
---

# Reglas para pruebas E2E (Playwright)

## 1. Cuándo va un E2E y cuándo no
- **E2E:** flujos que cruzan varias páginas o dependen del navegador real (navegación, persistencia en `localStorage`/IndexedDB, redirecciones de `RutaProtegida`, subida de archivos, video).
- **No E2E:** reglas de dominio, variantes de un componente, validaciones de un solo formulario. Eso va con Vitest + React Testing Library (skill `frontend-testing`).
- Pocos specs y de alto valor: un camino feliz por flujo y, como mucho, su fallo más relevante.

## 2. Estructura y comandos
- Los specs viven en `e2e/` con el nombre `<flujo>.spec.ts`. Vitest sólo toma `src/**/*.test.{ts,tsx}`; no mezclar extensiones.
- Configuración en `playwright.config.ts`. Playwright levanta `npm run dev` solo en `http://localhost:5173` (o reutiliza el que ya esté corriendo).
- Comandos:
  - `npx playwright test` — suite completa (`npm run e2e`).
  - `npx playwright test e2e/<archivo>.spec.ts` — un archivo.
  - `npx playwright test -g "<título>"` — un test.
  - `npx playwright test --ui` — modo interactivo (`npm run e2e:ui`).
  - `npx playwright show-report` — reporte HTML de la última corrida.

## 3. Datos y aislamiento
- Cada test corre en un contexto de navegador nuevo: `localStorage` vacío, por lo que la app arranca siempre desde la semilla (`src/datos/semilla.ts`). No hace falta limpiar nada entre tests.
- Importa cuentas y constantes desde la semilla (`CONTRASENIA_PRUEBA`, `CORREO_ADMIN`) en lugar de copiar los valores.
- Cuentas disponibles: `admin@atlasgym.com` (administrador), `ana@atlasgym.com` (plan intermedio), `bruno@atlasgym.com` (plan básico, solicitud pendiente del avanzado), `diego@atlasgym.com` (sin plan).
- Ningún test debe depender de lo que dejó otro: corren en paralelo y en cualquier orden.
- Usa rutas relativas (`page.goto('/ingresar')`); la `baseURL` ya está configurada.

## 4. Localizadores
- Misma prioridad que en `frontend-testing`:
  1. `getByRole` con `name`.
  2. `getByLabel`, `getByPlaceholder`, `getByText`.
  3. `getByTestId` sólo como último recurso.
- Prohibido seleccionar por clases CSS, ids o XPath.
- `getByLabel` también coincide con `aria-label` y por subcadena: en los formularios de acceso usa `{ exact: true }` (`'Contraseña'` choca con el botón «Mostrar contraseña»).
- Si un texto se repite en la página, acota primero: `page.getByRole('article', { name: titulo }).getByRole('link', { name: 'Ver entrenamiento' })`.

## 5. Aserciones y esperas
- Usa siempre las aserciones con reintento: `await expect(locator).toBeVisible()`, `toHaveText`, `toHaveValue`, `toHaveURL`.
- Prohibido `page.waitForTimeout()` y cualquier espera fija.
- No uses `locator.isVisible()` ni `count()` dentro de un `expect` genérico: no reintentan.
- Tras una acción que navega, afirma primero la URL o un encabezado de la página destino antes de seguir.

## 6. Reutilización
- Un paso repetido en tres o más specs (p. ej. iniciar sesión) se extrae a una función en `e2e/apoyo/` o a un fixture con `test.extend`. Antes de eso, déjalo en línea.
- Sin Page Objects mientras la app tenga este tamaño.

## 7. Depuración de un fallo
1. Lee el error y el `error-context.md` que deja Playwright en `test-results/`.
2. Reejecuta sólo ese test con `--trace on` y abre la traza: `npx playwright show-trace <ruta-al-trace.zip>`.
3. Decide si falla el test o la app. Si es la app, no ajustes el test para que pase: corrige el código (ciclo TDD de `frontend-testing`) o informa el defecto.
4. Nunca arregles un test inestable subiendo timeouts o agregando reintentos.

## 8. Agentes de Playwright
Definidos en `.claude/agents/` y conectados al servidor MCP `playwright-test` (`.mcp.json`). Delegar en ellos cuando el trabajo requiera explorar la app en el navegador:
- **`playwright-test-planner`:** explora un flujo y guarda el plan en `specs/<flujo>.md`. Usarlo antes de cubrir un flujo nuevo.
- **`playwright-test-generator`:** convierte un escenario del plan en un spec dentro de `e2e/`. Un escenario por invocación.
- **`playwright-test-healer`:** corre la suite, depura los specs que fallan y los repara.

Reglas:
- La semilla de los agentes es `e2e/seed.spec.ts` (app en `/`, sin sesión, datos de la semilla).
- Los planes y los títulos de los tests se escriben en español, como el resto del proyecto.
- Revisa lo que genera el generator contra las secciones 4 y 5 antes de darlo por bueno.
- El healer tiende a modificar el test hasta que pase: si el fallo es un defecto de la app, se aplica la sección 7.3 y no se acepta un `test.fixme()` sin avisar al usuario.
- Si se regeneran los agentes (`npx playwright init-agents --loop=claude`), vuelve a agregar `skills: e2e-testing` en su frontmatter.

## 9. Regla de cierre de tarea
1. Corre el spec tocado y luego la suite completa: `npx playwright test`.
2. Confirma que el test nuevo falla si se rompe el comportamiento que cubre (cambia temporalmente la aserción o el dato esperado y verifica el rojo).
3. `test-results/` y `playwright-report/` no se versionan.
