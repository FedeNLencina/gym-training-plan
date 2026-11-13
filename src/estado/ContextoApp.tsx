/**
 * Estado de la plataforma: datos, sesión y todas las acciones.
 *
 * Es la única fuente de verdad de la interfaz. Cada acción valida, arma el
 * nuevo documento de datos y lo persiste con `guardarDatos`; si algo no es
 * válido lanza un error de dominio que la vista traduce a mensajes.
 */

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import { ID_ADMIN_PRINCIPAL } from '../datos/semilla';
import {
  ErrorCorreoRegistrado,
  ErrorCredenciales,
  ErrorOperacionNoPermitida,
  ErrorUsuarioInexistente,
  ErrorValidacion,
} from '../dominio/errores';
import type {
  ContenidoLanding,
  Cuenta,
  Datos,
  Entrenamiento,
  Nivel,
  Plan,
} from '../dominio/modelos';
import {
  nivelDeAcceso,
  validarEntrenamiento,
  validarPlan,
  validarRegistro,
} from '../dominio/reglas';
import { borrarVideo, cargarDatos, guardarDatos, nuevoId } from '../infra/almacen';

/** Un alta o una edición: sin `id` se crea, con `id` se reemplaza. */
export type Borrador<T extends { id: string }> = Omit<T, 'id'> & { id?: string };

export type ValorApp = Omit<Datos, 'idSesion'> & {
  /** Cuenta con sesión abierta, o null. */
  cuenta: Cuenta | null;
  /** Nivel más alto de entrenamientos que la cuenta puede ver. */
  acceso: Nivel | null;

  registrar: (datos: { nombre: string; correo: string; contrasenia: string }) => void;
  ingresar: (credenciales: { correo: string; contrasenia: string }) => void;
  cerrarSesion: () => void;

  solicitarPlan: (idPlan: string) => void;
  cancelarSolicitud: () => void;

  guardarPlan: (plan: Borrador<Plan>) => void;
  eliminarPlan: (idPlan: string) => void;
  guardarEntrenamiento: (entrenamiento: Borrador<Entrenamiento>) => void;
  eliminarEntrenamiento: (idEntrenamiento: string) => void;
  /** Da de alta la solicitud pendiente: el plan pedido pasa a ser el activo. */
  aprobarSolicitud: (idCuenta: string) => void;
  rechazarSolicitud: (idCuenta: string) => void;
  /** Asigna un plan a mano, o da de baja con `null`. */
  asignarPlan: (idCuenta: string, idPlan: string | null) => void;
  eliminarCuenta: (idCuenta: string) => void;
  guardarContenido: (contenido: ContenidoLanding) => void;
};

const ContextoApp = createContext<ValorApp | null>(null);

const normalizarCorreo = (correo: string): string => correo.trim().toLowerCase();

function reemplazarOAgregar<T extends { id: string }>(lista: readonly T[], item: T): T[] {
  return lista.some((x) => x.id === item.id)
    ? lista.map((x) => (x.id === item.id ? item : x))
    : [...lista, item];
}

