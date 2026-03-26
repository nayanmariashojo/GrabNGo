import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import { getOrders, getStaffOrders, updateOrderStatus } from './orderService';
import { getPayments, getTotalRevenue } from './paymentService';
import DashboardCard from './DashboardCard';
import OrderTable from './OrderTable';
import PaymentTable from './PaymentTable';
import Alert from './Alert';

export default function UserDashboard() {
  const { user } = useAuth();
  const { items, setQuantity, deleteItem, total } = useCart();
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [panel, setPanel] = useState('active');
  const [loading, setLoading] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const isStaff = user?.role === 'staff';

  useEffect(() => {
    if (user) {
      setLoading(true);
      (isStaff ? getStaffOrders() : getOrders(user.id))
        .then(setOrders)
        .finally(() => setLoading(false));
    }
  }, [user, isStaff]);

  useEffect(() => {
    if (!user) return;
    setPanel(isStaff ? 'active' : 'orders');
  }, [user, isStaff]);

  useEffect(() => {
    if (!user) return;
    if (panel !== 'revenue') return;

    setLoadingPayments(true);
    Promise.all([getPayments(), getTotalRevenue()])
      .then(([p, r]) => {
        setPayments(p);
        setRevenue(r);
      })
      .finally(() => setLoadingPayments(false));
  }, [panel, user]);

  const totalSpent = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const activeOrders = orders.filter(o => !['Completed', 'Cancelled'].includes(o.status));
  const ordersForPanel = panel === 'active' ? activeOrders : orders;

  const handleStatusChange = async (orderId, newStatus) => {
    setAlert({ type: '', message: '' });
    try {
      await updateOrderStatus(orderId, newStatus);
      setAlert({ type: 'success', message: `Order #${orderId} updated to ${newStatus}` });
      setLoading(true);
      const refreshed = await (isStaff ? getStaffOrders() : getOrders(user?.id));
      setOrders(refreshed);
      setLoading(false);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to update order' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.name || (isStaff ? 'Staff' : 'Student')}! 👋
        </h1>
        <p className="mt-1 text-sm text-indigo-100">
          {isStaff
            ? 'Monitor and update active orders from students.'
            : 'Ready to order? Browse the menu and skip the queue.'}
        </p>
        <Link
          to={isStaff ? '/user/orders' : '/user/menu'}
          className="mt-4 inline-block rounded-lg bg-white px-5 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          {isStaff ? 'View Active Orders →' : 'Browse Menu →'}
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title={isStaff ? 'Total Orders (All)' : 'Total Orders'}
          value={orders.length}
          icon="📦"
          color="indigo"
          onClick={() => setPanel('orders')}
          active={panel === 'orders'}
        />
        <DashboardCard
          title="Active Orders"
          value={activeOrders.length}
          icon="🔄"
          color="yellow"
          onClick={() => setPanel('active')}
          active={panel === 'active'}
        />
        <DashboardCard
          title={isStaff ? 'Revenue (All)' : 'Total Spent'}
          value={isStaff ? `₹${revenue || 0}` : `₹${totalSpent}`}
          icon={isStaff ? '💳' : '💰'}
          color="green"
          onClick={() => setPanel('revenue')}
          active={panel === 'revenue'}
        />
        <DashboardCard
          title={isStaff ? 'Items in Cart' : 'Items in Cart'}
          value={items.length}
          icon="🛒"
          color="purple"
          onClick={() => setPanel('cart')}
          active={panel === 'cart'}
        />
      </div>

      {alert.message && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />
      )}

      {/* Details panel */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {panel === 'active'
              ? 'Active Orders'
              : panel === 'orders'
                ? 'Total Orders'
                : panel === 'revenue'
                  ? 'Revenue'
                  : 'Cart Items'}
          </h2>
          {panel === 'cart' ? (
            <Link to="/user/cart" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View Cart →
            </Link>
          ) : panel === 'revenue' ? null : (
            <Link to="/user/orders" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View All →
            </Link>
          )}
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : panel === 'cart' ? (
          items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-400">
              <span className="text-4xl block mb-2">🛒</span>
              No items in cart.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.item_id} className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.item_name}</p>
                    <p className="text-xs text-gray-500">₹{item.price} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(item.item_id, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                      aria-label={`Decrease ${item.item_name}`}
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => setQuantity(item.item_id, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                      aria-label={`Increase ${item.item_name}`}
                    >
                      +
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="w-20 text-right font-semibold text-gray-900">₹{item.price * item.quantity}</p>
                    <button
                      onClick={() => deleteItem(item.item_id)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1"
                      title="Remove item"
                      aria-label={`Remove ${item.item_name}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-lg font-bold text-gray-900">₹{total}</p>
                </div>
              </div>
            </div>
          )
        ) : panel === 'revenue' ? (
          loadingPayments ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {isStaff && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">Total Revenue (Paid)</p>
                  <p className="text-2xl font-bold text-gray-900">₹{revenue || 0}</p>
                </div>
              )}
              <PaymentTable payments={payments} />
            </div>
          )
        ) : (
          <>
            {/* Mobile: cards with status dropdown for staff */}
            <div className="lg:hidden space-y-3">
              {ordersForPanel.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-400">
                  No orders found.
                </div>
              ) : (
                ordersForPanel.map((order) => (
                  <div key={order.order_id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">#{order.order_id}</span>
                      {isStaff ? (
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                          className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Ready">Ready</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            order.status === 'Completed'
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'Preparing'
                                ? 'bg-blue-100 text-blue-700'
                                : order.status === 'Ready'
                                  ? 'bg-purple-100 text-purple-700'
                                  : order.status === 'Cancelled'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {order.status}
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      {isStaff && <p><strong>User:</strong> {order.user_id}</p>}
                      <p><strong>Items:</strong> {order.items?.map(i => `${i.item_name} ×${i.quantity}`).join(', ')}</p>
                      <p><strong>Total:</strong> ₹{order.total_amount}</p>
                      <p><strong>Slot:</strong> {order.time_slot?.slot_time || '—'}</p>
                      <p><strong>Counter:</strong> {order.counter?.counter_name || '—'}</p>
                      <p className="text-xs text-gray-400">{new Date(order.order_time).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop: table */}
            <div className="hidden lg:block">
              <OrderTable
                orders={ordersForPanel}
                showUser={isStaff}
                onStatusChange={isStaff ? handleStatusChange : undefined}
              />
            </div>
          </>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/user/menu"
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-xl">🍔</span>
          <div>
            <p className="font-medium text-gray-900">Browse Menu</p>
            <p className="text-xs text-gray-500">Explore food items</p>
          </div>
        </Link>
        <Link
          to="/user/cart"
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-xl">🛒</span>
          <div>
            <p className="font-medium text-gray-900">View Cart</p>
            <p className="text-xs text-gray-500">{items.length} items in cart</p>
          </div>
        </Link>
        <Link
          to="/user/orders"
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-xl">📦</span>
          <div>
            <p className="font-medium text-gray-900">My Orders</p>
            <p className="text-xs text-gray-500">Track your orders</p>
          </div>
        </Link>
      </div>
    </div>
  );
}


