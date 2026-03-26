import { useState, useEffect } from 'react';
import { getOrderStats, getOrders, updateOrderStatus } from './orderService';
import { getPayments, getTotalRevenue, updatePaymentStatus } from './paymentService';
import { getTimeSlots } from './timeSlotService';
import { assignStaffByEmail, getUsers, removeStaffRole } from './userService';
import DashboardCard from './DashboardCard';
import OrderTable from './OrderTable';
import PaymentTable from './PaymentTable';
import Alert from './Alert';

export default function AdminDashboard() {
  const [panel, setPanel] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [users, setUsers] = useState([]);
  const [staffEmail, setStaffEmail] = useState('');
  const [staffActionLoading, setStaffActionLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    activeSlots: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoadingDetails(true);
    const [orderStats, revenue, timeSlotRows, userRows, orderRows, paymentRows] =
      await Promise.all([
        getOrderStats(),
        getTotalRevenue(),
        getTimeSlots(),
        getUsers(),
        getOrders(),
        getPayments(),
      ]);

    setSlots(timeSlotRows || []);
    setUsers(userRows || []);
    setOrders(orderRows || []);
    setPayments(paymentRows || []);
    setStats({
      ...orderStats,
      totalRevenue: revenue,
      activeSlots: (timeSlotRows || []).filter((s) => s.is_active).length,
      totalUsers: (userRows || []).length,
    });
    setLoadingDetails(false);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setAlert({ type: 'success', message: `Order #${orderId} updated to ${newStatus}` });
      await loadDashboard();
    } catch (err) {
      setAlert({ type: 'error', message: err?.message || 'Failed to update order' });
    }
  };

  const selectedOrders =
    panel === 'pending'
      ? orders.filter((o) => o.status === 'Pending')
      : panel === 'orders'
      ? orders
      : [];

  const pendingPaymentApprovals = payments.filter(
    (p) => p.payment_status === 'Pending' && p.payment_method !== 'UPI'
  );

  const handleApprovePayment = async (paymentId) => {
    try {
      await updatePaymentStatus(paymentId, 'Paid');
      setAlert({ type: 'success', message: `Payment #${paymentId} approved` });
      await loadDashboard();
    } catch (err) {
      setAlert({ type: 'error', message: err?.message || 'Failed to approve payment' });
    }
  };

  const activeSlotRows = slots.filter((s) => s.is_active);
  const staffUsers = users.filter((u) => u.role === 'staff');

  const handleAddStaff = async () => {
    setAlert({ type: '', message: '' });
    if (!staffEmail.trim()) {
      setAlert({ type: 'error', message: 'Please enter an email to add as staff' });
      return;
    }

    setStaffActionLoading(true);
    try {
      const added = await assignStaffByEmail(staffEmail);
      setAlert({ type: 'success', message: `${added.name || added.email} is now staff` });
      setStaffEmail('');
      await loadDashboard();
      setPanel('staff');
    } catch (err) {
      setAlert({ type: 'error', message: err?.message || 'Failed to add staff' });
    } finally {
      setStaffActionLoading(false);
    }
  };

  const handleRemoveStaff = async (userId, nameOrEmail) => {
    const ok = window.confirm(`Remove staff access for ${nameOrEmail}?`);
    if (!ok) return;

    setStaffActionLoading(true);
    try {
      await removeStaffRole(userId);
      setAlert({ type: 'success', message: `Removed staff access for ${nameOrEmail}` });
      await loadDashboard();
    } catch (err) {
      setAlert({ type: 'error', message: err?.message || 'Failed to remove staff' });
    } finally {
      setStaffActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-300">
          Overview of your canteen management system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <DashboardCard
          title="Total Orders"
          value={stats.totalOrders}
          icon="📦"
          color="indigo"
          onClick={() => setPanel('orders')}
          active={panel === 'orders'}
        />
        <DashboardCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue}`}
          icon="💰"
          color="green"
          onClick={() => setPanel('revenue')}
          active={panel === 'revenue'}
        />
        <DashboardCard
          title="Active Slots"
          value={stats.activeSlots}
          icon="⏰"
          color="blue"
          onClick={() => setPanel('slots')}
          active={panel === 'slots'}
        />
        <DashboardCard
          title="Total Users"
          value={stats.totalUsers}
          icon="👥"
          color="purple"
          onClick={() => setPanel('users')}
          active={panel === 'users'}
        />
        <DashboardCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon="⏳"
          color="yellow"
          subtitle={`${stats.preparingOrders} preparing`}
          onClick={() => setPanel('pending')}
          active={panel === 'pending'}
        />
        <DashboardCard
          title="Payment Approvals"
          value={pendingPaymentApprovals.length}
          icon="🧾"
          color="orange"
          onClick={() => setPanel('approvals')}
          active={panel === 'approvals'}
        />
        <DashboardCard
          title="Staff Members"
          value={staffUsers.length}
          icon="🧑‍🍳"
          color="red"
          onClick={() => setPanel('staff')}
          active={panel === 'staff'}
        />
      </div>

      {alert.message && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '' })}
        />
      )}

      {/* Card details panel */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {panel === 'orders'
              ? 'All Orders'
              : panel === 'pending'
              ? 'Pending Orders'
              : panel === 'approvals'
              ? 'Pending Payment Approvals'
              : panel === 'staff'
              ? 'Staff Management'
              : panel === 'revenue'
              ? 'Payments'
              : panel === 'slots'
              ? 'Time Slots'
              : panel === 'users'
              ? 'Users'
              : 'Details'}
          </h3>
          <button
            type="button"
            onClick={loadDashboard}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Refresh
          </button>
        </div>

        {loadingDetails ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : (
          <>
            {(panel === 'orders' || panel === 'pending') && (
              <div className="hidden lg:block">
                <OrderTable orders={selectedOrders} showUser onStatusChange={handleStatusChange} />
              </div>
            )}
            {(panel === 'orders' || panel === 'pending') && (
              <div className="lg:hidden space-y-3">
                {selectedOrders.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-400">
                    No orders found.
                  </div>
                ) : (
                  selectedOrders.map((order) => (
                    <div
                      key={order.order_id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-gray-900">#{order.order_id}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(order.order_time).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm space-y-1 text-gray-600 mb-3">
                        <p>
                          <strong>User:</strong> {order.user_id}
                        </p>
                        <p>
                          <strong>Items:</strong>{' '}
                          {order.items?.map((i) => `${i.item_name} ×${i.quantity}`).join(', ') || '—'}
                        </p>
                        <p>
                          <strong>Total:</strong> ₹{order.total_amount}
                        </p>
                        <p>
                          <strong>Slot:</strong> {order.time_slot?.slot_time || '—'}
                        </p>
                        <p>
                          <strong>Counter:</strong> {order.counter?.counter_name || '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-gray-500">Status:</label>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                          className="rounded-lg border border-gray-300 px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Ready">Ready</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {panel === 'revenue' && <PaymentTable payments={payments} />}

            {panel === 'approvals' && (
              pendingPaymentApprovals.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-400">
                  No pending payment approvals.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Method</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pendingPaymentApprovals.map((p) => (
                        <tr key={p.payment_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">#{p.payment_id}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">#{p.order_id}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{p.payment_method}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">₹{p.amount}</td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              type="button"
                              onClick={() => handleApprovePayment(p.payment_id)}
                              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                            >
                              Approve Payment
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {panel === 'staff' && (
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-900 mb-3">Add Staff (from existing user)</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      placeholder="Enter user email"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddStaff}
                      disabled={staffActionLoading}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                      Add Staff
                    </button>
                  </div>
                </div>

                {staffUsers.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-400">
                    No active staff records found.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {staffUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.name || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{u.email}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{u.phone || '—'}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {u.is_active ? 'Active' : 'Disabled'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <button
                                type="button"
                                onClick={() => handleRemoveStaff(u.id, u.name || u.email)}
                                disabled={staffActionLoading}
                                className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                              >
                                Remove Staff
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {panel === 'slots' && (
              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Capacity</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Booked</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(activeSlotRows.length ? activeSlotRows : slots).map((s) => (
                      <tr key={s.slot_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-700">{s.date || '—'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.slot_time}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{s.max_capacity}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{s.booked_count}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              s.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {s.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {panel === 'users' && (
              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.name || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{u.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{u.role}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Status Breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Overview</h3>
          <div className="space-y-3">
            {[
              { label: 'Pending', count: stats.pendingOrders, color: 'bg-yellow-500', total: stats.totalOrders },
              { label: 'Preparing', count: stats.preparingOrders, color: 'bg-blue-500', total: stats.totalOrders },
              { label: 'Completed', count: stats.completedOrders, color: 'bg-green-500', total: stats.totalOrders },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium text-gray-900">{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full ${item.color} transition-all duration-500`}
                    style={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Manage Menu', icon: '🍽️', to: '/admin/menu', color: 'bg-orange-50 hover:bg-orange-100 text-orange-700' },
              { label: 'View Orders', icon: '📦', to: '/admin/orders', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700' },
              { label: 'Time Slots', icon: '⏰', to: '/admin/time-slots', color: 'bg-green-50 hover:bg-green-100 text-green-700' },
              { label: 'Payments', icon: '💳', to: '/admin/payments', color: 'bg-purple-50 hover:bg-purple-100 text-purple-700' },
              { label: 'Manage Users', icon: '👥', to: '/admin/users', color: 'bg-slate-50 hover:bg-slate-100 text-slate-700' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.to}
                className={`flex items-center gap-3 rounded-lg p-3 text-sm font-medium transition-colors ${action.color}`}
              >
                <span className="text-lg">{action.icon}</span>
                {action.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Revenue Summary</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-green-600">₹{stats.totalRevenue}</span>
          <span className="text-sm text-gray-500">total revenue from paid orders</span>
        </div>
      </div>
    </div>
  );
}


