import type { ReactElement, ReactNode } from 'react';

type PropiedadesCampo = {
  id: string;
  etiqueta: string;
  error?: string;
  ayuda?: string;
  children: ReactNode;
};

/** Envoltorio de un control de formulario: etiqueta, control y mensaje de error. */
export function Campo({ id, etiqueta, error, ayuda, children }: PropiedadesCampo): ReactElement {
  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      {children}
      {ayuda !== undefined && <p className="campo__ayuda">{ayuda}</p>}
      {error !== undefined && (
        <p className="campo__error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

type PropiedadesCampoTexto = Omit<PropiedadesCampo, 'children'> & {
  valor: string;
  alCambiar: (valor: string) => void;
  tipo?: 'text' | 'number' | 'url';
  /** Cantidad de filas: con valor, el control es un área de texto. */
  filas?: number;
};

export function CampoTexto({
  id,
  etiqueta,
  error,
  ayuda,
  valor,
  alCambiar,
  tipo = 'text',
  filas,
}: PropiedadesCampoTexto): ReactElement {
  const comunes = {
    id,
    className: 'campo__control',
    value: valor,
    'aria-invalid': error !== undefined,
    'aria-describedby': error !== undefined ? `${id}-error` : undefined,
  };
  return (
    <Campo id={id} etiqueta={etiqueta} error={error} ayuda={ayuda}>
      {filas !== undefined ? (
        <textarea {...comunes} rows={filas} onChange={(e) => alCambiar(e.target.value)} />
      ) : (
        <input
          {...comunes}
          type={tipo}
          inputMode={tipo === 'number' ? 'numeric' : undefined}
          onChange={(e) => alCambiar(e.target.value)}
        />
      )}
    </Campo>
  );
}
