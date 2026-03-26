import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * Top navigation bar — shown on auth pages and as a mobile toggle on panels.
 */
export default function Navbar({ onMenuToggle }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-100">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left: menu toggle (mobile) + brand */}
        <div className="flex items-center gap-3">
          {user && onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
              aria-label="Toggle sidebar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-indigo-600">
            🍽️ <span className="hidden sm:inline">Crowd-Free Canteen</span>
            <span className="sm:hidden">CFC</span>
          </Link>
        </div>

        {/* Right: user info + actions */}
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}


