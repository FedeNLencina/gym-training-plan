/**
 * Tests del ContextoAvisos.
 *
 * Varios criterios exigen presentar un mensaje después de navegar a otra ruta:
 * "Iniciá sesión para continuar" (2.13, 6.8, 7.8), "El entrenamiento
 * solicitado no existe" (2.14) y "No tenés permisos para esta sección" (7.2).
 * El aviso se publica antes de navegar, sobrevive el cambio de ruta y se
 * consume al presentarse, de modo que no reaparece más adelante.
 *
 * Cubre: 2.13, 2.14, 6.8, 7.2, 7.8
 */
import { useEffect } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Link, Route, Routes } from 'react-router-dom';
import { ProveedorAvisos, RegionAvisos, useAvisos } from './ContextoAvisos';

/** Sonda que expone el aviso pendiente como texto accesible. */
function SondaPendiente() {
  const { avisoPendiente } = useAvisos();
  return <p>{`Pendiente: ${avisoPendiente === null ? 'ninguno' : avisoPendiente.mensaje}`}</p>;
}

/** Control que publica un aviso al ser activado por el usuario. */
function BotonPublicar({ mensaje }: { mensaje: string }) {
  const { publicarAviso } = useAvisos();
  return (
    <button type="button" onClick={() => publicarAviso(mensaje)}>
      Publicar aviso
    </button>
  );
}

/** Vista que publica un aviso al montarse, como hace RutaProtegida antes de redirigir. */
function VistaQuePublica({ mensaje }: { mensaje: string }) {
  const { publicarAviso } = useAvisos();
  useEffect(() => {
    publicarAviso(mensaje);
  }, [publicarAviso, mensaje]);
  return <Link to="/ingresar">Iniciar sesión</Link>;
}

function renderizarAplicacion(contenidoInicial: JSX.Element) {
  return render(
    <MemoryRouter initialEntries={['/entrenamientos/7']}>
      <ProveedorAvisos>
        <RegionAvisos />
        <SondaPendiente />
        <Routes>
          <Route path="/entrenamientos/:id" element={contenidoInicial} />
          <Route path="/ingresar" element={<h1>Iniciar sesión</h1>} />
        </Routes>
      </ProveedorAvisos>
    </MemoryRouter>,
  );
}

describe('ContextoAvisos', () => {
  it('Dado un visitante sin avisos Cuando se publica un aviso Entonces la región de avisos presenta el mensaje', async () => {
    // Cubre: 2.13, 7.8
    renderizarAplicacion(<BotonPublicar mensaje="Iniciá sesión para continuar" />);
    await userEvent.click(screen.getByRole('button', { name: 'Publicar aviso' }));
    expect(screen.getByRole('status')).toHaveTextContent('Iniciá sesión para continuar');
  });

  it('Dado un aviso publicado Cuando se publica un aviso Entonces el aviso queda consumido y no vuelve a quedar pendiente', async () => {
    // Cubre: 7.2
    renderizarAplicacion(<BotonPublicar mensaje="No tenés permisos para esta sección" />);
    await userEvent.click(screen.getByRole('button', { name: 'Publicar aviso' }));
    expect(screen.getByRole('status')).toHaveTextContent('No tenés permisos para esta sección');
    expect(screen.getByText('Pendiente: ninguno')).toBeInTheDocument();
  });

  it('Dado un aviso publicado antes de redirigir Cuando el visitante navega a otra ruta Entonces la región de avisos conserva el mensaje', async () => {
    // Cubre: 2.14, 6.8
    renderizarAplicacion(<VistaQuePublica mensaje="El entrenamiento solicitado no existe" />);
    await userEvent.click(screen.getByRole('link', { name: 'Iniciar sesión' }));
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('El entrenamiento solicitado no existe');
  });
});
