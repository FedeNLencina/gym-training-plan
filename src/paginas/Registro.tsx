/**
 * Registro: alta de una cuenta con rol Usuario.
 *
 * Formulario controlado sobre el ContextoSesion. Al enviar delega en
 * `registrar`, que valida y persiste; el error de dominio se traduce a mensajes
 * presentables: `ErrorValidacion` señala cada campo afectado con su mensaje
 * asociado por `aria-describedby` (4.4), y `ErrorCorreoRegistrado` presenta un
 * aviso general del formulario conservando los valores ingresados (4.3). Un
 * registro válido abre la sesión y navega al catálogo (4.2).
 *
 * El plan elegido llega en el parámetro `plan` de la dirección (por ejemplo,
 * `/registro?plan=plan-elite`), se lee con `useSearchParams` y se pasa como
 * `idPlan` para que quede asociado a la cuenta creada (4.5).
 *
 * Cubre: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { useState, type FormEvent, type ReactElement } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  ErrorCorreoRegistrado,
  ErrorValidacion,
  esErrorDominio,
} from '../dominio/errores';
import { usarSesion } from '../estado/ContextoSesion';
import { RUTAS } from '../rutas/definicionRutas';

/** Mensajes de validación por campo, indexados por el nombre del control. */
type MensajesCampo = Readonly<Record<string, string>>;

export default function Registro(): ReactElement {
  const { registrar } = usarSesion();
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const idPlan = parametros.get('plan');

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [campos, setCampos] = useState<MensajesCampo>({});
  const [avisoGeneral, setAvisoGeneral] = useState<string | null>(null);

  const enviar = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    setCampos({});
    setAvisoGeneral(null);
    try {
      await registrar({ nombre, correo, contrasenia, idPlan });
      navegar(RUTAS.entrenamientos);
    } catch (fallo: unknown) {
      if (fallo instanceof ErrorValidacion) {
        setCampos(fallo.campos);
        return;
      }
      if (fallo instanceof ErrorCorreoRegistrado) {
        setAvisoGeneral(fallo.message);
        return;
      }
      if (esErrorDominio(fallo)) {
        setAvisoGeneral(fallo.message);
        return;
      }
      throw fallo;
    }
  };

  return (
    <section>
      <h1>Registro</h1>
      <form
        noValidate
        onSubmit={(evento) => {
          void enviar(evento);
        }}
      >
        {avisoGeneral !== null && (
          <p role="alert" id="registro-aviso">
            {avisoGeneral}
          </p>
        )}

        <div>
          <label htmlFor="registro-nombre">Nombre</label>
          <input
            id="registro-nombre"
            name="nombre"
            type="text"
            value={nombre}
            aria-invalid={campos.nombre !== undefined}
            aria-describedby={
              campos.nombre !== undefined ? 'registro-nombre-error' : undefined
            }
            onChange={(evento) => setNombre(evento.target.value)}
          />
          {campos.nombre !== undefined && (
            <p id="registro-nombre-error">{campos.nombre}</p>
          )}
        </div>

        <div>
          <label htmlFor="registro-correo">Correo</label>
          <input
            id="registro-correo"
            name="correo"
            type="email"
            value={correo}
            aria-invalid={campos.correo !== undefined}
            aria-describedby={
              campos.correo !== undefined ? 'registro-correo-error' : undefined
            }
            onChange={(evento) => setCorreo(evento.target.value)}
          />
          {campos.correo !== undefined && (
            <p id="registro-correo-error">{campos.correo}</p>
          )}
        </div>

        <div>
          <label htmlFor="registro-contrasenia">Contraseña</label>
          <input
            id="registro-contrasenia"
            name="contrasenia"
            type="password"
            value={contrasenia}
            aria-invalid={campos.contrasenia !== undefined}
            aria-describedby={
              campos.contrasenia !== undefined
                ? 'registro-contrasenia-error'
                : undefined
            }
            onChange={(evento) => setContrasenia(evento.target.value)}
          />
          {campos.contrasenia !== undefined && (
            <p id="registro-contrasenia-error">{campos.contrasenia}</p>
          )}
        </div>

        <button type="submit">Registrarme</button>
      </form>
    </section>
  );
}
