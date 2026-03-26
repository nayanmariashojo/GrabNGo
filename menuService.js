import { supabase } from './supabaseClient';
import { runtimeConfig } from './runtimeConfig';
import { mockMenuItems } from './mockData';

const toNumber = (n) => (n === null || n === undefined ? n : Number(n));

/** Get all menu items, optionally filtered by category or search */
export const getMenuItems = async ({ search = '', category = '' } = {}) => {
  if (runtimeConfig.demoMode) {
    const q = search.trim().toLowerCase();
    return mockMenuItems
      .filter((i) => (category ? i.category === category : true))
      .filter((i) => {
        if (!q) return true;
        return (
          String(i.item_name || '').toLowerCase().includes(q) ||
          String(i.description || '').toLowerCase().includes(q)
        );
      })
      .map((i) => ({ ...i, price: toNumber(i.price) }));
  }

  let query = supabase
    .from('menu_item')
    .select('item_id,item_name,price,category,is_available,description,created_at')
    .order('item_id', { ascending: true });

  if (category) query = query.eq('category', category);
  if (search) {
    const q = search.trim();
    if (q) {
      query = query.or(`item_name.ilike.%${q}%,description.ilike.%${q}%`);
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((i) => ({
    ...i,
    price: toNumber(i.price),
  }));
};

/** Get a single menu item by ID */
export const getMenuItem = async (itemId) => {
  if (runtimeConfig.demoMode) {
    const item = mockMenuItems.find((i) => Number(i.item_id) === Number(itemId));
    if (!item) return null;
    return { ...item, price: toNumber(item.price) };
  }

  const { data, error } = await supabase
    .from('menu_item')
    .select('item_id,item_name,price,category,is_available,description,created_at')
    .eq('item_id', itemId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { ...data, price: toNumber(data.price) };
};

/** Add a new menu item */
export const addMenuItem = async (item) => {
  if (runtimeConfig.demoMode) {
    const nextId =
      (mockMenuItems.reduce((m, i) => Math.max(m, Number(i.item_id) || 0), 0) || 0) + 1;
    const created = {
      item_id: nextId,
      item_name: item.item_name,
      price: toNumber(item.price),
      category: item.category,
      description: item.description || '',
      is_available: item.is_available ?? true,
    };
    mockMenuItems.push(created);
    return created;
  }

  const payload = {
    item_name: item.item_name,
    price: item.price,
    category: item.category,
    description: item.description || '',
    is_available: item.is_available ?? true,
  };
  const { data, error } = await supabase
    .from('menu_item')
    .insert(payload)
    .select('item_id,item_name,price,category,is_available,description,created_at')
    .single();
  if (error) throw error;
  return { ...data, price: toNumber(data.price) };
};

/** Update an existing menu item */
export const updateMenuItem = async (itemId, updates) => {
  if (runtimeConfig.demoMode) {
    const idx = mockMenuItems.findIndex((i) => Number(i.item_id) === Number(itemId));
    if (idx === -1) throw new Error('Item not found');
    const updated = {
      ...mockMenuItems[idx],
      ...(updates.item_name !== undefined ? { item_name: updates.item_name } : {}),
      ...(updates.price !== undefined ? { price: toNumber(updates.price) } : {}),
      ...(updates.category !== undefined ? { category: updates.category } : {}),
      ...(updates.description !== undefined ? { description: updates.description } : {}),
      ...(updates.is_available !== undefined ? { is_available: updates.is_available } : {}),
    };
    mockMenuItems[idx] = updated;
    return updated;
  }

  const { data, error } = await supabase
    .from('menu_item')
    .update({
      ...(updates.item_name !== undefined ? { item_name: updates.item_name } : {}),
      ...(updates.price !== undefined ? { price: updates.price } : {}),
      ...(updates.category !== undefined ? { category: updates.category } : {}),
      ...(updates.description !== undefined ? { description: updates.description } : {}),
      ...(updates.is_available !== undefined ? { is_available: updates.is_available } : {}),
    })
    .eq('item_id', itemId)
    .select('item_id,item_name,price,category,is_available,description,created_at')
    .single();
  if (error) throw error;
  return { ...data, price: toNumber(data.price) };
};

/** Delete a menu item */
export const deleteMenuItem = async (itemId) => {
  if (runtimeConfig.demoMode) {
    const idx = mockMenuItems.findIndex((i) => Number(i.item_id) === Number(itemId));
    if (idx === -1) return true;
    mockMenuItems.splice(idx, 1);
    return true;
  }

  const { error } = await supabase.from('menu_item').delete().eq('item_id', itemId);
  if (error) throw error;
  return true;
};

/** Toggle item availability */
export const toggleAvailability = async (itemId) => {
  const current = await getMenuItem(itemId);
  if (!current) throw new Error('Item not found');
  return updateMenuItem(itemId, { is_available: !current.is_available });
};

/** Get unique categories */
export const getCategories = async () => {
  if (runtimeConfig.demoMode) {
    const cats = mockMenuItems.map((r) => r.category).filter(Boolean);
    return [...new Set(cats)];
  }

  const { data, error } = await supabase
    .from('menu_item')
    .select('category');
  if (error) throw error;
  const cats = (data || []).map((r) => r.category).filter(Boolean);
  return [...new Set(cats)];
};


