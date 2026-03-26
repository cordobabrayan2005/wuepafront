/**
 * Sidebar component that provides a collapsible navigation panel.
 *
 * This component displays a side menu containing navigation links, user actions,
 * and a logout button. It supports opening/closing behavior and overlays the rest
 * of the UI when active. The sidebar also closes automatically when navigating
 * to a different route or after logging out.
 *
 * @component
 * @param {Object} SidebarProps - Props for the Sidebar component.
 * @param {boolean} SidebarProps.isOpen - Controls whether the sidebar is visible.
 * @param {() => void} SidebarProps.onClose - Callback executed when the sidebar should close.
 * @param {() => void} SidebarProps.onLogout - Callback triggered when the user logs out.
 * @param {boolean} [SidebarProps.isAuthed] - Optional flag indicating authentication status.
 *
 * @returns {JSX.Element} A collapsible sidebar containing navigation links and user options.
 *
 * @example
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
      {/* Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      {/* Sidebar */}
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
