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

Esta cuenta es la única que no puede eliminarse ni perder su rol: la gestión de usuarios la rechaza para que la Plataforma no quede sin ningún Administrador.

## Cuentas de prueba sembradas

Además del Administrador principal, el primer arranque siembra cinco cuentas para recorrer la Plataforma con cada rol y cada situación de plan sin tener que registrarse a mano. **Todas comparten la contraseña `AtlasPrueba2024`.**

| Correo | Nombre | Rol | Plan | Progreso sembrado |
|---|---|---|---|---|
| `entrenador@atlasgym.com` | Lucía Entrenadora | administrador | — | sin progreso |
| `ana@atlasgym.com` | Ana Pérez | usuario | Plan Progreso | 3 sesiones completadas y 2 entrenamientos a medias |
| `bruno@atlasgym.com` | Bruno Giménez | usuario | Plan Base | 1 sesión completada |
| `carla@atlasgym.com` | Carla Ríos | usuario | Plan Integral | 1 entrenamiento al 80 %, sin sesiones completadas |
| `diego@atlasgym.com` | Diego Sosa | usuario | sin plan | sin progreso |

La variedad es deliberada: `ana` sirve para ver un historial con repeticiones del mismo entrenamiento, `carla` para ver un avance en curso sin historial, y `diego` para ver los estados vacíos de "Mi progreso" y de una cuenta sin plan.

Para comprobar el aislamiento entre cuentas, basta con abrir el mismo entrenamiento con dos cuentas distintas: cada una ve su propio avance.

La siembra ocurre **sólo en el primer arranque**, cuando no hay cuentas guardadas. Si el Administrador elimina cuentas, no reaparecen al recargar; para recuperarlas hay que borrar los datos del sitio en el navegador.

## Qué se puede probar

| Vista | Dirección | Acceso |
|---|---|---|
| Catálogo de entrenamientos | `/entrenamientos` | público |
| Reproductor de un entrenamiento | `/entrenamientos/:id` | requiere sesión |
| Mi progreso (historial y acumulado) | `/mi-progreso` | requiere sesión |
| Panel de administración | `/admin` | requiere rol administrador |
| Gestión de usuarios | `/admin/usuarios` | requiere rol administrador |

El avance de un entrenamiento se guarda por cuenta a medida que se marcan los ejercicios, y al completar el último la sesión entra al historial de esa cuenta. Eliminar una cuenta desde la gestión de usuarios borra también todo su progreso.

## Advertencia de seguridad

Las contraseñas se guardan **sin cifrar** en el almacenamiento local del navegador, y la verificación de credenciales ocurre en el cliente. Esto es admisible únicamente porque:

- este prototipo no tiene backend donde alojar la verificación;
- no maneja datos reales de personas;
- las credenciales del Administrador y de las cuentas de prueba son públicas por diseño, para poder recorrer el prototipo.

Al incorporar un backend, la verificación de credenciales y el resguardo de contraseñas (con derivación de clave y salt) deben moverse al servidor, y esta capa debe limitarse a delegar en él. Las cuentas sembradas y sus credenciales documentadas acá no deben sobrevivir a esa migración.

## Almacenamiento del navegador

| Clave / almacén | Medio | Contenido |
|---|---|---|
| `atlas.entrenamientos` | localStorage | `{ version: 1, entrenamientos }` |
| `atlas.cuentas` | localStorage | `{ version: 1, cuentas }` |
| `atlas.sesion` | localStorage | Sesión activa (sin contraseña) |
| `atlas.progreso` | localStorage | `{ version: 1, porCorreo }`: avance e historial de cada cuenta |
| `videos` (clave `idEntrenamiento`) | IndexedDB `atlas-gym` | Archivos de video subidos |

Para volver al estado inicial, basta con borrar los datos del sitio en el navegador.
