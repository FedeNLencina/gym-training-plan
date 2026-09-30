/**
 * ContextoSesion: sesión activa de la Plataforma.
 *
 * El proveedor es la única fuente de verdad de la sesión en la interfaz y no
 * conoce el almacenamiento: delega todo en el ServicioAutenticacion inyectado,
 * de modo que las pruebas puedan sustituirlo por un doble.
 *
 * Expone `estado ∈ {'restaurando','lista'}` porque la restauración de la sesión
 * persistida es asincrónica: mientras no termina, nadie puede afirmar que no hay
 * sesión, y decidir antes expulsaría a un usuario legítimo que recarga una ruta
 * protegida (4.11). `RutaProtegida` no decide hasta que el estado es `lista`.
 *
 * `registrar` e `ingresar` devuelven la Sesion y propagan el error de dominio
 * tal cual: el mensaje por campo y la conservación de los valores del formulario
 * son responsabilidad de la vista, no del contexto.
 *
 * Cubre: 4.2, 4.6, 4.10, 4.11
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import type { Sesion } from '../dominio/modelos';
import type {
  Credenciales,
  DatosRegistro,
  ServicioAutenticacion,
} from '../servicios/servicioAutenticacion';

/** `restaurando` mientras se consulta la sesión persistida; luego `lista`. */
export type EstadoSesion = 'restaurando' | 'lista';

export type ValorContextoSesion = {
  estado: EstadoSesion;
  sesion: Sesion | null;
  registrar: (datos: DatosRegistro) => Promise<Sesion>;
  ingresar: (credenciales: Credenciales) => Promise<Sesion>;
  cerrarSesion: () => Promise<void>;
};

const ContextoSesion = createContext<ValorContextoSesion | null>(null);

export type PropiedadesProveedorSesion = {
  servicio: ServicioAutenticacion;
  children: ReactNode;
};

export function ProveedorSesion({
  servicio,
  children,
}: PropiedadesProveedorSesion): ReactElement {
  const [estado, setEstado] = useState<EstadoSesion>('restaurando');
  const [sesion, setSesion] = useState<Sesion | null>(null);

  /**
   * Evita aplicar el resultado de una restauración que terminó después de
   * desmontar el proveedor o de cambiar de servicio.
   */
  const vigente = useRef(true);

  useEffect(() => {
    vigente.current = true;
    setEstado('restaurando');

    const restaurar = async (): Promise<void> => {
      let restaurada: Sesion | null = null;
      try {
        restaurada = await servicio.restaurarSesion();
      } catch {
        // Una sesión que no puede restaurarse equivale a no tener sesión: la
        // Plataforma se presenta sin sesión activa en lugar de quedar trabada
        // en `restaurando` (4.12).
        restaurada = null;
      }
      if (!vigente.current) return;
      setSesion(restaurada);
      setEstado('lista');
    };

    void restaurar();

    return () => {
      vigente.current = false;
    };
  }, [servicio]);

  const registrar = useCallback(
    async (datos: DatosRegistro): Promise<Sesion> => {
      const nueva = await servicio.registrar(datos);
      setSesion(nueva);
      return nueva;
    },
    [servicio],
  );

  const ingresar = useCallback(
    async (credenciales: Credenciales): Promise<Sesion> => {
      const nueva = await servicio.ingresar(credenciales);
      setSesion(nueva);
      return nueva;
    },
    [servicio],
  );

  const cerrarSesion = useCallback(async (): Promise<void> => {
    await servicio.cerrarSesion();
    setSesion(null);
  }, [servicio]);

  const valor = useMemo<ValorContextoSesion>(
    () => ({ estado, sesion, registrar, ingresar, cerrarSesion }),
    [estado, sesion, registrar, ingresar, cerrarSesion],
  );

  return (
    <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>
  );
}

/** Acceso al ContextoSesion. Falla si no hay proveedor por encima. */
export function usarSesion(): ValorContextoSesion {
  const valor = useContext(ContextoSesion);
  if (valor === null) {
    throw new Error('usarSesion requiere un ProveedorSesion por encima');
  }
  return valor;
}
