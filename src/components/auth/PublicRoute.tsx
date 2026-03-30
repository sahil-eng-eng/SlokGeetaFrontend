import { Navigate, Outlet } from "react-router-dom";

/**
 * PublicRoute — wraps auth pages (login, register, etc.).
 * If an access token already exists the user is redirected to /dashboard.
 */
export function PublicRoute() {
  const token = localStorage.getItem("access_token");
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
