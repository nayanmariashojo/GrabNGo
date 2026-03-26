import { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus } from './orderService';
import OrderTable from './OrderTable';
import Alert from './Alert';

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [alert, setAlert] = useState({ type: '', message: '' });

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    const data = await getOrders();
    setOrders(data);
    setLoading(false);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setAlert({ type: 'success', message: `Order #${orderId} updated to ${newStatus}` });
      loadOrders();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

  const statusFilters = ['all', 'Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Orders</h1>
        <p className="text-sm text-gray-500">View and update order statuses</p>
      </div>

      {alert.message && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'].map((status) => {
          const count = orders.filter(o => o.status === status).length;
          const colors = {
            Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            Preparing: 'bg-blue-50 text-blue-700 border-blue-200',
            Ready: 'bg-purple-50 text-purple-700 border-purple-200',
            Completed: 'bg-green-50 text-green-700 border-green-200',
            Cancelled: 'bg-red-50 text-red-700 border-red-200',
          };
          return (
            <div key={status} className={`rounded-lg border p-3 text-center ${colors[status]}`}>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs font-medium">{status}</p>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
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
            {status === 'all' ? 'All' : status}
          </button>
        ))}
      </div>

      {/* Orders table */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
                No orders found
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div key={order.order_id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-gray-900">#{order.order_id}</span>
                    <span className="text-xs text-gray-500">{new Date(order.order_time).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm space-y-1 text-gray-600 mb-3">
                    <p><strong>User:</strong> {order.user_id}</p>
                    <p><strong>Items:</strong> {order.items?.map(i => `${i.item_name} ×${i.quantity}`).join(', ')}</p>
                    <p><strong>Total:</strong> ₹{order.total_amount}</p>
                    <p><strong>Slot:</strong> {order.time_slot?.slot_time || '—'}</p>
                    <p><strong>Counter:</strong> {order.counter?.counter_name || '—'}</p>
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

          {/* Desktop table */}
          <div className="hidden lg:block">
            <OrderTable
              orders={filteredOrders}
              showUser
              onStatusChange={handleStatusChange}
            />
          </div>
        </>
      )}
    </div>
  );
}


