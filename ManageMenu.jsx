import { useState, useEffect } from 'react';
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, toggleAvailability, getCategories } from './menuService';
import Modal from './Modal';
import FormInput from './FormInput';
import SelectDropdown from './SelectDropdown';
import Button from './Button';
import Alert from './Alert';

const emptyItem = { item_name: '', price: '', category: 'Breakfast', description: '', is_available: true };

export default function ManageMenu() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyItem);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [menuItems, cats] = await Promise.all([getMenuItems(), getCategories()]);
    setItems(menuItems);
    setCategories(cats);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const openAddModal = () => {
    setEditingItem(null);
    setForm(emptyItem);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setForm({ ...item, price: String(item.price) });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.item_name || !form.price) {
      setAlert({ type: 'error', message: 'Name and price are required' });
      return;
    }
    setLoading(true);
    try {
      if (editingItem) {
        await updateMenuItem(editingItem.item_id, { ...form, price: parseFloat(form.price) });
        setAlert({ type: 'success', message: 'Item updated successfully' });
      } else {
        await addMenuItem({ ...form, price: parseFloat(form.price) });
        setAlert({ type: 'success', message: 'Item added successfully' });
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteMenuItem(itemId);
      setAlert({ type: 'success', message: 'Item deleted' });
      loadData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleToggle = async (itemId) => {
    try {
      await toggleAvailability(itemId);
      loadData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const filtered = items.filter(i => {
    const matchSearch = !search || i.item_name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || i.category === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Menu</h1>
          <p className="text-sm text-gray-500">Add, edit, and manage menu items</p>
        </div>
        <Button onClick={openAddModal}>+ Add Item</Button>
      </div>

      {alert.message && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Item</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Price</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Available</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((item) => (
              <tr key={item.item_id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{item.item_name}</p>
                    <p className="text-xs text-gray-500 truncate max-w-xs">{item.description}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {item.category}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900">₹{item.price}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggle(item.item_id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      item.is_available ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                        item.is_available ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="rounded-lg px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.item_id)}
                      className="rounded-lg px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-400">No items found</div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Item Name"
            id="item_name"
            name="item_name"
            value={form.item_name}
            onChange={handleChange}
            placeholder="e.g. Masala Dosa"
          />
          <FormInput
            label="Description"
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Brief description"
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Price (₹)"
              id="price"
              name="price"
              type="number"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              placeholder="40"
            />
            <SelectDropdown
              label="Category"
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              options={[
                { value: 'Breakfast', label: 'Breakfast' },
                { value: 'Lunch', label: 'Lunch' },
                { value: 'Beverages', label: 'Beverages' },
                { value: 'Snacks', label: 'Snacks' },
              ]}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="is_available"
              checked={form.is_available}
              onChange={handleChange}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Available for ordering
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>
              {editingItem ? 'Update Item' : 'Add Item'}
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


