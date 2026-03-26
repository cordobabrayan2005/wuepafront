/* The code snippet is importing necessary modules and functions from the React library and a custom
API service file. */
// src/pages/Forgot.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

/**
 * Forgot password page component.
 *
 * Renders a simple "forgot password" form where the user can enter their email
 * to receive a password reset link. Calls the api.forgot service and displays
 * success or error feedback. Adds a page-level CSS class while mounted.
 *
 * @returns {JSX.Element} The forgot password page.
 */
export default function Forgot() {
  /**
   * Email input value for the recovery request.
   * @type {string}
   */
  const [email, setEmail] = useState("");

  /**
   * Status message shown to the user after submitting the form.
   * @type {string}
   */
  const [msg, setMsg] = useState("");

  /**
   * Message type used for styling: "success" | "error" | "info".
   * @type {"success" | "error" | "info"}
   */
  const [msgType, setMsgType] = useState<"success" | "error" | "info">("info");

  /**
   * Add a page-level class while the component is mounted for styling purposes.
   * Cleans up the class on unmount.
   */
  useEffect(() => {
    document.body.classList.add("login-page");
    return () => document.body.classList.remove("login-page");
  }, []);

  /**
   * Form submit handler.
   *
   * Sends a password recovery request to the API using the provided email.
   * On success shows a generic success message (to avoid leaking account existence).
   * On failure displays the API error message if available.
   *
   * @param {React.FormEvent} e - The form submit event.
   * @returns {Promise<void>}
   */
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.forgot(email);
      setMsg("Si el correo existe, se ha enviado un enlace de recuperación.");
      setMsgType("success");
    } catch (e: any) {
      setMsg(e.message || "Error al enviar el enlace.");
      setMsgType("error");
    }
  }

  return (
    <main className="auth-wrapper login-page" role="main" aria-labelledby="forgot-title">
      <div className="login-layout" aria-label="Forgot password split layout">
        <aside className="login-left contrawue" aria-hidden="true">
          <div className="login-image" />
        </aside>

        <section className="login-right" aria-describedby="forgot-description">
          <a href="/login" className="back-link">← Volver al inicio</a>
          <h1 id="forgot-title" className="signup-title">WUEPA</h1>
          <p id="forgot-description" className="signup-subtitle">Recuperar contraseña</p>

          <div className="info-box">
            Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
          </div>

          <form onSubmit={submit} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Correo electrónico</label>
              <input
                id="email"
                className="login-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
              />
            </div>

            <button type="submit" className="login-button">Enviar instrucciones</button>
          </form>

          <div className="login-links">
            <p className="forgot-text">
              <Link to="/login" className="forgot-link">¿Recordaste tu contraseña? Iniciar sesión</Link>
            </p>
            <p className="signup-text">
              ¿No tienes cuenta? <Link to="/signup" className="signup-link">Regístrate</Link>
            </p>
          </div>

          {msg && <p role="status" className={`login-message ${msgType}`}>{msg}</p>}
        </section>
      </div>
    </main>
  );
}
