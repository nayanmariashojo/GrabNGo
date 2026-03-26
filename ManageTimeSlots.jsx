import { useState, useEffect } from 'react';
import { getTimeSlots, createTimeSlot, updateTimeSlot, toggleTimeSlot, deleteTimeSlot } from './timeSlotService';
import Modal from './Modal';
import FormInput from './FormInput';
import Button from './Button';
import Alert from './Alert';

export default function ManageTimeSlots() {
  const [slots, setSlots] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [form, setForm] = useState({ slot_time: '', date: '', max_capacity: '20' });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  useEffect(() => { loadSlots(); }, []);

  const loadSlots = async () => {
    const data = await getTimeSlots();
    setSlots(data);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setEditingSlot(null);
    setForm({ slot_time: '', date: '2026-03-03', max_capacity: '20' });
    setModalOpen(true);
  };

  const openEditModal = (slot) => {
    setEditingSlot(slot);
    setForm({
      slot_time: slot.slot_time,
      date: slot.date,
      max_capacity: String(slot.max_capacity),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.slot_time || !form.max_capacity) {
      setAlert({ type: 'error', message: 'Time and capacity are required' });
      return;
    }
    setLoading(true);
    try {
      if (editingSlot) {
        await updateTimeSlot(editingSlot.slot_id, {
          slot_time: form.slot_time,
          date: form.date,
          max_capacity: parseInt(form.max_capacity),
        });
        setAlert({ type: 'success', message: 'Time slot updated' });
      } else {
        await createTimeSlot({
          slot_time: form.slot_time,
          date: form.date,
          max_capacity: parseInt(form.max_capacity),
        });
        setAlert({ type: 'success', message: 'Time slot created' });
      }
      setModalOpen(false);
      loadSlots();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (slotId) => {
    try {
      await toggleTimeSlot(slotId);
      loadSlots();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleDelete = async (slotId) => {
    if (!confirm('Delete this time slot?')) return;
    try {
      await deleteTimeSlot(slotId);
      setAlert({ type: 'success', message: 'Time slot deleted' });
      loadSlots();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Time Slots</h1>
          <p className="text-sm text-gray-500">Create and manage pickup time slots</p>
        </div>
        <Button onClick={openAddModal}>+ Add Slot</Button>
      </div>

      {alert.message && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />
      )}

      {/* Slots Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {slots.map((slot) => {
          const pct = slot.max_capacity > 0 ? (slot.booked_count / slot.max_capacity) * 100 : 0;
          const isFull = slot.booked_count >= slot.max_capacity;

          return (
            <div
              key={slot.slot_id}
              className={`rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
                !slot.is_active ? 'border-gray-200 opacity-60' : isFull ? 'border-red-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">⏰ {slot.slot_time}</h3>
                <button
                  onClick={() => handleToggle(slot.slot_id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    slot.is_active ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      slot.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <p className="text-xs text-gray-500 mb-3">Date: {slot.date}</p>

              {/* Capacity bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Booked: {slot.booked_count}/{slot.max_capacity}</span>
                  <span className={`font-medium ${isFull ? 'text-red-600' : pct > 75 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {isFull ? 'FULL' : `${slot.max_capacity - slot.booked_count} left`}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isFull ? 'bg-red-500' : pct > 75 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  slot.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {slot.is_active ? 'Active' : 'Disabled'}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(slot)}
                    className="rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(slot.slot_id)}
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

      {slots.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
          <span className="text-4xl block mb-2">⏰</span>
          No time slots configured. Add one to get started.
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSlot ? 'Edit Time Slot' : 'Create Time Slot'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Time Range"
            id="slot_time"
            name="slot_time"
            value={form.slot_time}
            onChange={handleChange}
            placeholder="e.g. 11:00 AM - 11:30 AM"
          />
          <FormInput
            label="Date"
            id="date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
          />
          <FormInput
            label="Max Capacity"
            id="max_capacity"
            name="max_capacity"
            type="number"
            min="1"
            value={form.max_capacity}
            onChange={handleChange}
            placeholder="20"
          />
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>
              {editingSlot ? 'Update Slot' : 'Create Slot'}
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


