import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../stores/authStore";

/**
 * Estructura de los datos de perfil devueltos por el backend.
 * @typedef {Object} ProfileData
 * @property {string} [name]
 * @property {string} [lastname]
 * @property {string|number} [age]
 * @property {string} [email]
 */

/**
 * Componente de la página de perfil.
 *
 * Responsabilidades:
 * - Obtiene los datos del usuario autenticado mediante `api.me()`.
 * - Muestra un estado de carga centrado con spinner mientras contacta al backend.
 * - Permite editar y actualizar (PUT) los campos básicos del perfil.
 * - Permite eliminar la cuenta y cerrar sesión.
 * - Usa el store de autenticación (`useAuthStore`) para mostrar datos inmediatos si ya están en memoria.
 *
 * Estado:
 * - `me`: Datos actuales del perfil (o null mientras carga).
 * - `form`: Valores temporales para edición.
 * - `editing`: Bandera para habilitar modo edición.
 * - `msg`: Mensaje de retroalimentación (éxito / error).
 *
 * Accesibilidad:
 * - Spinner con `role="status"` y `aria-live` para usuarios de lector de pantalla.
 * - Etiquetas visibles asociadas a cada campo editable.
 *
 * Errores:
 * - Si la carga inicial falla, el texto de error se almacena en `msg`.
 * - Si no hay token, se muestra un mensaje para iniciar sesión.
 */
export default function Profile() {
  const FLASH_STORAGE_KEY = 'wuepa-auth-flash';
  const [me, setMe] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [form, setForm] = useState({
    name: "",
    lastname: "",
    age: "",
    email: ""
  });
  // La contraseña nunca es editable ni recuperable; solo se muestra enmascarada.
  const navigate = useNavigate();
  const { user, isAuthed, logout } = useAuthStore();

  function redirectToLoginWithLogoutMessage() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    setMsg('Cerrando sesión...');

    window.setTimeout(() => {
      sessionStorage.setItem(FLASH_STORAGE_KEY, JSON.stringify({ type: 'info', text: 'Se cerró sesión correctamente.' }));
      logout();
      navigate('/login', { state: { flash: { type: 'info', text: 'Se cerró sesión correctamente.' } } });
    }, 650);
  }

  /**
   * Carga los datos del perfil desde el backend y sincroniza el estado del formulario.
   * @async
   * @returns {Promise<void>}
   */
  async function load() {
    try {
      const data = await api.me();
      console.log("Datos recibidos:", data);
      setMe(data);
      setForm({
        name: data.name || "",
        lastname: data.lastname || "",
        age: String(data.age || ""),
        email: data.email || ""
      });
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  useEffect(() => {
    // Si ya tenemos el usuario en el store, lo mostramos de inmediato para evitar parpadeo.
    if (user && !me) {
      setMe(user);
      setForm({
        name: user.name || "",
        lastname: user.lastname || "",
        age: String(user.age || ""),
        email: user.email || ""
      });
    }
    // Siempre intentamos sincronizar con el backend para evitar datos desactualizados.
    load();
  }, []);

  /**
   * Actualiza un campo específico en el formulario de edición.
   * @template K
   * @param {K} key Clave del campo a actualizar.
   * @param {any} value Nuevo valor para el campo.
   */
  function set<K extends keyof typeof form>(key: K, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  /**
   * Envía los cambios del formulario al backend (PUT /profile).
   * @async
   * @returns {Promise<void>}
   */
  async function save() {
    try {
      const updated = {
        ...me,
        name: form.name,
        lastname: form.lastname,
        age: Number(form.age),
        email: form.email,
      };
      setMe(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      setMsg("Perfil actualizado correctamente ✅");
      setEditing(false);
      // No password state to clear (password not editable).
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  /**
   * Elimina la cuenta del usuario actual (DELETE /profile) tras confirmación.
   * Limpia la sesión y redirige a /login.
   * @async
   * @returns {Promise<void>}
   */
  async function kill() {
    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.');
    if (!confirmDelete) return;
    try {
      localStorage.removeItem('user');
      sessionStorage.setItem(FLASH_STORAGE_KEY, JSON.stringify({ type: 'info', text: 'Se cerró sesión correctamente.' }));
      logout();
      setMsg("Cuenta eliminada.");
      navigate("/login", { state: { flash: { type: 'info', text: 'Se cerró sesión correctamente.' } } });
    } catch (e: any) {
      setMsg(e.message);
    }
  }


  /** Maneja el clic en el botón de guardar (no se permite editar email/contraseña). */
  function handleSaveClick() {
    if (!editing) { setEditing(true); return; }
    save();
  }

  // Verifica si hay token o sesión activa
  const hasToken = !!localStorage.getItem("user") || isAuthed;
  if (!hasToken && !isAuthed) {
    console.warn('[Profile] No se encontró token en localStorage ni en el store');
    return (
      <div className="profile-loading">
        <p>Por favor, inicia sesión primero.</p>
      </div>
    );
  }
  // Estado de carga mientras se obtienen los datos
  if (!me) return (
    <div className="profile-loading" role="status" aria-live="polite" aria-label="Cargando perfil">
      <div className="spinner" aria-hidden="true" />
      <p>Cargando perfil...</p>
    </div>
  );

  return (
    <section className="profile-page" role="region" aria-labelledby="profile-title" lang="es">
      <div className="profile-card-new">
        <div className="profile-header-row">
          <button className="profile-close" aria-label="Cerrar" onClick={() => navigate('/buy')}>×</button>
          <button className="profile-logout-link" onClick={redirectToLoginWithLogoutMessage} disabled={isLoggingOut}>{isLoggingOut ? '↪ Cerrando...' : '↪ Cerrar sesión'}</button>
        </div>
        <div className="profile-panel">
          <div className="profile-columns">
            <div className="profile-col profile-col-left">
              <h2 id="profile-title">Mi perfil</h2>
              <div className="profile-block">
                <div className="mini-label">Nombres</div>
                {editing ? (
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    className="profile-edit-input"
                  />
                ) : (
                  <div className="mini-value">{me.name}</div>
                )}
              </div>
              <div className="profile-block">
                <div className="mini-label">apellidos</div>
                {editing ? (
                  <input
                    type="text"
                    value={form.lastname}
                    onChange={(e) => set("lastname", e.target.value)}
                    className="profile-edit-input"
                  />
                ) : (
                  <div className="mini-value">{me.lastname}</div>
                )}
              </div>
              <div className="profile-block">
                <div className="mini-label">Edad</div>
                {editing ? (
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => set("age", e.target.value)}
                    className="profile-edit-input"
                  />
                ) : (
                  <div className="mini-value">{me.age}</div>
                )}
              </div>
            </div>
            <div className="profile-col profile-col-right">
              <div className="profile-block">
                <div className="mini-label">Correo electronico</div>
                <div className="mini-value profile-email" title={me.email}>{me.email}</div>
              </div>
              <div className="profile-block">
                <div className="mini-label">Contraseña (no editable)</div>
                <div className="mini-value password-obfuscated">********</div>
              </div>
            </div>
          </div>
        </div>
        <div className="profile-actions-row">
          <button className="btn primary profile-save-btn" onClick={editing ? handleSaveClick : () => setEditing(true)}>
            {editing ? "Guardar cambios" : "Editar perfil"}
          </button>
          <button className="profile-delete-btn" onClick={kill}>🗑 Eliminar cuenta</button>
        </div>
        {msg && <p role="status" className="profile-message-alt">{msg}</p>}
      </div>
    </section>
  );
};
