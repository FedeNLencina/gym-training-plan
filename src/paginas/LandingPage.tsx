/**
 * LandingPage: vista pública de promoción de la Plataforma.
 *
 * Compone, en el orden fijado por 1.1, las siete primeras secciones de la
 * landing: Hero, Beneficios del método, Catálogo destacado de entrenamientos,
 * Cómo funciona la Plataforma, Testimonios, Planes y Preguntas frecuentes. La
 * octava sección, el Pie de página, la aporta `PieDePagina` del `LayoutPublico`
 * que envuelve esta vista en el `Outlet`, de modo que las ocho secciones quedan
 * presentes y ordenadas en la vista completa.
 *
 * El Catálogo destacado (13.3) ya es la sección real `SeccionCatalogoDestacado`,
 * y los Planes (13.7) son la sección real `SeccionPlanes`; ambas toman sus datos
 * del ContextoServicios. La Seccion_Planes conserva el encabezado accesible y el
 * ancla `#planes` que consume la navegación.
 *
 * El contenido textual proviene de `crearContenidoLanding` y `crearPasosMetodo`,
 * y no referencia ningún archivo de imagen: los espacios visuales se arman con
 * bloques de color de los tokens marcados `aria-hidden` (1.4).
 *
 * Cubre: 1.1, 1.2, 1.3, 1.4, 1.5, 1.9
 */
import { type ReactElement } from 'react';

import SeccionBeneficios from '../componentes/landing/SeccionBeneficios';
import SeccionCatalogoDestacado from '../componentes/landing/SeccionCatalogoDestacado';
import SeccionComoFunciona from '../componentes/landing/SeccionComoFunciona';
import SeccionHero from '../componentes/landing/SeccionHero';
import SeccionPlanes from '../componentes/landing/SeccionPlanes';
import SeccionPreguntasFrecuentes from '../componentes/landing/SeccionPreguntasFrecuentes';
import SeccionTestimonios from '../componentes/landing/SeccionTestimonios';
import { crearContenidoLanding, crearPasosMetodo } from '../datos/contenidoLanding';

export default function LandingPage(): ReactElement {
  const contenido = crearContenidoLanding();
  const pasos = crearPasosMetodo();

  return (
    <>
      <SeccionHero />
      <SeccionBeneficios beneficios={contenido.beneficios} />
      <SeccionCatalogoDestacado />
      <SeccionComoFunciona pasos={pasos} />
      <SeccionTestimonios testimonios={contenido.testimonios} />
      <SeccionPlanes />
      <SeccionPreguntasFrecuentes preguntas={contenido.preguntasFrecuentes} />
    </>
  );
}
