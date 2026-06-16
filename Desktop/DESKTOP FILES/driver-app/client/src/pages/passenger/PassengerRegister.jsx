import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car } from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function PassengerRegister() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function handle(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/passenger/register', form);
      login(data.user, 'passenger', data.token);
      navigate('/passenger/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex bg-green-500 rounded-2xl p-3 mb-4">
            <Car className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Passenger Account</h1>
          <p className="text-gray-500 mt-1">Free rides, always. No payment needed.</p>
        </div>

        <div className="card">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input name="name" required value={form.name} onChange={handle} placeholder="John Doe" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" required value={form.email} onChange={handle} placeholder="john@example.com" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input name="phone" required value={form.phone} onChange={handle} placeholder="+1 234 567 8900" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input name="password" type="password" required value={form.password} onChange={handle} placeholder="••••••••" className="input-field" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary mt-2">
              {loading ? 'Creating account...' : 'Create Free Account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/passenger/login" className="text-green-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link to="/driver/register" className="text-sm text-gray-400 hover:text-gray-600">Want to drive instead? Register as a driver</Link>
        </div>
      </div>
    </div>
  );
}
