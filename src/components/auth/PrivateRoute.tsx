import { Navigate, Outlet } from "react-router-dom";

/**
 * PrivateRoute — wraps dashboard routes that require authentication.
 * If no access token exists the user is redirected to /login.
 */
export function PrivateRoute() {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
