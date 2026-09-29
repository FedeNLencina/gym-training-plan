# Requirements Document

## Introduction

Esta funcionalidad define una plataforma web de entrenamiento con formato similar a Nike Training, compuesta por dos capas: una **Landing Page comercial** que promociona al entrenador y su gimnasio (estructura inspirada en `app.olivia-rebel.com`, con la paleta visual de Atlas Gym), y una **Aplicación de Entrenamiento** donde el Administrador publica rutinas con videos de ejercicios y los Usuarios registrados las consumen.

El alcance de esta iteración es el **prototipo frontend** (React + Vite) con datos simulados, sin backend real, con navegación mediante `react-router-dom`, y siguiendo TDD con tests redactados en formato Dado/Cuando/Entonces en español. La autenticación y la persistencia se simulan íntegramente en el navegador, y existen únicamente dos roles: Administrador y Usuario.

El Administrador puede publicar el video de cada Entrenamiento de dos maneras: mediante un enlace a un video alojado en la web o subiendo un archivo de video propio que se conserva en el navegador.

### Alcance excluido de esta iteración

Las siguientes capacidades quedan explícitamente fuera de esta spec y se retomarán en iteraciones posteriores:

- Gestión de usuarios por parte del Administrador (listado, alta, baja y edición de cuentas).
- Asignación de rutinas a alumnos específicos.
- Edición de planes y precios desde el Panel_Admin.
- Pasarela de pago. El CTA "Elegir plan" conduce al registro, y en esta iteración no existe contenido bloqueado por pago: el desbloqueo de asesoría y de videos adicionales mediante pago es una iteración futura.
- Historial de sesiones de entrenamiento, récords personales y rachas de entrenamiento.

## Glossary

- **Plataforma**: La aplicación web completa, que integra la Landing_Page y la App_Entrenamiento.
- **Landing_Page**: Página pública de promoción comercial del entrenador y el gimnasio.
- **Navbar**: Barra de navegación superior persistente en todas las vistas públicas.
- **Seccion_Planes**: Sección de la Plataforma que describe los planes de entrenamiento y asesoría disponibles.
- **Catalogo_Entrenamientos**: Vista que lista los entrenamientos publicados con sus videos de ejercicios.
- **Reproductor_Entrenamiento**: Componente que presenta un entrenamiento seleccionado: video, ejercicios, series y repeticiones.
- **Panel_Admin**: Vista de gestión donde el Administrador crea, edita y publica entrenamientos.
- **Servicio_Autenticacion**: Componente que gestiona registro, inicio de sesión, cierre de sesión y el rol de la sesión activa.
- **Administrador**: Rol único, dueño de la Plataforma, con permiso para publicar y editar entrenamientos.
- **Usuario**: Persona registrada con rol de alumno, que consume entrenamientos.
- **Visitante**: Persona sin sesión iniciada.
- **Repositorio_Datos**: Capa de acceso a datos de la Plataforma, implementada en esta iteración sobre datos simulados y persistencia local del navegador.
- **Entrenamiento**: Unidad de contenido publicable compuesta por título, descripción, nivel de dificultad, duración estimada, categoría, Fuente_Video, referencia al video correspondiente a esa Fuente_Video y lista de ejercicios.
- **Ejercicio**: Ítem de un Entrenamiento con nombre, series, repeticiones y descanso en segundos.
- **Fuente_Video**: Atributo de un Entrenamiento que indica el origen de su video, con exactamente uno de los valores "enlace" o "archivo".
- **Enlace_Video**: Dirección web de un video alojado en la web (YouTube, Vimeo o enlace directo a un archivo de video), asociada a un Entrenamiento cuya Fuente_Video es "enlace".
- **Archivo_Video**: Archivo de video subido por el Administrador, con formato `mp4` o `webm` y tamaño máximo de 50 MB, conservado por el Repositorio_Datos y asociado a un Entrenamiento cuya Fuente_Video es "archivo".
- **Enrutador**: Componente de navegación de la Plataforma, implementado con `react-router-dom`, que asocia cada ruta con una vista y ejecuta los cambios de vista sin recargar el documento.
- **Ruta_Protegida**: Ruta que requiere una sesión activa, y en el caso de `/admin` una sesión activa con rol Administrador.
- **Tema_Atlas**: Conjunto de tokens de diseño definido en `.agents/rules/theme.md` (negro `#000000`, blanco `#FFFFFF`, rojo carmesí `#EF1818`).

## Rutas

El Enrutador expone exactamente las siguientes rutas:

| Ruta | Vista | Acceso |
|------|-------|--------|
| `/` | Landing_Page | Público |
| `/#planes` | Seccion_Planes dentro de la Landing_Page | Público |
| `/entrenamientos` | Catalogo_Entrenamientos | Público, con presentación reducida sin sesión activa |
| `/entrenamientos/:id` | Reproductor_Entrenamiento | Ruta_Protegida: requiere sesión activa |
| `/registro` | Formulario de registro | Público |
| `/ingresar` | Formulario de inicio de sesión | Público |
| `/admin` | Panel_Admin | Ruta_Protegida: requiere sesión activa con rol Administrador |

