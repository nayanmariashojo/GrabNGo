import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const userLinks = [
  { to: '/user/dashboard', label: 'Dashboard', icon: '📊', end: true },
  { to: '/user/menu', label: 'Menu', icon: '🍔' },
  { to: '/user/cart', label: 'Cart', icon: '🛒' },
  { to: '/user/orders', label: 'My Orders', icon: '📦' },
  { to: '/user/profile', label: 'Profile', icon: '👤' },
];

export default function UserLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        links={userLinks}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


