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
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

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
  const [mostrarClave, setMostrarClave] = useState(false);
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
          <h1 className="auth-titulo">Registro</h1>
          <p className="auth-bajada">
            Comienza tu transformación hoy. Crea tu cuenta oficial en Atlas Gym.
          </p>
          {idPlan !== null && (
            <div className="auth-plan-badge" aria-label={`Plan seleccionado: ${idPlan}`}>
              <span>Plan seleccionado: {idPlan}</span>
            </div>
          )}
        </header>

        <form
          className="auth-formulario"
          noValidate
          onSubmit={(evento) => {
            void enviar(evento);
          }}
        >
          {avisoGeneral !== null && (
            <div className="auth-alerta" role="alert" id="registro-aviso">
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
            <label className="auth-etiqueta" htmlFor="registro-nombre">
              Nombre
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
                  <circle cx="12" cy="8" r="5" />
                  <path d="M20 21a8 8 0 0 0-16 0" />
                </svg>
              </span>
              <input
                id="registro-nombre"
                name="nombre"
                type="text"
                className="auth-input"
                placeholder="Tu nombre completo"
                value={nombre}
                aria-invalid={campos.nombre !== undefined}
                aria-describedby={
                  campos.nombre !== undefined ? 'registro-nombre-error' : undefined
                }
                onChange={(evento) => setNombre(evento.target.value)}
              />
            </div>
            {campos.nombre !== undefined && (
              <p className="auth-error" id="registro-nombre-error">
                {campos.nombre}
              </p>
            )}
          </div>

          <div className="auth-campo">
            <label className="auth-etiqueta" htmlFor="registro-correo">
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
                id="registro-correo"
                name="correo"
                type="email"
                className="auth-input"
                placeholder="ejemplo@correo.com"
                value={correo}
                aria-invalid={campos.correo !== undefined}
                aria-describedby={
                  campos.correo !== undefined ? 'registro-correo-error' : undefined
                }
                onChange={(evento) => setCorreo(evento.target.value)}
              />
            </div>
            {campos.correo !== undefined && (
              <p className="auth-error" id="registro-correo-error">
                {campos.correo}
              </p>
            )}
          </div>

          <div className="auth-campo">
            <label className="auth-etiqueta" htmlFor="registro-contrasenia">
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
                id="registro-contrasenia"
                name="contrasenia"
                type={mostrarClave ? 'text' : 'password'}
                className="auth-input"
                placeholder="Mínimo 8 caracteres"
                value={contrasenia}
                aria-invalid={campos.contrasenia !== undefined}
                aria-describedby={
                  campos.contrasenia !== undefined
                    ? 'registro-contrasenia-error'
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
              <p className="auth-error" id="registro-contrasenia-error">
                {campos.contrasenia}
              </p>
            )}
          </div>

          <button type="submit" className="boton-primario auth-boton-enviar">
            Registrarme
          </button>
        </form>

        <footer className="auth-pie-tarjeta">
          <p>
            ¿Ya tienes una cuenta?{' '}
            <Link to={RUTAS.ingresar} className="auth-enlace">
              Iniciar sesión
            </Link>
          </p>
        </footer>
      </div>
    </section>
  );
}
