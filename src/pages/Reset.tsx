// src/pages/Reset.tsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
    <div className="login-layout">
      <div className="login-image">
        <img src="/contrawue.png" alt="Restablecer contraseña" />
      </div>
      <div className="login-form-section">
        <div className="login-card">
          <div className="login-logo">
            <div className="logo-circle large">
              {/* En Vite, /public se sirve desde la raíz */}
            </div>
            {/* brand text removed per request */}
          </div>


          <form onSubmit={onSubmit} className="login-form" aria-describedby="reset-status">
            <div className="input-group">
              <label htmlFor="password" className="label">Nueva contraseña</label>
              <PasswordField
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nueva contraseña"
                required
                className="login-input"
              />
            </div>

            <div className="input-group">
              <label htmlFor="confirm" className="label">Confirmar contraseña</label>
              <PasswordField
                id="confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirmar contraseña"
                required
                className="login-input"
              />
            </div>

            <button type="submit" className="login-button">
              Cambiar contraseña
            </button>
          </form>

          <div className="login-links">
            <p className="signup-text">
              <a href="/login" className="signup-link">Volver al inicio</a>
            </p>
          </div>

          {msg && (
            <p id="reset-status" role="status" className={`login-message ${msgType}`}>
              {msg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
