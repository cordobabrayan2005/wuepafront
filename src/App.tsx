import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Forgot from "./pages/Forgot";
import Reset from "./pages/Reset";
import UserManual from "./pages/UserManual";
import About from "./pages/About";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";
import Home from "./pages/Home";
import Buy from "./pages/buy";
import Products from "./pages/Products";
import ProductsSin from "./pages/ProductsSin";
import { useAuthStore } from './stores/authStore';
import ProtectedRoute from "./components/ProtectedRoute";

/**
 * Componente raíz de la aplicación que monta la capa de rutas dentro de un router de navegador.
 *
 * @returns {JSX.Element} Punto de entrada de la aplicación React.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}

/**
 * Capa de rutas (Shell) que renderiza controles de navegación, rutas protegidas y el layout general.
 *
 * @returns {JSX.Element} Layout para rutas públicas y autenticadas.
 */
function Shell() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { isAuthed, logout, checkAuth } = useAuthStore();  

  /**
   * Realiza comprobaciones iniciales de autenticación y suscribe a eventos de apertura/cierre del menú lateral.
   */
  useEffect(() => {
    checkAuth();
    function onToggle() {
      setSidebarOpen((s) => !s);
    }
    window.addEventListener("toggleSidebar", onToggle as EventListener);
    return () => window.removeEventListener("toggleSidebar", onToggle as EventListener);
  }, []);

  /**
   * Cierra el menú lateral si está abierto.
   */
  /**
   * Cierra la sesión del usuario actual y regresa a la ruta de inicio de sesión.
   */
  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app">
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot" element={<Forgot />} />
          <Route path="/reset" element={<Reset />} />
          <Route path="/about" element={<About />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route path="/user-manual" element={<UserManual />} />
          <Route path="/buy" element={<ProtectedRoute><Buy /></ProtectedRoute>} />
          <Route path="/products" element={<Products />} />
          <Route path="/productssin" element={<ProductsSin />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </main>
    </div>
  );
}
