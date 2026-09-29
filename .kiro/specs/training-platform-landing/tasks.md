# Implementation Plan: training-platform-landing

## Overview

Plan de implementación del prototipo frontend de la Plataforma (Landing_Page + App_Entrenamiento) en **TypeScript (React 18 + Vite, archivos `.tsx` / `.ts` en modo `strict`)**, tal como fija el diseño.

Toda tarea queda terminada sólo si `npm run typecheck` (es decir, `tsc --noEmit`) y `npm test` pasan. Prohibido `any` explícito y prohibido silenciar errores con `@ts-ignore`: si el tipo no cierra, se corrige el modelo, no la verificación.

La construcción es de abajo hacia arriba siguiendo las capas del diseño: dominio puro → infraestructura → servicios → estado → rutas y layout → vistas. Cada tarea de comportamiento arranca por la **fase roja** (tests que fallan) y sigue con la implementación mínima que los pone en verde, según `.agents/rules/tdd.md`.

Convenciones obligatorias en todas las tareas de prueba:

- Nombre de test en español con los segmentos `Dado `, `Cuando ` y `Entonces ` en ese orden, una sola ocurrencia de `Cuando `, máximo 200 caracteres.
- Un único `act` (una sola interacción del usuario) por test.
- Consultas exclusivamente por rol, texto o etiqueta accesible. Prohibido `querySelector`, `getElementById`, clases y `data-testid`.
- Toda dependencia externa (Repositorio_Datos, AlmacenVideos, reloj) sustituida por un doble de `tests/dobles/`.
- Comentario de trazabilidad `// Cubre: X.Y` en cada test.
- Los tests de propiedad usan `fast-check` con `fc.assert(..., { numRuns: 100, seed: 1 })` y la etiqueta `// Feature: training-platform-landing, Property N: {texto de la propiedad}`.

## Tasks

- [x] 1. Configuración del proyecto y andamiaje de pruebas
  - [x] 1.1 Instalar dependencias y configurar el entorno de pruebas
    - Instalar `react-router-dom@6.30.1`, `idb@8.0.3`, `fast-check@3.23.2` y `@testing-library/user-event@14.6.1` con versiones exactas
    - Configurar `vite.config.ts` con el bloque `test` de Vitest: entorno `jsdom`, `globals: true`, `setupFiles: ['src/tests/setup.ts']`
    - Crear `src/tests/setup.ts` con `@testing-library/jest-dom` y limpieza entre tests
    - Configurar TypeScript en modo `strict` (`tsconfig.json` con `include: ["src"]`, `jsx: react-jsx`, `noUnusedLocals`, `noUnusedParameters`), `src/vite-env.d.ts` con la referencia a `vite/client` para los imports de CSS, y el script `typecheck` → `tsc --noEmit`
    - Verificar que `npm test` corre `vitest run` en una única corrida no interactiva y que `npm run typecheck` termina sin errores
    - _Requirements: 10.6_

  - [x] 1.2 Unificar la ubicación de los archivos de estilo y cargar los tokens del Tema_Atlas
    - Crear `src/estilos/variables.css` con el bloque `:root` de `.agents/rules/theme.md` sin alteraciones, único archivo autorizado a declarar colores literales
    - Crear `src/estilos/global.css` (reset, tipografía, contenedor con `max-width`, `overflow-x: hidden` en `body`) y `src/estilos/components.css` (clases semánticas que sólo consumen `var(--token)`)
    - Corregir los imports de `src/main.tsx`, que hoy apuntan a `./styles/` inexistente, para que apunten a `./estilos/`
    - _Requirements: 9.1, 9.4, 9.5_

  - [x] 1.3 Crear los dobles de prueba y los generadores de dominio
    - Crear `src/tests/dobles/repositorioEnMemoria.ts`, `src/tests/dobles/almacenVideosEnMemoria.ts` y `src/tests/dobles/relojFalso.ts`, con capacidad de simular fallo de lectura, fallo de escritura y espacio insuficiente
    - Crear `src/tests/generadores/generadoresDominio.ts` con `arbEjercicio`, `arbEntrenamiento` (variantes válida e inválida por regla), `arbPlan`, `arbListaPlanes` (parametrizada por cantidad de recomendados), `arbCuenta`, `arbCorreoInvalido`, `arbArchivoVideo` (tipos admitidos y no admitidos, tamaños alrededor de 52.428.800 bytes), `arbAnchoVentana`, `arbRutaNoDeclarada`
    - Incluir en los generadores los casos borde: cadenas vacías y de sólo espacios, longitudes exactamente en el límite, listas vacías, caracteres no ASCII
    - _Requirements: 10.8_