export function ProveedorApp({ children }: { children: ReactNode }): ReactElement {
  const [datos, setDatos] = useState<Datos>(cargarDatos);
  // Las acciones leen de la referencia para no trabajar sobre datos viejos si
  // se encadenan dos en el mismo ciclo de render.
  const actuales = useRef(datos);

  const valor = useMemo<ValorApp>(() => {
    const aplicar = (cambio: Partial<Datos>): void => {
      const nuevos = { ...actuales.current, ...cambio };
      actuales.current = nuevos;
      guardarDatos(nuevos);
      setDatos(nuevos);
    };

    const cuentaActual = (): Cuenta | null =>
      actuales.current.cuentas.find((c) => c.id === actuales.current.idSesion) ?? null;

    const exigirSesion = (): Cuenta => {
      const cuenta = cuentaActual();
      if (cuenta === null) throw new ErrorOperacionNoPermitida('Iniciá sesión para continuar');
      return cuenta;
    };

    const exigirAdmin = (): Cuenta => {
      const cuenta = exigirSesion();
      if (cuenta.rol !== 'administrador') throw new ErrorOperacionNoPermitida();
      return cuenta;
    };

    const cambiarCuenta = (idCuenta: string, cambio: Partial<Cuenta>): void => {
      aplicar({
        cuentas: actuales.current.cuentas.map((c) => (c.id === idCuenta ? { ...c, ...cambio } : c)),
      });
    };

    const cuenta = datos.cuentas.find((c) => c.id === datos.idSesion) ?? null;

    return {
      cuentas: datos.cuentas,
      planes: datos.planes,
      entrenamientos: datos.entrenamientos,
      contenido: datos.contenido,
      cuenta,
      acceso: nivelDeAcceso(cuenta, datos.planes),

      registrar({ nombre, correo, contrasenia }) {
        const campos = validarRegistro({ nombre, correo, contrasenia });
        if (Object.keys(campos).length > 0) throw new ErrorValidacion(campos);
        const correoNormal = normalizarCorreo(correo);
        if (actuales.current.cuentas.some((c) => c.correo === correoNormal)) {
          throw new ErrorCorreoRegistrado();
        }
        const nueva: Cuenta = {
          id: nuevoId('cuenta'),
          nombre: nombre.trim(),
          correo: correoNormal,
          contrasenia,
          rol: 'usuario',
          idPlan: null,
          idPlanSolicitado: null,
        };
        aplicar({ cuentas: [...actuales.current.cuentas, nueva], idSesion: nueva.id });
      },

      ingresar({ correo, contrasenia }) {
        const encontrada = actuales.current.cuentas.find(
          (c) => c.correo === normalizarCorreo(correo),
        );
        if (encontrada === undefined) throw new ErrorUsuarioInexistente();
        if (encontrada.contrasenia !== contrasenia) throw new ErrorCredenciales();
        aplicar({ idSesion: encontrada.id });
      },

      cerrarSesion() {
        aplicar({ idSesion: null });
      },

      solicitarPlan(idPlan) {
        const propia = exigirSesion();
        if (!actuales.current.planes.some((p) => p.id === idPlan) || propia.idPlan === idPlan) {
          throw new ErrorOperacionNoPermitida('Ese plan no se puede solicitar');
        }
        cambiarCuenta(propia.id, { idPlanSolicitado: idPlan });
      },

      cancelarSolicitud() {
        cambiarCuenta(exigirSesion().id, { idPlanSolicitado: null });
      },

      guardarPlan(plan) {
        exigirAdmin();
        const campos = validarPlan(plan);
        if (Object.keys(campos).length > 0) throw new ErrorValidacion(campos);
        const completo: Plan = { ...plan, id: plan.id ?? nuevoId('plan') };
        aplicar({ planes: reemplazarOAgregar(actuales.current.planes, completo) });
      },

      eliminarPlan(idPlan) {
        exigirAdmin();
        // Quien tenía o había pedido el plan eliminado queda sin él.
        aplicar({
          planes: actuales.current.planes.filter((p) => p.id !== idPlan),
          cuentas: actuales.current.cuentas.map((c) => ({
            ...c,
            idPlan: c.idPlan === idPlan ? null : c.idPlan,
            idPlanSolicitado: c.idPlanSolicitado === idPlan ? null : c.idPlanSolicitado,
          })),
        });
      },

      guardarEntrenamiento(entrenamiento) {
        exigirAdmin();
        const campos = validarEntrenamiento(entrenamiento);
        if (Object.keys(campos).length > 0) throw new ErrorValidacion(campos);
        const completo: Entrenamiento = {
          ...entrenamiento,
          id: entrenamiento.id ?? nuevoId('ent'),
        };
        aplicar({
          entrenamientos: reemplazarOAgregar(actuales.current.entrenamientos, completo),
        });
      },

      eliminarEntrenamiento(idEntrenamiento) {
        exigirAdmin();
        const eliminado = actuales.current.entrenamientos.find((e) => e.id === idEntrenamiento);
        if (eliminado?.video.tipo === 'archivo') void borrarVideo(eliminado.video.idArchivo);
        aplicar({
          entrenamientos: actuales.current.entrenamientos.filter((e) => e.id !== idEntrenamiento),
        });
      },

      aprobarSolicitud(idCuenta) {
        exigirAdmin();
        const destino = actuales.current.cuentas.find((c) => c.id === idCuenta);
        if (destino?.idPlanSolicitado == null) return;
        cambiarCuenta(idCuenta, { idPlan: destino.idPlanSolicitado, idPlanSolicitado: null });
      },

      rechazarSolicitud(idCuenta) {
        exigirAdmin();
        cambiarCuenta(idCuenta, { idPlanSolicitado: null });
      },

      asignarPlan(idCuenta, idPlan) {
        exigirAdmin();
        const destino = actuales.current.cuentas.find((c) => c.id === idCuenta);
        cambiarCuenta(idCuenta, {
          idPlan,
          // Si se le asigna justo el plan que había pedido, la solicitud queda resuelta.
          idPlanSolicitado: destino?.idPlanSolicitado === idPlan ? null : destino?.idPlanSolicitado,
        });
      },

      eliminarCuenta(idCuenta) {
        const admin = exigirAdmin();
        if (idCuenta === admin.id || idCuenta === ID_ADMIN_PRINCIPAL) {
          throw new ErrorOperacionNoPermitida('Esa cuenta no se puede eliminar');
        }
        aplicar({ cuentas: actuales.current.cuentas.filter((c) => c.id !== idCuenta) });
      },

      guardarContenido(contenido) {
        exigirAdmin();
        aplicar({ contenido });
      },
    };
  }, [datos]);

  return <ContextoApp.Provider value={valor}>{children}</ContextoApp.Provider>;
}

export function usarApp(): ValorApp {
  const valor = useContext(ContextoApp);
  if (valor === null) throw new Error('usarApp requiere un ProveedorApp por encima');
  return valor;
}