## Requirements

### Requirement 1: Estructura de la Landing Page

**User Story:** Como Visitante, quiero ver una landing page con la propuesta del entrenador y su gimnasio, para entender la oferta y decidir registrarme.

#### Acceptance Criteria

1. THE Landing_Page SHALL presentar exactamente ocho secciones, en este orden de arriba hacia abajo: Hero, Beneficios del método, Catálogo destacado de entrenamientos, Cómo funciona la Plataforma, Testimonios, Planes, Preguntas frecuentes y Pie de página, cada una identificada por un encabezado accesible con texto único dentro de la página.
2. THE Landing_Page SHALL presentar en la sección Hero un titular de 1 a 80 caracteres, un subtitular de 40 a 200 caracteres y un CTA primario rotulado "Comenzar ahora" cuyo destino declarado es la ruta `/registro`.
3. THE Landing_Page SHALL presentar en la sección Hero un CTA secundario rotulado "Ver entrenamientos" cuyo destino declarado es la ruta `/entrenamientos`.
4. THE Landing_Page SHALL presentar cada una de las ocho secciones con al menos un bloque de texto redactado en español, sin ningún elemento de imagen que referencie un archivo, y con los espacios reservados construidos únicamente con los tokens de color del Tema_Atlas.
5. THE Landing_Page SHALL presentar en la sección Pie de página un correo electrónico de contacto, un número de teléfono de contacto, una dirección del gimnasio y al menos tres enlaces a redes sociales, todos como texto marcador de posición en español.
6. WHEN el Visitante activa cualquier CTA de la Landing_Page, THE Enrutador SHALL presentar la vista asociada a la ruta declarada como destino de ese CTA en 1 segundo o menos, sin recargar el documento y conservando el estado de la sesión activa.
7. WHEN el Repositorio_Datos devuelve la lista de Entrenamientos publicados, THE Landing_Page SHALL presentar en el Catálogo destacado un máximo de 3 Entrenamientos, cada uno con título, categoría, nivel de dificultad y duración estimada en minutos.
8. IF el Repositorio_Datos devuelve una lista de Entrenamientos publicados vacía o falla al obtenerla, THEN THE Landing_Page SHALL presentar en el Catálogo destacado el mensaje "No hay entrenamientos destacados por el momento" y mantener visibles las siete secciones restantes.
9. THE Landing_Page SHALL presentar al menos 3 beneficios en la sección Beneficios del método, al menos 3 testimonios con nombre y texto en la sección Testimonios, y al menos 4 pares de pregunta y respuesta en la sección Preguntas frecuentes.

### Requirement 2: Navegación mediante la Navbar

**User Story:** Como Visitante, quiero una barra de navegación clara, para moverme entre la página principal, los entrenamientos y los planes.

#### Acceptance Criteria

1. THE Navbar SHALL presentar, en este orden, los elementos de navegación "Inicio" con destino `/`, "Entrenamientos" con destino `/entrenamientos` y "Planes" con destino `/#planes`, y SHALL permanecer visible en la parte superior de toda vista pública de la Plataforma.
2. WHEN el Visitante activa "Inicio" y la ruta actual es distinta de `/`, THE Enrutador SHALL navegar a la ruta `/` sin recargar el documento y THE Plataforma SHALL posicionar la ventana en la posición vertical 0.
3. WHEN el Visitante activa "Inicio" y la ruta actual es `/`, THE Plataforma SHALL desplazar la ventana a la posición vertical 0 conservando la ruta actual.
4. WHEN el Visitante activa "Entrenamientos", THE Enrutador SHALL navegar a la ruta `/entrenamientos` sin recargar el documento.
5. WHEN el Visitante activa "Planes" y la ruta actual es distinta de `/`, THE Enrutador SHALL navegar a la ruta `/#planes` sin recargar el documento y THE Plataforma SHALL desplazar la ventana hasta que el inicio de la Seccion_Planes quede visible.
6. WHILE una ruta está activa, THE Navbar SHALL marcar con el atributo `aria-current="page"` exactamente un elemento de navegación, el correspondiente a esa ruta, y SHALL omitir ese atributo en los elementos restantes.
7. WHERE el ancho de la ventana es menor a 768 píxeles, THE Navbar SHALL presentar un botón de menú con nombre accesible "Menú", con estado inicial cerrado y con el atributo `aria-expanded` en `false` mientras el menú está cerrado y en `true` mientras está desplegado.
8. WHEN el Visitante activa un elemento del menú desplegado, THE Navbar SHALL cerrar el menú y ejecutar la navegación asociada a ese elemento.
9. WHEN el Visitante activa "Planes" y la ruta actual es `/`, THE Plataforma SHALL desplazar la ventana hasta que el inicio de la Seccion_Planes quede visible conservando la ruta actual.
10. WHEN el ancho de la ventana pasa de un valor menor a 768 píxeles a un valor mayor o igual a 768 píxeles mientras el menú está desplegado, THE Navbar SHALL cerrar el menú y presentar los elementos de navegación de forma permanente.
11. IF el Visitante activa un elemento de navegación mediante las teclas Enter o Espacio con el foco del teclado sobre ese elemento, THEN THE Navbar SHALL ejecutar la misma navegación que ante una activación con puntero.
12. WHEN el Enrutador recibe una de las rutas `/`, `/entrenamientos`, `/entrenamientos/:id`, `/registro`, `/ingresar` o `/admin` como dirección de entrada al cargar la Plataforma, THE Enrutador SHALL presentar la vista asociada a esa ruta.
13. IF el Enrutador recibe la ruta `/entrenamientos/:id` sin sesión activa, THEN THE Enrutador SHALL navegar a la ruta `/ingresar` y THE Plataforma SHALL presentar el mensaje "Iniciá sesión para continuar".
14. IF el Enrutador recibe la ruta `/entrenamientos/:id` con un identificador que no corresponde a ningún Entrenamiento publicado, THEN THE Enrutador SHALL navegar a la ruta `/entrenamientos` y THE Plataforma SHALL presentar el mensaje "El entrenamiento solicitado no existe".
15. IF el Enrutador recibe una ruta que no coincide con ninguna de las rutas declaradas en la sección Rutas, THEN THE Plataforma SHALL presentar el mensaje "Página no encontrada", conservar la Navbar visible y presentar una acción "Volver al inicio" que navega a la ruta `/`.

