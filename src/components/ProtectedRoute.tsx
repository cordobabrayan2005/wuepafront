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

export default function ProtectedRoute({
  children,
  requiredRole
}: Props) {

  const {
    isAuthed,
    user,
    isLoading
  } = useAuthStore();

  // Esperar validación Firebase
  if (isLoading) {
    return <p>Cargando...</p>;
  }

  // 🔥 NO autenticado
  if (!isAuthed || !user) {
    return <Navigate to="/login" replace />;
  }

  // 🔥 Usuario autenticado pero NO admin
  if (
    requiredRole &&
    user.rol !== requiredRole
  ) {
    return <Navigate to="/buy" replace />;
  }

  return <>{children}</>;
}