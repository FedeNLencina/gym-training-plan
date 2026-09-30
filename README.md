# Atlas Gym — prototipo de plataforma de entrenamiento

Prototipo frontend (React 18 + Vite + TypeScript) de la Plataforma: Landing_Page comercial y App_Entrenamiento con datos simulados, sin backend.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo de Vite |
| `npm test` | Suite de pruebas (Vitest, una sola corrida) |
| `npm run typecheck` | `tsc --noEmit` en modo estricto |
| `npm run build` | Verificación de tipos y compilación de producción |

## Cuenta de Administrador sembrada

El Administrador no se registra: la Plataforma nace con su cuenta creada. Sus credenciales son:

- Correo: `admin@atlasgym.com`
- Contraseña: `AtlasGym2024`

Con esa sesión queda disponible el acceso "Panel de administración" (`/admin`). Cualquier otra cuenta creada desde `/registro` obtiene rol `usuario`.

## Advertencia de seguridad

Las contraseñas se guardan **sin cifrar** en el almacenamiento local del navegador, y la verificación de credenciales ocurre en el cliente. Esto es admisible únicamente porque:

- este prototipo no tiene backend donde alojar la verificación;
- no maneja datos reales de personas;
- las credenciales del Administrador son públicas por diseño, para poder recorrer el prototipo.

Al incorporar un backend, la verificación de credenciales y el resguardo de contraseñas (con derivación de clave y salt) deben moverse al servidor, y esta capa debe limitarse a delegar en él. La cuenta sembrada y sus credenciales documentadas acá no deben sobrevivir a esa migración.

## Almacenamiento del navegador

| Clave / almacén | Medio | Contenido |
|---|---|---|
| `atlas.entrenamientos` | localStorage | `{ version: 1, entrenamientos }` |
| `atlas.cuentas` | localStorage | `{ version: 1, cuentas }` |
| `atlas.sesion` | localStorage | Sesión activa (sin contraseña) |
| `videos` (clave `idEntrenamiento`) | IndexedDB `atlas-gym` | Archivos de video subidos |

Para volver al estado inicial, basta con borrar los datos del sitio en el navegador.