- [ ] 2. Dominio puro
  - [x] 2.1 Definir modelos y jerarquía de errores de dominio
    - Crear `src/dominio/modelos.ts` con los tipos de `Entrenamiento`, `Ejercicio`, `Plan`, `Cuenta`, `Sesion`, constructores y constantes (`NIVELES`, `FUENTES_VIDEO`, `PERIODICIDADES`, `LIMITE_VIDEO_BYTES = 52428800`), tomando como punto de partida `src/tests/tiposDominio.ts`, que se creó provisionalmente en la tarea 1.3 y debe quedar reexportando desde acá, no duplicando
    - Crear `src/dominio/errores.ts` con `ErrorValidacion` (campo `campos`), `ErrorCorreoRegistrado`, `ErrorCredenciales`, `ErrorAlmacenamiento`, `ErrorEspacioInsuficiente`, `ErrorVideoAusente`, `ErrorCarga`
    - _Requirements: 8.7, 8.14_

  - [ ] 2.2 Implementar las validaciones de dominio
    - Escribir primero los tests unitarios de `validarEntrenamiento`, `validarEjercicio`, `validarCuenta` y `validarCorreo`, cubriendo límites exactos y campos ausentes
    - Implementar `src/dominio/validaciones.ts`: título ≤ 120, descripción ≤ 1000, categoría y nivel presentes, duración entera 1–240, 1–50 Ejercicios, `fuenteVideo` ∈ {`enlace`, `archivo`}, nombre 2–60, correo 6–254 con formato `texto@dominio.extension`, contraseña 8–64
    - Devolver `ErrorValidacion` con el mapa de campos inválidos
    - _Requirements: 4.1, 8.7, 8.14_

  - [ ] 2.3 Implementar la serialización de Entrenamientos
    - Escribir primero los tests de `serializarEntrenamientos` / `deserializarEntrenamientos`, incluyendo contenido con `version` desconocida y estructura inválida
    - Implementar `src/dominio/serializacion.ts` con el sobre `{ version: 1, entrenamientos }` y descarte del contenido que no cumple estructura
    - _Requirements: 8.4, 8.5_

  - [ ]* 2.4 Escribir el test de propiedad de ida y vuelta de serialización
    - **Property 44: Ida y vuelta de serialización de Entrenamiento**
    - **Validates: Requirements 8.4**

  - [ ] 2.5 Implementar el filtrado de Entrenamientos
    - Escribir primero los tests de `filtrarEntrenamientos(entrenamientos, { categoria, nivel })`: conjunción de filtros, valor `'Todos'` ignorado, sin coincidencias
    - Implementar `src/dominio/filtros.ts` y `soloPublicados(entrenamientos)`
    - _Requirements: 5.1, 5.2, 5.3, 5.9_

  - [ ] 2.6 Implementar el cálculo de avance
    - Escribir primero los tests de `calcularPorcentajeAvance(completados, total)`: total 0 devuelve 0, redondeo al entero más próximo, cota 0–100
    - Implementar `src/dominio/progreso.ts` con `calcularPorcentajeAvance` y `estaCompleto(completados, total)`
    - _Requirements: 6.4, 6.5, 6.9_

  - [ ]* 2.7 Escribir el test de propiedad del porcentaje de avance
    - **Property 27: El porcentaje de avance es el redondeo entero de la proporción completada**
    - **Validates: Requirements 6.4**

  - [ ] 2.8 Implementar la validación y resolución de enlaces de video
    - Escribir primero los tests de `esEnlaceVideoValido` y `resolverEmbebido`, con enlaces de YouTube, Vimeo, archivo directo, cadena vacía y textos que no son direcciones web
    - Implementar `src/dominio/enlacesVideo.ts`
    - _Requirements: 6.10, 7.10_

- [ ] 3. Checkpoint del dominio
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Infraestructura del navegador
  - [ ] 4.1 Implementar el adaptador de almacenamiento local
    - Escribir primero los tests con un doble de `localStorage` que simula ausencia de la API y `QuotaExceededError`
    - Implementar `src/infra/almacenamientoLocal.ts` con `leer`, `escribir` y `borrar`, traduciendo los fallos del navegador a `ErrorAlmacenamiento` y `ErrorEspacioInsuficiente`
    - _Requirements: 8.8_

  - [ ] 4.2 Implementar el acceso a IndexedDB
    - Escribir primero los tests de apertura de la base `atlas-gym` y del almacén `videos` con clave `idEntrenamiento`, usando un doble de `idb`
    - Implementar `src/infra/baseIndexedDb.ts` con transacciones `readwrite` atómicas y traducción de `QuotaExceededError` a `ErrorEspacioInsuficiente`
    - _Requirements: 8.10, 8.12_

  - [ ] 4.3 Implementar el reloj inyectable
    - Escribir primero los tests de `programarIntervalo` y `programarPlazo` con temporizadores falsos de Vitest
    - Implementar `src/infra/reloj.ts` como dependencia sustituible por `relojFalso`
    - _Requirements: 6.2, 5.10, 10.8_

- [ ] 5. Servicio RepositorioDatos
  - [ ] 5.1 Implementar el RepositorioDatos
    - Escribir primero los tests de `obtenerEntrenamientos`, `obtenerEntrenamiento`, `guardarEntrenamiento`, `eliminarEntrenamiento`, `obtenerPlanes` y `obtenerContenidoLanding` sobre dobles de almacenamiento
    - Implementar `src/servicios/repositorioDatos.ts` como fábrica `crearRepositorioDatos({ almacenamiento, almacenVideos, datosIniciales })`, que valida antes de escribir, reemplaza por `id` (idempotencia), acota la lectura a 200, siembra los datos simulados cuando el almacenamiento está vacío, descarta contenido no deserializable, degrada a memoria ante fallo de persistencia y borra en cascada el Archivo_Video al eliminar
    - Devolver siempre copias, nunca referencias al estado interno
    - _Requirements: 8.1, 8.2, 8.3, 8.5, 8.6, 8.7, 8.8, 8.9, 8.14_

  - [ ]* 5.2 Escribir el test de propiedad de conservación y lectura
    - **Property 42: Toda escritura válida se conserva y se devuelve**
    - **Validates: Requirements 8.1**

  - [ ]* 5.3 Escribir el test de propiedad del tope de lectura
    - **Property 43: La lectura devuelve la totalidad de lo almacenado hasta el tope**
    - **Validates: Requirements 8.2**

  - [ ]* 5.4 Escribir el test de propiedad de descarte de contenido inválido
    - **Property 45: Todo contenido almacenado inválido se descarta sin interrumpir la carga**
    - **Validates: Requirements 8.5**

  - [ ]* 5.5 Escribir el test de propiedad de idempotencia de escritura
    - **Property 46: La escritura de un Entrenamiento es idempotente**
    - **Validates: Requirements 8.6**

  - [ ]* 5.6 Escribir el test de propiedad de rechazo de escrituras inválidas
    - **Property 47: Toda escritura inválida es rechazada y preserva el estado previo**
    - **Validates: Requirements 8.7, 8.14**

  - [ ]* 5.7 Escribir los tests de ejemplo de siembra y degradación del almacenamiento
    - Primera carga con almacenamiento vacío devuelve entre 6 y 12 Entrenamientos simulados y los conserva
    - Almacenamiento no disponible devuelve error de persistencia, conserva los datos en memoria y deja intacto el contenido previo
    - _Requirements: 8.3, 8.8_

