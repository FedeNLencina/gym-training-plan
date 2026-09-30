/**
 * Tests de FormularioEntrenamiento.
 *
 * El formulario del Panel_Admin es controlado y valida al enviar. En creación
 * válida crea el Entrenamiento en estado publicado con identificador único y
 * presenta "Entrenamiento publicado" (7.3); en creación inválida presenta un
 * mensaje por cada campo afectado, no crea nada y conserva lo ingresado (7.4);
 * en edición conserva el identificador y presenta "Cambios guardados" (7.5).
 *
 * El formulario se monta bajo un `ProveedorServicios` con el Repositorio_Datos
 * en memoria (doble de `tests/dobles/`), de modo que se ejercite el guardado
 * real sobre el repositorio sin dobles del contexto. Consultas sólo por rol,
 * etiqueta accesible o texto; una sola interacción de envío por test.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import {
  crearEjercicio,
  crearEntrenamiento,
  type Entrenamiento,
} from '../../dominio/modelos';
import { ProveedorServicios } from '../../estado/ContextoServicios';
import { crearAlmacenVideosEnMemoria } from '../../tests/dobles/almacenVideosEnMemoria';
import { crearRelojFalso } from '../../tests/dobles/relojFalso';
import { crearRepositorioEnMemoria } from '../../tests/dobles/repositorioEnMemoria';
import FormularioEntrenamiento, {
  MENSAJE_CREACION,
  MENSAJE_EDICION,
} from './FormularioEntrenamiento';

type OpcionesRender = {
  entrenamientos?: Entrenamiento[];
  entrenamiento?: Entrenamiento;
  almacenVideos?: ReturnType<typeof crearAlmacenVideosEnMemoria>;
};

function renderizar({
  entrenamientos = [],
  entrenamiento,
  almacenVideos,
}: OpcionesRender = {}): {
  repositorio: ReturnType<typeof crearRepositorioEnMemoria>;
  almacenVideos: ReturnType<typeof crearAlmacenVideosEnMemoria>;
} {
  const almacen = almacenVideos ?? crearAlmacenVideosEnMemoria();
  const repositorio = crearRepositorioEnMemoria({
    entrenamientos,
    almacenVideos: almacen,
  });
  const reloj = crearRelojFalso();
  // El doble en memoria devuelve `unknown` en `obtenerVideo` (su binario es
  // opaco); el ContextoServicios exige un `Blob`. Se adapta la vista al doble
  // sin alterar el estado compartido: guardar y eliminar delegan directamente.
  const almacenDeVistas = {
    obtenerVideo: async (id: string) => {
      const valor = await almacen.obtenerVideo(id);
      return valor as Blob;
    },
    guardarVideo: (id: string, archivo: Blob) =>
      almacen.guardarVideo(id, archivo as unknown as File),
    eliminarVideo: (id: string) => almacen.eliminarVideo(id),
  };
  render(
    <ProveedorServicios
      repositorio={repositorio}
      reloj={reloj}
      almacenVideos={almacenDeVistas}
    >
      <FormularioEntrenamiento entrenamiento={entrenamiento} />
    </ProveedorServicios>,
  );
  return { repositorio, almacenVideos: almacen };
}

/**
 * Construye un `File` con un tamaño declarado arbitrario, sin materializar el
 * contenido, redefiniendo la propiedad `size` de sólo lectura.
 */
function archivoDeVideo(
  nombre: string,
  tipo: string,
  bytes: number,
): File {
  const archivo = new File(['x'], nombre, { type: tipo });
  Object.defineProperty(archivo, 'size', { value: bytes });
  return archivo;
}

/** Ejercicio válido de referencia para completar el editor. */
const EJERCICIO_VALIDO = Object.freeze({
  nombre: 'Sentadilla',
  series: 4,
  repeticiones: 12,
  descansoSegundos: 90,
});

/**
 * Completa los campos del Entrenamiento (todos menos los del editor de
 * ejercicios). No envía el formulario: cada test decide la única interacción de
 * envío que ejercita.
 */
