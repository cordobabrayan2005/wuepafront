/**
 * Componente Login
 *
 * Este componente maneja la autenticación de usuarios permitiendo ingresar correo y contraseña para iniciar sesión.
 * Incluye autenticación social y muestra mensajes de estado según el resultado.
 *
 * @param e - En el código, el parámetro `e` es el objeto de evento en la función onSubmit, de tipo `React.FormEvent`.
 * Se utiliza para prevenir el comportamiento por defecto del formulario.
 */

// src/pages/Login.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuthStore } from '../stores/authStore';  // Nuevo
import PasswordField from "../components/PasswordField";

/**
 * Props para el componente Login.
 * @typedef {Object} Props
 * @property {Function} [onAuth] - Callback opcional invocado tras autenticación exitosa.
 */

/**
 * Componente Login.
 *
 * Renderiza un formulario de correo/contraseña, botones de autenticación social y maneja la autenticación
 * usando el servicio `api` y el store Zustand.
 *
 * @param {Props} props - Props del componente.
 * @returns {JSX.Element} Interfaz de formulario de inicio de sesión.
 */
type Props = { onAuth?: () => void };

export default function Login({ onAuth }: Props) {
  const FLASH_STORAGE_KEY = 'wuepa-auth-flash';
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  /**
   * Estado del campo de correo electrónico.
   * @type {string}
   */
  const [email, setEmail] = useState("");

  /**
   * Estado del campo de contraseña.
   * @type {string}
   */
  const [password, setPassword] = useState("");

  /**
   * Mensaje de estado mostrado al usuario (éxito / error / info).
   * @type {string}
   */
  const [msg, setMsg] = useState("");

  /**
   * Tipo de mensaje para el estilo: "success" | "error" | "info".
   * @type {"success" | "error" | "info"}
   */
  const [msgType, setMsgType] = useState<"success" | "error" | "info">("info");

  const navigate = useNavigate();
  const location = useLocation();
  const { login, socialLogin, isLoading } = useAuthStore();  // Nuevo

  /**
   * Manejador del envío del formulario.
   *
   * Llama a store.login con las credenciales proporcionadas. Si es exitoso, invoca el callback opcional
   * onAuth, muestra un mensaje de éxito y navega a la página principal. Si falla, muestra el mensaje de error de la API.
   *
   * @param {React.FormEvent} e - Evento de envío del formulario.
   * @returns {Promise<void>}
   */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);  // Usa store
      onAuth?.();
      setMsg("Inicio de sesión exitoso.");
      setMsgType("success");
      navigate("/buy", { state: { flash: { type: "success", text: "Has iniciado sesión correctamente." } } });
    } catch (e: any) {
      setMsg(e.message || "Error al iniciar sesión.");
      setMsgType("error");
    }
  }

  /**
   * Manejador de autenticación social.
   *
   * Llama a store.socialLogin con el proveedor. Si es exitoso, navega a la página principal.
   *
   * @param {string} provider - 'google' o 'facebook'
   * @returns {Promise<void>}
   */
  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      await socialLogin(provider);  // Usa store
      onAuth?.();
      setMsg("Inicio de sesión exitoso.");
      setMsgType("success");
      navigate("/buy", { state: { flash: { type: "success", text: "Has iniciado sesión correctamente." } } });
    } catch (e: any) {
      setMsg(e.message || "Error en login social.");
      setMsgType("error");
    }
  };

  /**
   * Añade una clase CSS a nivel de página mientras el componente está montado para el estilo.
   */
  useEffect(() => {
    document.body.classList.add("login-page");
    return () => document.body.classList.remove("login-page");
  }, []);

  // Muestra mensaje de éxito si venimos de un registro o redirección
  useEffect(() => {
    const state = location.state as any;
    const persistedFlash = sessionStorage.getItem(FLASH_STORAGE_KEY);
    const storedFlash = persistedFlash ? JSON.parse(persistedFlash) as { text?: string; type?: "success" | "error" | "info" } : null;
    const flash = state?.flash ?? storedFlash;

    if (!flash) {
      return;
    }

    setToast({
      text: flash.text || "Cuenta creada sin problemas. Inicia sesión para continuar.",
      type: flash.type || "success",
    });
    sessionStorage.removeItem(FLASH_STORAGE_KEY);
    // Clear the navigation state to prevent it from re-displaying when going back.
    navigate(location.pathname + location.search, { replace: true });
  }, [location, navigate]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  return (
    <main className="auth-wrapper login-page" role="main" aria-labelledby="login-title">
      {toast && (
        <div role="status" aria-live="polite" className={`auth-toast ${toast.type}`}>
          {toast.text}
        </div>
      )}

      <div className="login-layout login-layout-no-mobile-art" aria-label="Login split layout">
        <aside className="login-left wuepaini" aria-hidden="true">
          <div className="login-image" />
        </aside>

        <section className="login-right" aria-describedby="login-description">
          <div className="login-panel">
            <a href="/" className="back-link">← Volver al inicio</a>

            <h1 id="login-title" className="signup-title">WUEPA</h1>
            <p id="login-description" className="signup-subtitle">Iniciar sesión en tu cuenta</p>

            <form onSubmit={onSubmit} className="login-form" aria-label="Formulario de inicio de sesión">
              <div className="form-group">
                <label htmlFor="email" className="form-label">Correo electrónico</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="login-input"
                  aria-required="true"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Contraseña</label>
                <PasswordField
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  label=""
                  placeholder="********"
                  required
                  className="login-input"
                />
              </div>

              <button type="submit" className="login-button" disabled={isLoading} aria-label="Ingresar a tu cuenta">
                Iniciar sesión
              </button>

              <div className="social-signup-container">
                <p className="social-signup-text">O continúa con</p>
                <div className="social-signup-buttons">
                  <button type="button" className="social-button google-button" onClick={() => handleSocialLogin('google')} disabled={isLoading}>
                    <img src="/google.png" alt="Google" />
                    Google
                  </button>
                </div>
              </div>
            </form>

            <nav className="login-links" aria-label="Enlaces de ayuda">
              <p className="forgot-text">
                <Link to="/forgot" className="forgot-link">¿Olvidaste tu contraseña?</Link>
              </p>

              <p className="signup-text">
                ¿No tienes cuenta? <Link to="/signup" className="signup-link">Regístrate aquí</Link>
              </p>
            </nav>

            {msg && (
              <p role="status" aria-live="polite" className={`login-message ${msgType}`}>
                {msg}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
