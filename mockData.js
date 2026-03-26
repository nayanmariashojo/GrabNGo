// ============================================================
// Mock Data — matches the 7 database tables
// ============================================================

export let mockUsers = [
  { id: 'u1', name: 'Rahul Kumar', email: 'rahul@college.edu', phone: '9876543210', role: 'student', created_at: '2026-01-15T10:00:00Z', is_active: true },
  { id: 'u2', name: 'Admin Sharma', email: 'admin@college.edu', phone: '9876543211', role: 'admin', created_at: '2026-01-01T08:00:00Z', is_active: true },
  { id: 'u3', name: 'Priya Singh', email: 'priya@college.edu', phone: '9876543212', role: 'student', created_at: '2026-02-10T12:00:00Z', is_active: true },
  { id: 'u4', name: 'Amit Verma', email: 'amit@college.edu', phone: '9876543213', role: 'student', created_at: '2026-02-20T09:00:00Z', is_active: true },
  { id: 'u6', name: 'Staff Kumar', email: 'staff@college.edu', phone: '9876543220', role: 'staff', created_at: '2026-03-10T09:00:00Z', is_active: true },
  { id: 'u5', name: 'Sneha Gupta', email: 'sneha@college.edu', phone: '9876543214', role: 'staff', created_at: '2026-01-05T11:00:00Z', is_active: false },
];

// Persist mock users for demo mode (so sign-up/sign-in survives refreshes).
const DEMO_USERS_KEY = 'cfc_demo_users';

const canUseLocalStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const loadPersistedMockUsers = () => {
  if (!canUseLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(DEMO_USERS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const persistMockUsers = () => {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(mockUsers));
  } catch {
    // ignore
  }
};

// Hydrate from storage once on module load.
const persistedUsers = loadPersistedMockUsers();
if (persistedUsers) {
  mockUsers = persistedUsers;
}

export let mockMenuItems = [
  { item_id: 1, item_name: 'Masala Dosa', price: 40, category: 'Breakfast', is_available: true, description: 'Crispy golden dosa served with potato masala, sambar & chutney' },
  { item_id: 2, item_name: 'Idli Sambar', price: 30, category: 'Breakfast', is_available: true, description: 'Soft steamed idlis with hot sambar and coconut chutney' },
  { item_id: 3, item_name: 'Veg Biryani', price: 80, category: 'Lunch', is_available: true, description: 'Fragrant basmati rice cooked with mixed vegetables and spices' },
  { item_id: 4, item_name: 'Chicken Biryani', price: 120, category: 'Lunch', is_available: true, description: 'Aromatic rice layered with tender chicken pieces and herbs' },
  { item_id: 5, item_name: 'Paneer Butter Masala', price: 100, category: 'Lunch', is_available: true, description: 'Cottage cheese cubes in rich tomato-butter gravy with naan' },
  { item_id: 6, item_name: 'Coffee', price: 20, category: 'Beverages', is_available: true, description: 'Hot filter coffee brewed fresh' },
  { item_id: 7, item_name: 'Tea', price: 15, category: 'Beverages', is_available: true, description: 'Classic Indian masala chai' },
  { item_id: 8, item_name: 'Cold Coffee', price: 50, category: 'Beverages', is_available: false, description: 'Chilled coffee blended with ice cream' },
  { item_id: 9, item_name: 'Samosa', price: 15, category: 'Snacks', is_available: true, description: 'Crispy deep-fried pastry with spiced potato filling' },
  { item_id: 10, item_name: 'Vada Pav', price: 20, category: 'Snacks', is_available: true, description: 'Spicy potato fritter in a soft bun with chutneys' },
  { item_id: 11, item_name: 'Poha', price: 25, category: 'Breakfast', is_available: true, description: 'Flattened rice cooked with onions, peanuts and spices' },
  { item_id: 12, item_name: 'Chole Bhature', price: 60, category: 'Lunch', is_available: true, description: 'Spicy chickpea curry served with fluffy fried bread' },
];

export let mockTimeSlots = [
  { slot_id: 1, slot_time: '11:00 AM - 11:30 AM', date: '2026-03-03', max_capacity: 20, booked_count: 12, is_active: true },
  { slot_id: 2, slot_time: '11:30 AM - 12:00 PM', date: '2026-03-03', max_capacity: 20, booked_count: 18, is_active: true },
  { slot_id: 3, slot_time: '12:00 PM - 12:30 PM', date: '2026-03-03', max_capacity: 25, booked_count: 25, is_active: true },
  { slot_id: 4, slot_time: '12:30 PM - 1:00 PM', date: '2026-03-03', max_capacity: 25, booked_count: 10, is_active: true },
  { slot_id: 5, slot_time: '1:00 PM - 1:30 PM', date: '2026-03-03', max_capacity: 20, booked_count: 5, is_active: true },
  { slot_id: 6, slot_time: '1:30 PM - 2:00 PM', date: '2026-03-03', max_capacity: 20, booked_count: 0, is_active: false },
];

export let mockServiceCounters = [
  { counter_id: 1, counter_name: 'Counter A', location: 'Ground Floor - Left', max_capacity: 15, current_orders: 8, status: 'Open' },
  { counter_id: 2, counter_name: 'Counter B', location: 'Ground Floor - Right', max_capacity: 10, current_orders: 3, status: 'Open' },
  { counter_id: 3, counter_name: 'Counter C', location: 'First Floor', max_capacity: 12, current_orders: 12, status: 'Closed' },
];

export let mockOrders = [
  { order_id: 1001, user_id: 'u1', counter_id: 1, slot_id: 1, order_time: '2026-03-01T11:15:00Z', total_amount: 130, status: 'Completed' },
  { order_id: 1002, user_id: 'u1', counter_id: 2, slot_id: 2, order_time: '2026-03-02T12:00:00Z', total_amount: 95, status: 'Preparing' },
  { order_id: 1003, user_id: 'u3', counter_id: 1, slot_id: 4, order_time: '2026-03-02T12:45:00Z', total_amount: 220, status: 'Pending' },
  { order_id: 1004, user_id: 'u4', counter_id: 2, slot_id: 1, order_time: '2026-03-03T11:10:00Z', total_amount: 60, status: 'Pending' },
  { order_id: 1005, user_id: 'u3', counter_id: 1, slot_id: 5, order_time: '2026-03-03T13:15:00Z', total_amount: 120, status: 'Ready' },
];

export let mockOrderItems = [
  { order_id: 1001, item_id: 1, quantity: 2, item_name: 'Masala Dosa', price: 40 },
  { order_id: 1001, item_id: 6, quantity: 1, item_name: 'Coffee', price: 20 },
  { order_id: 1001, item_id: 9, quantity: 2, item_name: 'Samosa', price: 15 },
  { order_id: 1002, item_id: 3, quantity: 1, item_name: 'Veg Biryani', price: 80 },
  { order_id: 1002, item_id: 7, quantity: 1, item_name: 'Tea', price: 15 },
  { order_id: 1003, item_id: 4, quantity: 1, item_name: 'Chicken Biryani', price: 120 },
  { order_id: 1003, item_id: 5, quantity: 1, item_name: 'Paneer Butter Masala', price: 100 },
  { order_id: 1004, item_id: 1, quantity: 1, item_name: 'Masala Dosa', price: 40 },
  { order_id: 1004, item_id: 6, quantity: 1, item_name: 'Coffee', price: 20 },
  { order_id: 1005, item_id: 4, quantity: 1, item_name: 'Chicken Biryani', price: 120 },
];

export let mockPayments = [
  { payment_id: 1, order_id: 1001, amount: 130, payment_method: 'UPI', payment_status: 'Paid', payment_time: '2026-03-01T11:16:00Z' },
  { payment_id: 2, order_id: 1002, amount: 95, payment_method: 'Cash', payment_status: 'Paid', payment_time: '2026-03-02T12:01:00Z' },
  { payment_id: 3, order_id: 1003, amount: 220, payment_method: 'UPI', payment_status: 'Pending', payment_time: '2026-03-02T12:46:00Z' },
  { payment_id: 4, order_id: 1004, amount: 60, payment_method: 'Card', payment_status: 'Paid', payment_time: '2026-03-03T11:11:00Z' },
  { payment_id: 5, order_id: 1005, amount: 120, payment_method: 'UPI', payment_status: 'Pending', payment_time: '2026-03-03T13:16:00Z' },
];


