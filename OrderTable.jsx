const statusColors = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Preparing: 'bg-blue-100 text-blue-800',
  Ready: 'bg-purple-100 text-purple-800',
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  Booked: 'bg-teal-100 text-teal-800',
};

/**
 * OrderTable — reusable table to display orders.
 * @param {Array} orders — enriched order objects
 * @param {boolean} showUser — show user column (admin view)
 * @param {function} onStatusChange — callback for admin status update
 */
export default function OrderTable({ orders = [], showUser = false, onStatusChange }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-400">
        No orders found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order ID</th>
            {showUser && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>}
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Items</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Time Slot</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Counter</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order) => (
            <tr key={order.order_id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">#{order.order_id}</td>
              {showUser && (
                <td className="px-4 py-3 text-sm text-gray-600">{order.user_id}</td>
              )}
              <td className="px-4 py-3 text-sm text-gray-600">
                <div className="max-w-xs">
                  {order.items?.map((item, idx) => (
                    <span key={idx} className="inline-block mr-1">
                      {item.item_name} ×{item.quantity}
                      {idx < order.items.length - 1 ? ',' : ''}
                    </span>
                  )) || '—'}
                </div>
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900">₹{order.total_amount}</td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {order.time_slot?.slot_time || '—'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {order.counter?.counter_name || '—'}
              </td>
              <td className="px-4 py-3 text-sm">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  order.payment?.payment_status === 'Paid'
                    ? 'bg-green-100 text-green-700'
                    : order.payment?.payment_status === 'Failed'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {order.payment?.payment_status || '—'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">
                {onStatusChange ? (
                  <select
                    value={order.status}
                    onChange={(e) => onStatusChange(order.order_id, e.target.value)}
                    className={`rounded-lg border-0 px-2 py-1 text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Ready">Ready</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                ) : (
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                    {order.status}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">
                {new Date(order.order_time).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


