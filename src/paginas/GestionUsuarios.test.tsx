/**
 * Tests de GestionUsuarios.
 *
 * La vista se monta con el ContextoServicios y el ContextoSesion sustituidos
 * por dobles. El control de acceso por rol no se prueba acá: lo resuelve
 * `RutaProtegida` en el árbol de rutas (7.2, 7.8), de modo que cuando esta
 * vista se monta la sesión ya tiene rol administrador.
 *
 * Lo que se prueba es la orquestación: cargar las cuentas, aplicar los cambios
 * en la GestionCuentas, purgar el progreso de la cuenta eliminada y publicar el
 * aviso correspondiente. Consultas sólo por rol, texto o etiqueta accesible.
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { ErrorOperacionNoPermitida } from '../dominio/errores';
import { crearPlan, type Rol, type Sesion } from '../dominio/modelos';
import { ProveedorAvisos, RegionAvisos } from '../estado/ContextoAvisos';
import {
  ProveedorServicios,
  type GestionCuentas,
} from '../estado/ContextoServicios';
import {
  ProveedorSesion,
  type ServicioDeSesion,
} from '../estado/ContextoSesion';
import type { ResumenCuenta } from '../servicios/servicioAutenticacion';
import { crearRelojFalso } from '../tests/dobles/relojFalso';
import { crearRepositorioEnMemoria } from '../tests/dobles/repositorioEnMemoria';
import GestionUsuarios, {
  MENSAJE_CARGANDO,
  MENSAJE_CUENTA_ELIMINADA,
  MENSAJE_ERROR,
  MENSAJE_ROL_ACTUALIZADO,
} from './GestionUsuarios';

const SESION_ADMIN: Sesion = {
  correo: 'admin@atlasgym.com',
  nombre: 'Administrador Atlas',
  rol: 'administrador',
};

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
  idPlan: 'plan-base',
};

const PLANES = [crearPlan({ id: 'plan-base', nombre: 'Plan Base' })];

/** Doble de la GestionCuentas con fallos inyectables. */
function crearGestionFalsa({
  cuentas = [ADMIN, ANA],
  errorCambiarRol = null,
  errorEliminar = null,
  errorListar = null,
}: {
  cuentas?: ResumenCuenta[];
  errorCambiarRol?: Error | null;
  errorEliminar?: Error | null;
  errorListar?: Error | null;
} = {}): GestionCuentas & {
  cambiosDeRol: Array<[string, Rol]>;
  eliminadas: string[];
} {
  const cambiosDeRol: Array<[string, Rol]> = [];
  const eliminadas: string[] = [];
  let actuales = [...cuentas];

  return {
    async listarCuentas() {
      if (errorListar !== null) throw errorListar;
      return [...actuales];
    },
    async cambiarRol(correo, rol) {
      if (errorCambiarRol !== null) throw errorCambiarRol;
      cambiosDeRol.push([correo, rol]);
      actuales = actuales.map((cuenta) =>
        cuenta.correo === correo ? { ...cuenta, rol } : cuenta,
      );
      return actuales.find((cuenta) => cuenta.correo === correo) ?? ADMIN;
    },
    async cambiarPlan(correo, idPlan) {
      actuales = actuales.map((cuenta) =>
        cuenta.correo === correo ? { ...cuenta, idPlan } : cuenta,
      );
      return actuales.find((cuenta) => cuenta.correo === correo) ?? ADMIN;
    },
    async eliminarCuenta(correo) {
      if (errorEliminar !== null) throw errorEliminar;
      eliminadas.push(correo);
      actuales = actuales.filter((cuenta) => cuenta.correo !== correo);
    },
    cambiosDeRol,
    eliminadas,
  };
}

const servicioDeSesion = (sesion: Sesion | null): ServicioDeSesion => ({
  async registrar() {
    throw new Error('no usado');
  },
  async ingresar() {
    throw new Error('no usado');
  },
  async cerrarSesion() {},
  async restaurarSesion() {
    return sesion;
  },
  cuentaDe() {
    return null;
  },
});

type OpcionesRender = {
  gestion?: ReturnType<typeof crearGestionFalsa>;
  olvidarCuenta?: (correo: string) => Promise<void>;
};