- [ ] 6. Servicio AlmacenVideos
  - [ ] 6.1 Implementar el AlmacenVideos sobre IndexedDB
    - Escribir primero los tests de `guardarVideo`, `obtenerVideo` y `eliminarVideo` con el doble en memoria y con rechazo por cuota
    - Implementar `src/servicios/almacenVideos.ts` como fábrica `crearAlmacenVideos({ base })`: valida tipo `video/mp4` o `video/webm` y tamaño ≤ 52.428.800 bytes, guarda el `Blob`, rechaza con `ErrorVideoAusente` cuando no existe, borra de forma idempotente
    - _Requirements: 8.10, 8.12, 8.13, 7.18, 7.19_

  - [ ]* 6.2 Escribir el test de propiedad de ida y vuelta binaria
    - **Property 48: Ida y vuelta binaria del Archivo_Video**
    - **Validates: Requirements 8.10, 8.11**

  - [ ]* 6.3 Escribir el test de propiedad de lectura de video ausente
    - **Property 49: Toda lectura de un Archivo_Video ausente falla sin alterar el estado**
    - **Validates: Requirements 8.13**

  - [ ]* 6.4 Escribir el test de ejemplo de rechazo por cuota
    - La transacción abortada no deja registros parciales y conserva los Entrenamientos y Archivos_Video previos
    - _Requirements: 8.12_

- [ ] 7. Servicio de autenticación
  - [ ] 7.1 Implementar el ServicioAutenticacion
    - Escribir primero los tests de `registrar`, `ingresar`, `cerrarSesion` y `restaurarSesion` sobre el doble de almacenamiento
    - Implementar `src/servicios/servicioAutenticacion.ts` como fábrica `crearServicioAutenticacion({ almacenamiento })`: valida campos, rechaza correo duplicado, crea cuenta con rol `usuario`, asocia `idPlan` cuando se recibe, exige coincidencia exacta de credenciales, borra la sesión persistida al cerrar y descarta la sesión persistida no deserializable o sin cuenta correspondiente
    - Sembrar la cuenta con rol `administrador` y documentar sus credenciales en el `README` del prototipo, dejando constancia de que las contraseñas sin cifrar sólo son admisibles por ausencia de backend
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 4.7, 4.10, 4.11, 4.12, 7.1_

  - [ ]* 7.2 Escribir el test de propiedad de validación de registro
    - **Property 13: La validación de registro acepta exactamente las entradas válidas**
    - **Validates: Requirements 4.1, 4.4**

  - [ ]* 7.3 Escribir el test de propiedad de unicidad de correo
    - **Property 15: El correo registrado es único**
    - **Validates: Requirements 4.3**

  - [ ]* 7.4 Escribir el test de propiedad de credenciales no coincidentes
    - **Property 17: Las credenciales no coincidentes no abren sesión**
    - **Validates: Requirements 4.7**

  - [ ]* 7.5 Escribir el test de propiedad de descarte de sesión persistida inválida
    - **Property 19: Toda sesión persistida inválida se descarta**
    - **Validates: Requirements 4.12**

