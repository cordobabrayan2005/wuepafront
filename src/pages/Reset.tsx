// src/pages/Reset.tsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import PasswordField from "../components/PasswordField";
import { validatePasswordRules } from "../utils/passwordRules";

/**
 * @typedef {Object} Participant
 * @property {number} id
 * @property {string} name
 *
 * @typedef {Object} ChatMessage
 * @property {number} id
 * @property {string} author
 * @property {string} text
 *
 * (Nota: Tipos no utilizados en este archivo, pueden eliminarse si no son necesarios)
 */

/**
 * Componente de restablecimiento de contraseña (Reset).
 *
 * Renderiza un formulario para restablecer la contraseña, leyendo el token desde los parámetros de la URL.
 * Valida la nueva contraseña y la confirmación localmente y llama a la API para realizar el restablecimiento.
 * Muestra mensajes de estado y redirige a la página de inicio de sesión en caso de éxito.
 *
 * @returns {JSX.Element} Página de restablecimiento de contraseña.
 */
export default function Reset() {
  /**
   * Hook para obtener los parámetros de búsqueda de la URL. El token de restablecimiento se espera en el parámetro "token".
   * @type {[URLSearchParams]}
   */
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const token = sp.get("oobCode") || sp.get("token") || "";

  /** Valor del campo de nueva contraseña. */
  const [password, setPassword] = useState("");
  /** Valor del campo de confirmación de contraseña. */
  const [confirm, setConfirm] = useState("");
  /** Mensaje de estado o retroalimentación mostrado al usuario. */
  const [msg, setMsg] = useState("");
  /** Tipo de mensaje para el estilo: "success" | "error" | "info". */
  const [msgType, setMsgType] = useState<"success" | "error" | "info">("info");

  /**
   * Añade una clase CSS a nivel de página mientras el componente está montado para el estilo.
   * Elimina la clase al desmontar el componente.
   */
  useEffect(() => {
    document.body.classList.add("login-page");
    return () => { document.body.classList.remove("login-page"); };
  }, []);

  /**
   * Manejador del envío del formulario.
   *
   * Realiza validaciones del lado del cliente:
   *  - asegura que el token esté presente
   *  - valida que la contraseña cumpla letras, dígitos y símbolos requeridos
   *  - verifica que la contraseña y la confirmación coincidan
   *
   * Si todo es correcto, llama a api.reset(token, password) y luego redirige
   * a la página de inicio de sesión tras un breve retraso.
   *
   * Los errores de la API se muestran en el mensaje de estado.
   *
   * @param {React.FormEvent} e - Evento de envío del formulario.
   * @returns {Promise<void>}
   */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setMsg("Falta token. Abre el enlace desde tu correo nuevamente.");
      setMsgType("error");
      return;
    }
    const { valid, message } = validatePasswordRules(password);
    if (!valid) {
      setMsg(message || "La contraseña no cumple los requisitos de seguridad.");
      setMsgType("error");
      return;
    }
    if (password !== confirm) {
      setMsg("Las contraseñas no coinciden.");
      setMsgType("error");
      return;
    }
    try {
      await api.reset(token, password);  // Changed: remove confirm
      setMsg("Contraseña actualizada. Redirigiendo al inicio de sesión…");
      setMsgType("success");
      setTimeout(() => navigate("/login"), 1200);
    } catch (e: any) {
      setMsg(e.message || "Error al restablecer.");
      setMsgType("error");
    }
  }

  return (
    <main className="auth-wrapper login-page" role="main" aria-labelledby="reset-title">
      <div className="login-layout" aria-label="Reset password split layout">
        <aside className="login-left contrawue" aria-hidden="true">
          <div className="login-image" />
          <div className="login-overlay forgot-overlay reset-overlay">
            <span className="forgot-overlay-badge">Nueva contraseña</span>
            <h2>Actualiza tu acceso</h2>
            <p>
              Crea una contraseña segura para proteger tu cuenta y volver a comprar sin interrupciones.
            </p>
          </div>
        </aside>

        <section className="login-right" aria-describedby="reset-description">
          <div className="forgot-panel reset-panel">
            <a href="/login" className="back-link">← Volver al inicio</a>
            <p className="forgot-kicker">Restablecer acceso</p>
            <h1 id="reset-title" className="signup-title">Crea tu nueva contraseña</h1>
            <p id="reset-description" className="signup-subtitle forgot-subtitle">
              Elige una contraseña nueva, segura y fácil de recordar para ti. Debe cumplir los requisitos de seguridad del sistema.
            </p>

            <div className="forgot-card reset-card">
              <div className="forgot-card-icon" aria-hidden="true">🔒</div>
              <div>
                <strong>Antes de continuar</strong>
                <p>
                  Usa una combinación robusta y confirma exactamente la misma contraseña en ambos campos para completar el cambio.
                </p>
              </div>
            </div>

            <div className="reset-requirements" aria-label="Requisitos de la contraseña">
              <div className="reset-requirement">Incluye letras mayúsculas y minúsculas.</div>
              <div className="reset-requirement">Agrega números y símbolos especiales.</div>
              <div className="reset-requirement">Evita usar datos fáciles de adivinar.</div>
            </div>

            <form onSubmit={onSubmit} className="login-form reset-form" aria-describedby="reset-status">
              <div className="form-group">
                <label htmlFor="password" className="form-label">Nueva contraseña</label>
                <PasswordField
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  label=""
                  placeholder="Nueva contraseña"
                  required
                  className="login-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm" className="form-label">Confirmar contraseña</label>
                <PasswordField
                  id="confirm"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  label=""
                  placeholder="Confirmar contraseña"
                  required
                  className="login-input"
                />
              </div>

              <button type="submit" className="login-button">
                Cambiar contraseña
              </button>
            </form>

            {msg && (
              <p id="reset-status" role="status" className={`login-message ${msgType}`}>
                {msg}
              </p>
            )}

            <div className="login-links forgot-links">
              <p className="signup-text">
                <Link to="/login" className="signup-link">Volver al inicio de sesión</Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
