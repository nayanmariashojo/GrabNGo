import { NavLink } from 'react-router-dom';

/**
 * Sidebar — responsive navigation sidebar for user/admin panels.
 * @param {Array} links — [{ to, label, icon }]
 * @param {function} onLogout
 * @param {boolean} isOpen — mobile sidebar open state
 * @param {function} onClose — close sidebar on mobile
 */
export default function Sidebar({ links = [], onLogout, isOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-xl transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <span className="text-2xl">🍽️</span>
          <span className="text-lg font-bold text-indigo-600">CFC System</span>
        </div>

        {/* Navigation links */}
        <nav className="mt-4 flex flex-col gap-1 px-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout button */}
        {onLogout && (
          <div className="absolute bottom-0 left-0 right-0 border-t p-3">
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <span className="text-lg">🚪</span>
              Logout
            </button>
          </div>
        )}
      </aside>
    </>
  );
}


