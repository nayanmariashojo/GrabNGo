import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Auth pages
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import HomePage from './HomePage';

// User pages
import UserLayout from './UserLayout';
import UserDashboard from './UserDashboard';
import MenuPage from './MenuPage';
import CartPage from './CartPage';
import OrdersPage from './OrdersPage';
import ProfilePage from './ProfilePage';

// Admin pages
import AdminLayout from './AdminLayout';
import AdminDashboard from './AdminDashboard';
import ManageMenu from './ManageMenu';
import ManageOrders from './ManageOrders';
import ManageTimeSlots from './ManageTimeSlots';
import ManageCounters from './ManageCounters';
import PaymentsPage from './PaymentsPage';
import ManageUsers from './ManageUsers';

/** Redirects unauthenticated users to /login */
function RequireAuth({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/** Redirects authenticated users away from auth pages */
function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />;
  }
  return children;
}

export default function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Auth routes — only for guests */}
      <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
      <Route path="/signup" element={<GuestOnly><SignupPage /></GuestOnly>} />

      {/* User panel (students, staff) */}
      <Route
        path="/user"
        element={
          <RequireAuth>
            <UserLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<UserDashboard />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Admin panel */}
      <Route
        path="/admin"
        element={
          <RequireAuth allowedRoles={['admin']}>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="menu" element={<ManageMenu />} />
        <Route path="orders" element={<ManageOrders />} />
        <Route path="time-slots" element={<ManageTimeSlots />} />
        <Route path="counters" element={<ManageCounters />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="users" element={<ManageUsers />} />
      </Route>

      {/* Root redirect */}
      <Route
        path="/"
        element={
          user
            ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />
            : <HomePage />
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