### Requirement 3: Sección de Planes de Entrenamiento

**User Story:** Como Visitante, quiero comparar los planes de entrenamiento y asesoría, para elegir el que se ajusta a mi objetivo.

#### Acceptance Criteria

1. THE Seccion_Planes SHALL presentar entre 3 y 6 planes, cada uno con nombre de 3 a 40 caracteres, objetivo de resultado de 10 a 120 caracteres, precio numérico entre 1 y 999.999 con dos decimales, periodicidad con uno de los valores "mensual", "trimestral" o "anual", y una lista de 3 a 8 prestaciones incluidas de 5 a 80 caracteres cada una.
2. THE Seccion_Planes SHALL indicar para cada plan, con un valor visible de "incluido" o "no incluido", si incluye asesoría en línea de ejercicios y si incluye plan de alimentación.
3. WHEN el Visitante activa el CTA rotulado "Elegir plan" de un plan, THE Enrutador SHALL navegar a la ruta `/registro` incorporando el identificador de ese plan como parámetro de consulta `plan`, sin recargar el documento y sin solicitar ningún pago.
4. THE Seccion_Planes SHALL destacar con el color de acento del Tema_Atlas y con una etiqueta textual "Recomendado" exactamente un plan de la lista.
5. IF el Repositorio_Datos devuelve una lista de planes sin ningún plan marcado como recomendado o con más de un plan marcado como recomendado, THEN THE Seccion_Planes SHALL presentar todos los planes sin etiqueta "Recomendado" ni destaque visual.
6. WHEN el Repositorio_Datos devuelve una lista de planes vacía, THE Seccion_Planes SHALL presentar el mensaje "No hay planes disponibles por el momento" y ningún CTA "Elegir plan".
7. WHILE el Repositorio_Datos resuelve la lista de planes, THE Seccion_Planes SHALL presentar un indicador de carga y ningún CTA "Elegir plan".
8. IF el Repositorio_Datos falla al obtener la lista de planes, THEN THE Seccion_Planes SHALL presentar el mensaje "No pudimos cargar los planes" y una acción "Reintentar" que solicita de nuevo la lista al Repositorio_Datos.

### Requirement 4: Registro e inicio de sesión

**User Story:** Como Visitante, quiero registrarme e iniciar sesión, para acceder a los entrenamientos publicados.

#### Acceptance Criteria

