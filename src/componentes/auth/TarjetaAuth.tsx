/**
 * Piezas compartidas por Ingresar y Registro. Reproducen la interfaz de la rama
 * `implementacion-avanzada-con-ususario-de-prueba`: mismo marcado, mismas
 * clases `auth-*` y los mismos iconos (Lucide).
 */

import { CircleAlert, Dumbbell, Eye, EyeOff } from 'lucide-react';
import { useState, type FormEvent, type ReactElement, type ReactNode } from 'react';

type PropiedadesTarjeta = {
  titulo: string;
  bajada: string;
  aviso: string | null;
  textoEnviar: string;
  alEnviar: () => void;
  /** Campos del formulario. */
  children: ReactNode;
  /** Enlace a la otra pantalla de acceso. */
  pie: ReactNode;
};

export function TarjetaAuth({
  titulo,
  bajada,
  aviso,
  textoEnviar,
  alEnviar,
  children,
  pie,
}: PropiedadesTarjeta): ReactElement {
  const enviar = (evento: FormEvent<HTMLFormElement>): void => {
    evento.preventDefault();
    alEnviar();
  };

  return (
    <section className="auth-seccion">
      <div className="auth-fondo" aria-hidden="true" />
      <div className="auth-overlay" aria-hidden="true" />
      <div className="auth-resplandor" aria-hidden="true" />

      <div className="auth-tarjeta">
        <div className="auth-cabecera">
          <div className="auth-insignia" aria-hidden="true">
            <Dumbbell size={28} />
          </div>
          <h1 className="auth-titulo">{titulo}</h1>
          <p className="auth-bajada">{bajada}</p>
        </div>

        <form className="auth-formulario" noValidate onSubmit={enviar}>
          {aviso !== null && (
            <div className="auth-alerta" role="alert">
              <CircleAlert className="auth-alerta-icono" size={18} aria-hidden="true" />
              <span>{aviso}</span>
            </div>
          )}
          {children}
          <button type="submit" className="boton-primario auth-boton-enviar">
            {textoEnviar}
          </button>
        </form>

        <footer className="auth-pie-tarjeta">
          <p>{pie}</p>
        </footer>
      </div>
    </section>
  );
}

type PropiedadesCampo = {
  id: string;
  etiqueta: string;
  tipo: 'text' | 'email' | 'password';
  icono: ReactNode;
  marcador: string;
  valor: string;
  alCambiar: (valor: string) => void;
  error?: string;
};

export function CampoAuth({
  id,
  etiqueta,
  tipo,
  icono,
  marcador,
  valor,
  alCambiar,
  error,
}: PropiedadesCampo): ReactElement {
  const [visible, setVisible] = useState(false);
  const esClave = tipo === 'password';

  return (
    <div className="auth-campo">
      <label className="auth-etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <div className="auth-input-contenedor">
        <span className="auth-icono" aria-hidden="true">
          {icono}
        </span>
        <input
          id={id}
          type={esClave && visible ? 'text' : tipo}
          className="auth-input"
          placeholder={marcador}
          value={valor}
          aria-invalid={error !== undefined}
          aria-describedby={error !== undefined ? `${id}-error` : undefined}
          onChange={(evento) => alCambiar(evento.target.value)}
        />
        {esClave && (
          <button
            type="button"
            className="auth-boton-toggle"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        )}
      </div>
      {error !== undefined && (
        <p className="auth-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