function renderizar({
  gestion = crearGestionFalsa(),
  olvidarCuenta = vi.fn(async () => {}),
}: OpcionesRender = {}): {
  gestion: ReturnType<typeof crearGestionFalsa>;
  olvidarCuenta: (correo: string) => Promise<void>;
} {
  const repositorio = crearRepositorioEnMemoria({ planes: PLANES });

  // Sólo `olvidarCuenta` se ejercita acá; el resto del ServicioProgreso no
  // interviene en la gestión de cuentas.
  const servicioProgreso = {
    async obtenerAvance() {
      return null;
    },
    async guardarAvance() {
      throw new Error('no usado');
    },
    async obtenerHistorial() {
      return [];
    },
    async registrarSesionCompletada() {
      throw new Error('no usado');
    },
    async obtenerEstadisticas() {
      throw new Error('no usado');
    },
    olvidarCuenta,
  } as unknown as Parameters<typeof ProveedorServicios>[0]['servicioProgreso'];

  render(
    <MemoryRouter>
      <ProveedorSesion servicio={servicioDeSesion(SESION_ADMIN)}>
        <ProveedorServicios
          repositorio={repositorio}
          reloj={crearRelojFalso()}
          gestionCuentas={gestion}
          servicioProgreso={servicioProgreso}
        >
          <ProveedorAvisos>
            <RegionAvisos />
            <GestionUsuarios />
          </ProveedorAvisos>
        </ProveedorServicios>
      </ProveedorSesion>
    </MemoryRouter>,
  );

  return { gestion, olvidarCuenta };
}

/** Fila de una cuenta ya cargada. */
const filaDe = async (nombre: string): Promise<HTMLElement> =>
  screen.findByRole('listitem', { name: nombre });

