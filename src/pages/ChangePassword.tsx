// ...existing code...
/* src/pages/ChangePassword.tsx */
import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import PasswordField from "../components/PasswordField";
import { validatePasswordRules } from "../utils/passwordRules";

/**
 * Componente ChangePassword.
 *
 * Proporciona una interfaz para que los usuarios autenticados cambien la contraseña de su cuenta.
 * Realiza validaciones del lado del cliente (longitud mínima y coincidencia de confirmación)
 * y llama a api.changePassword para actualizar la contraseña en el servidor.
 *
 * Si el usuario no está autenticado (no hay token en localStorage) se muestra un mensaje.
 *
 * @returns {JSX.Element} Página para cambiar la contraseña.
 */
export default function ChangePassword() {
  /**
   * Valor del campo de la contraseña actual.
   * @type {string}
   */
  const [currentPassword, setCurrentPassword] = useState("");

  /**
   * Valor del campo de la nueva contraseña.
   * @type {string}
   */
  const [newPassword, setNewPassword] = useState("");

  /**
   * Confirmación de la nueva contraseña.
   * @type {string}
   */
  const [confirmPassword, setConfirmPassword] = useState("");

  /**
   * Mensaje de estado o retroalimentación mostrado al usuario.
   * @type {string}
   */
  const [msg, setMsg] = useState("");

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
   * Realiza validaciones del lado del cliente:
   *  - la nueva contraseña debe tener al menos 6 caracteres
   *  - la nueva contraseña y la confirmación deben coincidir
   *
   * Si todo es correcto, llama a api.changePassword(currentPassword, newPassword, confirmPassword)
   * y limpia los campos. Los errores de la API se muestran en el mensaje de estado.
   *
   * @param {React.FormEvent} e - Evento de envío del formulario.
   * @returns {Promise<void>}
   */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { valid, message } = validatePasswordRules(newPassword);
    if (!valid) {
      setMsg(message || "La contraseña no cumple los requisitos de seguridad.");
      return;
    }
    if (newPassword !== confirmPassword) return setMsg("Las contraseñas no coinciden.");
    try {
      await api.changePassword(currentPassword, newPassword, confirmPassword);
      setMsg("Contraseña cambiada ✓");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (e: any) {
      setMsg(e.message || "Error al cambiar contraseña.");
    }
  }

  // Si el usuario no está autenticado, se le solicita iniciar sesión primero.
  if (!localStorage.getItem("token")) {
    return <div className="container">Inicia sesión para cambiar tu contraseña.</div>;
  }

  return (
    <div className="login-container" role="main" aria-labelledby="changepw-title" lang="es">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-circle large">
          </div>
        </div>
        <h2 id="changepw-title" className="label">Cambiar contraseña</h2>
        <form onSubmit={onSubmit} className="login-form" aria-describedby="changepw-status">
          <div className="input-group">
            <label htmlFor="current" className="label">Contraseña actual</label>
            <PasswordField id="current" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="pwd" className="label">Nueva contraseña</label>
            <PasswordField id="pwd" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="confirm" className="label">Confirmar contraseña</label>
            <PasswordField id="confirm" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required />
          </div>
          <button type="submit" className="login-button">Guardar</button>
        </form>
        {msg && <p id="changepw-status" role="status" className="login-message">{msg}</p>}
      </div>
    </div>
  );
}
