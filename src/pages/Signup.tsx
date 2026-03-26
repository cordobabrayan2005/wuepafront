// src/pages/Signup.tsx
import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import PasswordField from "../components/PasswordField";
import { useNavigate } from "react-router-dom";
import { validatePasswordRules } from "../utils/passwordRules";

/**
 * Signup component that renders a registration form for new users.
 * 
 * Features:
 * - Collects personal information (name, lastname, age).
 * - Collects login credentials (email, password, confirm password).
 * - Validates age (must be >= 18).
 * - Validates password confirmation.
 * - Submits data to the signup API.
 * - Displays success or error messages.
 * - Adds/removes a CSS class to the body for styling.
 * 
 * @component
 * @returns {JSX.Element} The signup page UI.
 */
export default function Signup() {

   /**
   * Form state containing user input values.
   */
  const [form, setForm] = useState({
    name: "",
    lastname: "",
    age: "", 
    email: "",
    password: "",
    confirmPassword: ""
  });

  /**
   * Message displayed to the user after validation or API response.
   */
  const [msg, setMsg] = useState("");

  /**
   * Type of message displayed (success, error, info).
   */
  const [msgType, setMsgType] = useState<"success" | "error" | "info">("info");

  const navigate = useNavigate();

  /**
   * Adds a CSS class to the body when the component mounts,
   * and removes it when the component unmounts.
   */
  useEffect(() => {
    document.body.classList.add("login-page");
    return () => document.body.classList.remove("login-page");
  }, []);

   /**
   * Updates a specific field in the form state.
   * 
   * @template K
   * @param {K} k - The key of the form field to update.
   * @param {any} v - The new value for the field.
   */
  function set<K extends keyof typeof form>(k: K, v: any) {
    setForm({ ...form, [k]: v });
  }

  /**
   * Handles form submission.
   * Validates age and password confirmation before sending data to the API.
   * 
   * @async
   * @param {React.FormEvent} e - The form submission event.
   * @returns {Promise<void>} Resolves when the signup process completes.
   */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Age validation
    if (Number(form.age) < 18 || isNaN(Number(form.age))) {
      setMsg("Debes tener al menos 18 años para registrarte.");
      setMsgType("error");
      return;
    }
    const { valid, message } = validatePasswordRules(form.password);
    if (!valid) {
      setMsg(message || "La contraseña no cumple los requisitos de seguridad.");
      setMsgType("error");
      return;
    }
    // Password confirmation validation
    if (form.password !== form.confirmPassword) {
      setMsg("Las contraseñas no coinciden.");
      setMsgType("error");
      return;
    }
    try {
      const formData = {
        name: form.name,
        lastname: form.lastname,
        age: Number(form.age),  // Send as number
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword
      };
      await api.signup(formData);
      setMsg("Cuenta creada sin problemas. Redirigiendo a compras...");
      setMsgType("success");
      navigate("/buy", {
        state: {
          flash: {
            type: "success",
            text: "Cuenta creada sin problemas. ¡Bienvenida a shop!",
          },
        },
        replace: true,
      });
    } catch (e: any) {
      setMsg(e.message || "Error al crear la cuenta.");
      setMsgType("error");
    }
  }

  return (
    <main className="auth-wrapper signup-page" role="main" aria-labelledby="signup-title" lang="es">
      <div className="signup-layout">
        <section className="signup-left">
          <a href="/login" className="back-link">← Volver al inicio</a>
          <h1 id="signup-title" className="signup-title">WUEPA</h1>
          <p className="signup-subtitle">Crea tu cuenta y comienza a brillar</p>

          <form onSubmit={onSubmit} className="signup-form" aria-label="Formulario de registro">
            <div className="form-group">
              <label htmlFor="name" className="sr-only">Nombre completo</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Nombre completo"
                required
                className="login-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastname" className="sr-only">Apellido</label>
              <input
                id="lastname"
                type="text"
                value={form.lastname}
                onChange={(e) => set("lastname", e.target.value)}
                placeholder="Apellido"
                required
                className="login-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="age" className="sr-only">Edad</label>
              <input
                id="age"
                type="number"
                min={18}
                value={form.age}
                onChange={(e) => set("age", e.target.value)}
                placeholder="Edad (mínimo 18 años)"
                required
                className="login-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="sr-only">Correo electrónico</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="Correo electrónico"
                required
                aria-required="true"
                className="login-input"
              />
            </div>

            <div className="form-group">
              <PasswordField
                id="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                label=""
                placeholder="Contraseña"
                required
                className="login-input"
              />
            </div>

            <div className="form-group">
              <PasswordField
                id="confirmPassword"
                value={form.confirmPassword}
                onChange={(e) => set("confirmPassword", e.target.value)}
                label=""
                placeholder="Confirmar contraseña"
                required
                className="login-input"
              />
            </div>

            <button type="submit" className="login-button">Crear cuenta</button>

            <div className="social-signup-container">
              <p className="social-signup-text">O regístrate con</p>
              <div className="social-signup-buttons">
                <button type="button" className="social-button google-button" onClick={() => console.log('Google signup')}>
                  <img src="/google.png" alt="Google" />
                  Google
                </button>
                <button type="button" className="social-button facebook-button" onClick={() => console.log('Facebook signup')}>
                  <img src="/faceb.png" alt="Facebook" />
                  Facebook
                </button>
              </div>
            </div>
          </form>

          <div className="login-links">
            <p className="signup-text">¿Ya tienes cuenta? <a href="/login" className="signup-link">Inicia sesión</a></p>
          </div>

          {msg && (
            <p id="signup-status" role="status" className={`login-message ${msgType}`}>
              {msg}
            </p>
          )}
        </section>

        <aside className="signup-right" aria-hidden="true">
          <div className="signup-image" />
          <div className="signup-overlay" />
        </aside>
      </div>
    </main>
  );
}
