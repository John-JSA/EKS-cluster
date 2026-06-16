import { useState, useEffect, useCallback, useRef } from 'react';
import { Car, MapPin, Navigation, CheckCircle, XCircle, Clock, Star, Power, RefreshCw, TrendingUp, LocateFixed } from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { notify, requestPermission } from '../../services/notifications';
import MapView from '../../components/MapView';
import ChatBox from '../../components/ChatBox';
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

const STATUS_STYLES = {
  requested:   'bg-yellow-100 text-yellow-700',
  accepted:    'bg-blue-100 text-blue-700',
  in_progress: 'bg-green-100 text-green-700',
  completed:   'bg-gray-100 text-gray-600',
  cancelled:   'bg-red-100 text-red-600',
};
const STATUS_LABELS = {
  requested:   'Waiting for driver',
  accepted:    'Accepted',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
};

export default function DriverDashboard() {
  const { user } = useAuth();
  const [rides, setRides]         = useState([]);
  const [isOnline, setIsOnline]   = useState(false);
  const [tab, setTab]             = useState('requests');
  const [myLocation, setMyLocation] = useState(null);
  const [locating, setLocating]   = useState(false);
  const prevRideIds = useRef(new Set());
  const watchRef = useRef(null);

  useEffect(() => { requestPermission(); }, []);

  const fetchRides = useCallback(async () => {
    try {
      const { data } = await api.get('/rides');
      // Notify on new incoming ride requests
      const openIds = data.filter(r => r.status === 'requested').map(r => r.id);
      const newOnes = openIds.filter(id => !prevRideIds.current.has(id));
      if (newOnes.length && isOnline) {
        notify('New ride request!', 'A passenger needs a ride. Open the app to accept.');
      }
      prevRideIds.current = new Set(openIds);
      setRides(data);
    } catch {}
  }, [isOnline]);

  useEffect(() => {
    fetchRides();
    const interval = setInterval(fetchRides, 4000);
    socket.on('new_ride_request', fetchRides);
    socket.on('ride_accepted', fetchRides);
    socket.on('ride_completed', fetchRides);
    return () => {
      clearInterval(interval);
      socket.off('new_ride_request', fetchRides);
      socket.off('ride_accepted', fetchRides);
      socket.off('ride_completed', fetchRides);
    };
  }, [fetchRides]);

  // Start/stop GPS tracking when going online/offline
  useEffect(() => {
    if (isOnline && 'geolocation' in navigator) {
      setLocating(true);
      watchRef.current = navigator.geolocation.watchPosition(
        pos => {
          const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMyLocation(location);
          setLocating(false);
          socket.emit('driver_location', { driverId: user.id, location });
        },
        () => setLocating(false),
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    } else {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
      setMyLocation(null);
    }
    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [isOnline, user?.id]);

  function toggleOnline() {
    const next = !isOnline;
    setIsOnline(next);
    socket.emit(next ? 'driver_online' : 'driver_offline', { driverId: user.id });
    if (!next) setMyLocation(null);
  }

  async function acceptRide(id) {
    try { await api.patch(`/rides/${id}/accept`); await fetchRides(); } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept');
    }
  }

  async function startRide(id) {
    try { await api.patch(`/rides/${id}/start`); await fetchRides(); } catch {}
  }

  async function completeRide(id) {
    try { await api.patch(`/rides/${id}/complete`); await fetchRides(); } catch {}
  }

  const openRequests  = rides.filter(r => r.status === 'requested');
  const myRides       = rides.filter(r => r.driverId === user?.id);
  const activeRide    = myRides.find(r => ['accepted','in_progress'].includes(r.status));
  const completedCount = myRides.filter(r => r.status === 'completed').length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
          <p className="text-gray-500 text-sm">
            {isOnline
              ? locating ? 'Getting your GPS location...' : `Online — GPS active`
              : `Hey ${user?.name?.split(' ')[0]}, go online to receive rides`}
          </p>
        </div>
        <button
          onClick={toggleOnline}
          className={`flex items-center gap-2 py-2.5 px-5 rounded-xl font-semibold transition-all ${
            isOnline ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          <Power size={16} /> {isOnline ? 'Online' : 'Go Online'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-500">{completedCount}</div>
          <div className="text-xs text-gray-500 mt-1">Total Rides</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-500 flex items-center justify-center gap-1">
            <Star size={16} className="fill-yellow-400" />{user?.rating?.toFixed(1) || '5.0'}
          </div>
          <div className="text-xs text-gray-500 mt-1">Rating</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-500">{openRequests.length}</div>
          <div className="text-xs text-gray-500 mt-1">Pending</div>
        </div>
      </div>

      {/* My location map */}
      {isOnline && myLocation && (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
            <LocateFixed size={14} className="text-green-500" /> Your current location
          </div>
          <MapView driverCoords={myLocation} className="h-36" />
        </div>
      )}

      {/* Active ride */}
      {activeRide && (
        <div className="card mb-6 border-2 border-green-400 bg-green-50">
          <div className="flex items-center gap-2 mb-3">
            <Car size={18} className="text-green-600" />
            <span className="font-bold text-green-800">Active Ride</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[activeRide.status]}`}>
              {STATUS_LABELS[activeRide.status]}
            </span>
          </div>
          <div className="text-sm text-gray-700 space-y-1 mb-4">
            <div className="flex items-center gap-2"><MapPin size={14} className="text-green-500" /> {activeRide.pickupAddress}</div>
            <div className="flex items-center gap-2"><Navigation size={14} className="text-blue-500" /> {activeRide.dropoffAddress}</div>
          </div>
          {(activeRide.pickupCoords || activeRide.dropoffCoords) && (
            <MapView
              pickupCoords={activeRide.pickupCoords}
              dropoffCoords={activeRide.dropoffCoords}
              driverCoords={myLocation}
              className="h-48 mb-4"
            />
          )}
          <div className="flex gap-2">
            {activeRide.status === 'accepted' && (
              <button onClick={() => startRide(activeRide.id)} className="btn-sm flex-1">Start Ride</button>
            )}
            {activeRide.status === 'in_progress' && (
              <button onClick={() => completeRide(activeRide.id)} className="btn-sm flex-1 bg-blue-500 hover:bg-blue-600">Complete Ride</button>
            )}
          </div>
        </div>
      )}

      {/* Chat — only visible when on an active ride */}
      {activeRide && ['accepted','in_progress'].includes(activeRide.status) && (
        <ChatBox rideId={activeRide.id} currentUser={user} currentRole="driver" />
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
        {[['requests',`Requests (${openRequests.length})`],['history','My Rides']].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === t ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Requests tab */}
      {tab === 'requests' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Open Ride Requests</h2>
            <button onClick={fetchRides} className="text-gray-400 hover:text-gray-600"><RefreshCw size={16} /></button>
          </div>
          {!isOnline && (
            <div className="card text-center py-8 text-gray-400 border-2 border-dashed border-gray-200">
              <Power size={32} className="mx-auto mb-2 opacity-40" />
              <p className="font-medium">Go online to receive ride requests</p>
            </div>
          )}
          {isOnline && openRequests.length === 0 && (
            <div className="card text-center py-12 text-gray-400">
              <Clock size={40} className="mx-auto mb-3 opacity-30" />
              <p>No ride requests yet. Stay online!</p>
            </div>
          )}
          {isOnline && openRequests.map(ride => (
            <div key={ride.id} className="card border-l-4 border-yellow-400">
              <div className="text-sm text-gray-700 space-y-1.5 mb-3">
                <div className="flex items-center gap-2 font-medium text-gray-900">
                  <MapPin size={14} className="text-green-500 shrink-0" /> {ride.pickupAddress}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Navigation size={14} className="text-blue-500 shrink-0" /> {ride.dropoffAddress}
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <Clock size={11} /> {new Date(ride.requestedAt).toLocaleTimeString()}
                  <span className="ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Free ride</span>
                </div>
              </div>
              {/* Mini map preview */}
              {(ride.pickupCoords || ride.dropoffCoords) && (
                <MapView pickupCoords={ride.pickupCoords} dropoffCoords={ride.dropoffCoords} className="h-32 mb-3" />
              )}
              {!activeRide ? (
                <button onClick={() => acceptRide(ride.id)} className="btn-primary py-2 text-sm">Accept Ride</button>
              ) : (
                <p className="text-xs text-gray-400 text-center">Finish your current ride first</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">My Ride History</h2>
            <button onClick={fetchRides} className="text-gray-400 hover:text-gray-600"><RefreshCw size={16} /></button>
          </div>
          {myRides.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
              <p>No rides yet. Accept your first request!</p>
            </div>
          ) : myRides.slice().reverse().map(ride => (
            <div key={ride.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[ride.status]}`}>
                      {STATUS_LABELS[ride.status]}
                    </span>
                    {ride.rating && (
                      <span className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} size={11} className={n <= ride.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                        ))}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div className="flex items-center gap-2"><MapPin size={13} className="text-green-500" />{ride.pickupAddress}</div>
                    <div className="flex items-center gap-2"><Navigation size={13} className="text-blue-500" />{ride.dropoffAddress}</div>
                  </div>
                  {ride.ratingComment && (
                    <p className="text-xs italic text-gray-400 mt-1">"{ride.ratingComment}"</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Clock size={11} /> {new Date(ride.requestedAt).toLocaleString()}
                  </p>
                </div>
                <div className="ml-2 shrink-0">
                  {ride.status === 'completed' && <CheckCircle size={18} className="text-green-500" />}
                  {ride.status === 'cancelled'  && <XCircle size={18} className="text-red-400" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
