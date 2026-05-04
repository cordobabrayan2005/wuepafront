import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

/**
 * Componente simple de protección de rutas.
 *
 * Si el usuario está autenticado, renderiza los elementos hijos proporcionados.
 * De lo contrario, redirige a `/login`.
 * También permite proteger por rol (admin / cliente).
 */
type Props = {
  children: React.ReactNode;
  requiredRole?: 'cliente' | 'admin';
};

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { isAuthed, user, isLoading } = useAuthStore();

  // 🔥 1. Esperar a que termine la validación inicial
  if (isLoading) {
    return <p>Cargando...</p>;
  }

  // 🔥 2. Evitar redirección prematura mientras se hidrata el user
  if (!user) {
    return <p>Cargando sesión...</p>;
  }

  // 🔐 3. Validar autenticación
  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  // 👑 4. Validar rol (solo si la ruta lo requiere)
  if (requiredRole && user.rol !== requiredRole) {
    return <Navigate to="/buy" replace />;
  }

  // ✅ 5. Acceso permitido
  return <>{children}</>;
}