1. THE formulario de registro SHALL requerir los campos nombre, correo electrónico y contraseña, donde el nombre tiene entre 2 y 60 caracteres, el correo electrónico tiene entre 6 y 254 caracteres con el formato `texto@dominio.extension`, y la contraseña tiene entre 8 y 64 caracteres.
2. WHEN el Visitante envía el formulario de registro con los tres campos obligatorios dentro de los límites definidos y con un correo electrónico no registrado, THE Servicio_Autenticacion SHALL crear una cuenta con rol Usuario, iniciar la sesión y navegar a la ruta `/entrenamientos`.
3. IF el Visitante envía el formulario de registro con un correo electrónico ya registrado, THEN THE Servicio_Autenticacion SHALL mantener la sesión sin iniciar, no crear la cuenta, conservar los valores ingresados en el formulario y presentar el mensaje "El correo ya está registrado".
4. IF el Visitante envía el formulario de registro con un campo obligatorio vacío, fuera de los límites de longitud definidos o con formato de correo electrónico inválido, THEN THE Servicio_Autenticacion SHALL presentar un mensaje de validación junto a cada campo afectado, conservar los valores ingresados en los campos restantes y mantener la cuenta sin crear.
5. WHERE la ruta `/registro` incluye el parámetro de consulta `plan`, WHEN el Servicio_Autenticacion crea la cuenta, THE Servicio_Autenticacion SHALL asociar a esa cuenta el identificador del plan indicado en ese parámetro.
6. WHEN el Visitante envía el formulario de inicio de sesión con un correo electrónico y una contraseña que coinciden exactamente con una cuenta existente, THE Servicio_Autenticacion SHALL iniciar la sesión con el rol registrado en esa cuenta y navegar a la ruta `/entrenamientos`.
7. IF el Visitante envía credenciales que no coinciden con ninguna cuenta existente, THEN THE Servicio_Autenticacion SHALL mantener la sesión sin iniciar, conservar el correo electrónico ingresado, vaciar el campo de contraseña y presentar el mensaje "Credenciales incorrectas".
8. WHILE existe una sesión activa, THE Navbar SHALL presentar el nombre de la cuenta de esa sesión y la acción "Cerrar sesión".
9. WHILE no existe una sesión activa, THE Navbar SHALL presentar las acciones "Iniciar sesión" con destino `/ingresar` y "Registrarme" con destino `/registro`, en lugar del nombre de la cuenta y de la acción "Cerrar sesión".
10. WHEN el Usuario activa "Cerrar sesión", THE Servicio_Autenticacion SHALL finalizar la sesión, eliminar la sesión persistida en el navegador y navegar a la ruta `/`.
11. WHEN la Plataforma se carga y existe una sesión persistida en el navegador con correo electrónico y rol correspondientes a una cuenta existente, THE Servicio_Autenticacion SHALL restaurar esa sesión con su rol.
12. IF la Plataforma se carga y la sesión persistida en el navegador no es deserializable o no corresponde a una cuenta existente, THEN THE Servicio_Autenticacion SHALL descartar esa sesión persistida y presentar la Plataforma sin sesión activa.

### Requirement 5: Catálogo de entrenamientos

**User Story:** Como Usuario, quiero explorar los entrenamientos publicados, para elegir cuál realizar.

#### Acceptance Criteria

1. THE Catalogo_Entrenamientos SHALL presentar únicamente los Entrenamientos en estado publicado, cada uno con título de 1 a 80 caracteres, categoría, nivel de dificultad con valor "Principiante", "Intermedio" o "Avanzado", y duración estimada expresada como número entero de minutos entre 5 y 120.
2. WHEN el Usuario selecciona un valor del filtro de categoría, THE Catalogo_Entrenamientos SHALL presentar únicamente los Entrenamientos publicados cuya categoría coincide exactamente con ese valor, y presentar la cantidad de resultados obtenidos.
3. WHEN el Usuario selecciona un valor del filtro de nivel de dificultad entre "Principiante", "Intermedio" y "Avanzado", THE Catalogo_Entrenamientos SHALL presentar únicamente los Entrenamientos publicados cuyo nivel coincide exactamente con ese valor, y presentar la cantidad de resultados obtenidos.
4. WHEN el Usuario aplica al menos un filtro y ningún Entrenamiento publicado satisface el conjunto de filtros aplicado, THE Catalogo_Entrenamientos SHALL presentar el mensaje "No encontramos entrenamientos con esos filtros" y una acción "Quitar filtros" que restablece todos los filtros a "Todos".
5. WHILE el Repositorio_Datos no ha resuelto la lista de Entrenamientos, THE Catalogo_Entrenamientos SHALL presentar un indicador de carga y mantener deshabilitados los controles de filtro.
6. IF el Repositorio_Datos falla al obtener los Entrenamientos, THEN THE Catalogo_Entrenamientos SHALL presentar el mensaje "No pudimos cargar los entrenamientos", presentar una acción "Reintentar" y conservar los filtros seleccionados.
7. WHEN el Usuario activa "Reintentar", THE Catalogo_Entrenamientos SHALL solicitar nuevamente la lista de Entrenamientos al Repositorio_Datos.
8. WHEN el Visitante accede a la ruta `/entrenamientos` sin sesión activa, THE Catalogo_Entrenamientos SHALL presentar cada Entrenamiento publicado con su descripción visible y un CTA "Registrate para entrenar" con destino `/registro`, y SHALL omitir todo enlace a la ruta `/entrenamientos/:id`.
9. WHEN el Usuario aplica simultáneamente el filtro de categoría y el filtro de nivel de dificultad, THE Catalogo_Entrenamientos SHALL presentar únicamente los Entrenamientos que satisfacen ambos filtros a la vez.
10. IF el Repositorio_Datos no resuelve la lista de Entrenamientos dentro de 5 segundos desde la solicitud, THEN THE Catalogo_Entrenamientos SHALL cancelar la espera, retirar el indicador de carga y aplicar el mismo comportamiento de error definido para el fallo de obtención.
11. WHEN el Repositorio_Datos resuelve una lista de Entrenamientos publicados vacía y no hay ningún filtro aplicado, THE Catalogo_Entrenamientos SHALL presentar el mensaje "Todavía no hay entrenamientos publicados" y no presentar controles de filtro.

