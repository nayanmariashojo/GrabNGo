import { useState } from 'react';
import { useAuth } from './AuthContext';
import FormInput from './FormInput';
import Button from './Button';
import Alert from './Alert';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    setAlert({ type: '', message: '' });
    try {
      await updateProfile({ name: form.name, phone: form.phone });
      setEditing(false);
      setAlert({ type: 'success', message: 'Profile updated successfully!' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '' });
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500">View and manage your account details</p>
      </div>

      {alert.message && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />
      )}

      <div className="max-w-2xl">
        {/* Profile header */}
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold backdrop-blur-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.name}</h2>
              <p className="text-sm text-indigo-200 capitalize">{user?.role} Account</p>
              <p className="text-xs text-indigo-200 mt-0.5">
                Member since {new Date(user?.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Profile details form */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Edit
              </button>
            )}
          </div>

          <div className="space-y-4">
            <FormInput
              label="Full Name"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              disabled={!editing}
            />

            <FormInput
              label="Email"
              id="email"
              name="email"
              type="email"
              value={form.email}
              disabled
              className="opacity-60"
            />

            <FormInput
              label="Phone Number"
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              disabled={!editing}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <p className="mt-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 capitalize">
                {user?.role}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">User ID</label>
              <p className="mt-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-400 font-mono">
                {user?.id}
              </p>
            </div>
          </div>

          {editing && (
            <div className="mt-6 flex gap-3">
              <Button onClick={handleSave} loading={loading}>
                Save Changes
              </Button>
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Account info */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
          <div className="flex items-center gap-2">
            <span className={`inline-block h-3 w-3 rounded-full ${user?.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {user?.is_active ? 'Active' : 'Inactive'} Account
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


