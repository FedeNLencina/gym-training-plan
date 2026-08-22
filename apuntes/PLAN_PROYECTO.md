# Plan de Arquitectura y Desarrollo: GymTrainingPlan

Documento de referencia para la plataforma propia de entrenamiento y gimnasio para el entrenador y sus alumnos.

---

## 1. Visión General del Producto

La solución consta de tres capas interconectadas:

1. **Landing Page Comercial**:
   * Promoción del entrenador y su gimnasio presencial.
   * Exposición de programas de entrenamiento con filtros y etiquetas de dificultad/duración.
   * Galería de transformaciones y testimonios con valoraciones.
   * Selector de planes de membresía (Online, Presencial, Híbrido).
   * Presentación de las características de la App (videos, registro de pesos, rachas, favoritos).
   * Información de contacto, ubicación del gimnasio y enlaces a redes.

2. **Web App / PWA para Alumnos (Boceto Interactivo)**:
   * **Modo Explorar**: Catálogo interactivo de programas y rutinas.
   * **Dashboard del Alumno**: Racha de entrenamientos, progreso semanal, accesos rápidos.
   * **Workout Player (Visor de Rutina)**:
     * Lista de ejercicios con series, repeticiones y cargas sugeridas.
     * Guía visual/video de ejecución.
     * Registro en vivo de pesos y repeticiones.
     * Temporizador de descanso interactivo con controles.
   * **Historial & Métricas**: Registro de sesiones completadas y marcas personales (PRs).

3. **Panel de Gestión (Admin CMS)**:
   * Vista de administración para crear/editar programas y ejercicios.

---

## 2. Enfoque Actual: Prototipo Frontend con Datos Mock

Para esta etapa inicial, se construye la **capa de Frontend completa** con:
* **Stack**: React + Vite + CSS Moderno (Vanilla Design System con tokens, tema oscuro de alta gama, tipografías modernas y microinteracciones fluidas).
* **Mock Data**: Conjunto completo de datos simulados realistas (programas, semanas, ejercicios, estadísticas de usuario, testimonios).
* **Navegación Fluida**: Posibilidad de alternar entre la **Landing Page comercial** y la **App de Entrenamiento / Workout Player** para probar la experiencia completa de usuario en dispositivos móviles y de escritorio.
