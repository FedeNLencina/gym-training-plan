# Plan de pruebas E2E: pedido de plan (Atlas Gym)

## Application Overview

Flujo de pedido de plan: el usuario solicita un plan desde /planes, paga por transferencia y el administrador lo da de alta o lo rechaza desde Administración > Usuarios (/admin?seccion=usuarios). Sólo el plan ACTIVO habilita entrenamientos; el solicitado no. Cada usuario tiene como máximo UNA solicitud pendiente: pedir otro plan reemplaza la anterior sin aviso.

Convenciones comunes:
- Contraseña de todas las cuentas: CONTRASENIA_PRUEBA (importar de src/datos/semilla.ts). Cuentas: admin@atlasgym.com, ana@atlasgym.com (Intermedio), bruno@atlasgym.com (Básico, pidió Avanzado), diego@atlasgym.com (sin plan).
- Planes: Básico $ 15.000, Intermedio $ 22.000, Avanzado $ 30.000 por mes.
- Cada plan es un article llamado «Plan Básico», «Plan Intermedio» o «Plan Avanzado». Botones y estados se repiten por tarjeta: SIEMPRE acotar con getByRole('article', { name: 'Plan X' }).
- Instrucciones de pago (texto de la semilla): «Transferí el importe del plan al alias ATLAS.GYM.PLANES y enviá el comprobante a pagos@atlasgym.com. Te damos de alta en el día.»
- Ingreso: textbox «Correo», textbox «Contraseña» (getByLabel con exact: true; choca con el botón «Mostrar contraseña») y button «Iniciar sesión» (el enlace del encabezado con el mismo nombre es role link).
- Cambio de usuario dentro de un test: cerrar sesión DESDE /planes (button «Cerrar sesión», lleva a /) y pulsar el enlace «Iniciar sesión». No cerrar sesión desde /admin ni /entrenamientos: el siguiente ingreso rebota a esa ruta (defecto reportado aparte).
- Tabla de Usuarios: las filas no tienen nombre propio; acotar con getByRole('row').filter({ has: getByRole('rowheader', { name: 'Diego Sosa' }) }) y dentro button «Dar de alta» o «Rechazar». Se abre con el tab «Usuarios» (tablist «Secciones de administración»).
- Entrenamientos: cada tarjeta es un article con el título del entrenamiento; si está habilitada tiene link «Ver entrenamiento», si no, el texto «Requiere el plan X.».

Fuera de alcance (ya cubierto o propio de Vitest): validación de los formularios de ingreso/registro, reglas nivelDeAcceso/puedeVer/ordenarPorPrecio, que solicitarPlan rechace un plan inexistente o el propio, orden de tarjetas por precio, asignación manual de plan con el combobox «Plan activo de ...», eliminación de cuentas, y registro de usuario nuevo (flujo aparte).

## Test Scenarios

### 1. Solicitud de plan

**Seed:** `e2e/seed.spec.ts`

#### 1.1. Visitante ve los planes y vuelve a Planes tras iniciar sesión

**File:** `e2e/solicitud-de-plan.spec.ts`

**Steps:**
  1. Estado inicial: sin sesión, semilla. Ir a /planes.
    - expect: URL /planes; heading nivel 1 «Planes»
    - expect: Texto «Para adquirir uno, primero iniciá sesión o registrate.»
    - expect: Tres articles (Plan Básico, Plan Intermedio, Plan Avanzado) con precios $ 15.000, $ 22.000 y $ 30.000 por mes
    - expect: Cada article tiene un link «Iniciá sesión para adquirirlo» y ningún button «Adquirir plan»
  2. Dentro del article «Plan Intermedio», pulsar el link «Iniciá sesión para adquirirlo».
    - expect: URL /ingresar; heading nivel 1 «Iniciar sesión»
  3. Completar «Correo» con diego@atlasgym.com y «Contraseña» con CONTRASENIA_PRUEBA; pulsar el button «Iniciar sesión».
    - expect: Vuelve a /planes (no a /entrenamientos)
    - expect: Heading «Planes»; el encabezado muestra «Diego Sosa» (title «Sesión iniciada») y el button «Cerrar sesión»
    - expect: Cada article muestra un button «Adquirir plan»; ya no aparece «Iniciá sesión para adquirirlo» ni el texto de iniciar sesión en la bajada

