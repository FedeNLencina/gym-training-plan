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
import { Link, useNavigate } from 'react-router-dom';

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
  const [mostrarClave, setMostrarClave] = useState(false);
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
    <section className="auth-seccion">
      <div className="auth-fondo" aria-hidden="true" />
      <div className="auth-overlay" aria-hidden="true" />
      <div className="auth-resplandor" aria-hidden="true" />

      <div className="auth-tarjeta">
        <header className="auth-cabecera">
          <div className="auth-insignia" aria-hidden="true">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6.5 6.5 11 11" />
              <path d="m21 21-1-1" />
              <path d="m3 3 1 1" />
              <path d="m18 22 4-4" />
              <path d="m2 6 4-4" />
              <path d="m3 10 7-7" />
              <path d="m14 21 7-7" />
            </svg>
          </div>
          <h1 className="auth-titulo">Iniciar sesión</h1>
          <p className="auth-bajada">
            Supera tus límites. Ingresa para acceder a tus rutinas y progreso en Atlas Gym.
          </p>
        </header>

        <form
          className="auth-formulario"
          noValidate
          onSubmit={(evento) => {
            void enviar(evento);
          }}
        >
          {avisoGeneral !== null && (
            <div className="auth-alerta" role="alert" id="ingresar-aviso">
              <svg
                className="auth-alerta-icono"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{avisoGeneral}</span>
            </div>
          )}

          <div className="auth-campo">
            <label className="auth-etiqueta" htmlFor="ingresar-correo">
              Correo
            </label>
            <div className="auth-input-contenedor">
              <span className="auth-icono" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
              <input
                id="ingresar-correo"
                name="correo"
                type="email"
                className="auth-input"
                placeholder="ejemplo@correo.com"
                value={correo}
                aria-invalid={campos.correo !== undefined}
                aria-describedby={
                  campos.correo !== undefined ? 'ingresar-correo-error' : undefined
                }
                onChange={(evento) => setCorreo(evento.target.value)}
              />
            </div>
            {campos.correo !== undefined && (
              <p className="auth-error" id="ingresar-correo-error">
                {campos.correo}
              </p>
            )}
          </div>

          <div className="auth-campo">
            <label className="auth-etiqueta" htmlFor="ingresar-contrasenia">
              Contraseña
            </label>
            <div className="auth-input-contenedor">
              <span className="auth-icono" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="ingresar-contrasenia"
                name="contrasenia"
                type={mostrarClave ? 'text' : 'password'}
                className="auth-input"
                placeholder="••••••••"
                value={contrasenia}
                aria-invalid={campos.contrasenia !== undefined}
                aria-describedby={
                  campos.contrasenia !== undefined
                    ? 'ingresar-contrasenia-error'
                    : undefined
                }
                onChange={(evento) => setContrasenia(evento.target.value)}
              />
              <button
                type="button"
                className="auth-boton-toggle"
                onClick={() => setMostrarClave((v) => !v)}
                aria-label={mostrarClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrarClave ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {campos.contrasenia !== undefined && (
              <p className="auth-error" id="ingresar-contrasenia-error">
                {campos.contrasenia}
              </p>
            )}
          </div>

          <button type="submit" className="boton-primario auth-boton-enviar">
            Iniciar sesión
          </button>
        </form>

        <footer className="auth-pie-tarjeta">
          <p>
            ¿No tienes una cuenta aún?{' '}
            <Link to={RUTAS.registro} className="auth-enlace">
              Registrarme
            </Link>
          </p>
        </footer>
      </div>
    </section>
  );
}
