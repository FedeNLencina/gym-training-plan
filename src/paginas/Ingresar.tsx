/**
 * Ingresar: apertura de sesión con credenciales existentes.
 *
 * Formulario controlado sobre el ContextoSesion. Al enviar delega en
 * `ingresar`, que exige coincidencia exacta de correo y contraseña; un ingreso
 * válido abre la sesión con el rol de la cuenta y navega al catálogo (4.6).
 * Ante credenciales incorrectas presenta el aviso "Credenciales incorrectas",
 * conserva el correo ingresado y vacía la contraseña, para que el visitante la
 * reescriba sin borrar el correo (4.7). Los errores de validación de formato se
 * señalan por campo con su mensaje asociado por `aria-describedby`.
 *
 * Cubre: 4.6, 4.7
 */

import { useState, type FormEvent, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  ErrorCredenciales,
  ErrorValidacion,
  esErrorDominio,
} from '../dominio/errores';
import { usarSesion } from '../estado/ContextoSesion';
import { RUTAS } from '../rutas/definicionRutas';

type MensajesCampo = Readonly<Record<string, string>>;

export default function Ingresar(): ReactElement {
  const { ingresar } = usarSesion();
  const navegar = useNavigate();

  const [correo, setCorreo] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [campos, setCampos] = useState<MensajesCampo>({});
  const [avisoGeneral, setAvisoGeneral] = useState<string | null>(null);

  const enviar = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    setCampos({});
    setAvisoGeneral(null);
    try {
      await ingresar({ correo, contrasenia });
      navegar(RUTAS.entrenamientos);
    } catch (fallo: unknown) {
      if (fallo instanceof ErrorCredenciales) {
        // Se conserva el correo y se vacía la contraseña: el visitante sólo
        // necesita reescribir la clave, no el correo (4.7).
        setContrasenia('');
        setAvisoGeneral(fallo.message);
        return;
      }
      if (fallo instanceof ErrorValidacion) {
        setCampos(fallo.campos);
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
      <h1>Iniciar sesión</h1>
      <form
        noValidate
        onSubmit={(evento) => {
          void enviar(evento);
        }}
      >
        {avisoGeneral !== null && (
          <p role="alert" id="ingresar-aviso">
            {avisoGeneral}
          </p>
        )}

        <div>
          <label htmlFor="ingresar-correo">Correo</label>
          <input
            id="ingresar-correo"
            name="correo"
            type="email"
            value={correo}
            aria-invalid={campos.correo !== undefined}
            aria-describedby={
              campos.correo !== undefined ? 'ingresar-correo-error' : undefined
            }
            onChange={(evento) => setCorreo(evento.target.value)}
          />
          {campos.correo !== undefined && (
            <p id="ingresar-correo-error">{campos.correo}</p>
          )}
        </div>

        <div>
          <label htmlFor="ingresar-contrasenia">Contraseña</label>
          <input
            id="ingresar-contrasenia"
            name="contrasenia"
            type="password"
            value={contrasenia}
            aria-invalid={campos.contrasenia !== undefined}
            aria-describedby={
              campos.contrasenia !== undefined
                ? 'ingresar-contrasenia-error'
                : undefined
            }
            onChange={(evento) => setContrasenia(evento.target.value)}
          />
          {campos.contrasenia !== undefined && (
            <p id="ingresar-contrasenia-error">{campos.contrasenia}</p>
          )}
        </div>

        <button type="submit">Iniciar sesión</button>
      </form>
    </section>
  );
}
