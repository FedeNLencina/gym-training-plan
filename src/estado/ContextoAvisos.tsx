/**
 * ContextoAvisos: canal global de mensajes que deben sobrevivir un cambio de
 * ruta.
 *
 * Varios criterios exigen presentar un mensaje después de redirigir: "Iniciá
 * sesión para continuar" (2.13, 6.8, 7.8), "El entrenamiento solicitado no
 * existe" (2.14) y "No tenés permisos para esta sección" (7.2). El emisor
 * publica el aviso antes de navegar; la región de avisos lo toma y lo consume
 * al presentarlo, de modo que no reaparece en navegaciones posteriores.
 *
 * Cubre: 2.13, 2.14, 6.8, 7.2, 7.8
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';

export type TipoAviso = 'informacion' | 'error';

export interface Aviso {
  readonly mensaje: string;
  readonly tipo: TipoAviso;
}

export interface ValorContextoAvisos {
  /** Aviso publicado y todavía no presentado. */
  readonly avisoPendiente: Aviso | null;
  /** Publica un aviso para que la región lo presente en la ruta de destino. */
  readonly publicarAviso: (mensaje: string, tipo?: TipoAviso) => void;
  /** Descarta el aviso pendiente sin presentarlo de nuevo. */
  readonly consumirAviso: () => void;
}

const Contexto = createContext<ValorContextoAvisos | null>(null);

export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [avisoPendiente, setAvisoPendiente] = useState<Aviso | null>(null);

  const publicarAviso = useCallback((mensaje: string, tipo: TipoAviso = 'informacion') => {
    const texto = mensaje.trim();
    if (texto === '') {
      return;
    }
    setAvisoPendiente({ mensaje: texto, tipo });
  }, []);

  const consumirAviso = useCallback(() => {
    setAvisoPendiente(null);
  }, []);

  const valor = useMemo<ValorContextoAvisos>(
    () => ({ avisoPendiente, publicarAviso, consumirAviso }),
    [avisoPendiente, publicarAviso, consumirAviso],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAvisos(): ValorContextoAvisos {
  const valor = useContext(Contexto);
  if (valor === null) {
    throw new Error('useAvisos requiere un ProveedorAvisos por encima en el árbol.');
  }
  return valor;
}

/**
 * Región `aria-live` donde se presentan los avisos. Toma el aviso pendiente y
 * lo consume en el acto, así el mensaje no vuelve a presentarse; el texto
 * permanece visible durante el cambio de ruta que lo motivó y se retira en la
 * navegación siguiente.
 */
export function RegionAvisos() {
  const { avisoPendiente, consumirAviso } = useAvisos();
  const location = useLocation();
  const [presentado, setPresentado] = useState<Aviso | null>(null);
  const claveRutaAnterior = useRef(location.key);
  const tolerarProximoCambio = useRef(false);

  useEffect(() => {
    if (avisoPendiente === null) {
      return;
    }
    setPresentado(avisoPendiente);
    // El aviso se publica antes de navegar: el cambio de ruta inmediatamente
    // posterior no debe retirarlo.
    tolerarProximoCambio.current = true;
    consumirAviso();
  }, [avisoPendiente, consumirAviso]);

  useEffect(() => {
    if (location.key === claveRutaAnterior.current) {
      return;
    }
    claveRutaAnterior.current = location.key;
    if (tolerarProximoCambio.current) {
      tolerarProximoCambio.current = false;
      return;
    }
    setPresentado(null);
  }, [location.key]);

  return (
    <div role="status" aria-live="polite">
      {presentado === null ? '' : presentado.mensaje}
    </div>
  );
}
