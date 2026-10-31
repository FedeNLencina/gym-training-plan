/**
 * Tests de ListaUsuariosAdmin.
 *
 * Componente de presentación puro: recibe las cuentas ya cargadas y delega cada
 * acción en su callback. No conoce el ServicioAutenticacion ni el estado de la
 * carga, que son responsabilidad de la vista GestionUsuarios.
 *
 * Consultas sólo por rol, texto o etiqueta accesible; una sola interacción por
 * test.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { crearPlan, type Plan } from '../../dominio/modelos';
import type { ResumenCuenta } from '../../servicios/servicioAutenticacion';
import ListaUsuariosAdmin, {
  MENSAJE_LISTA_VACIA,
  SIN_PLAN,
} from './ListaUsuariosAdmin';

const PLANES: Plan[] = [
  crearPlan({ id: 'plan-base', nombre: 'Plan Base' }),
  crearPlan({ id: 'plan-progreso', nombre: 'Plan Progreso' }),
];

const ADMIN: ResumenCuenta = {
  id: 'cuenta-administrador',
  nombre: 'Administrador Atlas',
  correo: 'admin@atlasgym.com',
  rol: 'administrador',
  idPlan: null,
};

const ANA: ResumenCuenta = {
  id: 'cuenta-ana',
  nombre: 'Ana Pérez',
  correo: 'ana@atlasgym.com',
  rol: 'usuario',
  idPlan: 'plan-progreso',
};

const DIEGO: ResumenCuenta = {
  id: 'cuenta-diego',
  nombre: 'Diego Sosa',
  correo: 'diego@atlasgym.com',
  rol: 'usuario',
  idPlan: null,
};

type OpcionesRender = {
  cuentas?: ResumenCuenta[];
  correoSesion?: string;
  onCambiarRol?: (correo: string, rol: 'usuario' | 'administrador') => void;
  onEliminar?: (correo: string) => void;
};

function renderizar({
  cuentas = [ADMIN, ANA, DIEGO],
  correoSesion = ADMIN.correo,
  onCambiarRol = vi.fn(),
  onEliminar = vi.fn(),
}: OpcionesRender = {}): {
  onCambiarRol: (correo: string, rol: 'usuario' | 'administrador') => void;
  onEliminar: (correo: string) => void;
} {
  render(
    <ListaUsuariosAdmin
      cuentas={cuentas}
      planes={PLANES}
      correoSesion={correoSesion}
      onCambiarRol={onCambiarRol}
      onEliminar={onEliminar}
    />,
  );
  return { onCambiarRol, onEliminar };
}

/** Fila de una cuenta, localizada por su nombre accesible. */
const filaDe = (nombre: string): HTMLElement =>
  screen.getByRole('listitem', { name: nombre });

