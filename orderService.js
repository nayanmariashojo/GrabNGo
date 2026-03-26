import { supabase } from './supabaseClient';
import { runtimeConfig } from './runtimeConfig';
import {
  mockMenuItems,
  mockOrderItems,
  mockOrders,
  mockPayments,
  mockServiceCounters,
  mockTimeSlots,
} from './mockData';

const toNumber = (n) => (n === null || n === undefined ? n : Number(n));

const isStaffVisibleOrder = (order) => order?.payment?.payment_status === 'Paid';

const normalizeOrder = (row) => {
  const paymentRow = Array.isArray(row.payment) ? row.payment[0] : row.payment;
  const items = (row.order_item || []).map((oi) => ({
    order_id: row.order_id,
    item_id: oi.item_id,
    quantity: oi.quantity,
    item_name: oi.menu_item?.item_name,
    price: toNumber(oi.menu_item?.price),
  }));

  return {
    ...row,
    total_amount: toNumber(row.total_amount),
    items,
    time_slot: row.time_slot || null,
    counter: row.service_counter || null,
    payment: paymentRow
      ? { ...paymentRow, amount: toNumber(paymentRow.amount) }
      : null,
  };
};

/** Get all orders (admin) or orders for a specific user */
export const getOrders = async (userId = null) => {
  if (runtimeConfig.demoMode) {
    const orders = (userId ? mockOrders.filter((o) => o.user_id === userId) : mockOrders)
      .slice()
      .sort((a, b) => new Date(b.order_time) - new Date(a.order_time));

    return orders.map((o) => {
      const counter = mockServiceCounters.find((c) => c.counter_id === o.counter_id) || null;
      const time_slot = mockTimeSlots.find((s) => s.slot_id === o.slot_id) || null;
      const payment = mockPayments.find((p) => p.order_id === o.order_id) || null;
      const items = mockOrderItems
        .filter((oi) => oi.order_id === o.order_id)
        .map((oi) => ({
          order_id: o.order_id,
          item_id: oi.item_id,
          quantity: oi.quantity,
          item_name: oi.item_name,
          price: toNumber(oi.price),
        }));

      return {
        ...o,
        total_amount: toNumber(o.total_amount),
        counter,
        time_slot,
        payment: payment ? { ...payment, amount: toNumber(payment.amount) } : null,
        items,
      };
    });
  }

  let query = supabase
    .from('orders')
    .select(
      `
      order_id,
      user_id,
      counter_id,
      slot_id,
      order_time,
      total_amount,
      status,
      service_counter ( counter_id, counter_name, location, max_capacity, current_orders, status ),
      time_slot ( slot_id, slot_time, date, max_capacity, booked_count, is_active ),
      payment ( payment_id, order_id, amount, payment_method, payment_status, payment_time ),
      order_item ( item_id, quantity, menu_item ( item_id, item_name, price ) )
      `
    )
    .order('order_time', { ascending: false });

  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(normalizeOrder);
};

/** Get only payment-approved orders for staff operations */
export const getStaffOrders = async () => {
  const allOrders = await getOrders();
  return allOrders.filter(isStaffVisibleOrder);
};