### Requirement 6: Reproducción de un entrenamiento

**User Story:** Como Usuario, quiero ver el video y el detalle de los ejercicios de un entrenamiento, para ejecutarlo correctamente.

#### Acceptance Criteria

1. WHILE la sesión activa tiene rol Usuario o Administrador, WHEN el Usuario selecciona un Entrenamiento del Catalogo_Entrenamientos, THE Enrutador SHALL navegar a la ruta `/entrenamientos/:id` con el identificador de ese Entrenamiento y THE Reproductor_Entrenamiento SHALL presentar el video del Entrenamiento, su título, y la lista completa de sus Ejercicios, indicando para cada Ejercicio el nombre, la cantidad de series, la cantidad de repeticiones y el descanso en segundos.
2. WHEN el Usuario activa el temporizador de descanso de un Ejercicio, THE Reproductor_Entrenamiento SHALL iniciar una cuenta regresiva desde el descanso definido para ese Ejercicio, expresado en segundos enteros entre 5 y 600, y SHALL presentar el valor restante actualizado una vez por segundo.
3. WHEN la cuenta regresiva del temporizador de descanso alcanza 0 segundos, THE Reproductor_Entrenamiento SHALL detener la cuenta regresiva, mantener el valor presentado en 0 y presentar el aviso "Descanso finalizado".
4. WHEN el Usuario marca un Ejercicio como completado, THE Reproductor_Entrenamiento SHALL registrar ese Ejercicio como completado y presentar el porcentaje de avance calculado como la cantidad de Ejercicios completados dividida por la cantidad total de Ejercicios del Entrenamiento, expresado como número entero entre 0 y 100 redondeado al entero más próximo.
5. WHEN el Usuario marca como completados todos los Ejercicios del Entrenamiento, THE Reproductor_Entrenamiento SHALL presentar el resumen de la sesión con la cantidad de Ejercicios completados, la cantidad total de Ejercicios del Entrenamiento y el porcentaje de avance en 100.
6. IF el Entrenamiento seleccionado carece de video reproducible, entendiendo por tal que su Fuente_Video es "enlace" con Enlace_Video vacío, o que su Fuente_Video es "archivo" y el Repositorio_Datos no devuelve el Archivo_Video asociado, THEN THE Reproductor_Entrenamiento SHALL presentar el mensaje "Video no disponible", mantener visible la lista completa de Ejercicios y mantener habilitadas las acciones de temporizador y de marcado de Ejercicios.
7. WHEN el Usuario desmarca un Ejercicio previamente marcado como completado, THE Reproductor_Entrenamiento SHALL registrar ese Ejercicio como no completado, recalcular el porcentaje de avance y dejar de presentar el resumen de la sesión.
8. IF el Visitante solicita la ruta `/entrenamientos/:id` sin sesión activa, THEN THE Enrutador SHALL navegar a la ruta `/ingresar` y THE Plataforma SHALL presentar el mensaje "Iniciá sesión para continuar" sin registrar avance alguno.
9. IF el Entrenamiento seleccionado no contiene ningún Ejercicio, THEN THE Reproductor_Entrenamiento SHALL presentar el mensaje "Este entrenamiento no tiene ejercicios cargados", presentar el porcentaje de avance en 0 y mantener deshabilitadas las acciones de temporizador y de marcado de Ejercicios.
10. WHERE la Fuente_Video del Entrenamiento es "enlace", THE Reproductor_Entrenamiento SHALL presentar el video mediante un reproductor embebido que apunta al Enlace_Video de ese Entrenamiento.
11. WHERE la Fuente_Video del Entrenamiento es "archivo", THE Reproductor_Entrenamiento SHALL solicitar el Archivo_Video al Repositorio_Datos y presentar el video mediante un reproductor nativo con controles de reproducción, pausa y posición.
12. WHILE el Reproductor_Entrenamiento espera la respuesta del Repositorio_Datos con el Archivo_Video, THE Reproductor_Entrenamiento SHALL presentar un indicador de carga en el área del video y mantener visible la lista completa de Ejercicios.

### Requirement 7: Gestión de entrenamientos por el Administrador

**User Story:** Como Administrador, quiero publicar y editar entrenamientos con sus videos, para que todos los Usuarios de la plataforma accedan a ellos.

#### Acceptance Criteria

