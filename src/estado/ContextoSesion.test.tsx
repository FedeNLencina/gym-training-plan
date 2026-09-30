/**
 * Tests del ContextoSesion.
 *
 * El ServicioAutenticacion se sustituye por un doble que implementa su contrato
 * completo y permite diferir la restauración de la sesión persistida: sin ese
 * control no se podría observar el estado `restaurando`, que es justamente lo
 * que impide que una recarga expulse a un usuario legítimo (4.11).
 *
 * Las consultas se hacen sólo por rol o por texto, y cada test contiene una
 * única interacción del usuario.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { ErrorCorreoRegistrado } from '../dominio/errores';
import { crearCuenta, crearSesion, type Sesion } from '../dominio/modelos';
import type {
  Credenciales,
  DatosRegistro,
  ServicioAutenticacion,
} from '../servicios/servicioAutenticacion';
import { ProveedorSesion, usarSesion } from './ContextoSesion';

// --- Doble del ServicioAutenticacion ----------------------------------------

type ServicioFalso = ServicioAutenticacion & {
  /** Resuelve la restauración diferida con la sesión configurada. */
  resolverRestauracion: () => void;
  /** Cantidad de cierres de sesión solicitados. */
  cierres: () => number;
};

type OpcionesServicioFalso = {
  /** Sesión persistida que devuelve `restaurarSesion`. */
  sesionPersistida?: Sesion | null;
  /** Cuando es verdadero, la restauración espera a `resolverRestauracion`. */
  diferirRestauracion?: boolean;
  /** Error con el que falla `registrar`. */
  errorRegistro?: Error | null;
  /** Error con el que falla `ingresar`. */
  errorIngreso?: Error | null;
  /** Sesión devuelta por `ingresar` cuando no hay error. */
  sesionIngreso?: Sesion | null;
};

function crearServicioFalso({
  sesionPersistida = null,
  diferirRestauracion = false,
  errorRegistro = null,
  errorIngreso = null,
  sesionIngreso = null,
}: OpcionesServicioFalso = {}): ServicioFalso {
  let liberar: (() => void) | null = null;
  let cierres = 0;

  return {
    async registrar({ nombre, correo, idPlan = null }: DatosRegistro) {
      if (errorRegistro !== null) throw errorRegistro;
      return crearSesion(
        crearCuenta({ nombre, correo, rol: 'usuario', idPlan }),
      );
    },

    async ingresar({ correo }: Credenciales) {
      if (errorIngreso !== null) throw errorIngreso;
      return (
        sesionIngreso ?? { correo, nombre: 'Cuenta existente', rol: 'usuario' }
      );
    },

    async cerrarSesion() {
      cierres += 1;
    },

    async restaurarSesion() {
      if (!diferirRestauracion) return sesionPersistida;
      await new Promise<void>((resolver) => {
        liberar = resolver;
      });
      return sesionPersistida;
    },

    cuentaDe() {
      return null;
    },

    resolverRestauracion() {
      liberar?.();
    },

    cierres: () => cierres,
  };
}

// --- Componente de observación ----------------------------------------------

const SIN_SESION = 'Sin sesión activa';

/**
 * Expone el valor del contexto como texto y como acciones accesibles, de modo
 * que las pruebas puedan consultarlo por rol y por texto en lugar de inspeccionar
 * el estado interno del proveedor. El fallo propagado se guarda en estado local,
 * que es lo que hará cada formulario real.
 */
function Observador(): ReactElement {
  const { estado, sesion, registrar, ingresar, cerrarSesion } = usarSesion();
  const [fallo, setFallo] = useState<string>('');

  const atrapar = (promesa: Promise<unknown>): void => {
    promesa.catch((motivo: unknown) => {
      setFallo(motivo instanceof Error ? motivo.message : 'Fallo desconocido');
    });
  };

  return (
    <div>
      <p>Estado: {estado}</p>
      <p>
        {sesion === null
          ? SIN_SESION
          : `Sesión de ${sesion.nombre} (${sesion.rol})`}
      </p>
      <button
        type="button"
        onClick={() => {
          atrapar(
            registrar({
              nombre: 'Ana Pérez',
              correo: 'ana@atlasgym.com',
              contrasenia: 'contrasenia1',
            }),
          );
        }}
      >
        Registrarme
      </button>
      <button
        type="button"
        onClick={() => {
          atrapar(
            ingresar({
              correo: 'ana@atlasgym.com',
              contrasenia: 'contrasenia1',
            }),
          );
        }}
      >
        Iniciar sesión
      </button>
      <button
        type="button"
        onClick={() => {
          atrapar(cerrarSesion());
        }}
      >
        Cerrar sesión
      </button>
      {fallo === '' ? null : <p>{fallo}</p>}
    </div>
  );
}

