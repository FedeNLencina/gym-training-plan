import { useState, type FormEvent, type ReactElement } from 'react';

import type { ContenidoLanding } from '../../dominio/modelos';
import { usarApp } from '../../estado/ContextoApp';
import { CampoTexto } from '../Campo';

/** Reemplaza el elemento `indice` de una lista por el resultado de fusionar `cambio`. */
function conCambio<T>(lista: readonly T[], indice: number, cambio: Partial<T>): T[] {
  return lista.map((item, i) => (i === indice ? { ...item, ...cambio } : item));
}

export default function AdminContenido(): ReactElement {
  const { contenido, guardarContenido } = usarApp();
  const [borrador, setBorrador] = useState<ContenidoLanding>(contenido);
  const [guardado, setGuardado] = useState(false);

  const cambiar = (cambio: Partial<ContenidoLanding>): void => {
    setGuardado(false);
    setBorrador((actual) => ({ ...actual, ...cambio }));
  };

  const enviar = (evento: FormEvent): void => {
    evento.preventDefault();
    // Los pasos y preguntas que quedaron en blanco no se publican.
    const limpio: ContenidoLanding = {
      ...borrador,
      pasos: borrador.pasos.filter((p) => p.titulo.trim() !== ''),
      preguntas: borrador.preguntas.filter((p) => p.pregunta.trim() !== ''),
    };
    guardarContenido(limpio);
    setBorrador(limpio);
    setGuardado(true);
  };

  return (
    <form className="formulario formulario--ancho" noValidate onSubmit={enviar}>
      <h2>Contenido de la página de inicio</h2>

      <CampoTexto id="cont-titulo" etiqueta="Título principal" valor={borrador.heroTitulo}
        alCambiar={(heroTitulo) => cambiar({ heroTitulo })} />
      <CampoTexto id="cont-texto" etiqueta="Texto principal" filas={3} valor={borrador.heroTexto}
        alCambiar={(heroTexto) => cambiar({ heroTexto })} />
      <CampoTexto id="cont-pago" etiqueta="Instrucciones de pago" filas={3}
        ayuda="Se muestran al usuario cuando pide un plan." valor={borrador.instruccionesPago}
        alCambiar={(instruccionesPago) => cambiar({ instruccionesPago })} />

      <fieldset className="formulario__grupo">
        <legend>Cómo funciona</legend>
        {borrador.pasos.map((paso, i) => (
          <div key={i} className="formulario__item">
            <CampoTexto id={`cont-paso-${i}`} etiqueta="Paso" valor={paso.titulo}
              alCambiar={(titulo) => cambiar({ pasos: conCambio(borrador.pasos, i, { titulo }) })} />
            <CampoTexto id={`cont-paso-texto-${i}`} etiqueta="Explicación" filas={2} valor={paso.texto}
              alCambiar={(texto) => cambiar({ pasos: conCambio(borrador.pasos, i, { texto }) })} />
            <button type="button" className="boton-secundario boton--compacto"
              onClick={() => cambiar({ pasos: borrador.pasos.filter((_, j) => j !== i) })}>
              Quitar paso
            </button>
          </div>
        ))}
        <button type="button" className="boton-secundario boton--compacto"
          onClick={() => cambiar({ pasos: [...borrador.pasos, { titulo: '', texto: '' }] })}>
          Agregar paso
        </button>
      </fieldset>

      <fieldset className="formulario__grupo">
        <legend>Preguntas frecuentes</legend>
        {borrador.preguntas.map((item, i) => (
          <div key={i} className="formulario__item">
            <CampoTexto id={`cont-pregunta-${i}`} etiqueta="Pregunta" valor={item.pregunta}
              alCambiar={(pregunta) => cambiar({ preguntas: conCambio(borrador.preguntas, i, { pregunta }) })} />
            <CampoTexto id={`cont-respuesta-${i}`} etiqueta="Respuesta" filas={2} valor={item.respuesta}
              alCambiar={(respuesta) => cambiar({ preguntas: conCambio(borrador.preguntas, i, { respuesta }) })} />
            <button type="button" className="boton-secundario boton--compacto"
              onClick={() => cambiar({ preguntas: borrador.preguntas.filter((_, j) => j !== i) })}>
              Quitar pregunta
            </button>
          </div>
        ))}
        <button type="button" className="boton-secundario boton--compacto"
          onClick={() => cambiar({ preguntas: [...borrador.preguntas, { pregunta: '', respuesta: '' }] })}>
          Agregar pregunta
        </button>
      </fieldset>

      <div className="formulario__acciones">
        <button type="submit" className="boton-primario boton--compacto">Guardar contenido</button>
        <p role="status" className="formulario__estado">{guardado ? 'Contenido guardado' : ''}</p>
      </div>
    </form>
  );
}
