import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/menu', label: 'Manage Menu', icon: '🍽️' },
  { to: '/admin/orders', label: 'Orders', icon: '📦' },
  { to: '/admin/time-slots', label: 'Time Slots', icon: '⏰' },
  { to: '/admin/counters', label: 'Counters', icon: '🏪' },
  { to: '/admin/payments', label: 'Payments', icon: '💳' },
  { to: '/admin/users', label: 'Users', icon: '👥' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        links={adminLinks}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


