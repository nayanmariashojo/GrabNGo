import { useState, useEffect } from 'react';
import { getPayments, getTotalRevenue } from './paymentService';
import PaymentTable from './PaymentTable';
import DashboardCard from './DashboardCard';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [data, revenue] = await Promise.all([getPayments(), getTotalRevenue()]);
    setPayments(data);
    setTotalRevenue(revenue);
    setLoading(false);
  };

  const filtered = payments.filter(p => {
    if (filterStatus && p.payment_status !== filterStatus) return false;
    if (filterDate) {
      const pDate = new Date(p.payment_time).toISOString().split('T')[0];
      if (pDate !== filterDate) return false;
    }
    return true;
  });

  const paidTotal = filtered
    .filter(p => p.payment_status === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingTotal = filtered
    .filter(p => p.payment_status === 'Pending')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-500">View payment records and revenue</p>
      </div>

      {/* Revenue cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DashboardCard title="Total Revenue" value={`₹${totalRevenue}`} icon="💰" color="green" />
        <DashboardCard title="Paid (Filtered)" value={`₹${paidTotal}`} icon="✅" color="blue" />
        <DashboardCard title="Pending (Filtered)" value={`₹${pendingTotal}`} icon="⏳" color="yellow" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {(filterStatus || filterDate) && (
          <button
            onClick={() => { setFilterStatus(''); setFilterDate(''); }}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : (
        <PaymentTable payments={filtered} />
      )}
    </div>
  );
}


