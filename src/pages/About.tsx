/**
 * Componente About
 *
 * Este componente funcional de React renderiza la página "Sobre" de la aplicación demo de Joyería Wuepa.
 * Proporciona información sobre el producto, su misión y características clave.
 *
 * ## Comportamiento
 * - Al montarse, elimina la clase CSS `login-page` del elemento `<body>` para asegurar el estilo correcto al navegar fuera de la vista de inicio de sesión.
 * - Utiliza HTML semántico y atributos ARIA para mejorar la accesibilidad y el soporte para lectores de pantalla.
 *
 * ## Estructura
 * - Sección principal: Muestra el logo de Wuepa, título y subtítulo.
 * - Sección de contenido: Explica qué es Wuepa, resalta las características principales y expone la misión.
 * - Cuadrícula de características: Tarjetas que describen accesibilidad, flujos de autenticación y demo de reuniones.
 * - Información de versión: Muestra la versión actual y detalles de desarrollo.
 * - Navegación: Proporciona un enlace de regreso a la página de inicio.
 *
 * ## Accesibilidad
 * - Se utilizan `role="main"` y `aria-labelledby="about-title"` para la estructura semántica.
 * - Se siguen los principios de WCAG 2.1 para asegurar compatibilidad con tecnologías de asistencia.
 *
 * @function About
 * @returns {JSX.Element} El componente de la página Sobre, que contiene información del producto,
 * declaración de misión, características y enlace de navegación.
 *
 * @example
 * // Uso en una configuración de React Router
 * import About from './About';
 *
 * function App() {
 *   return (
 *     <Routes>
 *       <Route path="/about" element={<About />} />
 *     </Routes>
 *   );
 * }
 */
import React, { useEffect } from "react";
import { Link } from "react-router-dom";

export default function About() {
  useEffect(() => {
    document.body.classList.remove("login-page");
  }, []);

  return (
    <main className="about-page" role="main" aria-labelledby="about-title">
      <section className="about-hero">
        <div className="about-hero-inner">
          <h1 id="about-title">Sobre Joyería Wuepa</h1>
          <p className="about-sub">Tu destino para las joyas más exclusivas y elegantes.</p>
        </div>
      </section>

      <section className="about-content container">
        <h2 className="section-title">¿Qué es Joyería Wuepa?</h2>
        <p className="lead">Joyería Wuepa es una tienda dedicada a ofrecer piezas únicas de joyería, seleccionadas cuidadosamente para resaltar tu estilo y personalidad. Nos especializamos en brindar una experiencia de compra segura, personalizada y memorable para cada cliente.</p>

        <h3 className="section-sub">Características principales</h3>
        <div className="features-grid">
          <article className="feature-card">
            <div className="feature-icon">💎</div>
            <h4>Piezas exclusivas</h4>
            <p>Ofrecemos una selección de joyas únicas, hechas con materiales de la más alta calidad y diseños innovadores.</p>
          </article>
          <article className="feature-card">
            <div className="feature-icon">🔒</div>
            <h4>Compra segura</h4>
            <p>Tu seguridad es nuestra prioridad. Contamos con procesos de autenticación y protección de datos para que compres con total confianza.</p>
          </article>
          <article className="feature-card">
            <div className="feature-icon">🎁</div>
            <h4>Atención personalizada</h4>
            <p>Brindamos asesoría y atención personalizada para ayudarte a encontrar la joya perfecta para cada ocasión.</p>
          </article>
        </div>

        <h3 className="section-sub">Nuestra misión</h3>
        <p>En Joyería Wuepa, creemos que cada persona merece brillar. Nuestra misión es ofrecer joyas que inspiren confianza, elegancia y felicidad en cada uno de nuestros clientes.</p>

        <div className="version-row">
          <div className="version-box">
            <h4>Versión actual</h4>
            <div className="version-badges">
              <span className="badge">v1.0.0</span>
              <span className="badge green">Estable</span>
            </div>
            <p className="muted">Construido con React + Vite + TypeScript + SASS. Plataforma lista para mostrar y vender joyas en línea.</p>
          </div>

          <div className="dev-box">
            <h4>Desarrollado por</h4>
            <div className="dev-badge">Joyería Wuepa</div>
          </div>
        </div>

        <div style={{ marginTop: 28 }}>
          <Link to="/buy" className="primary-btn">Volver al inicio</Link>
        </div>
      </section>
    </main>
  );
}
