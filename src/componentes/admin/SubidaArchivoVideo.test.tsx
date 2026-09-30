/**
 * Tests de SubidaArchivoVideo.
 *
 * El control de subida del Panel_Admin es obligatorio cuando la Fuente_Video es
 * "archivo", indica los formatos aceptados `mp4` y `webm` y el tamaño máximo de
 * 50 MB (7.13). Valida en el momento de la selección: acepta `video/mp4` o
 * `video/webm` de tamaño ≤ 52.428.800 bytes y presenta nombre y tamaño en MB con
 * un decimal (7.14); rechaza el tipo no admitido (7.15) y el tamaño excedido
 * (7.16), descartando el archivo. Cuando recibe un mensaje de validación lo
 * asocia al control mediante `aria-describedby`.
 *
 * Consultas sólo por rol, texto o etiqueta accesible; una sola interacción por
 * test.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LIMITE_VIDEO_BYTES } from '../../dominio/modelos';
import SubidaArchivoVideo, {
  MENSAJE_FORMATO_NO_ACEPTADO,
  MENSAJE_TAMANIO_EXCEDIDO,
  type ArchivoAceptado,
} from './SubidaArchivoVideo';

/**
 * Construye un `File` con un tamaño declarado arbitrario, sin materializar el
 * contenido, redefiniendo la propiedad `size` de sólo lectura.
 */
function archivoDeTamanio(nombre: string, tipo: string, bytes: number): File {
  const archivo = new File(['x'], nombre, { type: tipo });
  Object.defineProperty(archivo, 'size', { value: bytes });
  return archivo;
}

describe('SubidaArchivoVideo', () => {
  it('Dado el control de subida Cuando el Administrador lo observa Entonces indica los formatos aceptados y el tamaño máximo', () => {
    // Cubre: 7.13
    render(
      <SubidaArchivoVideo
        archivo={null}
        error={null}
        onSeleccion={vi.fn()}
        onRechazo={vi.fn()}
      />,
    );

    expect(screen.getByText(/mp4/i)).toBeInTheDocument();
    expect(screen.getByText(/50 MB/i)).toBeInTheDocument();
  });

  it('Dado un archivo mp4 dentro del límite Cuando el Administrador lo selecciona Entonces notifica el archivo aceptado', async () => {
    // Cubre: 7.14
    const usuario = userEvent.setup();
    const onSeleccion = vi.fn();
    render(
      <SubidaArchivoVideo
        archivo={null}
        error={null}
        onSeleccion={onSeleccion}
        onRechazo={vi.fn()}
      />,
    );
    const archivo = archivoDeTamanio('rutina.mp4', 'video/mp4', 1_048_576);

    await usuario.upload(screen.getByLabelText('Archivo de video'), archivo);

    expect(onSeleccion).toHaveBeenCalledTimes(1);
    expect(onSeleccion.mock.calls[0][0]).toBe(archivo);
  });

  it('Dado un archivo aceptado Cuando el control lo presenta Entonces muestra su nombre y su tamaño en MB con un decimal', () => {
    // Cubre: 7.14
    const aceptado: ArchivoAceptado = {
      nombre: 'rutina.mp4',
      tamanioBytes: 1_572_864,
    };
    render(
      <SubidaArchivoVideo
        archivo={aceptado}
        error={null}
        onSeleccion={vi.fn()}
        onRechazo={vi.fn()}
      />,
    );

    expect(screen.getByText(/rutina\.mp4/)).toBeInTheDocument();
    expect(screen.getByText(/1\.5 MB/)).toBeInTheDocument();
  });

  it('Dado un archivo con tipo no admitido Cuando el Administrador lo selecciona Entonces rechaza con el mensaje de formato no aceptado', async () => {
    // Cubre: 7.15
    const usuario = userEvent.setup({ applyAccept: false });
    const onRechazo = vi.fn();
    render(
      <SubidaArchivoVideo
        archivo={null}
        error={null}
        onSeleccion={vi.fn()}
        onRechazo={onRechazo}
      />,
    );
    const archivo = archivoDeTamanio('foto.png', 'image/png', 2048);

    await usuario.upload(screen.getByLabelText('Archivo de video'), archivo);

    expect(onRechazo).toHaveBeenCalledWith(MENSAJE_FORMATO_NO_ACEPTADO);
  });

  it('Dado un archivo que excede el tamaño máximo Cuando el Administrador lo selecciona Entonces rechaza con el mensaje de tamaño excedido', async () => {
    // Cubre: 7.16
    const usuario = userEvent.setup();
    const onRechazo = vi.fn();
    render(
      <SubidaArchivoVideo
        archivo={null}
        error={null}
        onSeleccion={vi.fn()}
        onRechazo={onRechazo}
      />,
    );
    const archivo = archivoDeTamanio(
      'grande.mp4',
      'video/mp4',
      LIMITE_VIDEO_BYTES + 1,
    );

    await usuario.upload(screen.getByLabelText('Archivo de video'), archivo);

    expect(onRechazo).toHaveBeenCalledWith(MENSAJE_TAMANIO_EXCEDIDO);
  });

  it('Dado un archivo con tipo no admitido Cuando el Administrador lo selecciona Entonces no notifica ningún archivo aceptado', async () => {
    // Cubre: 7.15
    const usuario = userEvent.setup({ applyAccept: false });
    const onSeleccion = vi.fn();
    render(
      <SubidaArchivoVideo
        archivo={null}
        error={null}
        onSeleccion={onSeleccion}
        onRechazo={vi.fn()}
      />,
    );
    const archivo = archivoDeTamanio('foto.png', 'image/png', 2048);

    await usuario.upload(screen.getByLabelText('Archivo de video'), archivo);

    expect(onSeleccion).not.toHaveBeenCalled();
  });

  it('Dado un rechazo por validación Cuando el control presenta el error Entonces asocia el mensaje al control', () => {
    // Cubre: 7.17
    render(
      <SubidaArchivoVideo
        archivo={null}
        error="Seleccioná un archivo de video"
        onSeleccion={vi.fn()}
        onRechazo={vi.fn()}
      />,
    );

    const control = screen.getByLabelText('Archivo de video');
    const idsDescripcion = (
      control.getAttribute('aria-describedby') ?? ''
    ).split(' ');
    const asociados = idsDescripcion
      .map((id) => document.getElementById(id)?.textContent ?? '')
      .join(' ');
    expect(asociados).toContain('Seleccioná un archivo de video');
  });
});
