import { supabase } from './supabaseClient';
import { runtimeConfig } from './runtimeConfig';
import { mockTimeSlots } from './mockData';

/** Get all time slots */
export const getTimeSlots = async () => {
  if (runtimeConfig.demoMode) {
    return mockTimeSlots;
  }

  const { data, error } = await supabase
    .from('time_slot')
    .select('slot_id,slot_time,date,max_capacity,booked_count,is_active,created_at')
    .order('date', { ascending: true })
    .order('slot_id', { ascending: true });
  if (error) throw error;
  return data || [];
};

/** Get available time slots (active and not fully booked) */
export const getAvailableTimeSlots = async () => {
  const slots = await getTimeSlots();
  return slots.filter(s => s.is_active && s.booked_count < s.max_capacity);
};

/** Create a new time slot */
export const createTimeSlot = async (slotData) => {
  if (runtimeConfig.demoMode) {
    const nextId =
      (mockTimeSlots.reduce((m, s) => Math.max(m, Number(s.slot_id) || 0), 0) || 0) + 1;
    const created = {
      slot_id: nextId,
      slot_time: slotData.slot_time,
      date: slotData.date,
      max_capacity: Number(slotData.max_capacity) || 0,
      booked_count: 0,
      is_active: slotData.is_active ?? true,
    };
    mockTimeSlots.push(created);
    return created;
  }

  const { data, error } = await supabase
    .from('time_slot')
    .insert({
      slot_time: slotData.slot_time,
      date: slotData.date,
      max_capacity: slotData.max_capacity,
      booked_count: 0,
      is_active: slotData.is_active ?? true,
    })
    .select('slot_id,slot_time,date,max_capacity,booked_count,is_active,created_at')
    .single();
  if (error) throw error;
  return data;
};

/** Update a time slot */
export const updateTimeSlot = async (slotId, updates) => {
  if (runtimeConfig.demoMode) {
    const slots = await getTimeSlots();
    const idx = slots.findIndex((s) => s.slot_id === slotId);
    const current = slots[idx];
    if (!current) throw new Error('Time slot not found');
    if (
      updates.max_capacity !== undefined &&
      Number(updates.max_capacity) < Number(current.booked_count)
    ) {
      throw new Error('Cannot set capacity below current booked count');
    }

    const updated = {
      ...current,
      ...(updates.slot_time !== undefined ? { slot_time: updates.slot_time } : {}),
      ...(updates.date !== undefined ? { date: updates.date } : {}),
      ...(updates.max_capacity !== undefined
        ? { max_capacity: Number(updates.max_capacity) }
        : {}),
      ...(updates.booked_count !== undefined
        ? { booked_count: Number(updates.booked_count) }
        : {}),
      ...(updates.is_active !== undefined ? { is_active: updates.is_active } : {}),
    };

    slots[idx] = updated;
    return updated;
  }

  // Prevent reducing capacity below booked count (client-side guard)
  const slots = await getTimeSlots();
  const current = slots.find(s => s.slot_id === slotId);
  if (!current) throw new Error('Time slot not found');
  if (updates.max_capacity !== undefined && updates.max_capacity < current.booked_count) {
    throw new Error('Cannot set capacity below current booked count');
  }

  const { data, error } = await supabase
    .from('time_slot')
    .update({
      ...(updates.slot_time !== undefined ? { slot_time: updates.slot_time } : {}),
      ...(updates.date !== undefined ? { date: updates.date } : {}),
      ...(updates.max_capacity !== undefined ? { max_capacity: updates.max_capacity } : {}),
      ...(updates.booked_count !== undefined ? { booked_count: updates.booked_count } : {}),
      ...(updates.is_active !== undefined ? { is_active: updates.is_active } : {}),
    })
    .eq('slot_id', slotId)
    .select('slot_id,slot_time,date,max_capacity,booked_count,is_active,created_at')
    .single();
  if (error) throw error;
  return data;
};

/** Toggle time slot active status */
export const toggleTimeSlot = async (slotId) => {
  const slots = await getTimeSlots();
  const slot = slots.find(s => s.slot_id === slotId);
  if (!slot) throw new Error('Time slot not found');
  return updateTimeSlot(slotId, { is_active: !slot.is_active });
};

/** Delete a time slot */
export const deleteTimeSlot = async (slotId) => {
  if (runtimeConfig.demoMode) {
    const slots = await getTimeSlots();
    const idx = slots.findIndex((s) => s.slot_id === slotId);
    const current = slots[idx];
    if (!current) throw new Error('Time slot not found');
    if (current.booked_count > 0) throw new Error('Cannot delete a slot with existing bookings');
    slots.splice(idx, 1);
    return true;
  }

  const slots = await getTimeSlots();
  const current = slots.find(s => s.slot_id === slotId);
  if (!current) throw new Error('Time slot not found');
  if (current.booked_count > 0) throw new Error('Cannot delete a slot with existing bookings');

  const { error } = await supabase.from('time_slot').delete().eq('slot_id', slotId);
  if (error) throw error;
  return true;
};


