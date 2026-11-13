import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import TarjetaPlan from '../componentes/TarjetaPlan';
import type { Plan } from '../dominio/modelos';
import { ordenarPorPrecio } from '../dominio/reglas';
import { usarApp } from '../estado/ContextoApp';
import { RUTAS } from '../rutas/rutas';

/** Estado o acción al pie de cada plan, según quién lo mira. */
function PiePlan({ plan }: { plan: Plan }): ReactElement {
  const { cuenta, contenido, solicitarPlan, cancelarSolicitud } = usarApp();

  if (cuenta === null) {
    return (
      <Link to={RUTAS.ingresar} state={{ desde: RUTAS.planes }} className="boton-secundario">
        Iniciá sesión para adquirirlo
      </Link>
    );
  }
  if (cuenta.rol === 'administrador') {
    return <p className="plan__nota">Los planes se editan desde Administración.</p>;
  }
  if (cuenta.idPlan === plan.id) {
    return <p className="plan__estado plan__estado--activo">Tu plan actual</p>;
  }
  if (cuenta.idPlanSolicitado === plan.id) {
    return (
      <>
        <p className="plan__estado">Solicitud pendiente</p>
        <p className="plan__nota">{contenido.instruccionesPago}</p>
        <button type="button" className="boton-secundario boton--compacto" onClick={cancelarSolicitud}>
          Cancelar solicitud
        </button>
      </>
    );
  }
  return (
    <button type="button" className="boton-primario" onClick={() => solicitarPlan(plan.id)}>
      {cuenta.idPlan === null ? 'Adquirir plan' : 'Cambiar a este plan'}
    </button>
  );
}

export default function Planes(): ReactElement {
  const { planes, cuenta } = usarApp();

  return (
    <section className="seccion contenedor">
      <h1>Planes</h1>
      <p className="seccion__bajada">
        Cada plan incluye los entrenamientos de su nivel y los de los niveles anteriores.
        {cuenta === null && ' Para adquirir uno, primero iniciá sesión o registrate.'}
      </p>

      {planes.length === 0 ? (
        <p className="mensaje">Todavía no hay planes publicados.</p>
      ) : (
        <div className="grilla-planes">
          {ordenarPorPrecio(planes).map((plan) => (
            <TarjetaPlan key={plan.id} plan={plan} destacada={cuenta?.idPlan === plan.id}>
              <PiePlan plan={plan} />
            </TarjetaPlan>
          ))}
        </div>
      )}
    </section>
  );
}
