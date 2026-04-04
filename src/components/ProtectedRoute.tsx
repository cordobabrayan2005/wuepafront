import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

/**
 * Componente simple de protección de rutas.
 *
 * Si el usuario está autenticado, renderiza los elementos hijos proporcionados.
 * De lo contrario, redirige a `/login` preservando el destino original
 * en el query string `redirectTo` para un posible redireccionamiento tras iniciar sesión.
 */
export default function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { isAuthed } = useAuthStore();
  const location = useLocation();

  if (!isAuthed) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirectTo=${redirectTo}`} replace />;
  }
  return children;
}
