/**
 * PaymentTable — displays payment records with filtering support.
 */
export default function PaymentTable({ payments = [] }) {
  if (payments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-400">
        No payment records found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment ID</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order ID</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Method</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date & Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {payments.map((p) => (
            <tr key={p.payment_id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">#{p.payment_id}</td>
              <td className="px-4 py-3 text-sm text-gray-600">#{p.order_id}</td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900">₹{p.amount}</td>
              <td className="px-4 py-3 text-sm">
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                  {p.payment_method === 'UPI' && '📱'}
                  {p.payment_method === 'Cash' && '💵'}
                  {p.payment_method === 'Card' && '💳'}
                  {p.payment_method}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.payment_status === 'Paid'
                      ? 'bg-green-100 text-green-700'
                      : p.payment_status === 'Pending Approval' || p.payment_status === 'Pending'
                      ? 'bg-amber-100 text-amber-700'
                      : p.payment_status === 'Failed'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {p.payment_status}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">
                {new Date(p.payment_time).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


