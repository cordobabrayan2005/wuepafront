import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

/**
 * Simple route guard component.
 *
 * If the user is authenticated, renders the provided children.
 * Otherwise, redirects to `/login` preserving the intended destination
 * in the `redirectTo` query string for a potential post-login redirect.
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
