import { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Navigation, Car, Clock, CheckCircle, XCircle, RefreshCw, Star } from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { notify, requestPermission } from '../../services/notifications';
import { geocode } from '../../services/geocode';
import MapView from '../../components/MapView';
import RatingModal from '../../components/RatingModal';
import ChatBox from '../../components/ChatBox';

const STATUS_STYLES = {
  requested:   'bg-yellow-100 text-yellow-700',
  accepted:    'bg-blue-100 text-blue-700',
  in_progress: 'bg-green-100 text-green-700',
  completed:   'bg-gray-100 text-gray-600',
  cancelled:   'bg-red-100 text-red-600',
};
const STATUS_LABELS = {
  requested:   'Looking for driver...',
  accepted:    'Driver on the way',
  in_progress: 'Ride in progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
};

export default function PassengerDashboard() {
  const { user } = useAuth();
  const [rides, setRides]       = useState([]);
  const [drivers, setDrivers]   = useState([]);
  const [form, setForm]         = useState({ pickupAddress: '', dropoffAddress: '' });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [tab, setTab]           = useState('book');
  const [rideToRate, setRideToRate] = useState(null);
  const [mapCoords, setMapCoords] = useState({ pickup: null, dropoff: null });
  const [geocoding, setGeocoding] = useState(false);
  const prevStatuses = useRef({});

  // Request browser notification permission on mount
  useEffect(() => { requestPermission(); }, []);

  const fetchRides = useCallback(async () => {
    try {
      const { data } = await api.get('/rides');
      // Detect status changes and fire notifications
      data.forEach(ride => {
        const prev = prevStatuses.current[ride.id];
        if (prev && prev !== ride.status) {
          if (ride.status === 'accepted')    notify('Driver on the way!', 'Your ride has been accepted by a driver.');
          if (ride.status === 'in_progress') notify('Ride started!', 'Your driver has started the trip.');
          if (ride.status === 'completed')   notify('Ride completed!', 'You have arrived. Enjoy your day!');
          if (ride.status === 'cancelled')   notify('Ride cancelled', 'Your ride was cancelled.');
        }
        prevStatuses.current[ride.id] = ride.status;
      });
      setRides(data);

      // Prompt rating for newly completed rides that haven't been rated
      const newlyCompleted = data.find(r =>
        r.status === 'completed' && !r.rating && r.passengerId === user?.id
      );
      if (newlyCompleted && !rideToRate) setRideToRate(newlyCompleted);
    } catch {}
  }, [rideToRate, user?.id]);

  const fetchDrivers = useCallback(async () => {
    try { const { data } = await api.get('/drivers'); setDrivers(data); } catch {}
  }, []);

  useEffect(() => {
    fetchRides(); fetchDrivers();
    const id = setInterval(() => { fetchRides(); fetchDrivers(); }, 4000);
    return () => clearInterval(id);
  }, [fetchRides, fetchDrivers]);

  async function handleGeocode() {
    setGeocoding(true);
    const [pickup, dropoff] = await Promise.all([
      geocode(form.pickupAddress),
      geocode(form.dropoffAddress),
    ]);
    setMapCoords({ pickup, dropoff });
    setGeocoding(false);
  }

  async function requestRide(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    const active = rides.find(r => ['requested','accepted','in_progress'].includes(r.status));
    if (active) { setError('You already have an active ride.'); return; }
    setLoading(true);
    try {
      const [pickupCoords, dropoffCoords] = await Promise.all([
        geocode(form.pickupAddress),
        geocode(form.dropoffAddress),
      ]);
      setMapCoords({ pickup: pickupCoords, dropoff: dropoffCoords });
      await api.post('/rides/request', { ...form, pickupCoords, dropoffCoords });
      setSuccess('Ride requested! A driver will accept shortly.');
      setForm({ pickupAddress: '', dropoffAddress: '' });
      await fetchRides();
      setTab('rides');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request ride');
    } finally {
      setLoading(false);
    }
  }

  async function cancelRide(id) {
    try { await api.patch(`/rides/${id}/cancel`); await fetchRides(); } catch {}
  }

  const activeRide   = rides.find(r => ['requested','accepted','in_progress'].includes(r.status));
  const activeDriver = activeRide?.driverId ? drivers.find(d => d.id === activeRide.driverId) : null;
  const availableCount = drivers.filter(d => d.isOnline && d.isAvailable).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {rideToRate && (
        <RatingModal
          ride={rideToRate}
          onClose={() => setRideToRate(null)}
          onRated={fetchRides}
        />
      )}

      {/* Chat — only visible when a ride is accepted or in progress */}
      {activeRide && ['accepted','in_progress'].includes(activeRide.status) && (
        <ChatBox rideId={activeRide.id} currentUser={user} currentRole="passenger" />
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hey, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-gray-500 text-sm">Your rides are always free with DriveFree</p>
      </div>

      {/* Active ride banner */}
      {activeRide && (
        <div className={`card mb-6 border-l-4 ${
          activeRide.status === 'accepted'    ? 'border-blue-500' :
          activeRide.status === 'in_progress' ? 'border-green-500' : 'border-yellow-500'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Car size={16} className="text-green-500" />
              <span className="font-semibold text-gray-900">Active Ride</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[activeRide.status]}`}>
                {STATUS_LABELS[activeRide.status]}
              </span>
            </div>
            {activeRide.status === 'requested' && (
              <button onClick={() => cancelRide(activeRide.id)} className="btn-danger text-xs py-1.5 px-3">Cancel</button>
            )}
          </div>
          <div className="text-sm text-gray-600 space-y-1 mb-3">
            <p><span className="font-medium">From:</span> {activeRide.pickupAddress}</p>
            <p><span className="font-medium">To:</span> {activeRide.dropoffAddress}</p>
            <p className="text-green-600 font-bold">Cost: FREE</p>
          </div>
          {activeDriver && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white font-bold">
                {activeDriver.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900">{activeDriver.name}</p>
                <p className="text-xs text-gray-500">{activeDriver.vehicleModel} • {activeDriver.vehicleColor} • {activeDriver.vehiclePlate}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Star size={11} className="text-yellow-400 fill-yellow-400" />
                {activeDriver.rating?.toFixed(1)}
              </div>
            </div>
          )}
          {/* Map for active ride */}
          {(activeRide.pickupCoords || activeRide.dropoffCoords) && (
            <MapView
              pickupCoords={activeRide.pickupCoords}
              dropoffCoords={activeRide.dropoffCoords}
              driverCoords={activeDriver?.location}
              className="mt-3 h-48"
            />
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
        {[['book','Book Ride'],['rides','My Rides'],['drivers','Drivers']].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === t ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Book tab ── */}
      {tab === 'book' && (
        <div className="card">
          <h2 className="font-bold text-gray-900 text-lg mb-4">Request a Free Ride</h2>
          {error   && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-4 text-sm">{success}</div>}
          <form onSubmit={requestRide} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <MapPin size={14} className="text-green-500" /> Pickup Location
              </label>
              <input
                required value={form.pickupAddress}
                onChange={e => setForm(f => ({ ...f, pickupAddress: e.target.value }))}
                placeholder="Enter pickup address"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Navigation size={14} className="text-blue-500" /> Drop-off Location
              </label>
              <input
                required value={form.dropoffAddress}
                onChange={e => setForm(f => ({ ...f, dropoffAddress: e.target.value }))}
                placeholder="Enter destination"
                className="input-field"
              />
            </div>

            {/* Preview map */}
            {(form.pickupAddress || form.dropoffAddress) && (
              <div>
                <button
                  type="button"
                  onClick={handleGeocode}
                  disabled={geocoding}
                  className="text-xs text-green-600 hover:underline mb-2"
                >
                  {geocoding ? 'Finding locations...' : 'Preview on map'}
                </button>
                {(mapCoords.pickup || mapCoords.dropoff) && (
                  <MapView pickupCoords={mapCoords.pickup} dropoffCoords={mapCoords.dropoff} className="h-44" />
                )}
              </div>
            )}

            <div className="bg-green-50 rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm text-gray-600 font-medium">Ride Cost</span>
              <span className="text-2xl font-black text-green-500">FREE</span>
            </div>
            <button type="submit" disabled={loading || !!activeRide} className="btn-primary">
              {loading ? 'Requesting...' : activeRide ? 'You have an active ride' : 'Request Free Ride'}
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-4">
            {availableCount} driver{availableCount !== 1 ? 's' : ''} available now
          </p>
        </div>
      )}

      {/* ── Rides tab ── */}
      {tab === 'rides' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-900">Your Rides</h2>
            <button onClick={fetchRides} className="text-gray-400 hover:text-gray-600"><RefreshCw size={16} /></button>
          </div>
          {rides.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <Car size={40} className="mx-auto mb-3 opacity-30" />
              <p>No rides yet. Book your first free ride!</p>
            </div>
          ) : rides.slice().reverse().map(ride => (
            <div key={ride.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[ride.status]}`}>
                      {STATUS_LABELS[ride.status]}
                    </span>
                    <span className="text-green-600 font-bold text-xs">FREE</span>
                    {ride.rating && (
                      <span className="flex items-center gap-0.5 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} size={9} className={n <= ride.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                        ))}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div className="flex items-center gap-2"><MapPin size={13} className="text-green-500 shrink-0" />{ride.pickupAddress}</div>
                    <div className="flex items-center gap-2"><Navigation size={13} className="text-blue-500 shrink-0" />{ride.dropoffAddress}</div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Clock size={11} /> {new Date(ride.requestedAt).toLocaleString()}
                  </p>
                  {ride.status === 'completed' && !ride.rating && (
                    <button
                      onClick={() => setRideToRate(ride)}
                      className="mt-2 text-xs text-green-600 font-medium hover:underline flex items-center gap-1"
                    >
                      <Star size={12} /> Rate this ride
                    </button>
                  )}
                  {ride.ratingComment && (
                    <p className="text-xs text-gray-400 italic mt-1">"{ride.ratingComment}"</p>
                  )}
                </div>
                <div className="ml-2 shrink-0">
                  {ride.status === 'requested' && (
                    <button onClick={() => cancelRide(ride.id)} className="text-red-500 hover:text-red-600"><XCircle size={18} /></button>
                  )}
                  {ride.status === 'completed' && <CheckCircle size={18} className="text-green-500" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Drivers tab ── */}
      {tab === 'drivers' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-900">All Drivers ({drivers.length})</h2>
            <button onClick={fetchDrivers} className="text-gray-400 hover:text-gray-600"><RefreshCw size={16} /></button>
          </div>
          {drivers.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <Car size={40} className="mx-auto mb-3 opacity-30" />
              <p>No drivers registered yet.</p>
            </div>
          ) : drivers.map(driver => (
            <div key={driver.id} className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 font-bold text-lg shrink-0">
                {driver.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{driver.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${driver.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {driver.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">{driver.vehicleModel} • {driver.vehicleColor} • {driver.vehiclePlate}</p>
                <div className="flex items-center gap-1 mt-1">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} size={11} className={n <= Math.round(driver.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                  ))}
                  <span className="text-xs text-gray-400 ml-1">{driver.rating?.toFixed(1)} ({driver.ratingCount || 0}) • {driver.totalRides} rides</span>
                </div>
              </div>
              {driver.isOnline && driver.isAvailable && (
                <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-lg font-medium">Available</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
