import { Check } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import type { Plan } from '../dominio/modelos';
import { formatearPrecio } from '../dominio/reglas';
import EtiquetaNivel from './EtiquetaNivel';

type Propiedades = {
  plan: Plan;
  /** Resalta la tarjeta del plan activo del usuario. */
  destacada?: boolean;
  /** Acción o estado al pie de la tarjeta. */
  children?: ReactNode;
};

export default function TarjetaPlan({ plan, destacada = false, children }: Propiedades): ReactElement {
  return (
    <article className={destacada ? 'plan plan--activo' : 'plan'} aria-label={`Plan ${plan.nombre}`}>
      <div className="plan__cabecera">
        <h3 className="plan__nombre">{plan.nombre}</h3>
        <EtiquetaNivel nivel={plan.nivel} />
      </div>
      <p className="plan__precio">
        {formatearPrecio(plan.precio)} <small>por mes</small>
      </p>
      <p className="plan__descripcion">{plan.descripcion}</p>
      <ul className="plan__beneficios">
        {plan.beneficios.map((beneficio) => (
          <li key={beneficio}>
            <Check size={16} strokeWidth={3} aria-hidden="true" />
            {beneficio}
          </li>
        ))}
      </ul>
      {children !== undefined && <div className="plan__pie">{children}</div>}
    </article>
  );
}