- [ ] 8. Checkpoint de servicios
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Capa de estado: contextos y hooks
  - [ ] 9.1 Implementar ContextoSesion
    - Escribir primero los tests del proveedor: estado `restaurando` inicial, transición a `lista`, registro, ingreso y cierre de sesión
    - Implementar `src/estado/ContextoSesion.tsx` exponiendo `{ estado, sesion, registrar, ingresar, cerrarSesion }` sobre el ServicioAutenticacion inyectado
    - _Requirements: 4.2, 4.6, 4.10, 4.11_

  - [ ]* 9.2 Escribir el test de propiedad de ida y vuelta de autenticación
    - **Property 14: Ida y vuelta de autenticación**
    - **Validates: Requirements 4.2, 4.6, 4.11**

  - [ ] 9.3 Implementar ContextoAvisos
    - Escribir primero los tests de publicación y consumo único de un aviso que sobrevive un cambio de ruta
    - Implementar `src/estado/ContextoAvisos.tsx` con `publicarAviso` y consumo al presentarse
    - _Requirements: 2.13, 2.14, 6.8, 7.2, 7.8_

  - [ ] 9.4 Implementar los hooks de datos useEntrenamientos y usePlanes
    - Escribir primero los tests de la máquina de estados `cargando → listo | error`, del `recargar` y del vencimiento del plazo de 5 segundos con reloj falso
    - Implementar `src/estado/useEntrenamientos.ts` y `src/estado/usePlanes.ts` exponiendo `{ estado, datos, error, recargar }`, con carrera entre la promesa del repositorio y el plazo del reloj inyectado, descartando la respuesta tardía
    - _Requirements: 3.7, 3.8, 5.5, 5.6, 5.7, 5.10_

  - [ ]* 9.5 Escribir el test de propiedad de conservación de filtros ante error
    - **Property 23: El error de carga conserva los filtros seleccionados**
    - **Validates: Requirements 5.6**

  - [ ] 9.6 Implementar useProgresoEntrenamiento
    - Escribir primero los tests de marcado, desmarcado, porcentaje y bandera de completitud
    - Implementar `src/estado/useProgresoEntrenamiento.ts` delegando el cálculo en `calcularPorcentajeAvance`
    - _Requirements: 6.4, 6.5, 6.7_

  - [ ]* 9.7 Escribir el test de propiedad de reversibilidad del marcado
    - **Property 29: Marcar y desmarcar un Ejercicio es reversible**
    - **Validates: Requirements 6.7**

  - [ ] 9.8 Implementar useTemporizadorDescanso
    - Escribir primero los tests con reloj falso: decremento de un segundo por segundo, detención en 0 y bandera `finalizado`
    - Implementar `src/estado/useTemporizadorDescanso.ts` con el reloj inyectado
    - _Requirements: 6.2, 6.3_

  - [ ]* 9.9 Escribir el test de propiedad de la cuenta regresiva
    - **Property 26: La cuenta regresiva decrece un segundo por segundo y se detiene en 0**
    - **Validates: Requirements 6.2, 6.3**

  - [ ] 9.10 Implementar useAnchoVentana
    - Escribir primero los tests del cruce del umbral de 768 px con `matchMedia` simulado
    - Implementar `src/estado/useAnchoVentana.ts`
    - _Requirements: 2.7, 2.10_

- [ ] 10. Datos simulados y contenido de la Landing
  - [ ] 10.1 Crear la semilla de datos y el contenido textual
    - Crear `src/datos/entrenamientosSimulados.ts` con 8 Entrenamientos publicados, todos con `fuenteVideo: 'enlace'`, variados en categoría, nivel y duración
    - Crear `src/datos/planesSimulados.ts` con 4 planes válidos y exactamente uno recomendado
    - Crear `src/datos/contenidoLanding.ts` con ≥ 3 beneficios, pasos del método, ≥ 3 testimonios con nombre y texto, ≥ 4 pares de pregunta y respuesta, y los datos de contacto y redes sociales como marcadores de posición en español
    - _Requirements: 1.5, 1.9, 3.1, 8.3_

- [ ] 11. Enrutador, rutas protegidas y layout
  - [ ] 11.1 Definir el árbol de rutas y el cableado de la aplicación
    - Escribir primero los tests de entrada directa a cada ruta declarada y a una ruta inexistente
    - Crear `src/rutas/definicionRutas.tsx` con las constantes de ruta y el árbol bajo `LayoutPublico`, y `src/paginas/NoEncontrada.tsx` con el mensaje "Página no encontrada" y la acción "Volver al inicio"
    - Actualizar `src/App.tsx` para componer `BrowserRouter`, `ContextoSesion` y `ContextoAvisos`
    - _Requirements: 2.12, 2.15_

  - [ ] 11.2 Implementar RutaProtegida
    - Escribir primero los tests de las cuatro situaciones: sin sesión, rol insuficiente, identificador inexistente y sesión restaurándose
    - Implementar `src/rutas/RutaProtegida.tsx`, que no decide mientras el estado de sesión es `restaurando`, redirige con `replace` y publica el aviso correspondiente antes de navegar
    - _Requirements: 2.13, 2.14, 6.8, 7.2, 7.8_

  - [ ]* 11.3 Escribir el test de propiedad de resolución de rutas declaradas
    - **Property 7: Toda ruta declarada resuelve a su vista o a su redirección definida**
    - **Validates: Requirements 2.12, 2.13, 6.8, 7.8**

  - [ ]* 11.4 Escribir el test de propiedad de identificadores inexistentes
    - **Property 8: Todo identificador inexistente devuelve al catálogo**
    - **Validates: Requirements 2.14**

  - [ ]* 11.5 Escribir el test de propiedad de rutas no declaradas
    - **Property 9: Toda ruta no declarada presenta la vista de página inexistente**
    - **Validates: Requirements 2.15**

  - [ ] 11.6 Implementar LayoutPublico, Navbar, MenuMovil y PieDePagina
    - Escribir primero los tests de orden de los elementos de navegación, `aria-current`, acciones según sesión, menú móvil y navegación con desplazamiento
    - Implementar `src/layout/LayoutPublico.tsx` (Navbar + `Outlet` + región `aria-live="polite"` de avisos), `src/layout/Navbar.tsx` con `Link` y `useMatch`, `src/layout/MenuMovil.tsx` con botón "Menú" y `aria-expanded`, y `src/layout/PieDePagina.tsx`
    - Implementar `useNavegacionLanding` para la combinación de navegación y desplazamiento de "Inicio" y "Planes", y el acceso "Panel de administración" visible sólo con rol Administrador
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 4.8, 4.9, 7.1_

  - [ ]* 11.7 Escribir el test de propiedad de presencia y orden de la Navbar
    - **Property 3: La Navbar está presente y ordenada en toda vista pública**
    - **Validates: Requirements 2.1**

  - [ ]* 11.8 Escribir el test de propiedad de página actual marcada
    - **Property 4: Exactamente un elemento de navegación marca la página actual**
    - **Validates: Requirements 2.6**

  - [ ]* 11.9 Escribir el test de propiedad del estado del menú móvil
    - **Property 5: El estado del menú móvil se refleja en su atributo**
    - **Validates: Requirements 2.7**

  - [ ]* 11.10 Escribir el test de propiedad de cierre y navegación del menú
    - **Property 6: Todo elemento del menú desplegado cierra el menú y navega**
    - **Validates: Requirements 2.8**

  - [ ]* 11.11 Escribir el test de propiedad de la Navbar frente a la sesión y los ejemplos de sesión
    - **Property 18: La Navbar refleja la sesión activa**
    - **Validates: Requirements 4.8**
    - Ejemplos adicionales: Navbar sin sesión presenta "Iniciar sesión" y "Registrarme"; cerrar sesión navega a `/` y borra la sesión persistida
    - _Requirements: 4.9, 4.10_

  - [ ]* 11.12 Escribir los tests de ejemplo de navegación con desplazamiento
    - "Inicio" desde otra ruta navega a `/` y posiciona la ventana en 0; desde `/` sólo desplaza
    - "Planes" desde otra ruta navega a `/#planes` y desplaza hasta la Seccion_Planes; desde `/` sólo desplaza
    - "Entrenamientos" navega a `/entrenamientos` sin recargar el documento
    - Cruzar el umbral de 768 px con el menú abierto lo cierra y fija los elementos de navegación
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.9, 2.10_