#### 1.2. Usuario sin plan solicita un plan y la solicitud persiste

**File:** `e2e/solicitud-de-plan.spec.ts`

**Steps:**
  1. Estado inicial: ingresar como diego@atlasgym.com y ir a /planes.
    - expect: Los tres articles muestran button «Adquirir plan
  2. Dentro del article «Plan Intermedio», pulsar «Adquirir plan».
    - expect: En ese article aparece «Solicitud pendiente», el texto de instrucciones de pago y el button «Cancelar solicitud
  3. Verificar los otros articles.
    - expect: «Plan Básico» y «Plan Avanzado» siguen con «Adquirir plan»; ningún article muestra «Tu plan actual»
  4. Recargar la página (page.reload()).
    - expect: Sigue la sesión de Diego; «Plan Intermedio» conserva «Solicitud pendiente» e instrucciones de pago
  5. Ir a Entrenamientos con el link «Entrenamientos» de la navegación «Principal».
    - expect: URL /entrenamientos; texto «Todavía no tenés un plan activo. Tu solicitud está pendiente: vas a poder entrenar cuando confirmemos el pago.»
    - expect: Ninguna tarjeta tiene link «Ver entrenamiento»; todas muestran «Requiere el plan Básico/Intermedio/Avanzado.» (p. ej. article «Movilidad de cadera y hombros» muestra «Requiere el plan Básico.»)

#### 1.3. Usuario cancela su solicitud pendiente

**File:** `e2e/solicitud-de-plan.spec.ts`

**Steps:**
  1. Estado inicial: diego en /planes con «Plan Avanzado» solicitado (pulsar «Adquirir plan» en ese article).
    - expect: «Plan Avanzado» muestra «Solicitud pendiente»
  2. Dentro del article «Plan Avanzado», pulsar «Cancelar solicitud».
    - expect: Desaparecen «Solicitud pendiente», las instrucciones de pago y «Cancelar solicitud»
    - expect: Los tres articles vuelven a mostrar «Adquirir plan»
  3. Recargar y abrir /entrenamientos.
    - expect: La cancelación persiste en /planes
    - expect: En /entrenamientos aparece «Todavía no tenés un plan activo. Elegí uno para empezar a entrenar.» (sin la frase de solicitud pendiente) y el link «Ver planes»

#### 1.4. Usuario con plan pide cambio y conserva su plan y su acceso mientras está pendiente

**File:** `e2e/solicitud-de-plan.spec.ts`

**Steps:**
  1. Estado inicial: ingresar como ana@atlasgym.com y ir a /planes.
    - expect: «Plan Intermedio» muestra «Tu plan actual»
    - expect: «Plan Básico» y «Plan Avanzado» muestran el button «Cambiar a este plan» (no «Adquirir plan»)
  2. Dentro del article «Plan Avanzado», pulsar «Cambiar a este plan».
    - expect: «Plan Avanzado» muestra «Solicitud pendiente», instrucciones de pago y «Cancelar solicitud»
    - expect: «Plan Intermedio» sigue mostrando «Tu plan actual»
    - expect: «Plan Básico» sigue con «Cambiar a este plan»
  3. Ir a /entrenamientos.
    - expect: No aparece el aviso «Todavía no tenés un plan activo»
    - expect: Article «Fuerza con mancuernas: tren superior» tiene link «Ver entrenamiento»
    - expect: Article «Peso muerto con barra» muestra «Requiere el plan Avanzado.» y no tiene link «Ver entrenamiento»

#### 1.5. Usuario con solicitud pendiente ve su estado y al pedir otro plan reemplaza la anterior

**File:** `e2e/solicitud-de-plan.spec.ts`

**Steps:**
  1. Estado inicial: ingresar como bruno@atlasgym.com (Básico, pidió Avanzado) y ir a /planes.
    - expect: «Plan Básico»: «Tu plan actual»
    - expect: «Plan Avanzado»: «Solicitud pendiente», instrucciones de pago y «Cancelar solicitud»
    - expect: «Plan Intermedio»: button «Cambiar a este plan»
  2. Dentro del article «Plan Intermedio», pulsar «Cambiar a este plan».
    - expect: «Plan Intermedio» pasa a «Solicitud pendiente» con «Cancelar solicitud»
    - expect: «Plan Avanzado» deja de estar pendiente y vuelve a mostrar «Cambiar a este plan» (la solicitud anterior se reemplazó sin confirmación ni aviso)
    - expect: «Plan Básico» sigue en «Tu plan actual»; hay una sola «Solicitud pendiente» en toda la página
  3. Recargar la página.
    - expect: El estado se conserva: sólo «Plan Intermedio» pendiente

