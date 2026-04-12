// src/pages/Signup.tsx
import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import PasswordField from "../components/PasswordField";
import { useNavigate } from "react-router-dom";
import { validatePasswordRules } from "../utils/passwordRules";
import { useAuthStore } from "../stores/authStore";

/**
 * Componente Signup que renderiza un formulario de registro para nuevos usuarios.
 *
 * Características:
 * - Solicita información personal (nombre, apellido, edad).
 * - Solicita credenciales de acceso (correo, contraseña, confirmar contraseña).
 * - Valida la edad (debe ser >= 18).
 * - Valida la confirmación de la contraseña.
 * - Envía los datos a la API de registro.
 * - Muestra mensajes de éxito o error.
 * - Añade/elimina una clase CSS al body para el estilo.
 *
 * @component
 * @returns {JSX.Element} Interfaz de la página de registro.
 */
export default function Signup() {

  /**
   * Estado del formulario que contiene los valores ingresados por el usuario.
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
   * Mensaje mostrado al usuario tras la validación o respuesta de la API.
   */
  const [msg, setMsg] = useState("");

  /**
   * Tipo de mensaje mostrado (éxito, error, info).
   */
  const [msgType, setMsgType] = useState<"success" | "error" | "info">("info");

  const navigate = useNavigate();
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const socialLogin = useAuthStore((state) => state.socialLogin);
  const isLoading = useAuthStore((state) => state.isLoading);

  /**
   * Añade una clase CSS al body cuando el componente se monta,
   * y la elimina cuando se desmonta.
   */
  useEffect(() => {
    document.body.classList.add("login-page");
    return () => document.body.classList.remove("login-page");
  }, []);

  /**
   * Actualiza un campo específico en el estado del formulario.
   * @template K
   * @param {K} k - Clave del campo a actualizar.
   * @param {any} v - Nuevo valor para el campo.
   */
  function set<K extends keyof typeof form>(k: K, v: any) {
    setForm({ ...form, [k]: v });
  }

  /**
   * Maneja el envío del formulario.
   * Valida la edad y la confirmación de la contraseña antes de enviar los datos a la API.
   *
   * @async
   * @param {React.FormEvent} e - Evento de envío del formulario.
   * @returns {Promise<void>} Se resuelve cuando el proceso de registro finaliza.
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
      checkAuth();
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

  async function onGoogleSignup() {
    try {
      await socialLogin("google");
      setMsg("Inicio de sesión con Google exitoso.");
      setMsgType("success");
      navigate("/buy", {
        state: {
          flash: {
            type: "success",
            text: "Bienvenido a wuepa",
          },
        },
      });
    } catch (e: any) {
      setMsg(e.message || "Error al registrarte con Google.");
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

            <button type="submit" className="login-button" disabled={isLoading}>Crear cuenta</button>

            <div className="social-signup-container">
              <p className="social-signup-text">O regístrate con</p>
              <div className="social-signup-buttons">
                <button type="button" className="social-button google-button" onClick={onGoogleSignup} disabled={isLoading}>
                  <img src="/google.png" alt="Google" />
                  Google
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