1. WHILE la sesión activa tiene rol Administrador, THE Navbar SHALL presentar el acceso al Panel_Admin con nombre accesible "Panel de administración" y destino `/admin`.
2. IF una sesión con rol Usuario solicita la ruta `/admin`, THEN THE Enrutador SHALL navegar a la ruta `/entrenamientos`, THE Plataforma SHALL presentar el mensaje "No tenés permisos para esta sección" y THE Servicio_Autenticacion SHALL mantener la sesión activa sin cambios.
3. WHEN el Administrador envía el formulario de creación con título de 3 a 80 caracteres, categoría, nivel de dificultad entre "Principiante", "Intermedio" y "Avanzado", duración estimada entera de 5 a 120 minutos, una Fuente_Video válida según los criterios 11 a 14 de este requisito, y entre 1 y 30 Ejercicios, cada uno con nombre de 3 a 60 caracteres, series de 1 a 20, repeticiones de 1 a 100 y descanso de 0 a 300 segundos, THE Panel_Admin SHALL crear el Entrenamiento en estado publicado con un identificador único y presentar el mensaje "Entrenamiento publicado".
4. IF el Administrador envía el formulario de creación con un campo obligatorio vacío, con un valor fuera de los rangos definidos o sin ningún Ejercicio, THEN THE Panel_Admin SHALL presentar un mensaje de validación junto a cada campo afectado, mantener el Entrenamiento sin crear y conservar los valores ya ingresados en el formulario.
5. WHEN el Administrador guarda cambios sobre un Entrenamiento existente con todos los campos dentro de los rangos definidos, THE Panel_Admin SHALL actualizar ese Entrenamiento conservando su identificador y presentar el mensaje "Cambios guardados".
6. WHEN el Administrador confirma la eliminación de un Entrenamiento en el diálogo de confirmación, THE Panel_Admin SHALL quitar ese Entrenamiento del Catalogo_Entrenamientos y presentar el mensaje "Entrenamiento eliminado".
7. WHEN el Administrador publica un Entrenamiento, THE Catalogo_Entrenamientos SHALL presentar ese Entrenamiento a todas las sesiones con rol Usuario en la carga siguiente de esa vista.
8. IF un Visitante sin sesión activa solicita la ruta `/admin`, THEN THE Enrutador SHALL navegar a la ruta `/ingresar` y THE Plataforma SHALL presentar el mensaje "Iniciá sesión para continuar".
9. IF el Administrador cancela el diálogo de confirmación de eliminación, THEN THE Panel_Admin SHALL conservar el Entrenamiento sin cambios y mantenerlo visible en el Catalogo_Entrenamientos.
10. IF el Administrador envía el formulario de creación o de edición con Fuente_Video "enlace" y un Enlace_Video cuyo formato no es una dirección web válida, THEN THE Panel_Admin SHALL presentar el mensaje de validación "Ingresá un enlace de video válido" junto al campo de enlace y mantener el Entrenamiento sin crear ni actualizar.
11. THE Panel_Admin SHALL presentar en el formulario de creación y de edición un control de selección de Fuente_Video con exactamente las dos opciones rotuladas "Enlace de video" y "Subir video", con la opción "Enlace de video" seleccionada de manera inicial.
12. WHEN el Administrador selecciona la opción "Enlace de video", THE Panel_Admin SHALL presentar el campo de Enlace_Video como campo obligatorio y SHALL ocultar el control de subida de Archivo_Video.
13. WHEN el Administrador selecciona la opción "Subir video", THE Panel_Admin SHALL presentar un control de subida de Archivo_Video como campo obligatorio, indicar los formatos aceptados `mp4` y `webm` y el tamaño máximo de 50 MB, y SHALL ocultar el campo de Enlace_Video.
14. WHEN el Administrador selecciona un Archivo_Video con tipo `video/mp4` o `video/webm` y tamaño menor o igual a 52.428.800 bytes, THE Panel_Admin SHALL aceptar el archivo, presentar su nombre y su tamaño en megabytes con un decimal, y habilitar el envío del formulario.
15. IF el Administrador selecciona un archivo cuyo tipo es distinto de `video/mp4` y de `video/webm`, THEN THE Panel_Admin SHALL presentar el mensaje de validación "Formato de video no aceptado: subí un archivo mp4 o webm" junto al control de subida, descartar el archivo seleccionado y mantener el Entrenamiento sin crear ni actualizar.
16. IF el Administrador selecciona un archivo cuyo tamaño excede 52.428.800 bytes, THEN THE Panel_Admin SHALL presentar el mensaje de validación "El video supera el tamaño máximo de 50 MB" junto al control de subida, descartar el archivo seleccionado y mantener el Entrenamiento sin crear ni actualizar.
17. IF el Administrador envía el formulario con Fuente_Video "archivo" sin ningún Archivo_Video seleccionado, THEN THE Panel_Admin SHALL presentar el mensaje de validación "Seleccioná un archivo de video" junto al control de subida, mantener el Entrenamiento sin crear ni actualizar y conservar los valores ya ingresados en el formulario.
18. WHEN el Administrador envía el formulario con Fuente_Video "archivo" y un Archivo_Video aceptado, THE Panel_Admin SHALL solicitar al Repositorio_Datos la conservación de ese Archivo_Video asociado al identificador del Entrenamiento y registrar la Fuente_Video del Entrenamiento con el valor "archivo".
19. IF el Repositorio_Datos devuelve un error de espacio insuficiente al conservar el Archivo_Video, THEN THE Panel_Admin SHALL presentar el mensaje "No pudimos guardar el video: el almacenamiento del navegador está lleno", mantener el Entrenamiento sin crear ni actualizar y conservar los valores ya ingresados en el formulario.
20. WHEN el Administrador cambia la Fuente_Video de un Entrenamiento existente de "archivo" a "enlace" y guarda los cambios, THE Panel_Admin SHALL registrar la Fuente_Video con el valor "enlace" y solicitar al Repositorio_Datos la eliminación del Archivo_Video asociado a ese Entrenamiento.