async function completarDatosEntrenamiento(
  usuario: ReturnType<typeof userEvent.setup>,
  datos: {
    titulo: string;
    categoria: string;
    nivel: string;
    duracion: string;
  },
): Promise<void> {
  await usuario.clear(screen.getByLabelText('Título'));
  if (datos.titulo !== '') {
    await usuario.type(screen.getByLabelText('Título'), datos.titulo);
  }
  await usuario.selectOptions(screen.getByLabelText('Categoría'), datos.categoria);
  await usuario.selectOptions(screen.getByLabelText('Nivel'), datos.nivel);
  await usuario.clear(screen.getByLabelText('Duración estimada (minutos)'));
  if (datos.duracion !== '') {
    await usuario.type(
      screen.getByLabelText('Duración estimada (minutos)'),
      datos.duracion,
    );
  }
}

/** Completa el campo de Enlace_Video con una dirección web válida (7.12). */
async function completarEnlaceVideo(
  usuario: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  await usuario.type(
    screen.getByLabelText('Dirección del video'),
    'https://youtu.be/abc',
  );
}

/** Completa el primer ejercicio del editor con valores válidos. */
async function completarPrimerEjercicio(
  usuario: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  await usuario.type(
    screen.getByLabelText('Nombre del ejercicio 1'),
    EJERCICIO_VALIDO.nombre,
  );
  await usuario.clear(screen.getByLabelText('Series del ejercicio 1'));
  await usuario.type(
    screen.getByLabelText('Series del ejercicio 1'),
    String(EJERCICIO_VALIDO.series),
  );
  await usuario.clear(screen.getByLabelText('Repeticiones del ejercicio 1'));
  await usuario.type(
    screen.getByLabelText('Repeticiones del ejercicio 1'),
    String(EJERCICIO_VALIDO.repeticiones),
  );
  await usuario.clear(screen.getByLabelText('Descanso del ejercicio 1 (segundos)'));
  await usuario.type(
    screen.getByLabelText('Descanso del ejercicio 1 (segundos)'),
    String(EJERCICIO_VALIDO.descansoSegundos),
  );
}

const DATOS_VALIDOS = Object.freeze({
  titulo: 'Fuerza total',
  categoria: 'Fuerza',
  nivel: 'Avanzado',
  duracion: '45',
});

