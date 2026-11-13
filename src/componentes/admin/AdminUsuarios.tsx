import type { ReactElement } from 'react';

import { ID_ADMIN_PRINCIPAL } from '../../datos/semilla';
import type { Cuenta } from '../../dominio/modelos';
import { ordenarPorPrecio } from '../../dominio/reglas';
import { usarApp } from '../../estado/ContextoApp';

export default function AdminUsuarios(): ReactElement {
  const { cuentas, planes, cuenta: propia, aprobarSolicitud, rechazarSolicitud, asignarPlan, eliminarCuenta } =
    usarApp();
  const planesOrdenados = ordenarPorPrecio(planes);
  const nombrePlan = (id: string | null): string => planes.find((p) => p.id === id)?.nombre ?? '';

  const eliminar = (c: Cuenta): void => {
    if (window.confirm(`¿Eliminar la cuenta de ${c.nombre}?`)) eliminarCuenta(c.id);
  };

  return (
    <>
      <div className="panel-admin__cabecera">
        <h2>Usuarios</h2>
      </div>
      <p className="seccion__bajada">
        Cuando un usuario pide un plan y confirmás su pago, dalo de alta. También podés asignar o quitar
        un plan a mano.
      </p>
      <div className="tabla-contenedor">
        <table className="tabla">
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">Correo</th>
              <th scope="col">Plan activo</th>
              <th scope="col">Solicitud</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cuentas.map((c) => {
              const esAdmin = c.rol === 'administrador';
              return (
                <tr key={c.id}>
                  <th scope="row">{c.nombre}</th>
                  <td>{c.correo}</td>
                  <td>
                    {esAdmin ? (
                      'Administrador'
                    ) : (
                      <select className="campo__control" aria-label={`Plan activo de ${c.nombre}`}
                        value={c.idPlan ?? ''}
                        onChange={(e) => asignarPlan(c.id, e.target.value === '' ? null : e.target.value)}>
                        <option value="">Sin plan</option>
                        {planesOrdenados.map((plan) => (
                          <option key={plan.id} value={plan.id}>{plan.nombre}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    {c.idPlanSolicitado === null ? (
                      <span className="tabla__vacio">Sin solicitud</span>
                    ) : (
                      <div className="tabla__acciones">
                        <span className="tabla__pendiente">Pidió {nombrePlan(c.idPlanSolicitado)}</span>
                        <button type="button" className="boton-primario boton--compacto"
                          onClick={() => aprobarSolicitud(c.id)}>Dar de alta</button>
                        <button type="button" className="boton-secundario boton--compacto"
                          onClick={() => rechazarSolicitud(c.id)}>Rechazar</button>
                      </div>
                    )}
                  </td>
                  <td>
                    {c.id !== propia?.id && c.id !== ID_ADMIN_PRINCIPAL && (
                      <button type="button" className="boton-secundario boton--compacto"
                        onClick={() => eliminar(c)}>Eliminar</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
