/**
 * SeccionPlanes: "Planes" de la Landing_Page.
 *
 * Presenta la lista de planes disponibles, cada uno como una `TarjetaPlan` con
 * su información completa y el CTA "Elegir plan" hacia `/registro?plan={id}`
 * (3.1, 3.2, 3.3). Los datos llegan de `usePlanes`, que toma el
 * Repositorio_Datos y el reloj del ContextoServicios, de modo que esta sección
 * no sabe de dónde salen los planes ni cómo se mide el plazo de carga.
 *
 * El destaque del plan recomendado se resuelve en el dominio con
 * `resolverPlanRecomendado`: se destaca y rotula "Recomendado" a un plan si y
 * sólo si hay exactamente uno marcado como recomendado (3.4, 3.5).
 *
 * La sección nombra su estado, y de ahí salen las tres situaciones sin lista de
 * planes, todas sin CTA "Elegir plan":
 *
 * - **Cargando** (3.7): presenta un indicador de carga y ninguna tarjeta.
 * - **Vacío** (3.6): presenta "No hay planes disponibles por el momento".
 * - **Error** (3.8): presenta "No pudimos cargar los planes" y la acción
 *   "Reintentar", que vuelve a solicitar la lista con `recargar`.
 *
 * En cualquier estado conserva su encabezado accesible "Planes" y el ancla
 * `#planes` que consume la navegación de la Navbar (2.5, 2.9), de modo que las
 * ocho secciones de la Landing_Page permanezcan presentes y ordenadas.
 *
 * Cubre: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */
import { type ReactElement } from 'react';

import { resolverPlanRecomendado } from '../../dominio/planes';
import { usarServicios } from '../../estado/ContextoServicios';
import { usePlanes } from '../../estado/usePlanes';
import { ANCLA_PLANES } from '../../layout/useNavegacionLanding';
import TarjetaPlan from './TarjetaPlan';

export const MENSAJE_PLANES_VACIO = 'No hay planes disponibles por el momento';
export const MENSAJE_PLANES_CARGANDO = 'Cargando planes';

/** Envoltura de la sección: fija encabezado, ancla y región accesible. */
function Seccion({ children }: { children: ReactElement }): ReactElement {
  return (
    <section
      id={ANCLA_PLANES}
      className="seccion seccion--superficie"
      aria-labelledby="planes-titulo"
    >
      <div className="contenedor">
        <div className="seccion__encabezado">
          <h2 id="planes-titulo">Planes</h2>
        </div>
        {children}
      </div>
    </section>
  );
}

export default function SeccionPlanes(): ReactElement {
  const { repositorio, reloj } = usarServicios();
  const { estado, datos, error, recargar } = usePlanes({ repositorio, reloj });

  if (estado === 'cargando') {
    return (
      <Seccion>
        <p className="seccion__bajada" role="status">
          {MENSAJE_PLANES_CARGANDO}
        </p>
      </Seccion>
    );
  }

  if (estado === 'error') {
    return (
      <Seccion>
        <div className="seccion__estado">
          <p className="seccion__bajada">
            {error?.message ?? 'No pudimos cargar los planes'}
          </p>
          <button type="button" className="boton" onClick={recargar}>
            Reintentar
          </button>
        </div>
      </Seccion>
    );
  }

  if (datos.length === 0) {
    return (
      <Seccion>
        <p className="seccion__bajada">{MENSAJE_PLANES_VACIO}</p>
      </Seccion>
    );
  }

  const idDestacado = resolverPlanRecomendado(datos);

  return (
    <Seccion>
      <ul className="grilla grilla--planes">
        {datos.map((plan) => (
          <TarjetaPlan
            key={plan.id}
            plan={plan}
            destacado={plan.id === idDestacado}
          />
        ))}
      </ul>
    </Seccion>
  );
}
