import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Forgot from "./pages/Forgot";
import Reset from "./pages/Reset";
import UserManual from "./pages/UserManual";
import About from "./pages/About";
import Profile from "./pages/Profile";
import Home from "./pages/Home";
import Buy from "./pages/buy";
import Products from "./pages/Products";
import { useAuthStore } from './stores/authStore';
import ProtectedRoute from "./components/ProtectedRoute";

/**
 * Root application component that mounts the routing shell inside a browser router.
 *
 * @returns {JSX.Element} React application entry point.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}

/**
 * Shell routing layer that renders navigation controls, guarded routes, and layout chrome.
 *
 * @returns {JSX.Element} Shell layout for authenticated and public routes.
 */
function Shell() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { isAuthed, logout, checkAuth } = useAuthStore();  

  /**
   * Performs initial authentication checks and subscribes to sidebar toggle events.
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
   * Closes the sidebar if it is currently open.
   */
  /**
   * Logs out the current user and returns to the login route.
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
          <Route path="/user-manual" element={<UserManual />} />
          <Route path="/buy" element={<ProtectedRoute><Buy /></ProtectedRoute>} />
          <Route path="/products" element={<Products />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </main>
    </div>
  );
}
