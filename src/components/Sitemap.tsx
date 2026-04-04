/**
 * Componente Sitemap
 *
 * Este componente funcional de React renderiza la sección de pie de página de la aplicación demo de wuepa.
 * Proporciona un "mapa del sitio" estructurado con enlaces de navegación a páginas clave y flujos de autenticación.
 *
 * ## Comportamiento
 * - Muestra enlaces de navegación agrupados para páginas generales y rutas relacionadas con autenticación.
 * - Utiliza HTML semántico (`<footer>`, `<h3>`, `<ul>`, `<li>`) para mejorar la legibilidad y accesibilidad.
 * - Incluye atributos ARIA (`role="contentinfo"`, `aria-label="Mapa del sitio"`) para soporte de lectores de pantalla.
 *
 * ## Estructura
 * - **Título:** Encabezado "Mapa del sitio".
 * - **Columnas:**
 *   - Páginas: Enlaces a secciones principales como Inicio, Sobre nosotros, Manual de usuario, Videollamada demo y Perfil.
 *   - Autenticación: Enlaces a inicio de sesión, registro, recuperación, restablecimiento y cambio de contraseña.
 * - **Nota de pie:** Aviso de copyright.
 *
 * ## Accesibilidad
 * - `role="contentinfo"` identifica el footer como una región de referencia.
 * - `aria-label="Mapa del sitio"` proporciona una etiqueta descriptiva para tecnologías de asistencia.
 *
 * @función Sitemap
 * @returns {JSX.Element} Componente de pie de página renderizado con enlaces de navegación y copyright.
 *
 */
import React from 'react';
import { Link } from 'react-router-dom';

const Sitemap: React.FC = () => {
  return (
    <footer className="sitemap" role="contentinfo" aria-label="Mapa del sitio">
      <div className="sitemap-container">
        <h3 className="sitemap-title">Mapa del sitio</h3>

        <div className="sitemap-columns">
          <div className="sitemap-col">
            <h4>Páginas</h4>
            <ul>
              <li><Link to="/wuepa">Inicio</Link></li>
              <li><Link to="/about">Sobre nosotros</Link></li>
              <li><Link to="/user-manual">Manual de usuario</Link></li>
              <li><Link to="/videocall">Videollamada (demo)</Link></li>
              <li><Link to="/profile">Perfil</Link></li>
            </ul>
          </div>

          <div className="sitemap-col">
            <h4>Autenticación</h4>
            <ul>
              <li><Link to="/login">Iniciar sesión</Link></li>
              <li><Link to="/signup">Registro</Link></li>
              <li><Link to="/forgot">Recuperar contraseña</Link></li>
              <li><Link to="/reset">Restablecer contraseña</Link></li>
              <li><Link to="/change-password">Cambiar contraseña</Link></li>
            </ul>
          </div>
        </div>

        <div className="sitemap-footer">
          <p>&copy; 2025 wuepa. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Sitemap;
