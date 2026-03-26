import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from './CartContext';
import { useAuth } from './AuthContext';
import { getAvailableTimeSlots } from './timeSlotService';
import { getOpenCounters } from './counterService';
import { placeOrder } from './orderService';
import SelectDropdown from './SelectDropdown';
import Button from './Button';
import Alert from './Alert';

export default function CartPage() {
  const { items, setQuantity, deleteItem, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [timeSlots, setTimeSlots] = useState([]);
  const [counters, setCounters] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedCounter, setSelectedCounter] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    const [slots, ctrs] = await Promise.all([
      getAvailableTimeSlots(),
      getOpenCounters(),
    ]);
    setTimeSlots(slots);
    setCounters(ctrs);
  };

  const handlePlaceOrder = async () => {
    setAlert({ type: '', message: '' });

    if (items.length === 0) {
      setAlert({ type: 'error', message: 'Your cart is empty' });
      return;
    }
    if (!selectedSlot) {
      setAlert({ type: 'error', message: 'Please select a time slot' });
      return;
    }
    if (!selectedCounter) {
      setAlert({ type: 'error', message: 'Please select a service counter' });
      return;
    }

    setLoading(true);
    try {
      await placeOrder(
        user.id,
        items,
        parseInt(selectedSlot),
        parseInt(selectedCounter),
        paymentMethod
      );
      clearCart();
      const needsAdminApproval = paymentMethod !== 'UPI';
      setAlert({
        type: 'success',
        message: needsAdminApproval
          ? 'Order placed. Waiting for admin payment approval before staff processing.'
          : 'Order placed successfully! Sent to staff for processing.',
      });
      setTimeout(() => navigate('/user/orders'), 1500);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to place order' });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !alert.message) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Cart</h1>
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <span className="text-5xl block mb-3">🛒</span>
          <p className="text-lg font-medium text-gray-600">Your cart is empty</p>
          <p className="text-sm text-gray-400 mt-1">Add some items from the menu to get started</p>
          <button
            onClick={() => navigate('/user/menu')}
            className="mt-4 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Cart</h1>

      {alert.message && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-3">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="border-b px-5 py-3">
              <h2 className="font-semibold text-gray-900">Cart Items ({items.length})</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div key={item.item_id} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                  {/* Item emoji badge */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-xl flex-shrink-0">
                    🍛
                  </div>

                  {/* Item details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.item_name}</p>
                    <p className="text-sm text-gray-500">₹{item.price} each</p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(item.item_id, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => setQuantity(item.item_id, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal */}
                  <p className="w-20 text-right font-semibold text-gray-900">
                    ₹{item.price * item.quantity}
                  </p>

                  {/* Remove */}
                  <button
                    onClick={() => deleteItem(item.item_id)}
                    className="text-red-400 hover:text-red-600 transition-colors p-1"
                    title="Remove item"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order summary & options */}
        <div className="space-y-4">
          {/* Time Slot Selection */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="font-semibold text-gray-900 mb-3">⏰ Pick Time Slot</h3>
            <SelectDropdown
              id="timeSlot"
              placeholder="Select a time slot"
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              options={timeSlots.map((s) => ({
                value: s.slot_id,
                label: `${s.slot_time} (${s.max_capacity - s.booked_count} spots left)`,
                disabled: s.booked_count >= s.max_capacity,
              }))}
            />
            {timeSlots.length === 0 && (
              <p className="mt-2 text-xs text-yellow-600">No available time slots right now</p>
            )}
          </div>

          {/* Counter Selection */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="font-semibold text-gray-900 mb-3">🏪 Pick Counter</h3>
            <SelectDropdown
              id="counter"
              placeholder="Select a counter"
              value={selectedCounter}
              onChange={(e) => setSelectedCounter(e.target.value)}
              options={counters.map((c) => ({
                value: c.counter_id,
                label: `${c.counter_name} — ${c.location} (${c.max_capacity - c.current_orders} available)`,
                disabled: c.current_orders >= c.max_capacity,
              }))}
            />
          </div>

          {/* Payment Method */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="font-semibold text-gray-900 mb-3">💳 Payment Method</h3>
            <div className="flex gap-2">
              {['UPI', 'Cash', 'Card'].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-colors ${
                    paymentMethod === method
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {method === 'UPI' ? '📱' : method === 'Cash' ? '💵' : '💳'} {method}
                </button>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.item_id} className="flex justify-between text-gray-600">
                  <span>{item.item_name} × {item.quantity}</span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-base font-bold text-gray-900">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handlePlaceOrder}
              loading={loading}
              className="w-full mt-4"
            >
              Place Order — ₹{total}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


