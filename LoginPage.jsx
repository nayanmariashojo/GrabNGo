import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import FormInput from './FormInput';
import Button from './Button';
import Alert from './Alert';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const user = await signIn(form.email, form.password, form.role);
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/user/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side — decorative */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 p-12">
        <div className="text-center text-white">
          <span className="text-8xl block mb-6">🍽️</span>
          <h1 className="text-4xl font-bold mb-4">Crowd-Free Canteen</h1>
          <p className="text-lg opacity-90 max-w-md">
            Skip the crowds, pre-order your meals, and pick up at your chosen time slot.
            Smart dining for smart students.
          </p>
          <div className="mt-8 flex items-center justify-center gap-8 text-sm opacity-75">
            <div className="text-center">
              <p className="text-3xl font-bold">500+</p>
              <p>Students</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">50+</p>
              <p>Menu Items</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">3</p>
              <p>Counters</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side — login form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="mb-8 text-center lg:hidden">
            <span className="text-5xl">🍽️</span>
            <h1 className="mt-2 text-2xl font-bold text-indigo-600">Crowd-Free Canteen</h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">Welcome!</h2>
          <p className="mt-1 text-sm text-gray-500">Sign in to access your canteen account</p>

          {error && <Alert type="error" message={error} onClose={() => setError('')} />}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <FormInput
              label="Email"
              id="email"
              name="email"
              type="email"
              placeholder="you@college.edu"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />

            <FormInput
              label="Password"
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Login as</label>
              <div className="flex gap-3">
                {['student', 'staff', 'admin'].map((role) => (
                  <label
                    key={role}
                    className={`flex-1 cursor-pointer rounded-lg border-2 p-3 text-center text-sm font-medium transition-colors ${
                      form.role === role
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={form.role === role}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="block text-lg mb-1">
                      {role === 'student' ? '🎓' : role === 'staff' ? '👨‍🏫' : '🛡️'}
                    </span>
                    <span className="capitalize">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2">
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-700">
              Create account
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}


