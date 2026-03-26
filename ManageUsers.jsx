import { useState, useEffect } from 'react';
import { getUsers, toggleUserStatus, getUserOrders, updateUser } from './userService';
import Modal from './Modal';
import Alert from './Alert';
import { useAuth } from './AuthContext';
import { runtimeConfig } from './runtimeConfig';

export default function ManageUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { loadUsers(); }, []);

  const isProtectedAdmin = (u) => {
    const allowlist = runtimeConfig.adminEmailAllowlist || [];
    if (!allowlist.length) return false;
    const email = String(u?.email || '').trim().toLowerCase();
    return u?.role === 'admin' && allowlist.includes(email);
  };

  const isSelf = (u) => currentUser?.id && u?.id === currentUser.id;

  const loadUsers = async () => {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleToggleStatus = async (userId) => {
    try {
      await toggleUserStatus(userId);
      setAlert({ type: 'success', message: 'User status updated' });
      loadUsers();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await updateUser(userId, { role });
      setAlert({ type: 'success', message: 'User role updated' });
      loadUsers();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleViewOrders = async (user) => {
    setSelectedUser(user);
    const orders = await getUserOrders(user.id);
    setUserOrders(orders);
    setOrderModalOpen(true);
  };

  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
        <p className="text-sm text-gray-500">View and manage user accounts</p>
      </div>

      {alert.message && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={isSelf(user) || isProtectedAdmin(user)}
                      className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium capitalize focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="student">student</option>
                      <option value="staff">staff</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                      {user.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        disabled={isSelf(user) || isProtectedAdmin(user)}
                        className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                          user.is_active
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        } ${isSelf(user) || isProtectedAdmin(user) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {user.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleViewOrders(user)}
                        className="rounded-lg px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        Orders
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-gray-400">No users found</div>
          )}
        </div>
      )}

      {/* Order History Modal */}
      <Modal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        title={`Order History — ${selectedUser?.name}`}
        size="lg"
      >
        {userOrders.length === 0 ? (
          <p className="text-center text-gray-400 py-4">No orders from this user</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {userOrders.map((order) => (
              <div key={order.order_id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">#{order.order_id}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                    order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">₹{order.total_amount} • {new Date(order.order_time).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}


