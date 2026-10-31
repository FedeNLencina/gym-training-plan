/**
 * GestionUsuarios: vista de administración de cuentas.
 *
 * El acceso por rol lo resuelve `RutaProtegida`, que envuelve esta vista en el
 * árbol de rutas: un Usuario que solicita `/admin/usuarios` es devuelto a
 * `/entrenamientos` y un Visitante a `/ingresar` (7.2, 7.8). Por eso la vista no
 * repite esas decisiones: cuando se monta, la sesión ya tiene rol administrador.
 *
 * La vista orquesta tres colaboradores que llegan por el ContextoServicios:
 *
 * - **GestionCuentas**, para listar las cuentas y aplicar los cambios de rol y
 *   las eliminaciones.
 * - **Repositorio_Datos**, para los planes, de modo que el plan de cada cuenta
 *   se presente por su nombre y no por su identificador.
 * - **ServicioProgreso**, para purgar el progreso de la cuenta eliminada. La
 *   purga se hace acá y no dentro del ServicioAutenticacion porque ese servicio
 *   no conoce el progreso: acoplarlos obligaría a que la autenticación dependa
 *   de la persistencia del avance. Que viva en la vista es deliberado, y es la
 *   razón por la que hay una prueba que lo verifica.
 *
 * La eliminación es irreversible y se lleva el progreso, así que pasa por el
 * DialogoConfirmacion que compone ListaUsuariosAdmin.
 *
 * Toda negativa del servicio —degradar al último Administrador, eliminar al
 * Administrador principal— se presenta con el mensaje del propio error de
 * dominio en lugar de un texto genérico: el motivo concreto es lo único que le
 * permite al Administrador entender qué le falta para lograr lo que quería.
 */
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';

import ListaUsuariosAdmin from '../componentes/admin/ListaUsuariosAdmin';
import { esErrorDominio } from '../dominio/errores';
import type { Plan, Rol } from '../dominio/modelos';
import { useAvisos } from '../estado/ContextoAvisos';
import { usarServicios } from '../estado/ContextoServicios';
import { usarSesion } from '../estado/ContextoSesion';
import type { ResumenCuenta } from '../servicios/servicioAutenticacion';
import { RUTAS } from '../rutas/definicionRutas';

export const TITULO_GESTION_USUARIOS = 'Gestión de usuarios';
export const MENSAJE_CARGANDO = 'Cargando cuentas';
export const MENSAJE_ERROR = 'No pudimos cargar las cuentas';
export const MENSAJE_ROL_ACTUALIZADO = 'Rol actualizado';
export const MENSAJE_CUENTA_ELIMINADA = 'Cuenta eliminada';
export const MENSAJE_FALLO_ROL = 'No pudimos cambiar el rol';
export const MENSAJE_FALLO_ELIMINACION = 'No pudimos eliminar la cuenta';
export const MENSAJE_SIN_GESTION =
  'La gestión de cuentas no está disponible en este entorno';

type EstadoCarga = 'cargando' | 'listo' | 'error';

/** Envoltura de la vista: fija el encabezado accesible y el enlace de vuelta. */
function Vista({ children }: { children: ReactElement }): ReactElement {
  return (
    <section className="seccion" aria-labelledby="gestion-usuarios-titulo">
      <div className="contenedor">
        <div className="seccion__encabezado">
          <h1 id="gestion-usuarios-titulo">{TITULO_GESTION_USUARIOS}</h1>
          <Link className="tarjeta__enlace" to={RUTAS.admin}>
            Volver al panel
          </Link>
        </div>
        {children}
      </div>
    </section>
  );
}

export default function GestionUsuarios(): ReactElement {
  const { repositorio, gestionCuentas, servicioProgreso } = usarServicios();
  const { sesion } = usarSesion();
  const { publicarAviso } = useAvisos();

  const [estado, setEstado] = useState<EstadoCarga>('cargando');
  const [cuentas, setCuentas] = useState<ResumenCuenta[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);

  /**
   * Relee cuentas y planes. Las dos lecturas van juntas porque la vista no
   * puede presentar una cuenta sin saber el nombre de su plan.
   */
  const cargar = useCallback(async (): Promise<void> => {
    if (gestionCuentas === null) {
      setEstado('error');
      return;
    }
    setEstado('cargando');
    try {
      const [leidas, leidos] = await Promise.all([
        gestionCuentas.listarCuentas(),
        repositorio.obtenerPlanes(),
      ]);
      setCuentas(leidas);
      setPlanes(leidos);
      setEstado('listo');
    } catch {
      setEstado('error');
    }
  }, [gestionCuentas, repositorio]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  /** Mensaje presentable de un fallo: el del dominio, o el genérico dado. */
  const motivoDe = (fallo: unknown, generico: string): string =>
    esErrorDominio(fallo) && fallo.message.trim() !== ''
      ? fallo.message
      : generico;

  const cambiarRol = async (correo: string, rol: Rol): Promise<void> => {
    if (gestionCuentas === null) return;
    try {
      await gestionCuentas.cambiarRol(correo, rol);
      await cargar();
      publicarAviso(MENSAJE_ROL_ACTUALIZADO);
    } catch (fallo) {
      // La lista se relee igual: así el selector vuelve al rol que la cuenta
      // tiene de verdad en lugar de quedar mostrando el que se intentó poner.
      await cargar();
      publicarAviso(motivoDe(fallo, MENSAJE_FALLO_ROL), 'error');
    }
  };

  const eliminar = async (correo: string): Promise<void> => {
    if (gestionCuentas === null) return;
    try {
      await gestionCuentas.eliminarCuenta(correo);
      // El progreso se purga sólo si la cuenta se eliminó de verdad: ante una
      // negativa del servicio, la cuenta sigue existiendo y su progreso debe
      // seguir intacto.
      await servicioProgreso?.olvidarCuenta(correo);
      await cargar();
      publicarAviso(MENSAJE_CUENTA_ELIMINADA);
    } catch (fallo) {
      publicarAviso(motivoDe(fallo, MENSAJE_FALLO_ELIMINACION), 'error');
    }
  };

  if (gestionCuentas === null) {
    return (
      <Vista>
        <p className="seccion__bajada">{MENSAJE_SIN_GESTION}</p>
      </Vista>
    );
  }

  if (estado === 'cargando') {
    return (
      <Vista>
        <p className="seccion__bajada" role="status">
          {MENSAJE_CARGANDO}
        </p>
      </Vista>
    );
  }

  if (estado === 'error') {
    return (
      <Vista>
        <div className="seccion__estado">
          <p className="seccion__bajada">{MENSAJE_ERROR}</p>
          <button
            type="button"
            className="boton"
            onClick={() => {
              void cargar();
            }}
          >
            Reintentar
          </button>
        </div>
      </Vista>
    );
  }

  return (
    <Vista>
      <ListaUsuariosAdmin
        cuentas={cuentas}
        planes={planes}
        correoSesion={sesion?.correo ?? ''}
        onCambiarRol={(correo, rol) => {
          void cambiarRol(correo, rol);
        }}
        onEliminar={(correo) => {
          void eliminar(correo);
        }}
      />
    </Vista>
  );
}
