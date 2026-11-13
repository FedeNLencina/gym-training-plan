import { Lock, Mail } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { CampoAuth, TarjetaAuth } from '../componentes/auth/TarjetaAuth';
import { ErrorCredenciales, ErrorDominio, ErrorUsuarioInexistente } from '../dominio/errores';
import { usarApp } from '../estado/ContextoApp';
import { RUTAS } from '../rutas/rutas';

export default function Ingresar(): ReactElement {
  const { ingresar } = usarApp();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  // Página desde la que se pidió iniciar sesión, para volver a ella.
  const desde = (ubicacion.state as { desde?: string } | null)?.desde;

  const [correo, setCorreo] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);

  const enviar = (): void => {
    setAviso(null);
    try {
      ingresar({ correo, contrasenia });
      navegar(desde ?? RUTAS.entrenamientos, { replace: true });
    } catch (fallo: unknown) {
      if (!(fallo instanceof ErrorDominio)) throw fallo;
      // Contraseña incorrecta: se conserva el correo y sólo se reescribe la clave.
      if (fallo instanceof ErrorCredenciales) setContrasenia('');
      // Usuario inexistente: no se conserva nada hasta que se registre.
      if (fallo instanceof ErrorUsuarioInexistente) {
        setCorreo('');
        setContrasenia('');
      }
      setAviso(fallo.message);
    }
  };

  return (
    <TarjetaAuth
      titulo="Iniciar sesión"
      bajada="Supera tus límites. Ingresa para acceder a tus rutinas y progreso en Atlas Gym."
      aviso={aviso}
      textoEnviar="Iniciar sesión"
      alEnviar={enviar}
      pie={
        <>
          ¿No tienes una cuenta aún?{' '}
          <Link to={RUTAS.registro} state={ubicacion.state} className="auth-enlace">
            Registrarme
          </Link>
        </>
      }
    >
      <CampoAuth
        id="ingresar-correo"
        etiqueta="Correo"
        tipo="email"
        icono={<Mail size={18} />}
        marcador="ejemplo@correo.com"
        valor={correo}
        alCambiar={setCorreo}
      />
      <CampoAuth
        id="ingresar-contrasenia"
        etiqueta="Contraseña"
        tipo="password"
        icono={<Lock size={18} />}
        marcador="••••••••"
        valor={contrasenia}
        alCambiar={setContrasenia}
      />
    </TarjetaAuth>
  );
}