function montar(servicio: ServicioAutenticacion): void {
  render(
    <ProveedorSesion servicio={servicio}>
      <Observador />
    </ProveedorSesion>,
  );
}

describe('ContextoSesion', () => {
  it('Dado un servicio cuya restauración no resolvió, Cuando se monta el proveedor, Entonces el estado es restaurando y no hay sesión', async () => {
    // Cubre: 4.11
    const servicio = crearServicioFalso({ diferirRestauracion: true });

    montar(servicio);

    expect(await screen.findByText('Estado: restaurando')).toBeInTheDocument();
    expect(screen.getByText(SIN_SESION)).toBeInTheDocument();
  });

  it('Dado una sesión persistida válida, Cuando el proveedor termina de restaurar, Entonces el estado es lista y expone esa sesión con su rol', async () => {
    // Cubre: 4.11
    const servicio = crearServicioFalso({
      sesionPersistida: {
        correo: 'admin@atlasgym.com',
        nombre: 'Administrador Atlas',
        rol: 'administrador',
      },
    });

    montar(servicio);

    expect(await screen.findByText('Estado: lista')).toBeInTheDocument();
    expect(
      screen.getByText('Sesión de Administrador Atlas (administrador)'),
    ).toBeInTheDocument();
  });

  it('Dado un almacenamiento sin sesión persistida, Cuando el proveedor termina de restaurar, Entonces el estado es lista sin sesión activa', async () => {
    // Cubre: 4.11
    const servicio = crearServicioFalso({ sesionPersistida: null });

    montar(servicio);

    expect(await screen.findByText('Estado: lista')).toBeInTheDocument();
    expect(screen.getByText(SIN_SESION)).toBeInTheDocument();
  });

  it('Dado un proveedor restaurado sin sesión, Cuando el visitante se registra, Entonces el contexto expone la sesión creada con rol usuario', async () => {
    // Cubre: 4.2
    const servicio = crearServicioFalso();
    montar(servicio);
    await screen.findByText('Estado: lista');

    await userEvent.click(screen.getByRole('button', { name: 'Registrarme' }));

    expect(
      await screen.findByText('Sesión de Ana Pérez (usuario)'),
    ).toBeInTheDocument();
  });

  it('Dado un correo ya registrado, Cuando el visitante se registra, Entonces el contexto propaga el error y mantiene la sesión sin iniciar', async () => {
    // Cubre: 4.2
    const servicio = crearServicioFalso({
      errorRegistro: new ErrorCorreoRegistrado(),
    });
    montar(servicio);
    await screen.findByText('Estado: lista');

    await userEvent.click(screen.getByRole('button', { name: 'Registrarme' }));

    expect(
      await screen.findByText('El correo ya está registrado'),
    ).toBeInTheDocument();
    expect(screen.getByText(SIN_SESION)).toBeInTheDocument();
  });

  it('Dado credenciales que coinciden con una cuenta, Cuando el visitante ingresa, Entonces el contexto expone la sesión con el rol registrado', async () => {
    // Cubre: 4.6
    const servicio = crearServicioFalso({
      sesionIngreso: {
        correo: 'admin@atlasgym.com',
        nombre: 'Administrador Atlas',
        rol: 'administrador',
      },
    });
    montar(servicio);
    await screen.findByText('Estado: lista');

    await userEvent.click(
      screen.getByRole('button', { name: 'Iniciar sesión' }),
    );

    expect(
      await screen.findByText('Sesión de Administrador Atlas (administrador)'),
    ).toBeInTheDocument();
  });

  it('Dado una sesión activa restaurada, Cuando el usuario cierra la sesión, Entonces el contexto queda sin sesión y el servicio borra la persistida', async () => {
    // Cubre: 4.10
    const servicio = crearServicioFalso({
      sesionPersistida: {
        correo: 'ana@atlasgym.com',
        nombre: 'Ana Pérez',
        rol: 'usuario',
      },
    });
    montar(servicio);
    await screen.findByText('Sesión de Ana Pérez (usuario)');

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByText(SIN_SESION)).toBeInTheDocument();
    expect(servicio.cierres()).toBe(1);
  });
});
