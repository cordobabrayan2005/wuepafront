/**
 * Componente Sidebar que proporciona un panel de navegación colapsable.
 *
 * Este componente muestra un menú lateral con enlaces de navegación, acciones de usuario
 * y un botón para cerrar sesión. Soporta comportamiento de abrir/cerrar y superpone el resto
 * de la interfaz cuando está activo. El sidebar también se cierra automáticamente al navegar
 * a otra ruta o después de cerrar sesión.
 *
 * @componente
 * @param {Object} SidebarProps - Propiedades para el componente Sidebar.
 * @param {boolean} SidebarProps.isOpen - Controla si el sidebar es visible.
 * @param {() => void} SidebarProps.onClose - Callback ejecutado cuando se debe cerrar el sidebar.
 * @param {() => void} SidebarProps.onLogout - Callback disparado cuando el usuario cierra sesión.
 * @param {boolean} [SidebarProps.isAuthed] - Bandera opcional que indica el estado de autenticación.
 *
 * @returns {JSX.Element} Sidebar colapsable con enlaces de navegación y opciones de usuario.
 *
 * @ejemplo
 * <Sidebar
 *   isOpen={isSidebarOpen}
 *   onClose={() => setSidebarOpen(false)}
 *   onLogout={handleLogout}
 *   isAuthed={true}
 * />
 */
import React from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  isAuthed?: boolean;
}

export default function Sidebar({ isOpen, onClose, onLogout, isAuthed }: SidebarProps) {
  const handleLogout = () => {
    onLogout();
    onClose();
  };

  return (
    <>
      {/* Capa de fondo (overlay) */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      {/* Sidebar (menú lateral) */}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <NavLink to="/" className="sidebar-brand" onClick={onClose}>
          </NavLink>
          <button className="sidebar-close" onClick={onClose}>×</button>
        </div>

        <button className="sidebar-logout" onClick={handleLogout}>
          <span className="sidebar-icon">🚪</span>
          <span className="sidebar-text">Cerrar sesión</span>
        </button>
      </div>
    </>
  );
}
