import { useState, type FormEvent, type ReactElement } from 'react';

import { ErrorValidacion, type CamposInvalidos } from '../../dominio/errores';
import { ETIQUETA_NIVEL, NIVELES, type Nivel, type Plan } from '../../dominio/modelos';
import { formatearPrecio, ordenarPorPrecio } from '../../dominio/reglas';
import { usarApp } from '../../estado/ContextoApp';
import { Campo, CampoTexto } from '../Campo';
import EtiquetaNivel from '../EtiquetaNivel';

/** Valores del formulario: todo texto, como lo escribe el administrador. */
type Formulario = {
  id?: string;
  nombre: string;
  descripcion: string;
  precio: string;
  nivel: Nivel;
  beneficios: string;
};

const VACIO: Formulario = { nombre: '', descripcion: '', precio: '', nivel: 'basico', beneficios: '' };

const aFormulario = (plan: Plan): Formulario => ({
  ...plan,
  precio: String(plan.precio),
  beneficios: plan.beneficios.join('\n'),
});

export default function AdminPlanes(): ReactElement {
  const { planes, guardarPlan, eliminarPlan } = usarApp();
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [campos, setCampos] = useState<CamposInvalidos>({});

  const abrir = (valores: Formulario): void => {
    setCampos({});
    setFormulario(valores);
  };

  const cambiar = (cambio: Partial<Formulario>): void => {
    setFormulario((actual) => (actual === null ? actual : { ...actual, ...cambio }));
  };

  const enviar = (evento: FormEvent): void => {
    evento.preventDefault();
    if (formulario === null) return;
    try {
      guardarPlan({
        ...formulario,
        precio: Number(formulario.precio),
        beneficios: formulario.beneficios.split('\n').map((b) => b.trim()).filter(Boolean),
      });
      setFormulario(null);
    } catch (fallo: unknown) {
      if (!(fallo instanceof ErrorValidacion)) throw fallo;
      setCampos(fallo.campos);
    }
  };

  const eliminar = (plan: Plan): void => {
    const aviso = `¿Eliminar el plan ${plan.nombre}? Quienes lo tengan activo quedan sin plan.`;
    if (window.confirm(aviso)) eliminarPlan(plan.id);
  };

  if (formulario !== null) {
    return (
      <form className="formulario" noValidate onSubmit={enviar}>
        <h2>{formulario.id === undefined ? 'Nuevo plan' : 'Editar plan'}</h2>
        <CampoTexto id="plan-nombre" etiqueta="Nombre" valor={formulario.nombre}
          alCambiar={(nombre) => cambiar({ nombre })} error={campos.nombre} />
        <CampoTexto id="plan-descripcion" etiqueta="Descripción" filas={2} valor={formulario.descripcion}
          alCambiar={(descripcion) => cambiar({ descripcion })} error={campos.descripcion} />
        <CampoTexto id="plan-precio" etiqueta="Precio mensual" tipo="number" valor={formulario.precio}
          alCambiar={(precio) => cambiar({ precio })} error={campos.precio} />
        <Campo id="plan-nivel" etiqueta="Nivel que habilita"
          ayuda="El plan da acceso a los entrenamientos de este nivel y de los anteriores.">
          <select id="plan-nivel" className="campo__control" value={formulario.nivel}
            onChange={(e) => cambiar({ nivel: e.target.value as Nivel })}>
            {NIVELES.map((nivel) => (
              <option key={nivel} value={nivel}>{ETIQUETA_NIVEL[nivel]}</option>
            ))}
          </select>
        </Campo>
        <CampoTexto id="plan-beneficios" etiqueta="Beneficios" filas={4} ayuda="Uno por línea."
          valor={formulario.beneficios} alCambiar={(beneficios) => cambiar({ beneficios })} />
        <div className="formulario__acciones">
          <button type="submit" className="boton-primario boton--compacto">Guardar plan</button>
          <button type="button" className="boton-secundario boton--compacto" onClick={() => setFormulario(null)}>
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <>
      <div className="panel-admin__cabecera">
        <h2>Planes</h2>
        <button type="button" className="boton-primario boton--compacto" onClick={() => abrir(VACIO)}>
          Nuevo plan
        </button>
      </div>
      {planes.length === 0 ? (
        <p className="mensaje">No hay planes. Creá el primero con “Nuevo plan”.</p>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th scope="col">Plan</th>
                <th scope="col">Precio</th>
                <th scope="col">Nivel</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenarPorPrecio(planes).map((plan) => (
                <tr key={plan.id}>
                  <th scope="row">{plan.nombre}</th>
                  <td data-etiqueta="Precio">{formatearPrecio(plan.precio)}</td>
                  <td data-etiqueta="Nivel"><EtiquetaNivel nivel={plan.nivel} /></td>
                  <td className="tabla__acciones">
                    <button type="button" className="boton-secundario boton--compacto"
                      onClick={() => abrir(aFormulario(plan))}>Editar</button>
                    <button type="button" className="boton-secundario boton--compacto"
                      onClick={() => eliminar(plan)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