- [ ] 12. Checkpoint de navegación
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Landing Page
  - [ ] 13.1 Implementar las secciones estáticas de la Landing_Page
    - Escribir primero los tests del orden y unicidad de los ocho encabezados, de los límites del titular y subtitular, de los CTA del Hero y del contenido del pie de página
    - Implementar `src/paginas/LandingPage.tsx` y los componentes `SeccionHero`, `SeccionBeneficios`, `SeccionComoFunciona`, `SeccionTestimonios`, `SeccionPreguntasFrecuentes` (con `details`/`summary`)
    - Construir los espacios reservados de imagen con bloques de color de los tokens, sin `img` ni `background-image` a archivos, marcados como ignorados por las tecnologías de asistencia
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.9_

  - [ ]* 13.2 Escribir los tests de ejemplo de la estructura de la Landing_Page
    - Ocho secciones en orden con encabezados accesibles de texto único, límites de longitud del Hero, ausencia de elementos de imagen, contenido del pie de página y cantidades mínimas de beneficios, testimonios y preguntas frecuentes
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.9_

  - [ ] 13.3 Implementar SeccionCatalogoDestacado
    - Escribir primero los tests de la cota de 3 Entrenamientos, de los datos presentados y del mensaje de vacío o error
    - Implementar el componente sobre `useEntrenamientos`, con el mensaje "No hay entrenamientos destacados por el momento" ante lista vacía o fallo, conservando visibles las siete secciones restantes
    - _Requirements: 1.7, 1.8_

  - [ ]* 13.4 Escribir el test de propiedad del catálogo destacado
    - **Property 2: El catálogo destacado está acotado y es completo**
    - **Validates: Requirements 1.7**

  - [ ]* 13.5 Escribir el test de ejemplo del catálogo destacado vacío o con fallo
    - _Requirements: 1.8_

  - [ ]* 13.6 Escribir el test de propiedad del destino de los CTA
    - **Property 1: El destino declarado de un CTA es el destino efectivo**
    - **Validates: Requirements 1.6**

  - [ ] 13.7 Implementar SeccionPlanes y TarjetaPlan
    - Escribir primero los tests de los datos de cada plan, de "incluido"/"no incluido", del destaque único, del CTA con parámetro `plan` y de los estados de carga, vacío y error
    - Implementar `resolverPlanRecomendado(planes)` en el dominio, devolviendo el id sólo cuando hay exactamente un plan recomendado
    - Implementar `SeccionPlanes` sobre `usePlanes` y `TarjetaPlan` con el CTA "Elegir plan" hacia `/registro?plan={id}` sin solicitar pago
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 13.8 Escribir el test de propiedad de la tarjeta de plan completa
    - **Property 10: Toda tarjeta de plan presenta el plan completo**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 13.9 Escribir el test de propiedad del CTA de plan
    - **Property 11: El CTA de un plan transporta el identificador de ese plan**
    - **Validates: Requirements 3.3**

  - [ ]* 13.10 Escribir el test de propiedad del destaque de plan recomendado
    - **Property 12: El destaque existe si y sólo si hay exactamente un plan recomendado**
    - **Validates: Requirements 3.4, 3.5**

  - [ ]* 13.11 Escribir los tests de ejemplo de los estados de la Seccion_Planes
    - Lista vacía presenta "No hay planes disponibles por el momento" sin CTA; estado de carga presenta indicador sin CTA; fallo presenta "No pudimos cargar los planes" con "Reintentar" que vuelve a solicitar la lista
    - _Requirements: 3.6, 3.7, 3.8_

