import { supabase } from './supabaseClient';
import { runtimeConfig } from './runtimeConfig';
import { mockOrders, mockPayments } from './mockData';

const toNumber = (n) => (n === null || n === undefined ? n : Number(n));

/** Get all payment records */
export const getPayments = async () => {
  if (runtimeConfig.demoMode) {
    return mockPayments
      .slice()
      .sort((a, b) => new Date(b.payment_time) - new Date(a.payment_time))
      .map((p) => {
        const order = mockOrders.find((o) => o.order_id === p.order_id) || null;
        return {
          ...p,
          amount: toNumber(p.amount),
          order: order ? { ...order, total_amount: toNumber(order.total_amount) } : null,
        };
      });
  }

  const { data, error } = await supabase
    .from('payment')
    .select('payment_id,order_id,amount,payment_method,payment_status,payment_time,orders(order_id,user_id,counter_id,slot_id,order_time,total_amount,status)')
    .order('payment_time', { ascending: false });
  if (error) throw error;

  return (data || []).map((p) => ({
    ...p,
    amount: toNumber(p.amount),
    order: p.orders ? { ...p.orders, total_amount: toNumber(p.orders.total_amount) } : null,
  }));
};

/** Get payments filtered by date range */
export const getPaymentsByDate = async (startDate, endDate) => {
  const payments = await getPayments();
  return payments.filter(p => {
    const pDate = new Date(p.payment_time);
    if (startDate && pDate < new Date(startDate)) return false;
    if (endDate && pDate > new Date(endDate + 'T23:59:59Z')) return false;
    return true;
  });
};

/** Get payments filtered by status */
export const getPaymentsByStatus = async (status) => {
  if (!status) return getPayments();
  const payments = await getPayments();
  return payments.filter(p => p.payment_status === status);
};

/** Calculate total revenue (sum of paid payments) */
export const getTotalRevenue = async () => {
  if (runtimeConfig.demoMode) {
    return mockPayments
      .filter((p) => p.payment_status === 'Paid')
      .reduce((sum, p) => sum + toNumber(p.amount), 0);
  }

  const { data, error } = await supabase
    .from('payment')
    .select('amount,payment_status');
  if (error) throw error;
  return (data || [])
    .filter((p) => p.payment_status === 'Paid')
    .reduce((sum, p) => sum + toNumber(p.amount), 0);
};

/** Update payment status */
export const updatePaymentStatus = async (paymentId, newStatus) => {
  if (runtimeConfig.demoMode) {
    const idx = mockPayments.findIndex((p) => p.payment_id === paymentId);
    if (idx === -1) throw new Error('Payment not found');
    mockPayments[idx] = { ...mockPayments[idx], payment_status: newStatus };
    return { ...mockPayments[idx], amount: toNumber(mockPayments[idx].amount) };
  }

  const { data, error } = await supabase
    .from('payment')
    .update({ payment_status: newStatus })
    .eq('payment_id', paymentId)
    .select('payment_id,order_id,amount,payment_method,payment_status,payment_time')
    .single();
  if (error) throw error;
  return { ...data, amount: toNumber(data.amount) };
};


