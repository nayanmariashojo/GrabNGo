import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getOrders, getStaffOrders, updateOrderStatus } from './orderService';
import OrderTable from './OrderTable';
import Alert from './Alert';

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [alert, setAlert] = useState({ type: '', message: '' });

  const isStaff = user?.role === 'staff';

  useEffect(() => {
    if (user) {
      setLoading(true);
      if (isStaff) setFilter('active');
      (isStaff ? getStaffOrders() : getOrders(user.id)).then((data) => {
        setOrders(data);
        setLoading(false);
      });
    }
  }, [user, isStaff]);

  const handleStatusChange = async (orderId, newStatus) => {
    setAlert({ type: '', message: '' });
    try {
      await updateOrderStatus(orderId, newStatus);
      setAlert({ type: 'success', message: `Order #${orderId} updated to ${newStatus}` });
      setLoading(true);
      const data = await (isStaff ? getStaffOrders() : getOrders(user?.id));
      setOrders(data);
      setLoading(false);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to update order' });
    }
  };

  const filteredOrders =
    filter === 'all'
      ? orders
      : filter === 'active'
        ? orders.filter((o) => !['Completed', 'Cancelled'].includes(o.status))
        : orders.filter((o) => o.status === filter);

  const statusFilters = isStaff
    ? ['active', 'Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled', 'all']
    : ['all', 'Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isStaff ? 'Active Orders' : 'My Orders'}</h1>
        <p className="text-sm text-gray-500">
          {isStaff ? 'View and update student orders in real-time' : 'Track all your canteen orders'}
        </p>
      </div>

      {alert.message && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />
      )}

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusFilters.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {status === 'all'
              ? (isStaff ? 'All Orders' : 'All Orders')
              : status === 'active'
                ? 'Active'
                : status}
            {status !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({
                  status === 'active'
                    ? orders.filter((o) => !['Completed', 'Cancelled'].includes(o.status)).length
                    : orders.filter((o) => o.status === status).length
                })
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse rounded-lg bg-white border border-gray-100 p-4">
              <div className="flex justify-between">
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="h-4 w-16 rounded bg-gray-200" />
              </div>
              <div className="mt-3 h-3 w-3/4 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Mobile-friendly card view */}
          <div className="lg:hidden space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
                <span className="text-4xl block mb-2">📦</span>
                No orders found
              </div>
            ) : (
              filteredOrders.map((order) => (
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
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'Preparing' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'Ready' ? 'bg-purple-100 text-purple-700' :
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
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
                    <p><strong>Payment:</strong>
                      <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        order.payment?.payment_status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.payment?.payment_status || '—'}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400">{new Date(order.order_time).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop table view */}
          <div className="hidden lg:block">
            <OrderTable
              orders={filteredOrders}
              showUser={isStaff}
              onStatusChange={isStaff ? handleStatusChange : undefined}
            />
          </div>
        </>
      )}
    </div>
  );
}