- [ ] 14. Vistas de registro e inicio de sesión
  - [ ] 14.1 Implementar Registro e Ingresar
    - Escribir primero los tests de registro válido, correo duplicado, campos inválidos con mensaje por campo y conservación de valores, ingreso válido y credenciales incorrectas con contraseña vaciada
    - Implementar `src/paginas/Registro.tsx` (leyendo el parámetro `plan` con `useSearchParams`) y `src/paginas/Ingresar.tsx` sobre `ContextoSesion`, con mensajes asociados por `aria-describedby` y navegación a `/entrenamientos` al iniciar sesión
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 14.2 Escribir el test de propiedad de asociación del plan elegido
    - **Property 16: El plan elegido queda asociado a la cuenta**
    - **Validates: Requirements 4.5**

- [ ] 15. Catálogo de entrenamientos
  - [ ] 15.1 Implementar CatalogoEntrenamientos, FiltrosCatalogo y TarjetaEntrenamiento
    - Escribir primero los tests de la lista de publicados, del filtrado por categoría y nivel con recuento, del conjunto vacío por filtros, de los estados de carga, error y reintento, y de la vista reducida sin sesión
    - Implementar la vista sobre `useEntrenamientos` y `filtrarEntrenamientos`, con filtros deshabilitados mientras carga, acción "Quitar filtros", acción "Reintentar" que conserva los filtros, y tarjetas que sin sesión muestran descripción y CTA "Registrate para entrenar" sin ningún enlace a `/entrenamientos/:id`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11_

  - [ ]* 15.2 Escribir el test de propiedad de los Entrenamientos publicados
    - **Property 20: El catálogo presenta exactamente los Entrenamientos publicados**
    - **Validates: Requirements 5.1**

  - [ ]* 15.3 Escribir el test de propiedad del filtrado conjuntivo
    - **Property 21: El filtrado es conjuntivo, exacto y consistente con el recuento**
    - **Validates: Requirements 5.2, 5.3, 5.9**

  - [ ]* 15.4 Escribir el test de propiedad de restablecimiento de filtros
    - **Property 22: Quitar filtros restaura el conjunto completo**
    - **Validates: Requirements 5.4**

  - [ ]* 15.5 Escribir el test de propiedad de la vista sin sesión
    - **Property 24: Sin sesión no se expone ningún enlace al detalle**
    - **Validates: Requirements 5.8**

  - [ ]* 15.6 Escribir los tests de ejemplo de los estados del catálogo
    - Indicador de carga con filtros deshabilitados; "Reintentar" vuelve a solicitar la lista; vencimiento del plazo de 5 segundos aplica el comportamiento de error; lista publicada vacía sin filtros presenta "Todavía no hay entrenamientos publicados" sin controles de filtro
    - _Requirements: 5.5, 5.7, 5.10, 5.11_

- [ ] 16. Checkpoint del catálogo
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Reproductor de entrenamiento
  - [ ] 17.1 Implementar ReproductorEntrenamiento, ListaEjercicios y FilaEjercicio
    - Escribir primero los tests del título y del detalle completo de cada Ejercicio (nombre, series, repeticiones y descanso en segundos)
    - Implementar `src/paginas/ReproductorEntrenamiento.tsx`, `ListaEjercicios.tsx` y `FilaEjercicio.tsx`
    - _Requirements: 6.1_

  - [ ]* 17.2 Escribir el test de propiedad de la lista completa de Ejercicios
    - **Property 25: El reproductor presenta la lista completa de Ejercicios**
    - **Validates: Requirements 6.1**

  - [ ] 17.3 Implementar VisorVideo, VideoEnlace y VideoArchivo
    - Escribir primero los tests de las dos fuentes de video, del indicador de carga en el área del video y del mensaje "Video no disponible"
    - Implementar el despacho por `fuenteVideo`: `iframe` embebido apuntando al Enlace_Video, o `<video controls>` sobre la URL de objeto creada desde el `Blob`, liberada al desmontar
    - _Requirements: 6.6, 6.10, 6.11, 6.12_

  - [ ]* 17.4 Escribir el test de propiedad de la fuente declarada
    - **Property 31: El reproductor apunta a la fuente declarada del Entrenamiento**
    - **Validates: Requirements 6.10, 6.11**

  - [ ]* 17.5 Escribir el test de propiedad de ausencia de video
    - **Property 30: La ausencia de video no bloquea la ejecución del entrenamiento**
    - **Validates: Requirements 6.6**

  - [ ] 17.6 Integrar progreso, temporizador y resumen de sesión
    - Escribir primero los tests del marcado y desmarcado con recálculo del porcentaje, del aviso "Descanso finalizado" en región `aria-live`, del resumen con total y 100 %, y del Entrenamiento sin Ejercicios
    - Implementar `BarraProgreso.tsx`, `ResumenSesion.tsx` y `TemporizadorDescanso.tsx` sobre `useProgresoEntrenamiento` y `useTemporizadorDescanso`, con mensaje "Este entrenamiento no tiene ejercicios cargados", avance 0 y controles deshabilitados cuando no hay Ejercicios
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.7, 6.9_

  - [ ]* 17.7 Escribir el test de propiedad del resumen de sesión
    - **Property 28: Completar todos los Ejercicios presenta el resumen de sesión**
    - **Validates: Requirements 6.5**

  - [ ]* 17.8 Escribir los tests de ejemplo del reproductor sin ejercicios y a la espera del archivo
    - _Requirements: 6.9, 6.12_