describe('ListaUsuariosAdmin', () => {
  describe('presentación', () => {
    it('Dadas tres cuentas Cuando se presenta la lista Entonces muestra una fila por cuenta', () => {
      renderizar();

      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });

    it('Dada una cuenta Cuando se presenta la lista Entonces muestra su correo', () => {
      renderizar();

      expect(within(filaDe(ANA.nombre)).getByText(ANA.correo)).toBeInTheDocument();
    });

    it('Dada una cuenta con plan Cuando se presenta la lista Entonces muestra el nombre del plan', () => {
      renderizar();

      expect(
        within(filaDe(ANA.nombre)).getByText('Plan Progreso'),
      ).toBeInTheDocument();
    });

    it('Dada una cuenta sin plan Cuando se presenta la lista Entonces lo indica', () => {
      renderizar();

      expect(within(filaDe(DIEGO.nombre)).getByText(SIN_PLAN)).toBeInTheDocument();
    });

    it('Dada una cuenta con un plan desconocido Cuando se presenta la lista Entonces no rompe y lo indica', () => {
      // El Administrador pudo haber eliminado el plan al que estaba suscrita.
      renderizar({
        cuentas: [{ ...ANA, idPlan: 'plan-inexistente' }],
      });

      expect(within(filaDe(ANA.nombre)).getByText(SIN_PLAN)).toBeInTheDocument();
    });

    it('Dada la cuenta de la sesión activa Cuando se presenta la lista Entonces la señala', () => {
      // Sin esta señal, el Administrador no sabe cuál de las filas es la suya
      // antes de cambiarse el rol a sí mismo.
      renderizar({ correoSesion: ANA.correo });

      expect(within(filaDe(ANA.nombre)).getByText(/vos/i)).toBeInTheDocument();
    });

    it('Dada ninguna cuenta Cuando se presenta la lista Entonces muestra el mensaje de lista vacía', () => {
      renderizar({ cuentas: [] });

      expect(screen.getByText(MENSAJE_LISTA_VACIA)).toBeInTheDocument();
    });

    it('Dada una cuenta Cuando se presenta la lista Entonces su selector de rol refleja el rol actual', () => {
      renderizar();

      expect(
        within(filaDe(ANA.nombre)).getByRole('combobox', { name: /rol/i }),
      ).toHaveValue('usuario');
    });
  });

  describe('cambio de rol', () => {
    it('Dado un Usuario Cuando el Administrador lo promueve Entonces delega el cambio con su correo y el rol nuevo', async () => {
      const { onCambiarRol } = renderizar();

      await userEvent.selectOptions(
        within(filaDe(ANA.nombre)).getByRole('combobox', { name: /rol/i }),
        'administrador',
      );

      expect(onCambiarRol).toHaveBeenCalledWith(ANA.correo, 'administrador');
    });

    it('Dado un Administrador Cuando se lo degrada Entonces delega el cambio a rol usuario', async () => {
      const { onCambiarRol } = renderizar({ cuentas: [ADMIN, ANA] });

      await userEvent.selectOptions(
        within(filaDe(ADMIN.nombre)).getByRole('combobox', { name: /rol/i }),
        'usuario',
      );

      expect(onCambiarRol).toHaveBeenCalledWith(ADMIN.correo, 'usuario');
    });
  });

  describe('eliminación', () => {
    it('Dada una cuenta Cuando el Administrador pide eliminarla Entonces abre el diálogo de confirmación', async () => {
      renderizar();

      await userEvent.click(
        within(filaDe(ANA.nombre)).getByRole('button', { name: /eliminar/i }),
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('Dado el diálogo abierto Cuando el Administrador confirma Entonces delega la eliminación con el correo', async () => {
      const { onEliminar } = renderizar();
      await userEvent.click(
        within(filaDe(ANA.nombre)).getByRole('button', { name: /eliminar/i }),
      );

      await userEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: 'Eliminar',
        }),
      );

      expect(onEliminar).toHaveBeenCalledWith(ANA.correo);
    });

    it('Dado el diálogo abierto Cuando el Administrador cancela Entonces no elimina nada', async () => {
      const { onEliminar } = renderizar();
      await userEvent.click(
        within(filaDe(ANA.nombre)).getByRole('button', { name: /eliminar/i }),
      );

      await userEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: 'Cancelar',
        }),
      );

      expect(onEliminar).not.toHaveBeenCalled();
    });

    it('Dado el diálogo abierto Cuando el Administrador cancela Entonces cierra el diálogo', async () => {
      renderizar();
      await userEvent.click(
        within(filaDe(ANA.nombre)).getByRole('button', { name: /eliminar/i }),
      );

      await userEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: 'Cancelar',
        }),
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('Dado el diálogo de una cuenta Cuando se presenta Entonces nombra a esa cuenta', async () => {
      // Confirmar una eliminación sin saber a quién se elimina es una trampa.
      renderizar();

      await userEvent.click(
        within(filaDe(ANA.nombre)).getByRole('button', { name: /eliminar/i }),
      );

      expect(screen.getByRole('dialog')).toHaveTextContent(ANA.nombre);
    });
  });
});