### 2. Alta de plan

**Seed:** `e2e/seed.spec.ts`

#### 2.1. Ciclo completo: el usuario solicita, el administrador da de alta y el usuario accede a su nivel

**File:** `e2e/alta-de-plan.spec.ts`

**Steps:**
  1. Estado inicial: ingresar como diego, ir a /planes y en el article «Plan Intermedio» pulsar «Adquirir plan». Luego pulsar «Cerrar sesión» (desde /planes).
    - expect: URL /; aparece el link «Iniciar sesión» en el encabezado
  2. Ingresar como admin@atlasgym.com (Correo/Contraseña). Si el ingreso redirige a /entrenamientos, pulsar el link «Administración» de la navegación «Principal»; luego el tab «Usuarios».
    - expect: URL /admin?seccion=usuarios; heading «Administración»; tabpanel «Usuarios» con tabla de Nombre, Correo, Plan activo, Solicitud, Acciones
    - expect: La fila de «Diego Sosa» muestra «Pidió Intermedio» con buttons «Dar de alta» y «Rechazar», y el combobox «Plan activo de Diego Sosa» en «Sin plan»
  3. En la fila de Diego Sosa pulsar «Dar de alta».
    - expect: En esa fila el combobox «Plan activo de Diego Sosa» queda en «Intermedio» y la celda Solicitud muestra «Sin solicitud»; desaparecen «Dar de alta» y «Rechazar» de esa fila
  4. Ir a /planes con el link «Planes» y pulsar «Cerrar sesión»; ingresar como diego.
    - expect: Tras ingresar se llega a una página de la app con la sesión «Diego Sosa»
  5. Ir a /planes.
    - expect: «Plan Intermedio» muestra «Tu plan actual» (sin «Solicitud pendiente»)
    - expect: «Plan Básico» y «Plan Avanzado» muestran «Cambiar a este plan»
  6. Ir a /entrenamientos.
    - expect: No aparece «Todavía no tenés un plan activo»
    - expect: Article «Intervalos de alta intensidad» y article «Movilidad de cadera y hombros» tienen link «Ver entrenamiento»
    - expect: Article «Peso muerto con barra» muestra «Requiere el plan Avanzado.» sin link «Ver entrenamiento»

#### 2.2. El administrador rechaza una solicitud y el usuario conserva su plan actual

**File:** `e2e/alta-de-plan.spec.ts`

**Steps:**
  1. Estado inicial: semilla; ingresar como admin@atlasgym.com y abrir Administración > tab «Usuarios».
    - expect: La fila de «Bruno Giménez» muestra combobox «Plan activo de Bruno Giménez» en «Básico» y «Pidió Avanzado» con «Dar de alta» y «Rechazar»
  2. En la fila de Bruno Giménez pulsar «Rechazar».
    - expect: La celda Solicitud de esa fila muestra «Sin solicitud»
    - expect: El combobox sigue en «Básico»
  3. Ir a /planes, pulsar «Cerrar sesión» e ingresar como bruno@atlasgym.com; ir a /planes.
    - expect: «Plan Básico»: «Tu plan actual»
    - expect: «Plan Avanzado» ya no muestra «Solicitud pendiente» sino «Cambiar a este plan»
    - expect: Ningún article muestra «Cancelar solicitud»
  4. Ir a /entrenamientos.
    - expect: Article «Zona media: estabilidad» con link «Ver entrenamiento»; article «Peso muerto con barra» con «Requiere el plan Avanzado.»

## Descartados como E2E

Vistas de un solo estado, sin flujo entre páginas; si hace falta cubrirlas, van con Vitest.
- El administrador ve los planes sin acciones de compra (cada article muestra «Los planes se editan desde Administración.»).
- Un usuario sin plan no accede a /admin (redirige a / y la navegación no tiene link «Administración»).
