/**
 * Tests de MiProgreso.
 *
 * La vista presenta el acumulado y el historial de la cuenta de la sesión
 * activa. El control de acceso lo resuelve `RutaProtegida`, así que acá la
 * sesión ya existe.
 *
 * Lo que más importa de estas pruebas es que la vista pida el progreso de la
 * cuenta en sesión y de ninguna otra: es el punto donde el aislamiento entre
 * Usuarios se vuelve visible para quien usa la Plataforma.
 */
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { crearSesionCompletada, type Sesion } from '../dominio/modelos';
import { calcularEstadisticas } from '../dominio/historial';
import { ProveedorServicios } from '../estado/ContextoServicios';
import {
  ProveedorSesion,
  type ServicioDeSesion,
} from '../estado/ContextoSesion';
import type { ServicioProgreso } from '../servicios/servicioProgreso';
import { crearRelojFalso } from '../tests/dobles/relojFalso';
import { crearRepositorioEnMemoria } from '../tests/dobles/repositorioEnMemoria';
import MiProgreso, {
  MENSAJE_CARGANDO,
  MENSAJE_ERROR,
  MENSAJE_SIN_PROGRESO,
} from './MiProgreso';

const SESION_ANA: Sesion = {
  correo: 'ana@atlasgym.com',
  nombre: 'Ana Pérez',
  rol: 'usuario',
};

const HISTORIAL_DE_ANA = [
  crearSesionCompletada({
    id: 'ses-1',
    idEntrenamiento: 'ent-fuerza',
    tituloEntrenamiento: 'Fuerza de tren superior',
    completadoEn: '2026-03-09T12:00:00.000Z',
    ejerciciosCompletados: 4,
    ejerciciosTotales: 4,
  }),
  crearSesionCompletada({
    id: 'ses-2',
    idEntrenamiento: 'ent-cardio',
    tituloEntrenamiento: 'Cardio por intervalos',
    completadoEn: '2026-03-05T12:00:00.000Z',
    ejerciciosCompletados: 3,
    ejerciciosTotales: 3,
  }),
];

