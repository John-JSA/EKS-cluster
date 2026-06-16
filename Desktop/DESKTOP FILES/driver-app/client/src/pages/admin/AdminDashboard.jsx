import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Car, MapPin, CheckCircle, XCircle, Clock, Star,
  TrendingUp, RefreshCw, Trash2, LogOut, Shield, Activity,
} from 'lucide-react';
import api from '../../api';

const ADMIN_KEY = () => localStorage.getItem('adminKey') || '';

const adminHeaders = () => ({ headers: { 'x-admin-key': ADMIN_KEY() } });

const STATUS_STYLES = {
  requested:   'bg-yellow-100 text-yellow-700',
  accepted:    'bg-blue-100 text-blue-700',
  in_progress: 'bg-green-100 text-green-700',
  completed:   'bg-gray-100 text-gray-600',
  cancelled:   'bg-red-100 text-red-600',
};

export default function AdminDashboard() {
  const [stats, setStats]         = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [drivers, setDrivers]     = useState([]);
  const [rides, setRides]         = useState([]);
  const [tab, setTab]             = useState('overview');
  const [loading, setLoading]     = useState(true);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const [s, p, d, r] = await Promise.all([
        api.get('/admin/stats',      adminHeaders()),
        api.get('/admin/passengers', adminHeaders()),
        api.get('/admin/drivers',    adminHeaders()),
        api.get('/admin/rides',      adminHeaders()),
      ]);
      setStats(s.data); setPassengers(p.data); setDrivers(d.data); setRides(r.data);
    } catch {
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  function logout() {
    localStorage.removeItem('adminKey');
    navigate('/admin');
  }

  async function deleteRide(id) {
    if (!confirm('Delete this ride record?')) return;
    await api.delete(`/admin/rides/${id}`, adminHeaders());
    setRides(prev => prev.filter(r => r.id !== id));
    setStats(prev => prev ? { ...prev, totalRides: prev.totalRides - 1 } : prev);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Loading admin data...
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-gray-900 rounded-xl p-2">
            <Shield size={20} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm">DriveFree platform overview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100">
            <RefreshCw size={16} />
          </button>
          <button onClick={logout} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium">
            <LogOut size={15} /> Logout
          </button>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Passengers',      value: stats.totalPassengers,    icon: Users,     color: 'text-blue-500',  bg: 'bg-blue-50' },
            { label: 'Drivers',         value: stats.totalDrivers,       icon: Car,       color: 'text-green-500', bg: 'bg-green-50' },
            { label: 'Total Rides',     value: stats.totalRides,         icon: TrendingUp,color: 'text-purple-500',bg: 'bg-purple-50' },
            { label: 'Drivers Online',  value: stats.onlineDrivers,      icon: Activity,  color: 'text-yellow-600',bg: 'bg-yellow-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card flex items-center gap-4">
              <div className={`${bg} ${color} p-3 rounded-xl shrink-0`}>
                <Icon size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ride status breakdown */}
      {stats && (
        <div className="card mb-8">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin size={16} className="text-green-500" /> Ride Status Breakdown
          </h2>
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status} className="text-center">
                <div className="text-xl font-bold text-gray-900">{count}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[status]}`}>
                  {status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
        {[['overview','Rides'],['drivers','Drivers'],['passengers','Passengers']].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === t ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Rides tab */}
      {tab === 'overview' && (
        <div className="space-y-3">
          <h2 className="font-bold text-gray-900">All Rides ({rides.length})</h2>
          {rides.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <MapPin size={40} className="mx-auto mb-3 opacity-30" />
              <p>No rides yet.</p>
            </div>
          ) : rides.map(ride => (
            <div key={ride.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[ride.status]}`}>
                      {ride.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">Passenger: <span className="font-medium text-gray-800">{ride.passengerName}</span></span>
                    {ride.driverName !== '—' && (
                      <span className="text-xs text-gray-500">Driver: <span className="font-medium text-gray-800">{ride.driverName}</span></span>
                    )}
                    {ride.rating && (
                      <span className="flex items-center gap-0.5 text-xs text-yellow-600">
                        <Star size={10} className="fill-yellow-400" /> {ride.rating}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-0.5">
                    <p><span className="font-medium">From:</span> {ride.pickupAddress}</p>
                    <p><span className="font-medium">To:</span> {ride.dropoffAddress}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Clock size={10} /> {new Date(ride.requestedAt).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => deleteRide(ride.id)}
                  className="text-red-400 hover:text-red-600 shrink-0 p-1 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drivers tab */}
      {tab === 'drivers' && (
        <div className="space-y-3">
          <h2 className="font-bold text-gray-900">All Drivers ({drivers.length})</h2>
          {drivers.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">No drivers yet.</div>
          ) : drivers.map(driver => (
            <div key={driver.id} className="card flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 ${driver.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}>
                {driver.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{driver.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${driver.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {driver.isOnline ? (driver.isAvailable ? 'Available' : 'On a ride') : 'Offline'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">{driver.vehicleModel} • {driver.vehicleColor} • {driver.vehiclePlate}</p>
                <p className="text-xs text-gray-400">{driver.email} • {driver.phone}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Star size={11} className="text-yellow-400 fill-yellow-400" />
                    {driver.rating?.toFixed(1)} ({driver.ratingCount || 0} ratings)
                  </span>
                  <span>{driver.totalRides} rides</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Passengers tab */}
      {tab === 'passengers' && (
        <div className="space-y-3">
          <h2 className="font-bold text-gray-900">All Passengers ({passengers.length})</h2>
          {passengers.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">No passengers yet.</div>
          ) : passengers.map(p => (
            <div key={p.id} className="card flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
                {p.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{p.name}</p>
                <p className="text-sm text-gray-500">{p.email}</p>
                <p className="text-xs text-gray-400">{p.phone}</p>
              </div>
              <div className="text-right text-xs text-gray-400 shrink-0">
                <p>{rides.filter(r => r.passengerId === p.id).length} rides</p>
                <p className="mt-0.5">
                  {rides.filter(r => r.passengerId === p.id && r.status === 'completed').length} completed
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
