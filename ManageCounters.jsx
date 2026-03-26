import { useState, useEffect } from 'react';
import { getCounters, addCounter, updateCounter, toggleCounterStatus, getCounterOrders, deleteCounter } from './counterService';
import Modal from './Modal';
import FormInput from './FormInput';
import Button from './Button';
import Alert from './Alert';

export default function ManageCounters() {
  const [counters, setCounters] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCounter, setEditingCounter] = useState(null);
  const [form, setForm] = useState({ counter_name: '', location: '', max_capacity: '15' });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [counterOrders, setCounterOrders] = useState({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const data = await getCounters();
    setCounters(data);
    const ordersMap = {};
    for (const c of data) {
      const orders = await getCounterOrders(c.counter_id);
      ordersMap[c.counter_id] = orders;
    }
    setCounterOrders(ordersMap);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setEditingCounter(null);
    setForm({ counter_name: '', location: '', max_capacity: '15' });
    setModalOpen(true);
  };

  const openEditModal = (counter) => {
    setEditingCounter(counter);
    setForm({
      counter_name: counter.counter_name,
      location: counter.location,
      max_capacity: String(counter.max_capacity),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.counter_name) {
      setAlert({ type: 'error', message: 'Counter name is required' });
      return;
    }
    setLoading(true);
    try {
      if (editingCounter) {
        await updateCounter(editingCounter.counter_id, {
          counter_name: form.counter_name,
          location: form.location,
          max_capacity: parseInt(form.max_capacity),
        });
        setAlert({ type: 'success', message: 'Counter updated' });
      } else {
        await addCounter({
          counter_name: form.counter_name,
          location: form.location,
          max_capacity: parseInt(form.max_capacity),
        });
        setAlert({ type: 'success', message: 'Counter added' });
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (counterId) => {
    try {
      await toggleCounterStatus(counterId);
      loadData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleDelete = async (counterId) => {
    if (!confirm('Delete this counter?')) return;
    try {
      await deleteCounter(counterId);
      setAlert({ type: 'success', message: 'Counter deleted' });
      loadData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Counters</h1>
          <p className="text-sm text-gray-500">Manage counter operations and capacity</p>
        </div>
        <Button onClick={openAddModal}>+ Add Counter</Button>
      </div>

      {alert.message && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />
      )}

      {/* Counters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {counters.map((counter) => {
          const orders = counterOrders[counter.counter_id] || [];
          const pct = counter.max_capacity > 0 ? (counter.current_orders / counter.max_capacity) * 100 : 0;

          return (
            <div
              key={counter.counter_id}
              className={`rounded-xl border bg-white p-5 shadow-sm ${
                counter.status === 'Closed' ? 'border-red-200 opacity-75' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl ${
                    counter.status === 'Open' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    🏪
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{counter.counter_name}</h3>
                    <p className="text-xs text-gray-500">{counter.location}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  counter.status === 'Open' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {counter.status}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Current Orders</span>
                  <span className="font-medium">{counter.current_orders}/{counter.max_capacity}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      pct >= 100 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>

              {orders.length > 0 && (
                <div className="mb-4 rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-600 mb-2">Active Orders ({orders.length})</p>
                  <div className="space-y-1">
                    {orders.slice(0, 3).map(o => (
                      <div key={o.order_id} className="flex justify-between text-xs text-gray-500">
                        <span>#{o.order_id}</span>
                        <span className="font-medium">{o.status}</span>
                      </div>
                    ))}
                    {orders.length > 3 && (
                      <p className="text-xs text-gray-400">+{orders.length - 3} more</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleToggle(counter.counter_id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    counter.status === 'Open'
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                >
                  {counter.status === 'Open' ? 'Close Counter' : 'Open Counter'}
                </button>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(counter)}
                    className="rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(counter.counter_id)}
                    className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {counters.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
          <span className="text-4xl block mb-2">🏪</span>
          No counters configured. Add one to get started.
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCounter ? 'Edit Counter' : 'Add Counter'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Counter Name"
            id="counter_name"
            name="counter_name"
            value={form.counter_name}
            onChange={handleChange}
            placeholder="e.g. Counter D"
          />
          <FormInput
            label="Location"
            id="location"
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="e.g. First Floor - Right"
          />
          <FormInput
            label="Max Capacity"
            id="max_capacity"
            name="max_capacity"
            type="number"
            min="1"
            value={form.max_capacity}
            onChange={handleChange}
          />
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>
              {editingCounter ? 'Update' : 'Add Counter'}
            </Button>
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