describe('FormularioEntrenamiento', () => {
  it('Dado un formulario de creación con datos válidos Cuando el Administrador lo envía Entonces presenta el mensaje "Entrenamiento publicado"', async () => {
    // Cubre: 7.3
    const usuario = userEvent.setup();
    renderizar();
    await completarDatosEntrenamiento(usuario, DATOS_VALIDOS);
    await completarPrimerEjercicio(usuario);
    await completarEnlaceVideo(usuario);

    await usuario.click(screen.getByRole('button', { name: 'Publicar entrenamiento' }));

    expect(await screen.findByText(MENSAJE_CREACION)).toBeInTheDocument();
  });

  it('Dado un formulario de creación con datos válidos Cuando el Administrador lo envía Entonces crea el Entrenamiento en estado publicado con identificador único', async () => {
    // Cubre: 7.3
    const usuario = userEvent.setup();
    const { repositorio } = renderizar();
    await completarDatosEntrenamiento(usuario, DATOS_VALIDOS);
    await completarPrimerEjercicio(usuario);
    await completarEnlaceVideo(usuario);

    await usuario.click(screen.getByRole('button', { name: 'Publicar entrenamiento' }));

    await screen.findByText(MENSAJE_CREACION);
    const almacenados = repositorio.entrenamientosAlmacenados();
    expect(almacenados).toHaveLength(1);
    expect(almacenados[0].estado).toBe('publicado');
    expect(almacenados[0].id.length).toBeGreaterThan(0);
  });

  it('Dado un formulario de creación con el título vacío Cuando el Administrador lo envía Entonces señala el campo título con un mensaje asociado', async () => {
    // Cubre: 7.4
    const usuario = userEvent.setup();
    renderizar();
    await completarDatosEntrenamiento(usuario, { ...DATOS_VALIDOS, titulo: '' });
    await completarPrimerEjercicio(usuario);

    await usuario.click(screen.getByRole('button', { name: 'Publicar entrenamiento' }));

    const titulo = screen.getByLabelText('Título');
    const idMensaje = titulo.getAttribute('aria-describedby');
    expect(idMensaje).not.toBeNull();
    const mensaje = document.getElementById(idMensaje ?? '');
    expect(mensaje?.textContent ?? '').toMatch(/título/i);
  });

  it('Dado un formulario de creación inválido Cuando el Administrador lo envía Entonces no crea ningún Entrenamiento', async () => {
    // Cubre: 7.4
    const usuario = userEvent.setup();
    const { repositorio } = renderizar();
    await completarDatosEntrenamiento(usuario, { ...DATOS_VALIDOS, duracion: '3' });
    await completarPrimerEjercicio(usuario);

    await usuario.click(screen.getByRole('button', { name: 'Publicar entrenamiento' }));

    expect(repositorio.entrenamientosAlmacenados()).toHaveLength(0);
  });

  it('Dado un formulario de creación inválido Cuando el Administrador lo envía Entonces conserva los valores ya ingresados', async () => {
    // Cubre: 7.4
    const usuario = userEvent.setup();
    renderizar();
    await completarDatosEntrenamiento(usuario, { ...DATOS_VALIDOS, duracion: '3' });
    await completarPrimerEjercicio(usuario);

    await usuario.click(screen.getByRole('button', { name: 'Publicar entrenamiento' }));

    expect(screen.getByLabelText('Título')).toHaveValue(DATOS_VALIDOS.titulo);
    expect(screen.getByLabelText('Nombre del ejercicio 1')).toHaveValue(
      EJERCICIO_VALIDO.nombre,
    );
  });

  it('Dado un formulario sin ningún ejercicio Cuando el Administrador lo envía Entonces señala el grupo de ejercicios con un mensaje asociado', async () => {
    // Cubre: 7.4
    const usuario = userEvent.setup();
    renderizar();
    await completarDatosEntrenamiento(usuario, DATOS_VALIDOS);
    await usuario.click(screen.getByRole('button', { name: 'Quitar ejercicio 1' }));

    await usuario.click(screen.getByRole('button', { name: 'Publicar entrenamiento' }));

    const grupo = screen.getByRole('group', { name: 'Ejercicios' });
    const idMensaje = grupo.getAttribute('aria-describedby');
    expect(idMensaje).not.toBeNull();
    const mensaje = document.getElementById(idMensaje ?? '');
    expect(mensaje?.textContent ?? '').toMatch(/ejercicios/i);
  });

  it('Dado un formulario de edición con datos válidos Cuando el Administrador guarda cambios Entonces presenta el mensaje "Cambios guardados"', async () => {
    // Cubre: 7.5
    const usuario = userEvent.setup();
    const existente = crearEntrenamiento({
      id: 'e1',
      titulo: 'Fuerza total',
      categoria: 'Fuerza',
      nivel: 'Avanzado',
      duracionMinutos: 45,
      estado: 'publicado',
      enlaceVideo: 'https://youtu.be/abc',
      ejercicios: [crearEjercicio({ ...EJERCICIO_VALIDO, id: 'ej1' })],
    });
    renderizar({ entrenamientos: [existente], entrenamiento: existente });
    await usuario.clear(screen.getByLabelText('Título'));
    await usuario.type(screen.getByLabelText('Título'), 'Fuerza total renovada');

    await usuario.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText(MENSAJE_EDICION)).toBeInTheDocument();
  });

  it('Dado un formulario de edición con datos válidos Cuando el Administrador guarda cambios Entonces conserva el identificador del Entrenamiento', async () => {
    // Cubre: 7.5
    const usuario = userEvent.setup();
    const existente = crearEntrenamiento({
      id: 'e1',
      titulo: 'Fuerza total',
      categoria: 'Fuerza',
      nivel: 'Avanzado',
      duracionMinutos: 45,
      estado: 'publicado',
      enlaceVideo: 'https://youtu.be/abc',
      ejercicios: [crearEjercicio({ ...EJERCICIO_VALIDO, id: 'ej1' })],
    });
    const { repositorio } = renderizar({
      entrenamientos: [existente],
      entrenamiento: existente,
    });
    await usuario.clear(screen.getByLabelText('Título'));
    await usuario.type(screen.getByLabelText('Título'), 'Fuerza total renovada');

    await usuario.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await screen.findByText(MENSAJE_EDICION);
    const almacenados = repositorio.entrenamientosAlmacenados();
    expect(almacenados).toHaveLength(1);
    expect(almacenados[0].id).toBe('e1');
    expect(almacenados[0].titulo).toBe('Fuerza total renovada');
  });

  it('Dado el formulario recién presentado Cuando el Administrador observa la Fuente_Video Entonces la opción "Enlace de video" está seleccionada de manera inicial', () => {
    // Cubre: 7.11
    renderizar();

    expect(
      screen.getByRole('radio', { name: 'Enlace de video' }),
    ).toBeChecked();
  });

  it('Dado el formulario en "Enlace de video" Cuando el Administrador elige "Subir video" Entonces presenta el control de subida y oculta el campo de enlace', async () => {
    // Cubre: 7.13
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(screen.getByRole('radio', { name: 'Subir video' }));

    expect(screen.getByLabelText('Archivo de video')).toBeInTheDocument();
    expect(
      screen.queryByLabelText('Dirección del video'),
    ).not.toBeInTheDocument();
  });

  it('Dado un formulario con Fuente_Video enlace y un enlace inválido Cuando el Administrador lo envía Entonces señala el campo de enlace con el mensaje de enlace inválido', async () => {
    // Cubre: 7.10
    const usuario = userEvent.setup();
    renderizar();
    await completarDatosEntrenamiento(usuario, DATOS_VALIDOS);
    await completarPrimerEjercicio(usuario);
    await usuario.type(
      screen.getByLabelText('Dirección del video'),
      'no-es-un-enlace',
    );

    await usuario.click(
      screen.getByRole('button', { name: 'Publicar entrenamiento' }),
    );

    const control = screen.getByLabelText('Dirección del video');
    const idMensaje = control.getAttribute('aria-describedby');
    const mensaje = document.getElementById(idMensaje ?? '');
    expect(mensaje?.textContent ?? '').toBe(
      'Ingresá un enlace de video válido',
    );
  });

  it('Dado un formulario con Fuente_Video archivo sin ningún archivo Cuando el Administrador lo envía Entonces señala el control de subida con el mensaje de archivo faltante', async () => {
    // Cubre: 7.17
    const usuario = userEvent.setup();
    renderizar();
    await completarDatosEntrenamiento(usuario, DATOS_VALIDOS);
    await completarPrimerEjercicio(usuario);
    await usuario.click(screen.getByRole('radio', { name: 'Subir video' }));

    await usuario.click(
      screen.getByRole('button', { name: 'Publicar entrenamiento' }),
    );

    const control = screen.getByLabelText('Archivo de video');
    const asociados = (control.getAttribute('aria-describedby') ?? '')
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent ?? '')
      .join(' ');
    expect(asociados).toContain('Seleccioná un archivo de video');
  });

  it('Dado un formulario con Fuente_Video archivo sin archivo Cuando el Administrador lo envía Entonces no crea ningún Entrenamiento', async () => {
    // Cubre: 7.17
    const usuario = userEvent.setup();
    const { repositorio } = renderizar();
    await completarDatosEntrenamiento(usuario, DATOS_VALIDOS);
    await completarPrimerEjercicio(usuario);
    await usuario.click(screen.getByRole('radio', { name: 'Subir video' }));

    await usuario.click(
      screen.getByRole('button', { name: 'Publicar entrenamiento' }),
    );

    expect(repositorio.entrenamientosAlmacenados()).toHaveLength(0);
  });

  it('Dado un formulario con Fuente_Video archivo y un archivo aceptado Cuando el Administrador lo envía Entonces conserva el Archivo_Video asociado al identificador del Entrenamiento', async () => {
    // Cubre: 7.18
    const usuario = userEvent.setup();
    const { repositorio, almacenVideos } = renderizar();
    await completarDatosEntrenamiento(usuario, DATOS_VALIDOS);
    await completarPrimerEjercicio(usuario);
    await usuario.click(screen.getByRole('radio', { name: 'Subir video' }));
    await usuario.upload(
      screen.getByLabelText('Archivo de video'),
      archivoDeVideo('rutina.mp4', 'video/mp4', 1_048_576),
    );

    await usuario.click(
      screen.getByRole('button', { name: 'Publicar entrenamiento' }),
    );

    await screen.findByText(MENSAJE_CREACION);
    const almacenados = repositorio.entrenamientosAlmacenados();
    expect(almacenados).toHaveLength(1);
    expect(almacenados[0].fuenteVideo).toBe('archivo');
    const videos = almacenVideos.videosAlmacenados();
    expect(videos).toHaveLength(1);
    expect(videos[0].idEntrenamiento).toBe(almacenados[0].id);
  });

  it('Dado un almacenamiento sin espacio Cuando el Administrador envía el formulario con un archivo aceptado Entonces presenta el mensaje de almacenamiento lleno', async () => {
    // Cubre: 7.19
    const usuario = userEvent.setup();
    const almacen = crearAlmacenVideosEnMemoria();
    almacen.simularEspacioInsuficiente();
    renderizar({ almacenVideos: almacen });
    await completarDatosEntrenamiento(usuario, DATOS_VALIDOS);
    await completarPrimerEjercicio(usuario);
    await usuario.click(screen.getByRole('radio', { name: 'Subir video' }));
    await usuario.upload(
      screen.getByLabelText('Archivo de video'),
      archivoDeVideo('rutina.mp4', 'video/mp4', 1_048_576),
    );

    await usuario.click(
      screen.getByRole('button', { name: 'Publicar entrenamiento' }),
    );

    expect(
      await screen.findByText(
        'No pudimos guardar el video: el almacenamiento del navegador está lleno',
      ),
    ).toBeInTheDocument();
  });

  it('Dado un almacenamiento sin espacio Cuando el Administrador envía el formulario con un archivo aceptado Entonces no crea ningún Entrenamiento', async () => {
    // Cubre: 7.19
    const usuario = userEvent.setup();
    const almacen = crearAlmacenVideosEnMemoria();
    almacen.simularEspacioInsuficiente();
    const { repositorio } = renderizar({ almacenVideos: almacen });
    await completarDatosEntrenamiento(usuario, DATOS_VALIDOS);
    await completarPrimerEjercicio(usuario);
    await usuario.click(screen.getByRole('radio', { name: 'Subir video' }));
    await usuario.upload(
      screen.getByLabelText('Archivo de video'),
      archivoDeVideo('rutina.mp4', 'video/mp4', 1_048_576),
    );

    await usuario.click(
      screen.getByRole('button', { name: 'Publicar entrenamiento' }),
    );

    await screen.findByText(
      'No pudimos guardar el video: el almacenamiento del navegador está lleno',
    );
    expect(repositorio.entrenamientosAlmacenados()).toHaveLength(0);
  });

  it('Dado un Entrenamiento con Fuente_Video archivo en edición Cuando el Administrador cambia a "Enlace de video" y guarda Entonces elimina el Archivo_Video huérfano', async () => {
    // Cubre: 7.20
    const usuario = userEvent.setup();
    const existente = crearEntrenamiento({
      id: 'e1',
      titulo: 'Fuerza total',
      categoria: 'Fuerza',
      nivel: 'Avanzado',
      duracionMinutos: 45,
      estado: 'publicado',
      fuenteVideo: 'archivo',
      videoArchivo: { nombre: 'rutina.mp4', tipo: 'video/mp4', tamanioBytes: 1024 },
      ejercicios: [crearEjercicio({ ...EJERCICIO_VALIDO, id: 'ej1' })],
    });
    const almacen = crearAlmacenVideosEnMemoria({
      videosIniciales: [
        {
          idEntrenamiento: 'e1',
          blob: new Blob(['x'], { type: 'video/mp4' }),
          tipo: 'video/mp4',
          tamanioBytes: 1024,
          nombre: 'rutina.mp4',
        },
      ],
    });
    renderizar({
      entrenamientos: [existente],
      entrenamiento: existente,
      almacenVideos: almacen,
    });
    await usuario.click(screen.getByRole('radio', { name: 'Enlace de video' }));
    await usuario.type(
      screen.getByLabelText('Dirección del video'),
      'https://youtu.be/abc',
    );

    await usuario.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await screen.findByText(MENSAJE_EDICION);
    expect(almacen.tieneVideo('e1')).toBe(false);
    expect(almacen.llamadas.eliminarVideo).toContain('e1');
  });
});
