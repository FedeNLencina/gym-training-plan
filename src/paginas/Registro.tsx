import { Lock, Mail, User } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { CampoAuth, TarjetaAuth } from '../componentes/auth/TarjetaAuth';
import { ErrorDominio, ErrorValidacion, type CamposInvalidos } from '../dominio/errores';
import { usarApp } from '../estado/ContextoApp';
import { RUTAS } from '../rutas/rutas';

export default function Registro(): ReactElement {
  const { registrar } = usarApp();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const desde = (ubicacion.state as { desde?: string } | null)?.desde;

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [campos, setCampos] = useState<CamposInvalidos>({});
  const [aviso, setAviso] = useState<string | null>(null);

  const enviar = (): void => {
    setCampos({});
    setAviso(null);
    try {
      registrar({ nombre, correo, contrasenia });
      // Una cuenta nueva no tiene plan: el paso siguiente es elegir uno.
      navegar(desde ?? RUTAS.planes, { replace: true });
    } catch (fallo: unknown) {
      if (fallo instanceof ErrorValidacion) return setCampos(fallo.campos);
      if (!(fallo instanceof ErrorDominio)) throw fallo;
      setAviso(fallo.message);
    }
  };

  return (
    <TarjetaAuth
      titulo="Registro"
      bajada="Comienza tu transformación hoy. Crea tu cuenta oficial en Atlas Gym."
      aviso={aviso}
      textoEnviar="Registrarme"
      alEnviar={enviar}
      pie={
        <>
          ¿Ya tienes una cuenta?{' '}
          <Link to={RUTAS.ingresar} state={ubicacion.state} className="auth-enlace">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <CampoAuth
        id="registro-nombre"
        etiqueta="Nombre"
        tipo="text"
        icono={<User size={18} />}
        marcador="Tu nombre completo"
        valor={nombre}
        alCambiar={setNombre}
        error={campos.nombre}
      />
      <CampoAuth
        id="registro-correo"
        etiqueta="Correo"
        tipo="email"
        icono={<Mail size={18} />}
        marcador="ejemplo@correo.com"
        valor={correo}
        alCambiar={setCorreo}
        error={campos.correo}
      />
      <CampoAuth
        id="registro-contrasenia"
        etiqueta="Contraseña"
        tipo="password"
        icono={<Lock size={18} />}
        marcador="Mínimo 8 caracteres"
        valor={contrasenia}
        alCambiar={setContrasenia}
        error={campos.contrasenia}
      />
    </TarjetaAuth>
  );
}