### Requirement 8: Persistencia e integridad de los datos

**User Story:** Como Administrador, quiero que los entrenamientos que publico se conserven entre visitas, para no volver a cargarlos en cada sesión.

#### Acceptance Criteria

1. WHEN el Repositorio_Datos recibe una solicitud de escritura de un Entrenamiento válido, THE Repositorio_Datos SHALL conservar ese Entrenamiento en el almacenamiento local del navegador y devolver el Entrenamiento conservado con su identificador en 1 segundo o menos.
2. WHEN la Plataforma se carga y el almacenamiento local contiene datos de la Plataforma deserializables, THE Repositorio_Datos SHALL devolver la totalidad de los Entrenamientos almacenados, hasta un máximo de 200 Entrenamientos, en 1 segundo o menos.
3. WHEN la Plataforma se carga y el almacenamiento local no contiene datos de la Plataforma, THE Repositorio_Datos SHALL devolver el conjunto de datos simulados inicial, compuesto por entre 6 y 12 Entrenamientos, y conservarlo en el almacenamiento local.
4. WHEN el Repositorio_Datos serializa y luego deserializa un Entrenamiento válido, THE Repositorio_Datos SHALL devolver un Entrenamiento con idéntico identificador, título, descripción, nivel de dificultad, duración estimada, categoría, Fuente_Video, referencia de video y lista de Ejercicios en el mismo orden, con nombre, series, repeticiones y descanso idénticos en cada Ejercicio (propiedad de ida y vuelta).
5. IF el contenido del almacenamiento local no es deserializable o no cumple la estructura de Entrenamiento, THEN THE Repositorio_Datos SHALL descartar ese contenido, devolver el conjunto de datos simulados inicial y no interrumpir la carga de la Plataforma.
6. WHEN el Repositorio_Datos aplica dos veces la misma escritura de un Entrenamiento con el mismo identificador, THE Repositorio_Datos SHALL producir el mismo estado almacenado que al aplicarla una vez, sin incrementar la cantidad de Entrenamientos almacenados (idempotencia).
7. IF el Repositorio_Datos recibe una solicitud de escritura de un Entrenamiento que carece de título, categoría, nivel de dificultad, duración estimada o al menos un Ejercicio, o cuyo título excede 120 caracteres, cuya descripción excede 1000 caracteres, cuya duración estimada está fuera del rango de 1 a 240 minutos, o que contiene más de 50 Ejercicios, THEN THE Repositorio_Datos SHALL rechazar la escritura, devolver un error que indique el campo inválido y conservar sin cambios el estado almacenado previo.
8. IF el almacenamiento local no está disponible o rechaza la escritura por falta de espacio, THEN THE Repositorio_Datos SHALL devolver un error que indique la imposibilidad de conservar los datos, conservar los datos en memoria durante la sesión activa y mantener sin cambios el contenido previo del almacenamiento local.
9. WHEN el Repositorio_Datos elimina un Entrenamiento existente, THE Repositorio_Datos SHALL quitar ese Entrenamiento del almacenamiento local, eliminar el Archivo_Video asociado a ese Entrenamiento cuando su Fuente_Video es "archivo", y conservar sin cambios los Entrenamientos restantes.
10. WHEN el Repositorio_Datos recibe un Archivo_Video con tipo `video/mp4` o `video/webm` y tamaño menor o igual a 52.428.800 bytes junto al identificador de un Entrenamiento, THE Repositorio_Datos SHALL conservar ese Archivo_Video en el almacenamiento del navegador asociado a ese identificador y devolver la confirmación en 5 segundos o menos.
11. WHEN el Repositorio_Datos recibe una solicitud de lectura del Archivo_Video de un identificador de Entrenamiento conservado previamente, THE Repositorio_Datos SHALL devolver un Archivo_Video con idéntico tipo, tamaño en bytes y contenido binario que el conservado (propiedad de ida y vuelta).
12. IF el almacenamiento del navegador rechaza la escritura de un Archivo_Video por falta de espacio, THEN THE Repositorio_Datos SHALL devolver un error que indique espacio insuficiente, descartar el Archivo_Video parcialmente escrito y conservar sin cambios el conjunto de Entrenamientos y de Archivos_Video previos.
13. IF el Repositorio_Datos recibe una solicitud de lectura del Archivo_Video de un identificador de Entrenamiento sin Archivo_Video conservado, THEN THE Repositorio_Datos SHALL devolver un error que indique la ausencia del video y conservar sin cambios el estado almacenado.
14. IF el Repositorio_Datos recibe una solicitud de escritura de un Entrenamiento cuya Fuente_Video tiene un valor distinto de "enlace" y de "archivo", THEN THE Repositorio_Datos SHALL rechazar la escritura, devolver un error que indique la Fuente_Video inválida y conservar sin cambios el estado almacenado previo.

