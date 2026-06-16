import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car } from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function DriverRegister() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    vehicleModel: '', vehiclePlate: '', vehicleColor: '',
  });
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
      const { data } = await api.post('/driver/register', form);
      login(data.driver, 'driver', data.token);
      navigate('/driver/dashboard');
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
          <div className="inline-flex bg-gray-900 rounded-2xl p-3 mb-4">
            <Car className="text-green-400" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Register as a Driver</h1>
          <p className="text-gray-500 mt-1">Join our community driver network</p>
        </div>

        <div className="card">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}
          <form onSubmit={submit} className="space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Personal Info</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input name="name" required value={form.name} onChange={handle} placeholder="John Doe" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input name="phone" required value={form.phone} onChange={handle} placeholder="+1 234 567" className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" required value={form.email} onChange={handle} placeholder="driver@example.com" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input name="password" type="password" required value={form.password} onChange={handle} placeholder="••••••••" className="input-field" />
            </div>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Vehicle Info</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Model</label>
              <input name="vehicleModel" required value={form.vehicleModel} onChange={handle} placeholder="Toyota Camry 2020" className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
                <input name="vehiclePlate" required value={form.vehiclePlate} onChange={handle} placeholder="ABC-1234" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input name="vehicleColor" required value={form.vehicleColor} onChange={handle} placeholder="White" className="input-field" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary mt-2">
              {loading ? 'Registering...' : 'Register as Driver'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Already registered?{' '}
            <Link to="/driver/login" className="text-green-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link to="/passenger/register" className="text-sm text-gray-400 hover:text-gray-600">Looking for a ride? Sign up as passenger</Link>
        </div>
      </div>
    </div>
  );
}
