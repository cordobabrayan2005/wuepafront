import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

/**
 * Componente simple de protección de rutas.
 *
 * Si el usuario está autenticado, renderiza los elementos hijos proporcionados.
 * De lo contrario, redirige a `/login` preservando el destino original
 * en el query string `redirectTo` para un posible redireccionamiento tras iniciar sesión.
 */
type Props = {
  children: React.ReactNode;
  requiredRole?: 'cliente' | 'admin';
};

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { isAuthed, user, isLoading } = useAuthStore();

  if (isLoading) {
    return <p>Cargando...</p>;
  }

  if (!isAuthed || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.rol !== requiredRole) {
    return <Navigate to="/buy" replace />;
  }

  return <>{children}</>;
}