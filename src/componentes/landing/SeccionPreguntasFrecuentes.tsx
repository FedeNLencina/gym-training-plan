/**
 * SeccionPreguntasFrecuentes: "Preguntas frecuentes".
 *
 * Presenta ≥ 4 pares de pregunta y respuesta con `details`/`summary`, de modo
 * que cada respuesta se despliega desde su pregunta de forma accesible por
 * teclado y sin JavaScript. Encabezado de nivel 2 con texto único dentro de la
 * página (1.9).
 *
 * Cubre: 1.9
 */
import { type ReactElement } from 'react';

import type { PreguntaFrecuente } from '../../dominio/modelos';

export default function SeccionPreguntasFrecuentes({
  preguntas,
}: {
  preguntas: PreguntaFrecuente[];
}): ReactElement {
  return (
    <section className="seccion" aria-labelledby="preguntas-titulo">
      <div className="contenedor">
        <div className="seccion__encabezado">
          <h2 id="preguntas-titulo">Preguntas frecuentes</h2>
        </div>
        <ul className="lista-preguntas">
          {preguntas.map((par) => (
            <li key={par.pregunta}>
              <details className="tarjeta">
                <summary className="tarjeta__titulo">{par.pregunta}</summary>
                <p className="tarjeta__texto">{par.respuesta}</p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
