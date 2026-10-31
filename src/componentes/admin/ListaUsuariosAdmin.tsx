/**
 * ListaUsuariosAdmin: listado de cuentas administrables.
 *
 * Presenta, para el Administrador, las cuentas de la Plataforma con su nombre,
 * su correo, su plan y su rol, y ofrece por fila el cambio de rol y la
 * eliminación.
 *
 * Es un componente de presentación puro: recibe las cuentas ya cargadas y no
 * conoce el ServicioAutenticacion ni el estado de la carga. `GestionUsuarios`
 * resuelve la carga, aplica los cambios y publica los avisos; acá sólo se
 * delega en `onCambiarRol` y `onEliminar`. La eliminación pasa primero por un
 * DialogoConfirmacion, igual que la de Entrenamientos (7.6, 7.9), porque borrar
 * una cuenta se lleva también su progreso.
 *
 * No se ofrece editar el correo a propósito: el correo es la clave con la que el
 * ServicioProgreso aísla el progreso de cada cuenta, así que cambiarlo dejaría
 * el historial y el avance huérfanos.
 *
 * El plan se presenta por su nombre y no por su identificador, y una cuenta
 * cuyo plan ya no existe se presenta como sin plan en lugar de mostrar un
 * identificador colgado.
 */
import { useId, useState, type ReactElement } from 'react';

import { ROLES, type Plan, type Rol } from '../../dominio/modelos';
import type { ResumenCuenta } from '../../servicios/servicioAutenticacion';
import DialogoConfirmacion from './DialogoConfirmacion';

export const MENSAJE_LISTA_VACIA = 'Todavía no hay cuentas para administrar';

/** Texto con el que se presenta una cuenta sin plan vigente. */
export const SIN_PLAN = 'Sin plan';

/** Etiqueta de cada rol en el selector, en el lenguaje de la Plataforma. */
const ETIQUETA_ROL: Record<Rol, string> = {
  usuario: 'Usuario',
  administrador: 'Administrador',
};

export type PropiedadesListaUsuariosAdmin = {
  cuentas: ResumenCuenta[];
  /** Planes vigentes, para presentar el plan de cada cuenta por su nombre. */
  planes: Plan[];
  /** Correo de la sesión activa, para señalar la fila propia. */
  correoSesion: string;
  /** Se invoca con el correo de la cuenta y el rol elegido. */
  onCambiarRol?: (correo: string, rol: Rol) => void;
  /** Se invoca con el correo de la cuenta cuya eliminación se confirma. */
  onEliminar?: (correo: string) => void;
};

/** Selector de rol de una cuenta, etiquetado con el nombre de su dueño. */
function SelectorRol({
  cuenta,
  onCambiarRol,
}: {
  cuenta: ResumenCuenta;
  onCambiarRol?: (correo: string, rol: Rol) => void;
}): ReactElement {
  const idEtiqueta = useId();

  return (
    <div className="campo campo--compacto">
      <label className="campo__etiqueta" htmlFor={idEtiqueta}>
        {`Rol de ${cuenta.nombre}`}
      </label>
      <select
        id={idEtiqueta}
        className="campo__control"
        value={cuenta.rol}
        onChange={(evento) =>
          onCambiarRol?.(cuenta.correo, evento.target.value as Rol)
        }
      >
        {ROLES.map((rol) => (
          <option key={rol} value={rol}>
            {ETIQUETA_ROL[rol]}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function ListaUsuariosAdmin({
  cuentas,
  planes,
  correoSesion,
  onCambiarRol,
  onEliminar,
}: PropiedadesListaUsuariosAdmin): ReactElement {
  // Cuenta cuya eliminación se está confirmando; `null` mientras no hay
  // diálogo abierto.
  const [enConfirmacion, setEnConfirmacion] = useState<ResumenCuenta | null>(
    null,
  );

  if (cuentas.length === 0) {
    return <p className="seccion__bajada">{MENSAJE_LISTA_VACIA}</p>;
  }

  const nombrePlan = (idPlan: string | null): string =>
    planes.find((plan) => plan.id === idPlan)?.nombre ?? SIN_PLAN;

  const confirmar = (): void => {
    if (enConfirmacion === null) return;
    const correo = enConfirmacion.correo;
    setEnConfirmacion(null);
    onEliminar?.(correo);
  };

  return (
    <>
      <ul className="lista-usuarios">
        {cuentas.map((cuenta) => (
          <li
            className="lista-usuarios__fila tarjeta"
            key={cuenta.id}
            aria-label={cuenta.nombre}
          >
            <div className="lista-usuarios__identidad">
              <h3 className="tarjeta__titulo">
                {cuenta.nombre}
                {cuenta.correo === correoSesion ? (
                  <span className="etiqueta-acento lista-usuarios__propia">
                    Vos
                  </span>
                ) : null}
              </h3>
              <p className="lista-usuarios__correo">{cuenta.correo}</p>
              <div className="tarjeta__meta">
                <span>{nombrePlan(cuenta.idPlan)}</span>
              </div>
            </div>

            <div className="lista-usuarios__acciones">
              <SelectorRol cuenta={cuenta} onCambiarRol={onCambiarRol} />
              <button
                type="button"
                className="boton-secundario boton--compacto"
                aria-label={`Eliminar ${cuenta.nombre}`}
                onClick={() => setEnConfirmacion(cuenta)}
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>

      {enConfirmacion !== null && (
        <DialogoConfirmacion
          titulo="Eliminar cuenta"
          mensaje={`¿Seguro que querés eliminar la cuenta de ${enConfirmacion.nombre} (${enConfirmacion.correo})? Se borra también todo su progreso.`}
          etiquetaConfirmar="Eliminar"
          onConfirmar={confirmar}
          onCancelar={() => setEnConfirmacion(null)}
        />
      )}
    </>
  );
}