/** Doble del ServicioProgreso que registra a quién se le pidió el progreso. */
function crearProgresoFalso({
  historialPorCorreo = {} as Record<string, typeof HISTORIAL_DE_ANA>,
  falla = false,
}: {
  historialPorCorreo?: Record<string, typeof HISTORIAL_DE_ANA>;
  falla?: boolean;
} = {}): ServicioProgreso & { consultas: string[] } {
  const consultas: string[] = [];

  return {
    async obtenerAvance() {
      return null;
    },
    async guardarAvance() {
      throw new Error('no usado');
    },
    async obtenerHistorial(correo) {
      consultas.push(correo);
      if (falla) throw new Error('caído');
      return historialPorCorreo[correo] ?? [];
    },
    async registrarSesionCompletada() {
      throw new Error('no usado');
    },
    async obtenerEstadisticas(correo) {
      if (falla) throw new Error('caído');
      return calcularEstadisticas(historialPorCorreo[correo] ?? []);
    },
    async olvidarCuenta() {},
    consultas,
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

function renderizar({
  sesion = SESION_ANA,
  progreso = crearProgresoFalso({
    historialPorCorreo: { [SESION_ANA.correo]: HISTORIAL_DE_ANA },
  }),
}: {
  sesion?: Sesion | null;
  progreso?: ReturnType<typeof crearProgresoFalso>;
} = {}): { progreso: ReturnType<typeof crearProgresoFalso> } {
  render(
    <MemoryRouter>
      <ProveedorSesion servicio={servicioDeSesion(sesion)}>
        <ProveedorServicios
          repositorio={crearRepositorioEnMemoria()}
          reloj={crearRelojFalso()}
          servicioProgreso={progreso}
        >
          <MiProgreso />
        </ProveedorServicios>
      </ProveedorSesion>
    </MemoryRouter>,
  );
  return { progreso };
}

describe('MiProgreso', () => {
  describe('carga', () => {
    it('Dada la vista montada Cuando todavía no llegó el progreso Entonces presenta el indicador de carga', () => {
      renderizar();

      expect(screen.getByText(MENSAJE_CARGANDO)).toBeInTheDocument();
    });

    it('Dado un fallo de lectura Cuando la carga termina Entonces presenta el mensaje de error', async () => {
      renderizar({ progreso: crearProgresoFalso({ falla: true }) });

      expect(await screen.findByText(MENSAJE_ERROR)).toBeInTheDocument();
    });
  });

  describe('aislamiento por cuenta', () => {
    it('Dada una sesión activa Cuando se carga el progreso Entonces lo pide para el correo de esa sesión', async () => {
      const { progreso } = renderizar();

      await screen.findByText('Fuerza de tren superior');

      expect(progreso.consultas).toContain(SESION_ANA.correo);
    });

    it('Dado el progreso de otra cuenta Cuando la sesión es de un Usuario sin progreso Entonces presenta el estado vacío', async () => {
      renderizar({
        sesion: {
          correo: 'diego@atlasgym.com',
          nombre: 'Diego Sosa',
          rol: 'usuario',
        },
        progreso: crearProgresoFalso({
          historialPorCorreo: { [SESION_ANA.correo]: HISTORIAL_DE_ANA },
        }),
      });

      expect(
        await screen.findByText(MENSAJE_SIN_PROGRESO),
      ).toBeInTheDocument();
    });
  });

  describe('estadísticas', () => {
    it('Dadas dos sesiones completadas Cuando se presenta el acumulado Entonces cuenta las sesiones', async () => {
      renderizar();

      const sesiones = await screen.findByRole('listitem', {
        name: /sesiones completadas/i,
      });

      expect(within(sesiones).getByText('2')).toBeInTheDocument();
    });

    it('Dadas dos sesiones de Entrenamientos distintos Cuando se presenta el acumulado Entonces los cuenta', async () => {
      renderizar();

      const distintos = await screen.findByRole('listitem', {
        name: /entrenamientos distintos/i,
      });

      expect(within(distintos).getByText('2')).toBeInTheDocument();
    });

    it('Dadas sesiones con siete ejercicios en total Cuando se presenta el acumulado Entonces los suma', async () => {
      renderizar();

      const ejercicios = await screen.findByRole('listitem', {
        name: /ejercicios completados/i,
      });

      expect(within(ejercicios).getByText('7')).toBeInTheDocument();
    });

    it('Dada la sesión más reciente Cuando se presenta el acumulado Entonces muestra su fecha', async () => {
      renderizar();

      const ultima = await screen.findByRole('listitem', {
        name: /última sesión/i,
      });

      expect(within(ultima).getByText('09/03/2026')).toBeInTheDocument();
    });
  });

  describe('historial', () => {
    it('Dadas dos sesiones Cuando se presenta el historial Entonces muestra una fila por sesión', async () => {
      renderizar();

      const historial = await screen.findByRole('list', {
        name: /historial/i,
      });

      expect(within(historial).getAllByRole('listitem')).toHaveLength(2);
    });

    it('Dada una sesión Cuando se presenta el historial Entonces muestra el título del Entrenamiento', async () => {
      renderizar();

      expect(
        await screen.findByText('Cardio por intervalos'),
      ).toBeInTheDocument();
    });

    it('Dadas dos sesiones Cuando se presenta el historial Entonces la más reciente va primera', async () => {
      renderizar();
      const historial = await screen.findByRole('list', {
        name: /historial/i,
      });

      const filas = within(historial).getAllByRole('listitem');

      expect(filas[0]).toHaveTextContent('Fuerza de tren superior');
    });

    it('Dada una sesión Cuando se presenta el historial Entonces indica su recuento de Ejercicios', async () => {
      renderizar();

      const historial = await screen.findByRole('list', {
        name: /historial/i,
      });

      expect(within(historial).getAllByRole('listitem')[0]).toHaveTextContent(
        '4 de 4 ejercicios',
      );
    });

    it('Dada una cuenta sin sesiones Cuando se presenta la vista Entonces ofrece ir al catálogo', async () => {
      renderizar({ progreso: crearProgresoFalso() });

      expect(
        await screen.findByRole('link', { name: /ver entrenamientos/i }),
      ).toBeInTheDocument();
    });
  });
});
