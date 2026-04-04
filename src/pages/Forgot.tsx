/* Este fragmento importa los módulos y funciones necesarios de React y el servicio API personalizado. */
// src/pages/Forgot.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

/**
 * Componente de recuperación de contraseña (Forgot).
 *
 * Renderiza un formulario simple donde el usuario puede ingresar su correo electrónico
 * para recibir un enlace de restablecimiento de contraseña. Llama al servicio api.forgot
 * y muestra mensajes de éxito o error. Añade una clase CSS a nivel de página mientras está montado.
 *
 * @returns {JSX.Element} Página de recuperación de contraseña.
 */
export default function Forgot() {
  /**
   * Valor del campo de correo electrónico para la solicitud de recuperación.
   * @type {string}
   */
  const [email, setEmail] = useState("");

  /**
   * Mensaje de estado mostrado al usuario tras enviar el formulario.
   * @type {string}
   */
  const [msg, setMsg] = useState("");

  /**
   * Tipo de mensaje para el estilo: "success" | "error" | "info".
   * @type {"success" | "error" | "info"}
   */
  const [msgType, setMsgType] = useState<"success" | "error" | "info">("info");

  /**
   * Añade una clase CSS a nivel de página mientras el componente está montado para el estilo.
   * Elimina la clase al desmontar el componente.
   */
  useEffect(() => {
    document.body.classList.add("login-page");
    return () => document.body.classList.remove("login-page");
  }, []);

  /**
   * Manejador del envío del formulario.
   *
   * Envía una solicitud de recuperación de contraseña a la API usando el correo proporcionado.
   * Si es exitoso, muestra un mensaje genérico de éxito (para no revelar la existencia de la cuenta).
   * Si falla, muestra el mensaje de error de la API si está disponible.
   *
   * @param {React.FormEvent} e - Evento de envío del formulario.
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
