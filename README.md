# gym-training-plan

Plataforma de planes de entrenamiento en video (Atlas Training). React 18 + TypeScript + Vite + Vitest.

Es un prototipo sin backend: los datos se guardan en el navegador (localStorage, y los videos subidos en IndexedDB). El login no es seguro de verdad y los datos no se comparten entre navegadores.

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — typecheck + build
- `npm run typecheck` — `tsc --noEmit`
- `npm test` — tests con Vitest

## Cuentas de prueba

Todas usan la contraseña `AtlasPrueba2024`.

| Correo | Rol | Situación |
| --- | --- | --- |
| `admin@atlasgym.com` | Administrador | Acceso al panel de administración |
| `ana@atlasgym.com` | Usuario | Plan Intermedio activo |
| `bruno@atlasgym.com` | Usuario | Plan Básico activo, pidió el Avanzado |
| `diego@atlasgym.com` | Usuario | Sin plan |

Para volver a los datos iniciales, borrá la clave `atlas-training:datos:v1` del localStorage.

## Páginas

- `/` — inicio: presentación, cómo funciona, planes, preguntas frecuentes
- `/planes` — planes ordenados por precio; con sesión se pueden adquirir o cambiar
- `/entrenamientos` — lista con filtro por categoría (requiere sesión)
- `/entrenamientos/:id` — video del entrenamiento (requiere un plan que lo habilite)
- `/ingresar`, `/registro` — acceso
- `/admin` — entrenamientos, planes, usuarios y contenido de inicio (sólo administrador)

## Reglas de negocio

- Un usuario pide un plan y queda como solicitud pendiente; el administrador lo da de alta al confirmar el pago.
- Cada plan habilita los entrenamientos de su nivel y de los inferiores.

## Estructura

- `src/dominio/` — modelos, reglas puras y errores
- `src/datos/semilla.ts` — datos iniciales
- `src/infra/almacen.ts` — persistencia en el navegador (único punto a reemplazar para conectar un backend)
- `src/estado/ContextoApp.tsx` — estado, sesión y acciones
- `src/paginas/`, `src/componentes/`, `src/layout/`, `src/rutas/` — interfaz

La implementación previa está en la rama `implementacion-avanzada-con-ususario-de-prueba`.

## Agentes de IA

- `.claude/` — rules y skills de Claude Code
- `.kiro/` — agentes, skills, steering y specs de Kiro
- `.agents/` — rules y skills genéricas
