import { supabase } from './supabaseClient';
import { runtimeConfig } from './runtimeConfig';
import { mockOrders, mockServiceCounters } from './mockData';

/** Get all service counters */
export const getCounters = async () => {
  if (runtimeConfig.demoMode) {
    return mockServiceCounters;
  }

  const { data, error } = await supabase
    .from('service_counter')
    .select('counter_id,counter_name,location,max_capacity,current_orders,status')
    .order('counter_id', { ascending: true });
  if (error) throw error;
  return data || [];
};

/** Get open counters */
export const getOpenCounters = async () => {
  const counters = await getCounters();
  return counters.filter(c => c.status === 'Open' && c.current_orders < c.max_capacity);
};

/** Add a new counter */
export const addCounter = async (counterData) => {
  if (runtimeConfig.demoMode) {
    const nextId =
      (mockServiceCounters.reduce((m, c) => Math.max(m, Number(c.counter_id) || 0), 0) || 0) +
      1;
    const created = {
      counter_id: nextId,
      counter_name: counterData.counter_name,
      location: counterData.location,
      max_capacity: Number(counterData.max_capacity) || 0,
      current_orders: 0,
      status: counterData.status || 'Open',
    };
    mockServiceCounters.push(created);
    return created;
  }

  const { data, error } = await supabase
    .from('service_counter')
    .insert({
      counter_name: counterData.counter_name,
      location: counterData.location,
      max_capacity: counterData.max_capacity,
      status: counterData.status || 'Open',
      current_orders: 0,
    })
    .select('counter_id,counter_name,location,max_capacity,current_orders,status')
    .single();
  if (error) throw error;
  return data;
};

/** Update counter details */
export const updateCounter = async (counterId, updates) => {
  if (runtimeConfig.demoMode) {
    const idx = mockServiceCounters.findIndex((c) => c.counter_id === counterId);
    if (idx === -1) throw new Error('Counter not found');
    const updated = {
      ...mockServiceCounters[idx],
      ...(updates.counter_name !== undefined ? { counter_name: updates.counter_name } : {}),
      ...(updates.location !== undefined ? { location: updates.location } : {}),
      ...(updates.max_capacity !== undefined ? { max_capacity: Number(updates.max_capacity) } : {}),
      ...(updates.current_orders !== undefined
        ? { current_orders: Number(updates.current_orders) }
        : {}),
      ...(updates.status !== undefined ? { status: updates.status } : {}),
    };
    mockServiceCounters[idx] = updated;
    return updated;
  }

  const { data, error } = await supabase
    .from('service_counter')
    .update({
      ...(updates.counter_name !== undefined ? { counter_name: updates.counter_name } : {}),
      ...(updates.location !== undefined ? { location: updates.location } : {}),
      ...(updates.max_capacity !== undefined ? { max_capacity: updates.max_capacity } : {}),
      ...(updates.current_orders !== undefined ? { current_orders: updates.current_orders } : {}),
      ...(updates.status !== undefined ? { status: updates.status } : {}),
    })
    .eq('counter_id', counterId)
    .select('counter_id,counter_name,location,max_capacity,current_orders,status')
    .single();
  if (error) throw error;
  return data;
};

/** Toggle counter status (Open/Closed) */
export const toggleCounterStatus = async (counterId) => {
  const counters = await getCounters();
  const counter = counters.find(c => c.counter_id === counterId);
  if (!counter) throw new Error('Counter not found');
  const next = counter.status === 'Open' ? 'Closed' : 'Open';
  return updateCounter(counterId, { status: next });
};

/** Get orders assigned to a counter */
export const getCounterOrders = async (counterId) => {
  if (runtimeConfig.demoMode) {
    return mockOrders
      .filter((o) => o.counter_id === counterId)
      .filter((o) => ['Pending', 'Preparing', 'Ready'].includes(o.status))
      .sort((a, b) => new Date(b.order_time) - new Date(a.order_time));
  }

  const { data, error } = await supabase
    .from('orders')
    .select('order_id,user_id,counter_id,slot_id,order_time,total_amount,status')
    .eq('counter_id', counterId)
    .in('status', ['Pending', 'Preparing', 'Ready'])
    .order('order_time', { ascending: false });
  if (error) throw error;
  return data || [];
};

/** Delete a counter */
export const deleteCounter = async (counterId) => {
  if (runtimeConfig.demoMode) {
    const activeOrders = await getCounterOrders(counterId);
    if (activeOrders.length > 0) throw new Error('Cannot delete counter with active orders');
    const idx = mockServiceCounters.findIndex((c) => c.counter_id === counterId);
    if (idx === -1) return true;
    mockServiceCounters.splice(idx, 1);
    return true;
  }

  const activeOrders = await getCounterOrders(counterId);
  if (activeOrders.length > 0) throw new Error('Cannot delete counter with active orders');
  const { error } = await supabase.from('service_counter').delete().eq('counter_id', counterId);
  if (error) throw error;
  return true;
};


