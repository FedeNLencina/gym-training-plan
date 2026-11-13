---
name: frontend-testing
description: Directrices para desarrollo guiado por pruebas (TDD), pruebas unitarias y de componentes en React utilizando Vitest y React Testing Library. Activar al crear nuevas funcionalidades, corregir bugs o refactorizar código existente.
---

# Reglas para Testing y Flujo TDD en Frontend (Vitest + React Testing Library)

## 1. Ciclo de Trabajo TDD (Obligatorio)
Todo cambio, agregado o corrección sobre componentes (sean nuevos o preexistentes) debe regirse por el ciclo Red-Green-Refactor:

### Fase 1: Red (Fallo comprobado)
1. Escribe la prueba describiendo el nuevo requerimiento antes de modificar el componente.
2. Ejecuta la prueba en la terminal (`npx vitest run <ruta-del-test>`).
3. **Verificación obligatoria:** Confirma que el test falla y que la razón del fallo es la esperada (p. ej., "el elemento no existe" o "la función no fue llamada"), nunca un error de sintaxis o de importación rota.

### Fase 2: Green (Implementación mínima indispensable)
1. Escribe **estrictamente el código mínimo necesario** para que la prueba pase.
2. Prohibido añadir abstracciones prematuras, estilos no solicitados o lógica para casos futuros no cubiertos por un test activo.
3. Vuelve a ejecutar la prueba y confirma que pasa en verde.

### Fase 3: Refactor (Limpieza sin alterar la conducta)
1. Simplifica nombres de variables, extrae hooks o subcomponentes si el archivo creció demasiado.
2. Reejecuta la suite completa para certificar que el refactor no rompió ningún comportamiento previo.

## 2. Aplicación de TDD en Código Existente
- **Corrección de Bugs:** Escribe una prueba que reproduzca el bug reportado (fase Red). Cuando el test falle demostrando el defecto, aplica la solución mínima en el componente hasta que pase (fase Green).
- **Nuevas Funcionalidades o Props:** Agrega un nuevo bloque `it()` o `test()` con la nueva interacción esperada antes de tocar el JSX o el estado.
- **Refactorización de Código Legacy sin Tests:** Si necesitas refactorizar código sin cobertura previa, escribe primero pruebas de caracterización que congelen el comportamiento actual visible antes de alterar nada.

## 3. Filosofía General
- **Prueba el comportamiento, no la implementación:** Interactúa con los componentes de la misma manera que lo haría un usuario humano o un lector de pantalla. No pruebes estados internos (`useState`), referencias internas ni detalles específicos del ciclo de vida del framework.
- **Mantenibilidad:** Un test no debe romperse si el componente se refactoriza internamente pero su funcionalidad visual e interactiva sigue intacta.

## 4. Consultas (Queries) y Prioridades
- **Utiliza siempre `screen`:** Evita desestructurar métodos desde la función `render()`.
- **Prioridad estricta de Queries (basado en accesibilidad):**
  1. `getByRole`: (Primera opción absoluta). Asegura que el elemento sea accesible (ej: `screen.getByRole('button', { name: /guardar/i })`).
  2. `getByLabelText`, `getByPlaceholderText`, `getByText`.
  3. `getByAltText`, `getByTitle`.
  4. `getByTestId`: Utilízalo **únicamente** como último recurso cuando no haya roles semánticos disponibles o el texto sea dinámico e impredecible.

## 5. Simulación de Eventos del Usuario
- **Usa `@testing-library/user-event`:** Emplea este paquete en lugar de `fireEvent`.
- **Configuración:** Inicializa siempre el simulador al inicio del test: `const user = userEvent.setup();`.
- **Asincronía:** Todas las acciones de `user-event` devuelven promesas y deben llevar `await` (ej. `await user.click(button);`).

## 6. Esperas y Mutaciones del DOM
- Usa consultas asíncronas (`findByRole`, `findByText`) para elementos que aparecen tras resolver promesas o animaciones.
- Para verificar que un elemento **ya no existe**, usa siempre `queryBy*` combinado con `.not.toBeInTheDocument()`.
- Evita usar `waitFor` para buscar elementos; resérvalo únicamente para envolver aserciones (`expect`) que requieran reintento periódico.

## 7. Mocks y Aislamiento con Vitest
- Usa `vi.fn()` para espías en callbacks inyectados por props (`onClose`, `onSubmit`).
- Utiliza `vi.spyOn()` o `vi.mock()` solo para interceptar efectos secundarios externos (navegación, peticiones HTTP, fechas fijas).
- En peticiones asíncronas de red, favorece Mock Service Worker (MSW) sobre mocks manuales de `fetch` o `axios`.
- Limpia el estado entre pruebas: incluye `afterEach(() => { vi.clearAllMocks(); })`.

## 8. Aserciones Legibles (jest-dom)
- Emplea los matchers extendidos de `@testing-library/jest-dom`:
  - **Presencia / Visibilidad:** `toBeInTheDocument()`, `toBeVisible()`.
  - **Estados interactivos:** `toBeDisabled()`, `toBeChecked()`, `toHaveFocus()`.
  - **Contenido:** `toHaveTextContent()`, `toHaveAccessibleDescription()`.

## 9. Regla de Cierre de Tarea
Antes de dar por finalizada cualquier modificación:
1. Corre la suite completa: `npx vitest run <archivo-test>`.
2. Verifica en la consola que no existan avisos de `act(...)` sin resolver ni fugas de promesas colgadas.
EOF