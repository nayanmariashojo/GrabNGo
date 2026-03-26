import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import FormInput from './FormInput';
import Button from './Button';
import Alert from './Alert';

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'student',
    accessCode: '',
    adminCode: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const next = { ...form, [e.target.name]: e.target.value };
    // Clear codes when switching roles
    if (e.target.name === 'role') {
      next.accessCode = '';
      next.adminCode = '';
    }
    setForm(next);
    // Clear field error
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(form.phone)) errs.phone = 'Enter a valid 10-digit phone number';
    if (!['student', 'staff', 'admin'].includes(form.role)) errs.role = 'Select a valid role';

    // Student/Staff access code
    if (form.role === 'student' || form.role === 'staff') {
      const envKey = form.role === 'student' ? 'VITE_STUDENT_SIGNUP_CODE' : 'VITE_STAFF_SIGNUP_CODE';
      const expected = form.role === 'student'
        ? import.meta.env.VITE_STUDENT_SIGNUP_CODE
        : import.meta.env.VITE_STAFF_SIGNUP_CODE;

      if (!expected) {
        errs.accessCode = `${form.role === 'student' ? 'Student' : 'Staff'} signup code is disabled. Set ${envKey} in .env`;
      } else if (!form.accessCode) {
        errs.accessCode = `${form.role === 'student' ? 'Student' : 'Staff'} signup code is required`;
      } else if (String(form.accessCode).trim() !== String(expected).trim()) {
        errs.accessCode = `Invalid ${form.role} signup code`;
      }
    }

    const adminCodeRequired = form.role === 'admin';
    const adminCodeFromEnv = import.meta.env.VITE_ADMIN_SIGNUP_CODE;
    if (adminCodeRequired) {
      if (!adminCodeFromEnv) {
        errs.adminCode = 'Admin signup is disabled. Set VITE_ADMIN_SIGNUP_CODE in .env';
      } else if (!form.adminCode) {
        errs.adminCode = 'Admin code is required';
      } else if (String(form.adminCode).trim() !== String(adminCodeFromEnv).trim()) {
        errs.adminCode = 'Invalid admin code';
      }
    }

    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await signUp(
        form.name,
        form.email,
        form.phone,
        form.password,
        form.role,
        form.accessCode,
        form.adminCode
      );
      navigate(form.role === 'admin' ? '/admin/dashboard' : '/user/dashboard', { replace: true });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Signup failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side — decorative */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-700 p-12">
        <div className="text-center text-white">
          <span className="text-8xl block mb-6">🎓</span>
          <h1 className="text-4xl font-bold mb-4">Join Us Today!</h1>
          <p className="text-lg opacity-90 max-w-md">
            Create your account and start ordering. Save time during lunch 
            with pre-booked time slots and zero queues!
          </p>
          <div className="mt-8 space-y-3 text-left max-w-xs mx-auto">
            {[
              'Pre-order meals from the menu',
              'Choose your pickup time slot',
              'Skip the queue — zero waiting',
              'Track your orders in real-time',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side — signup form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="mb-6 text-center lg:hidden">
            <span className="text-5xl">🍽️</span>
            <h1 className="mt-2 text-2xl font-bold text-indigo-600">Crowd-Free Canteen</h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-1 text-sm text-gray-500">Create your account to start ordering</p>

          {alert.message && (
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <FormInput
              label="Full Name"
              id="name"
              name="name"
              type="text"
              placeholder="Rahul Kumar"
              value={form.name}
              onChange={handleChange}
              error={errors.name}
            />

            <FormInput
              label="Email"
              id="email"
              name="email"
              type="email"
              placeholder="you@college.edu"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              autoComplete="email"
            />

            <FormInput
              label="Phone Number"
              id="phone"
              name="phone"
              type="tel"
              placeholder="9876543210"
              value={form.phone}
              onChange={handleChange}
              error={errors.phone}
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Sign up as</label>
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
              {errors.role && <p className="text-xs text-red-600 mt-1">{errors.role}</p>}
            </div>

            {(form.role === 'student' || form.role === 'staff') && (
              <FormInput
                label={form.role === 'student' ? 'Student Signup Code' : 'Staff Signup Code'}
                id="accessCode"
                name="accessCode"
                type="password"
                placeholder="Enter your code"
                value={form.accessCode}
                onChange={handleChange}
                error={errors.accessCode}
              />
            )}

            {form.role === 'admin' && (
              <FormInput
                label="Admin Code"
                id="adminCode"
                name="adminCode"
                type="password"
                placeholder="Enter admin signup code"
                value={form.adminCode}
                onChange={handleChange}
                error={errors.adminCode}
              />
            )}

            <FormInput
              label="Password"
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              autoComplete="new-password"
            />

            <FormInput
              label="Confirm Password"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />

            <Button type="submit" loading={loading} className="w-full mt-2">
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}


