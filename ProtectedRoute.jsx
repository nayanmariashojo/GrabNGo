import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * ProtectedRoute — wraps pages that require authentication.
 *
 * @param {string[]} allowedRoles – optional whitelist (e.g. ["admin"])
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { session, profile, loading } = useAuth();

  // Still loading session — show nothing (avoids redirect flash)
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!session) return <Navigate to="/login" replace />;

  // Role check (only when allowedRoles is provided and profile is loaded)
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}


