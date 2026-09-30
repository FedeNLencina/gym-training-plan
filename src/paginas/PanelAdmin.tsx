/**
 * PanelAdmin: vista de gestión de Entrenamientos del Administrador.
 *
 * Presenta el listado de Entrenamientos administrables al Administrador (7.1).
 * El acceso por rol lo resuelve `RutaProtegida`, que envuelve esta vista en el
 * árbol de rutas: una sesión con rol Usuario que solicita `/admin` es devuelta a
 * `/entrenamientos` con el aviso "No tenés permisos para esta sección" sin
 * llegar a montar esta vista (7.2), y un Visitante sin sesión es enviado a
 * `/ingresar` (7.8). Por eso el Panel_Admin no repite esas decisiones: cuando se
 * monta, la sesión ya tiene rol administrador.
 *
 * Los datos llegan de `useEntrenamientos`, alimentado por el ContextoServicios,
 * de modo que la vista comparta la misma máquina de estados de carga que el
 * catálogo. A diferencia del catálogo público, aquí se listan todos los
 * Entrenamientos —publicados y borradores— porque el Administrador gestiona
 * todos; el filtrado por estado publicado es propio de la vista pública.
 *
 * La vista deriva su presentación del estado de la carga:
 *
 * - **Cargando**: indicador de carga (`role="status"`).
 * - **Error**: mensaje de fallo y acción "Reintentar" que vuelve a solicitar la
 *   lista con `recargar`.
 * - **Listo**: el listado administrable, o su mensaje de lista vacía.
 *
 * La eliminación de un Entrenamiento se resuelve aquí: la lista abre el diálogo
 * de confirmación por fila y, al confirmar, el panel solicita al Repositorio_Datos
 * la eliminación —que hace el borrado en cascada del Archivo_Video asociado
 * cuando su Fuente_Video es `archivo` (8.9)—, recarga el listado y publica el
 * aviso "Entrenamiento eliminado" (7.6). Al cancelar no cambia nada (7.9). Las
 * tareas de creación y edición (formulario, selector de fuente de video)
 * corresponden a tareas posteriores.
 *
 * Cubre: 7.1, 7.2, 7.6, 7.9
 */
import { type ReactElement } from 'react';

import { useAvisos } from '../estado/ContextoAvisos';
import { usarServicios } from '../estado/ContextoServicios';
import { useEntrenamientos } from '../estado/useEntrenamientos';
import ListaEntrenamientosAdmin from '../componentes/admin/ListaEntrenamientosAdmin';

export const TITULO_PANEL_ADMIN = 'Panel de administración';
export const MENSAJE_CARGANDO = 'Cargando entrenamientos';
export const MENSAJE_ERROR = 'No pudimos cargar los entrenamientos';
export const MENSAJE_ELIMINADO = 'Entrenamiento eliminado';
export const MENSAJE_FALLO_ELIMINACION =
  'No pudimos eliminar el entrenamiento';

/** Envoltura de la vista: fija el encabezado accesible del panel. */
function Vista({ children }: { children: ReactElement }): ReactElement {
  return (
    <section className="seccion" aria-labelledby="panel-admin-titulo">
      <div className="contenedor">
        <div className="seccion__encabezado">
          <h1 id="panel-admin-titulo">{TITULO_PANEL_ADMIN}</h1>
        </div>
        {children}
      </div>
    </section>
  );
}

export default function PanelAdmin(): ReactElement {
  const { repositorio, reloj } = usarServicios();
  const { publicarAviso } = useAvisos();
  const { estado, datos, error, recargar } = useEntrenamientos({
    repositorio,
    reloj,
  });

  /**
   * Elimina el Entrenamiento a través del Repositorio_Datos —que hace el borrado
   * en cascada del Archivo_Video cuando su Fuente_Video es `archivo` (8.9)—,
   * recarga el listado para que el Entrenamiento quitado deje de presentarse y
   * publica el aviso "Entrenamiento eliminado" (7.6). Si el repositorio falla,
   * conserva el listado y avisa del error.
   */
  const eliminar = async (id: string): Promise<void> => {
    try {
      await repositorio.eliminarEntrenamiento(id);
      recargar();
      publicarAviso(MENSAJE_ELIMINADO);
    } catch {
      publicarAviso(MENSAJE_FALLO_ELIMINACION, 'error');
    }
  };

  if (estado === 'cargando') {
    return (
      <Vista>
        <p className="seccion__bajada" role="status">
          {MENSAJE_CARGANDO}
        </p>
      </Vista>
    );
  }

  if (estado === 'error') {
    return (
      <Vista>
        <div className="seccion__estado">
          <p className="seccion__bajada">{error?.message ?? MENSAJE_ERROR}</p>
          <button type="button" className="boton" onClick={recargar}>
            Reintentar
          </button>
        </div>
      </Vista>
    );
  }

  return (
    <Vista>
      <ListaEntrenamientosAdmin
        entrenamientos={datos}
        onEliminar={(id) => {
          void eliminar(id);
        }}
      />
    </Vista>
  );
}
