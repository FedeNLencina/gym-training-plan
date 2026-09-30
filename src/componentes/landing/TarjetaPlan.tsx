/**
 * TarjetaPlan: presenta un plan de la Seccion_Planes.
 *
 * Muestra el plan completo (3.1): nombre, objetivo, precio con dos decimales
 * exactos, periodicidad y todas sus prestaciones. Para la asesoría y la
 * alimentación presenta explícitamente "incluido" o "no incluido" (3.2), en
 * lugar de mostrar u ocultar la prestación, de modo que el usuario compare qué
 * ofrece cada plan sin ambigüedad.
 *
 * El CTA "Elegir plan" es un enlace a `/registro?plan={id}` (3.3): transporta el
 * identificador del plan al registro y no solicita pago, porque el prototipo no
 * tiene pasarela. El destino se arma con `RUTAS.registro` para no divergir de la
 * ruta declarada.
 *
 * El destaque no es decisión de la tarjeta: la Seccion_Planes resuelve cuál
 * destacar (`resolverPlanRecomendado`) y se lo indica con `destacado`. Cuando lo
 * está, la tarjeta rotula "Recomendado" y aplica el color de acento del tema.
 *
 * Cubre: 3.1, 3.2, 3.3, 3.4
 */
import { type ReactElement } from 'react';
import { Link } from 'react-router-dom';

import type { Plan } from '../../dominio/modelos';
import { RUTAS } from '../../rutas/definicionRutas';

/** Etiqueta del plan destacado (3.4). */
export const ETIQUETA_RECOMENDADO = 'Recomendado';

/** Texto de inclusión de una prestación de sí/no (3.2). */
export const TEXTO_INCLUIDO = 'incluido';
export const TEXTO_NO_INCLUIDO = 'no incluido';

/** Destino del CTA "Elegir plan" para el plan indicado (3.3). */
export function destinoElegirPlan(idPlan: string): string {
  return `${RUTAS.registro}?plan=${encodeURIComponent(idPlan)}`;
}

/** Formatea el precio con exactamente dos decimales (3.1). */
function formatearPrecio(precio: number): string {
  return precio.toFixed(2);
}

export type PropiedadesTarjetaPlan = {
  plan: Plan;
  /** Si la Seccion_Planes resolvió destacar este plan como recomendado. */
  destacado: boolean;
};

/** Presenta si una prestación de sí/no está incluida, con su rótulo. */
function LineaInclusion({
  etiqueta,
  incluida,
}: {
  etiqueta: string;
  incluida: boolean;
}): ReactElement {
  return (
    <li className="tarjeta-plan__inclusion">
      <span>{etiqueta}</span>
      <span>{incluida ? TEXTO_INCLUIDO : TEXTO_NO_INCLUIDO}</span>
    </li>
  );
}

export default function TarjetaPlan({
  plan,
  destacado,
}: PropiedadesTarjetaPlan): ReactElement {
  const clase = destacado
    ? 'tarjeta-plan tarjeta-plan--destacada'
    : 'tarjeta-plan';

  return (
    <li className={clase}>
      {destacado && (
        <p className="tarjeta-plan__etiqueta">{ETIQUETA_RECOMENDADO}</p>
      )}
      <h3 className="tarjeta-plan__nombre">{plan.nombre}</h3>
      <p className="tarjeta-plan__objetivo">{plan.objetivo}</p>
      <p className="tarjeta-plan__precio">
        {`$${formatearPrecio(plan.precio)} / ${plan.periodicidad}`}
      </p>
      <ul className="tarjeta-plan__prestaciones">
        {plan.prestaciones.map((prestacion) => (
          <li key={prestacion}>{prestacion}</li>
        ))}
      </ul>
      <ul className="tarjeta-plan__inclusiones">
        <LineaInclusion etiqueta="Asesoría" incluida={plan.incluyeAsesoria} />
        <LineaInclusion
          etiqueta="Alimentación"
          incluida={plan.incluyeAlimentacion}
        />
      </ul>
      <Link className="boton boton--primario" to={destinoElegirPlan(plan.id)}>
        Elegir plan
      </Link>
    </li>
  );
}