- [ ] 18. Panel de administración
  - [ ] 18.1 Implementar PanelAdmin y ListaEntrenamientosAdmin
    - Escribir primero los tests del listado de Entrenamientos administrables y del acceso según rol
    - Implementar `src/paginas/PanelAdmin.tsx` y `ListaEntrenamientosAdmin.tsx`
    - _Requirements: 7.1, 7.2_

  - [ ] 18.2 Implementar FormularioEntrenamiento y EditorEjercicios
    - Escribir primero los tests de creación válida con mensaje "Entrenamiento publicado", de creación inválida con mensaje por campo y conservación de valores, y de edición con mensaje "Cambios guardados"
    - Implementar el formulario controlado con validación al enviar (título 3–80, nivel, duración 5–120, 1–30 Ejercicios con nombre 3–60, series 1–20, repeticiones 1–100, descanso 0–300), mensajes asociados por `aria-describedby`, creación en estado publicado con identificador único y edición que preserva el identificador
    - _Requirements: 7.3, 7.4, 7.5_

  - [ ]* 18.3 Escribir el test de propiedad de creación válida
    - **Property 32: Toda creación válida publica un Entrenamiento con identificador único**
    - **Validates: Requirements 7.3**

  - [ ]* 18.4 Escribir el test de propiedad de creación inválida
    - **Property 33: Toda creación inválida deja el estado intacto**
    - **Validates: Requirements 7.4**

  - [ ]* 18.5 Escribir el test de propiedad de preservación del identificador
    - **Property 34: La edición preserva el identificador**
    - **Validates: Requirements 7.5**

  - [ ] 18.6 Implementar SelectorFuenteVideo, CampoEnlaceVideo y SubidaArchivoVideo
    - Escribir primero los tests de la alternancia entre "Enlace de video" (inicial) y "Subir video", del enlace inválido, del archivo aceptado con nombre y tamaño en MB con un decimal, del tipo y del tamaño rechazados, del envío sin archivo y del espacio insuficiente
    - Implementar el grupo de radios y los dos controles obligatorios mutuamente excluyentes, la validación en el momento de la selección del archivo, y la secuencia de guardado `validar → guardarVideo → guardarEntrenamiento` para Fuente_Video `archivo`, con eliminación del video huérfano al pasar a `enlace`
    - _Requirements: 7.10, 7.11, 7.12, 7.13, 7.14, 7.15, 7.16, 7.17, 7.18, 7.19, 7.20_

  - [ ]* 18.7 Escribir el test de propiedad del enlace de video inválido
    - **Property 38: Todo Enlace_Video con formato inválido es rechazado**
    - **Validates: Requirements 7.10**

  - [ ]* 18.8 Escribir el test de propiedad de aceptación de Archivo_Video
    - **Property 39: La selección de Archivo_Video acepta exactamente los archivos admitidos**
    - **Validates: Requirements 7.14, 7.15, 7.16**

  - [ ]* 18.9 Escribir el test de propiedad de conservación del Archivo_Video
    - **Property 40: El Archivo_Video se conserva asociado al identificador del Entrenamiento**
    - **Validates: Requirements 7.18**

  - [ ]* 18.10 Escribir el test de propiedad de ausencia de videos huérfanos
    - **Property 41: Cambiar la fuente a enlace no deja videos huérfanos**
    - **Validates: Requirements 7.20**

  - [ ] 18.11 Implementar DialogoConfirmacion y la eliminación de Entrenamientos
    - Escribir primero los tests de confirmación con mensaje "Entrenamiento eliminado" y de cancelación sin cambios
    - Implementar el diálogo accesible y el flujo de eliminación con borrado en cascada del Archivo_Video
    - _Requirements: 7.6, 7.9_

  - [ ]* 18.12 Escribir el test de propiedad de eliminación confirmada
    - **Property 35: La eliminación confirmada quita únicamente el Entrenamiento elegido**
    - **Validates: Requirements 7.6, 8.9**

  - [ ]* 18.13 Escribir el test de propiedad de cancelación de la eliminación
    - **Property 36: Cancelar la eliminación no altera el estado**
    - **Validates: Requirements 7.9**

  - [ ]* 18.14 Escribir el test de propiedad de visibilidad de lo publicado
    - **Property 37: Todo Entrenamiento publicado es visible para las sesiones Usuario**
    - **Validates: Requirements 7.7**

  - [ ]* 18.15 Escribir los tests de ejemplo del Panel_Admin
    - Acceso "Panel de administración" según rol; alternancia del selector de Fuente_Video con sus campos obligatorios y la indicación de formatos y tamaño máximo; envío con Fuente_Video `archivo` sin archivo seleccionado; espacio insuficiente al guardar el video
    - _Requirements: 7.1, 7.11, 7.12, 7.13, 7.17, 7.19_

