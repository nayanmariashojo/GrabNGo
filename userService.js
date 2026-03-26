import { supabase } from './supabaseClient';
import { runtimeConfig } from './runtimeConfig';
import { mockOrders, mockUsers, persistMockUsers } from './mockData';

const isAdminEmailAllowed = (email) => {
  const normalized = String(email || '').trim().toLowerCase();
  const allowlist = runtimeConfig.adminEmailAllowlist || [];
  if (!allowlist.length) return true;
  return allowlist.includes(normalized);
};

/** Get all users (admin) */
export const getUsers = async () => {
  if (runtimeConfig.demoMode) {
    return mockUsers
      .slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  const { data, error } = await supabase
    .from('users')
    .select('id,name,email,phone,role,is_active,created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

/** Get a single user by ID */
export const getUser = async (userId) => {
  if (runtimeConfig.demoMode) {
    return mockUsers.find((u) => u.id === userId) || null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('id,name,email,phone,role,is_active,created_at')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
};

/** Update user profile */
export const updateUser = async (userId, updates) => {
  if (updates?.role === 'admin') {
    const user = await getUser(userId);
    if (user && !isAdminEmailAllowed(user.email)) {
      throw new Error('This email is not authorized for admin access');
    }
  }

  if (runtimeConfig.demoMode) {
    const idx = mockUsers.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error('User not found');

    const updated = {
      ...mockUsers[idx],
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
      ...(updates.email !== undefined ? { email: updates.email } : {}),
      ...(updates.role !== undefined ? { role: updates.role } : {}),
      ...(updates.is_active !== undefined ? { is_active: updates.is_active } : {}),
    };
    mockUsers[idx] = updated;
    persistMockUsers();
    return updated;
  }

  const { data, error } = await supabase
    .from('users')
    .update({
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
      ...(updates.email !== undefined ? { email: updates.email } : {}),
      ...(updates.role !== undefined ? { role: updates.role } : {}),
      ...(updates.is_active !== undefined ? { is_active: updates.is_active } : {}),
    })
    .eq('id', userId)
    .select('id,name,email,phone,role,is_active,created_at')
    .single();
  if (error) throw error;
  return data;
};

/** Toggle user active status (admin) */
export const toggleUserStatus = async (userId) => {
  const user = await getUser(userId);
  if (!user) throw new Error('User not found');
  return updateUser(userId, { is_active: !user.is_active });
};

/** Get user's order history */
export const getUserOrders = async (userId) => {
  if (runtimeConfig.demoMode) {
    return mockOrders
      .filter((o) => o.user_id === userId)
      .slice()
      .sort((a, b) => new Date(b.order_time) - new Date(a.order_time));
  }

  const { data, error } = await supabase
    .from('orders')
    .select('order_id,user_id,counter_id,slot_id,order_time,total_amount,status')
    .eq('user_id', userId)
    .order('order_time', { ascending: false });
  if (error) throw error;
  return data || [];
};

/** Promote an existing user account to staff by email */
export const assignStaffByEmail = async (email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) throw new Error('Email is required');

  const users = await getUsers();
  const user = users.find((u) => String(u.email || '').trim().toLowerCase() === normalizedEmail);
  if (!user) throw new Error('No user found with this email');
  if (user.role === 'admin') throw new Error('Admin account cannot be changed to staff');
  if (user.role === 'staff' && user.is_active) return user;

  return updateUser(user.id, { role: 'staff', is_active: true });
};

/** Remove staff access from a user account */
export const removeStaffRole = async (userId) => {
  const user = await getUser(userId);
  if (!user) throw new Error('User not found');
  if (user.role !== 'staff') throw new Error('Selected user is not a staff member');

  return updateUser(userId, { role: 'student' });
};