describe('GestionUsuarios', () => {
  describe('carga', () => {
    it('Dada la vista montada Cuando todavía no llegaron las cuentas Entonces presenta el indicador de carga', () => {
      renderizar();

      expect(screen.getByText(MENSAJE_CARGANDO)).toBeInTheDocument();
    });

    it('Dadas dos cuentas Cuando la carga se resuelve Entonces presenta una fila por cuenta', async () => {
      renderizar();

      expect(await screen.findAllByRole('listitem')).toHaveLength(2);
    });

    it('Dada una cuenta con plan Cuando la carga se resuelve Entonces presenta el nombre del plan', async () => {
      renderizar();

      expect(
        within(await filaDe(ANA.nombre)).getByText('Plan Base'),
      ).toBeInTheDocument();
    });

    it('Dado un fallo de lectura Cuando la carga termina Entonces presenta el mensaje de error', async () => {
      renderizar({
        gestion: crearGestionFalsa({ errorListar: new Error('caído') }),
      });

      expect(await screen.findByText(MENSAJE_ERROR)).toBeInTheDocument();
    });

    it('Dado un fallo de lectura Cuando la carga termina Entonces ofrece reintentar', async () => {
      renderizar({
        gestion: crearGestionFalsa({ errorListar: new Error('caído') }),
      });

      expect(
        await screen.findByRole('button', { name: 'Reintentar' }),
      ).toBeInTheDocument();
    });
  });

  describe('cambio de rol', () => {
    it('Dada una cuenta de Usuario Cuando el Administrador la promueve Entonces lo pide a la gestión de cuentas', async () => {
      const { gestion } = renderizar();
      const fila = await filaDe(ANA.nombre);

      await userEvent.selectOptions(
        within(fila).getByRole('combobox', { name: /rol/i }),
        'administrador',
      );

      await waitFor(() => {
        expect(gestion.cambiosDeRol).toEqual([[ANA.correo, 'administrador']]);
      });
    });

    it('Dada una cuenta de Usuario Cuando se la promueve Entonces publica el aviso de rol actualizado', async () => {
      renderizar();
      const fila = await filaDe(ANA.nombre);

      await userEvent.selectOptions(
        within(fila).getByRole('combobox', { name: /rol/i }),
        'administrador',
      );

      expect(
        await screen.findByText(MENSAJE_ROL_ACTUALIZADO),
      ).toBeInTheDocument();
    });

    it('Dada una cuenta promovida Cuando el cambio se aplica Entonces la lista refleja el rol nuevo', async () => {
      renderizar();
      const fila = await filaDe(ANA.nombre);

      await userEvent.selectOptions(
        within(fila).getByRole('combobox', { name: /rol/i }),
        'administrador',
      );

      await waitFor(async () => {
        expect(
          within(await filaDe(ANA.nombre)).getByRole('combobox', {
            name: /rol/i,
          }),
        ).toHaveValue('administrador');
      });
    });

    it('Dado el único Administrador Cuando se intenta degradarlo Entonces presenta el motivo de la negativa', async () => {
      const motivo = 'La plataforma necesita al menos un administrador';
      renderizar({
        gestion: crearGestionFalsa({
          errorCambiarRol: new ErrorOperacionNoPermitida(motivo),
        }),
      });
      const fila = await filaDe(ADMIN.nombre);

      await userEvent.selectOptions(
        within(fila).getByRole('combobox', { name: /rol/i }),
        'usuario',
      );

      expect(await screen.findByText(motivo)).toBeInTheDocument();
    });

    it('Dado un fallo al cambiar el rol Cuando se intenta el cambio Entonces la lista conserva el rol anterior', async () => {
      renderizar({
        gestion: crearGestionFalsa({
          errorCambiarRol: new ErrorOperacionNoPermitida('no se puede'),
        }),
      });
      const fila = await filaDe(ADMIN.nombre);

      await userEvent.selectOptions(
        within(fila).getByRole('combobox', { name: /rol/i }),
        'usuario',
      );

      await waitFor(async () => {
        expect(
          within(await filaDe(ADMIN.nombre)).getByRole('combobox', {
            name: /rol/i,
          }),
        ).toHaveValue('administrador');
      });
    });
  });

  describe('eliminación', () => {
    /** Abre el diálogo de eliminación de una cuenta y confirma. */
    const cuandoEliminaYConfirma = async (nombre: string): Promise<void> => {
      const fila = await filaDe(nombre);
      await userEvent.click(
        within(fila).getByRole('button', { name: /eliminar/i }),
      );
      await userEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: 'Eliminar',
        }),
      );
    };

    it('Dada una cuenta Cuando el Administrador confirma su eliminación Entonces la pide a la gestión de cuentas', async () => {
      const { gestion } = renderizar();

      await cuandoEliminaYConfirma(ANA.nombre);

      await waitFor(() => {
        expect(gestion.eliminadas).toEqual([ANA.correo]);
      });
    });

    it('Dada una cuenta Cuando se confirma su eliminación Entonces purga también su progreso', async () => {
      // Sin esta purga, registrar de nuevo ese correo heredaría el historial
      // de la cuenta anterior.
      const { olvidarCuenta } = renderizar();

      await cuandoEliminaYConfirma(ANA.nombre);

      await waitFor(() => {
        expect(olvidarCuenta).toHaveBeenCalledWith(ANA.correo);
      });
    });

    it('Dada una cuenta Cuando se confirma su eliminación Entonces publica el aviso de cuenta eliminada', async () => {
      renderizar();

      await cuandoEliminaYConfirma(ANA.nombre);

      expect(
        await screen.findByText(MENSAJE_CUENTA_ELIMINADA),
      ).toBeInTheDocument();
    });

    it('Dada una cuenta eliminada Cuando la lista se recarga Entonces ya no la presenta', async () => {
      renderizar();

      await cuandoEliminaYConfirma(ANA.nombre);

      await waitFor(() => {
        expect(
          screen.queryByRole('listitem', { name: ANA.nombre }),
        ).not.toBeInTheDocument();
      });
    });

    it('Dado el Administrador principal Cuando se intenta eliminarlo Entonces presenta el motivo de la negativa', async () => {
      const motivo = 'No podés eliminar la cuenta del administrador principal';
      renderizar({
        gestion: crearGestionFalsa({
          errorEliminar: new ErrorOperacionNoPermitida(motivo),
        }),
      });

      await cuandoEliminaYConfirma(ADMIN.nombre);

      expect(await screen.findByText(motivo)).toBeInTheDocument();
    });

    it('Dado un fallo al eliminar Cuando se intenta la eliminación Entonces no purga ningún progreso', async () => {
      const { olvidarCuenta } = renderizar({
        gestion: crearGestionFalsa({
          errorEliminar: new ErrorOperacionNoPermitida('no se puede'),
        }),
      });

      await cuandoEliminaYConfirma(ADMIN.nombre);

      await waitFor(() => {
        expect(olvidarCuenta).not.toHaveBeenCalled();
      });
    });
  });
});
