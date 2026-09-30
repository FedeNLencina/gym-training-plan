/**
 * Tests de ContextoServicios.
 *
 * El proveedor entrega el Repositorio_Datos y el reloj a las vistas que los
 * consumen (Catálogo destacado, Seccion_Planes, Catalogo_Entrenamientos), sin
 * que ninguna de ellas conozca cómo se construyen. Las pruebas verifican que el
 * valor inyectado llega intacto al consumidor y que consumir el contexto sin un
 * proveedor por encima falla de forma explícita.
 *
 * Consultas sólo por rol, texto o etiqueta accesible.
 */
import { render, screen } from '@testing-library/react';
import { type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { crearRelojFalso } from '../tests/dobles/relojFalso';
import { crearRepositorioEnMemoria } from '../tests/dobles/repositorioEnMemoria';
import { ProveedorServicios, usarServicios } from './ContextoServicios';

/** Sonda que expone el resultado de `usarServicios` como texto accesible. */
function SondaServicios(): ReactElement {
  const { repositorio, reloj } = usarServicios();
  return (
    <div>
      <p>{`Tiene repositorio: ${typeof repositorio.obtenerEntrenamientos === 'function'}`}</p>
      <p>{`Instante: ${reloj.ahora()}`}</p>
    </div>
  );
}

describe('ContextoServicios', () => {
  it('Dado un proveedor con repositorio y reloj Cuando un consumidor los solicita Entonces recibe las mismas instancias inyectadas', () => {
    // Cubre: 1.7
    const repositorio = crearRepositorioEnMemoria();
    const reloj = crearRelojFalso({ ahoraInicial: 42 });

    render(
      <ProveedorServicios repositorio={repositorio} reloj={reloj}>
        <SondaServicios />
      </ProveedorServicios>,
    );

    expect(screen.getByText('Tiene repositorio: true')).toBeInTheDocument();
    expect(screen.getByText('Instante: 42')).toBeInTheDocument();
  });

  it('Dado ningún proveedor por encima Cuando un consumidor solicita los servicios Entonces la consulta falla con un mensaje explícito', () => {
    // Cubre: 1.7
    const consultarSinProveedor = (): void => {
      render(<SondaServicios />);
    };

    expect(consultarSinProveedor).toThrow(
      'usarServicios requiere un ProveedorServicios por encima',
    );
  });
});