- [ ] 19. Identidad visual y accesibilidad
  - [ ] 19.1 Completar las reglas de estilo transversales
    - Escribir primero los tests sobre las reglas declaradas: `:focus-visible` con contorno de acento, área activa de 44 × 44 px por debajo de 768 px, una sola columna entre 320 y 767 px y grillas desde 768 px
    - Completar `src/estilos/components.css` y `src/estilos/global.css` con clases semánticas que sólo consumen `var(--token)`, texto blanco sobre `--primary` únicamente en tamaño ≥ 18 px o negrita ≥ 14 px, y bloques decorativos ignorados por las tecnologías de asistencia
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.9, 9.10, 9.11_

  - [ ]* 19.2 Escribir el test de propiedad de contraste de los tokens
    - **Property 50: Toda combinación de colores del sistema alcanza su umbral de contraste**
    - **Validates: Requirements 9.2, 9.3, 9.9**

  - [ ]* 19.3 Escribir el test de propiedad de ausencia de desplazamiento horizontal
    - **Property 51: Ningún ancho de ventana produce desplazamiento horizontal**
    - **Validates: Requirements 9.4, 9.5**

  - [ ]* 19.4 Escribir el test de propiedad de nombre accesible y rol
    - **Property 52: Todo control interactivo tiene nombre accesible y rol correspondiente**
    - **Validates: Requirements 9.6**

  - [ ]* 19.5 Escribir el test de propiedad de activación por teclado
    - **Property 53: La activación por teclado equivale a la activación con puntero**
    - **Validates: Requirements 9.7, 2.11**

  - [ ]* 19.6 Escribir el test de propiedad de la secuencia de tabulación
    - **Property 54: La secuencia de tabulación sigue el orden del documento**
    - **Validates: Requirements 9.8**

  - [ ]* 19.7 Escribir el test de propiedad de bloques decorativos
    - **Property 55: Todo bloque decorativo queda fuera del árbol de accesibilidad**
    - **Validates: Requirements 9.11**

- [ ] 20. Verificaciones estáticas del repositorio
  - [ ]* 20.1 Escribir la verificación estática de colores literales
    - Ningún archivo del proyecto distinto de `src/estilos/variables.css` declara valores de color literales
    - _Requirements: 9.1_

  - [ ]* 20.2 Escribir la verificación estática del formato de los nombres de prueba
    - Todo nombre de test contiene "Dado ", "Cuando " y "Entonces " en ese orden, con exactamente una ocurrencia de "Cuando " y un máximo de 200 caracteres
    - _Requirements: 10.3, 10.4_

  - [ ]* 20.3 Escribir la verificación estática de las consultas prohibidas
    - Ningún archivo de prueba usa `querySelector`, `getElementById`, selectores de clase ni `data-testid`
    - _Requirements: 10.5_

  - [ ]* 20.4 Escribir la verificación estática de trazabilidad de criterios
    - Las etiquetas `// Cubre: X.Y` cubren todos los criterios de aceptación de los Requirements 1 a 9, y en particular todos los criterios con patrón IF-THEN
    - _Requirements: 10.1, 10.7_

  - [ ] 20.5 Verificar el corredor de pruebas y el determinismo de la suite
    - Escribir la verificación de que el script `test` es `vitest run` y de que la suite finaliza en 300 segundos o menos con código de salida distinto de 0 ante fallos
    - Verificar que dos corridas consecutivas con la misma semilla producen resultados idénticos, con toda dependencia externa sustituida por dobles
    - _Requirements: 10.6, 10.8_

- [ ] 21. Checkpoint final
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido; incluyen tests de propiedad, tests de ejemplo y verificaciones estáticas.
- Las tareas de comportamiento no opcionales incluyen su propio ciclo TDD: primero los tests en rojo, después la implementación mínima que los pone en verde, en commits separados y en ese orden (10.2).
- Cada tarea referencia los criterios de aceptación que cubre y, cuando corresponde, la propiedad de corrección del diseño.
- Las 55 propiedades del diseño se implementan con `fast-check`, mínimo 100 iteraciones y semilla fija, usando los generadores de `src/tests/generadores/generadoresDominio.ts`.
- Los contraejemplos que arroje `fast-check` se incorporan como tests de ejemplo permanentes.
- Las propiedades 50 y 51 se verifican sobre los tokens y las reglas CSS declaradas, no sobre píxeles renderizados: jsdom no calcula layout ni contraste. La validación visual completa del Tema_Atlas y la conformidad plena con WCAG requieren revisión manual en navegador y de una persona experta en accesibilidad, fuera del alcance de estas tareas.
- El criterio 10.2 es una regla de proceso sobre el historial de commits y se cumple por convención de trabajo, no por un test de comportamiento.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.5", "2.6", "2.8", "4.1", "4.2", "4.3"] },
    { "id": 3, "tasks": ["2.4", "2.7", "5.1", "6.1", "7.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "6.2", "6.3", "6.4", "7.2", "7.3", "7.4", "7.5", "9.1", "9.3", "10.1"] },
    { "id": 5, "tasks": ["9.2", "9.4", "9.6", "9.8", "9.10", "11.1"] },
    { "id": 6, "tasks": ["9.5", "9.7", "9.9", "11.2", "11.6", "19.1"] },
    { "id": 7, "tasks": ["13.1", "13.3", "13.7", "14.1", "15.1", "17.1", "18.1"] },
    { "id": 8, "tasks": ["11.3", "11.4", "11.5", "11.7", "11.8", "11.9", "11.10", "11.11", "11.12", "13.2", "13.4", "13.5", "13.6", "13.8", "13.9", "13.10", "13.11", "14.2", "15.2", "15.3", "15.4", "15.5", "15.6", "17.3", "17.6", "18.2", "18.11"] },
    { "id": 9, "tasks": ["17.2", "17.4", "17.5", "17.7", "17.8", "18.3", "18.4", "18.5", "18.6", "18.12", "18.13", "18.14"] },
    { "id": 10, "tasks": ["18.7", "18.8", "18.9", "18.10", "18.15", "19.2", "19.3", "19.4", "19.5", "19.6", "19.7"] },
    { "id": 11, "tasks": ["20.1", "20.2", "20.3", "20.4", "20.5"] }
  ]
}
```
