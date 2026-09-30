/**
 * EditorEjercicios: edición de la lista de Ejercicios de un Entrenamiento.
 *
 * Componente controlado: recibe la lista de Ejercicios y avisa cada cambio a
 * través de `onChange`, sin conservar estado propio. Por cada Ejercicio presenta
 * los campos nombre, series, repeticiones y descanso con etiquetas accesibles
 * numeradas (para que dos filas no compartan nombre accesible), y permite
 * agregar y quitar Ejercicios. Los mensajes de validación por campo se asocian
 * al control afectado mediante `aria-describedby` (7.4).
 *
 * El editor no valida: la validación al enviar y los rangos del formulario viven
 * en `FormularioEntrenamiento`, que le pasa los `errores` por posición. El editor
 * sólo presenta y edita.
 *
 * Cubre: 7.4
 */
import { type ChangeEvent, type ReactElement } from 'react';

import { crearEjercicio, type Ejercicio } from '../../dominio/modelos';

/** Mensajes de validación de un Ejercicio, indexados por nombre de campo. */
export type ErroresEjercicio = Readonly<Record<string, string>>;

export const ETIQUETA_AGREGAR = 'Agregar ejercicio';

/** Campos numéricos del Ejercicio, para el mapeo etiqueta → propiedad. */
type CampoNumerico = 'series' | 'repeticiones' | 'descansoSegundos';

export type PropiedadesEditorEjercicios = {
  ejercicios: Ejercicio[];
  /** Errores por posición; cada entrada es el mapa de campos del Ejercicio. */
  errores: ErroresEjercicio[];
  onChange: (ejercicios: Ejercicio[]) => void;
};

/**
 * Convierte el texto de un campo numérico a número. Una entrada vacía o no
 * numérica se deja como `NaN` para que la validación del formulario la rechace
 * con su mensaje, en lugar de coaccionarla silenciosamente a cero.
 */
function aNumero(texto: string): number {
  if (texto.trim() === '') return Number.NaN;
  return Number(texto);
}

/** Convierte un valor numérico a texto para el control; `NaN` se muestra vacío. */
function aTexto(valor: number): string {
  return Number.isNaN(valor) ? '' : String(valor);
}

export default function EditorEjercicios({
  ejercicios,
  errores,
  onChange,
}: PropiedadesEditorEjercicios): ReactElement {
  const cambiarTexto = (
    indice: number,
    valor: string,
  ): void => {
    onChange(
      ejercicios.map((ejercicio, i) =>
        i === indice ? { ...ejercicio, nombre: valor } : ejercicio,
      ),
    );
  };

  const cambiarNumero = (
    indice: number,
    campo: CampoNumerico,
    evento: ChangeEvent<HTMLInputElement>,
  ): void => {
    const valor = aNumero(evento.target.value);
    onChange(
      ejercicios.map((ejercicio, i) =>
        i === indice ? { ...ejercicio, [campo]: valor } : ejercicio,
      ),
    );
  };

  const agregar = (): void => {
    onChange([...ejercicios, crearEjercicio()]);
  };

  const quitar = (indice: number): void => {
    onChange(ejercicios.filter((_, i) => i !== indice));
  };

  return (
    <div>
      <ul className="editor-ejercicios">
        {ejercicios.map((ejercicio, indice) => {
          const numero = indice + 1;
          const errorFila = errores[indice] ?? {};
          const prefijo = `ejercicio-${ejercicio.id}`;
          return (
            <li className="editor-ejercicios__fila" key={ejercicio.id}>
              <div className="campo">
                <label
                  className="campo__etiqueta"
                  htmlFor={`${prefijo}-nombre`}
                >{`Nombre del ejercicio ${numero}`}</label>
                <input
                  id={`${prefijo}-nombre`}
                  className="campo__control"
                  type="text"
                  value={ejercicio.nombre}
                  aria-invalid={errorFila.nombre !== undefined}
                  aria-describedby={
                    errorFila.nombre !== undefined
                      ? `${prefijo}-nombre-error`
                      : undefined
                  }
                  onChange={(evento) => cambiarTexto(indice, evento.target.value)}
                />
                {errorFila.nombre !== undefined && (
                  <p className="campo__error" id={`${prefijo}-nombre-error`}>
                    {errorFila.nombre}
                  </p>
                )}
              </div>

              <div className="campo">
                <label
                  className="campo__etiqueta"
                  htmlFor={`${prefijo}-series`}
                >{`Series del ejercicio ${numero}`}</label>
                <input
                  id={`${prefijo}-series`}
                  className="campo__control"
                  type="number"
                  inputMode="numeric"
                  value={aTexto(ejercicio.series)}
                  aria-invalid={errorFila.series !== undefined}
                  aria-describedby={
                    errorFila.series !== undefined
                      ? `${prefijo}-series-error`
                      : undefined
                  }
                  onChange={(evento) =>
                    cambiarNumero(indice, 'series', evento)
                  }
                />
                {errorFila.series !== undefined && (
                  <p className="campo__error" id={`${prefijo}-series-error`}>
                    {errorFila.series}
                  </p>
                )}
              </div>

              <div className="campo">
                <label
                  className="campo__etiqueta"
                  htmlFor={`${prefijo}-repeticiones`}
                >{`Repeticiones del ejercicio ${numero}`}</label>
                <input
                  id={`${prefijo}-repeticiones`}
                  className="campo__control"
                  type="number"
                  inputMode="numeric"
                  value={aTexto(ejercicio.repeticiones)}
                  aria-invalid={errorFila.repeticiones !== undefined}
                  aria-describedby={
                    errorFila.repeticiones !== undefined
                      ? `${prefijo}-repeticiones-error`
                      : undefined
                  }
                  onChange={(evento) =>
                    cambiarNumero(indice, 'repeticiones', evento)
                  }
                />
                {errorFila.repeticiones !== undefined && (
                  <p
                    className="campo__error"
                    id={`${prefijo}-repeticiones-error`}
                  >
                    {errorFila.repeticiones}
                  </p>
                )}
              </div>

              <div className="campo">
                <label
                  className="campo__etiqueta"
                  htmlFor={`${prefijo}-descanso`}
                >{`Descanso del ejercicio ${numero} (segundos)`}</label>
                <input
                  id={`${prefijo}-descanso`}
                  className="campo__control"
                  type="number"
                  inputMode="numeric"
                  value={aTexto(ejercicio.descansoSegundos)}
                  aria-invalid={errorFila.descansoSegundos !== undefined}
                  aria-describedby={
                    errorFila.descansoSegundos !== undefined
                      ? `${prefijo}-descanso-error`
                      : undefined
                  }
                  onChange={(evento) =>
                    cambiarNumero(indice, 'descansoSegundos', evento)
                  }
                />
                {errorFila.descansoSegundos !== undefined && (
                  <p className="campo__error" id={`${prefijo}-descanso-error`}>
                    {errorFila.descansoSegundos}
                  </p>
                )}
              </div>

              <button
                type="button"
                className="boton-secundario"
                onClick={() => quitar(indice)}
              >
                {`Quitar ejercicio ${numero}`}
              </button>
            </li>
          );
        })}
      </ul>

      <button type="button" className="boton-secundario" onClick={agregar}>
        {ETIQUETA_AGREGAR}
      </button>
    </div>
  );
}