/** Get a single order by ID */
export const getOrder = async (orderId) => {
  if (runtimeConfig.demoMode) {
    const o = mockOrders.find((x) => x.order_id === orderId);
    if (!o) return null;
    const counter = mockServiceCounters.find((c) => c.counter_id === o.counter_id) || null;
    const time_slot = mockTimeSlots.find((s) => s.slot_id === o.slot_id) || null;
    const payment = mockPayments.find((p) => p.order_id === o.order_id) || null;
    const items = mockOrderItems
      .filter((oi) => oi.order_id === o.order_id)
      .map((oi) => ({
        order_id: o.order_id,
        item_id: oi.item_id,
        quantity: oi.quantity,
        item_name: oi.item_name,
        price: toNumber(oi.price),
      }));

    return {
      ...o,
      total_amount: toNumber(o.total_amount),
      counter,
      time_slot,
      payment: payment ? { ...payment, amount: toNumber(payment.amount) } : null,
      items,
    };
  }

  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      order_id,
      user_id,
      counter_id,
      slot_id,
      order_time,
      total_amount,
      status,
      service_counter ( counter_id, counter_name, location, max_capacity, current_orders, status ),
      time_slot ( slot_id, slot_time, date, max_capacity, booked_count, is_active ),
      payment ( payment_id, order_id, amount, payment_method, payment_status, payment_time ),
      order_item ( item_id, quantity, menu_item ( item_id, item_name, price ) )
      `
    )
    .eq('order_id', orderId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return normalizeOrder(data);
};

/**
 * Place a new order.
 * @param {string} userId
 * @param {Array} cartItems — [{ item_id, item_name, price, quantity }]
 * @param {number} slotId
 * @param {number} counterId
 * @param {string} paymentMethod
 */
export const placeOrder = async (userId, cartItems, slotId, counterId, paymentMethod = 'UPI') => {
  const requiresAdminApproval = String(paymentMethod || '').toUpperCase() !== 'UPI';
  const initialPaymentStatus = requiresAdminApproval ? 'Pending' : 'Paid';

  if (runtimeConfig.demoMode) {
    const counter = mockServiceCounters.find((c) => c.counter_id === counterId);
    if (!counter) throw new Error('Counter not found');
    if (counter.status !== 'Open') throw new Error('Counter is closed');
    if (counter.current_orders >= counter.max_capacity) throw new Error('Counter is full');

    const slot = mockTimeSlots.find((s) => s.slot_id === slotId);
    if (!slot) throw new Error('Time slot not found');
    if (!slot.is_active) throw new Error('Time slot is inactive');
    if (slot.booked_count >= slot.max_capacity) throw new Error('Time slot is full');

    const totalAmount = cartItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );

    const nextOrderId =
      (mockOrders.reduce((m, o) => Math.max(m, Number(o.order_id) || 0), 0) || 1000) + 1;
    const orderRow = {
      order_id: nextOrderId,
      user_id: userId,
      counter_id: counterId,
      slot_id: slotId,
      order_time: new Date().toISOString(),
      total_amount: totalAmount,
      status: 'Pending',
    };

    // capacity increments
    counter.current_orders += 1;
    slot.booked_count += 1;

    mockOrders.push(orderRow);

    const itemsPayload = cartItems.map((item) => {
      const menuItem = mockMenuItems.find((m) => Number(m.item_id) === Number(item.item_id));
      return {
        order_id: orderRow.order_id,
        item_id: item.item_id,
        quantity: item.quantity,
        item_name: item.item_name || menuItem?.item_name,
        price: toNumber(item.price ?? menuItem?.price),
      };
    });
    mockOrderItems.push(...itemsPayload);

    const nextPaymentId =
      (mockPayments.reduce((m, p) => Math.max(m, Number(p.payment_id) || 0), 0) || 0) + 1;
    const paymentRow = {
      payment_id: nextPaymentId,
      order_id: orderRow.order_id,
      amount: totalAmount,
      payment_method: paymentMethod,
      payment_status: initialPaymentStatus,
      payment_time: new Date().toISOString(),
    };
    mockPayments.push(paymentRow);

    return {
      order: { ...orderRow, total_amount: toNumber(orderRow.total_amount) },
      payment: { ...paymentRow, amount: toNumber(paymentRow.amount) },
    };
  }

  const totalAmount = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  // 1) Insert order (DB trigger enforces capacity + increments counts)
  const { data: orderRow, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      counter_id: counterId,
      slot_id: slotId,
      total_amount: totalAmount,
      status: 'Pending',
    })
    .select('order_id,user_id,counter_id,slot_id,order_time,total_amount,status')
    .single();
  if (orderError) throw orderError;

  // 2) Insert order items
  const itemsPayload = cartItems.map((item) => ({
    order_id: orderRow.order_id,
    item_id: item.item_id,
    quantity: item.quantity,
  }));
  if (itemsPayload.length > 0) {
    const { error: itemsError } = await supabase.from('order_item').insert(itemsPayload);
    if (itemsError) throw itemsError;
  }

  // 3) Insert payment record (UPI=Paid, others require admin approval)
  const { data: paymentRow, error: payError } = await supabase
    .from('payment')
    .insert({
      order_id: orderRow.order_id,
      amount: totalAmount,
      payment_method: paymentMethod,
      payment_status: initialPaymentStatus,
    })
    .select('payment_id,order_id,amount,payment_method,payment_status,payment_time')
    .single();
  if (payError) throw payError;

  return {
    order: { ...orderRow, total_amount: toNumber(orderRow.total_amount) },
    payment: { ...paymentRow, amount: toNumber(paymentRow.amount) },
  };
};

/** Update order status (admin) */
export const updateOrderStatus = async (orderId, newStatus) => {
  if (runtimeConfig.demoMode) {
    const idx = mockOrders.findIndex((o) => o.order_id === orderId);
    if (idx === -1) throw new Error('Order not found');
    const prevStatus = mockOrders[idx].status;

    mockOrders[idx] = { ...mockOrders[idx], status: newStatus };

    const becameTerminal = ['Completed', 'Cancelled'].includes(newStatus);
    const wasTerminal = ['Completed', 'Cancelled'].includes(prevStatus);
    if (becameTerminal && !wasTerminal) {
      const counter = mockServiceCounters.find((c) => c.counter_id === mockOrders[idx].counter_id);
      if (counter) counter.current_orders = Math.max(0, Number(counter.current_orders) - 1);
      const slot = mockTimeSlots.find((s) => s.slot_id === mockOrders[idx].slot_id);
      if (slot) slot.booked_count = Math.max(0, Number(slot.booked_count) - 1);
    }

    return { ...mockOrders[idx], total_amount: toNumber(mockOrders[idx].total_amount) };
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('order_id', orderId)
    .select('order_id,user_id,counter_id,slot_id,order_time,total_amount,status')
    .single();
  if (error) throw error;
  return { ...data, total_amount: toNumber(data.total_amount) };
};

/** Get order statistics for admin dashboard */
export const getOrderStats = async () => {
  if (runtimeConfig.demoMode) {
    const orders = mockOrders;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === 'Pending').length;
    const preparingOrders = orders.filter((o) => o.status === 'Preparing').length;
    const completedOrders = orders.filter((o) => o.status === 'Completed').length;
    return { totalOrders, pendingOrders, preparingOrders, completedOrders };
  }

  const { data, error } = await supabase
    .from('orders')
    .select('order_id,status');
  if (error) throw error;

  const orders = data || [];
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const preparingOrders = orders.filter(o => o.status === 'Preparing').length;
  const completedOrders = orders.filter(o => o.status === 'Completed').length;
  return { totalOrders, pendingOrders, preparingOrders, completedOrders };
};