### Requirement 9: Identidad visual y accesibilidad

**User Story:** Como Visitante, quiero una interfaz coherente con la marca y usable en cualquier dispositivo, para navegar con comodidad.

#### Acceptance Criteria

1. THE Plataforma SHALL aplicar exclusivamente los tokens del Tema_Atlas definidos en `.agents/rules/theme.md` para fondos, textos, bordes, sombras y acentos, sin declarar en los componentes valores de color literales distintos de esos tokens.
2. THE Plataforma SHALL presentar todo texto con tamaño menor a 18 píxeles, o menor a 14 píxeles en negrita, con una relación de contraste de al menos 4.5:1 respecto de su fondo.
3. THE Plataforma SHALL presentar todo texto con tamaño igual o mayor a 18 píxeles, o igual o mayor a 14 píxeles en negrita, y todo borde o icono que comunique estado, con una relación de contraste de al menos 3:1 respecto de su fondo.
4. WHERE el ancho de la ventana está entre 320 y 767 píxeles, THE Plataforma SHALL presentar las secciones en una sola columna y mantener el ancho del contenido dentro del ancho de la ventana, sin desplazamiento horizontal.
5. WHERE el ancho de la ventana es igual o mayor a 768 píxeles, THE Plataforma SHALL mantener el contenido dentro del ancho de la ventana, sin desplazamiento horizontal.
6. THE Plataforma SHALL exponer todo control interactivo con un nombre accesible no vacío y con un rol correspondiente a su función.
7. WHEN el Visitante presiona la tecla Enter o la barra espaciadora sobre un control interactivo enfocado, THE Plataforma SHALL ejecutar la misma acción que produce la activación con el puntero.
8. THE Plataforma SHALL incluir todo control interactivo en la secuencia de tabulación, en el mismo orden en que aparece en la vista, sin valores de orden de tabulación mayores a 0.
9. WHILE el foco del teclado está sobre un control interactivo, THE Plataforma SHALL presentar un indicador de foco visible con una relación de contraste de al menos 3:1 respecto del fondo adyacente.
10. WHERE el ancho de la ventana está entre 320 y 767 píxeles, THE Plataforma SHALL presentar cada control interactivo con un área activa de al menos 44 por 44 píxeles.
11. IF una imagen o bloque decorativo no aporta información, THEN THE Plataforma SHALL exponerlo como elemento ignorado por las tecnologías de asistencia.

### Requirement 10: Desarrollo guiado por pruebas

**User Story:** Como desarrollador, quiero que cada caso de uso quede descrito por pruebas legibles en español, para validar el comportamiento antes de implementarlo.

#### Acceptance Criteria

1. THE Plataforma SHALL contener, para cada criterio de aceptación de los Requirements 1 a 9, al menos una prueba automatizada que verifique el disparador y la respuesta declarados en ese criterio.
2. WHEN se incorpora un comportamiento nuevo, THE Plataforma SHALL registrar primero la prueba correspondiente en estado fallido y luego el código de producción que la hace pasar, quedando ambos pasos como commits separados y en ese orden.
3. THE Plataforma SHALL nombrar cada prueba con un texto en español que contenga los tres segmentos "Dado ", "Cuando " y "Entonces " en ese orden, con un máximo de 200 caracteres.
4. THE Plataforma SHALL contener exactamente una ocurrencia del segmento "Cuando " por nombre de prueba.
5. THE Plataforma SHALL consultar los elementos de interfaz en las pruebas únicamente por rol, texto o etiqueta accesible, sin consultas por selector CSS, clase, identificador de elemento ni estructura interna de componentes.
6. WHEN se ejecuta el comando `npm test`, THE Plataforma SHALL ejecutar la totalidad de la suite de pruebas en una única corrida no interactiva, finalizar en 300 segundos o menos y devolver un código de salida distinto de 0 si al menos una prueba falla.
7. THE Plataforma SHALL incluir, para cada criterio de aceptación que declara un camino de error mediante el patrón IF-THEN en los Requirements 1 a 9, una prueba que verifique el mensaje o la indicación de error declarada y la conservación del estado previo.
8. IF una prueba depende de un servicio externo o del Repositorio_Datos, THEN THE Plataforma SHALL sustituir esa dependencia por un doble de prueba controlado, de modo que dos ejecuciones consecutivas de la suite sin cambios de código produzcan el mismo resultado.
