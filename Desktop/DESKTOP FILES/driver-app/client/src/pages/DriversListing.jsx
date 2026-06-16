import { useState, useEffect } from 'react';
import { Car, Star } from 'lucide-react';
import api from '../api';

export default function DriversListing() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/drivers')
      .then(({ data }) => setDrivers(data))
      .finally(() => setLoading(false));
  }, []);

  const online = drivers.filter(d => d.isOnline && d.isAvailable);
  const offline = drivers.filter(d => !d.isOnline || !d.isAvailable);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Drivers</h1>
        <p className="text-gray-500">Community drivers ready to give you a free ride</p>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>{online.length} online now</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-gray-300 rounded-full inline-block"></span>{offline.length} offline</span>
          <span className="text-gray-400">{drivers.length} total registered</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading drivers...</div>
      ) : drivers.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Car size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No drivers registered yet</p>
          <p className="text-sm mt-1">Be the first to join as a driver!</p>
        </div>
      ) : (
        <>
          {online.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-3">Available Now</h2>
              <div className="space-y-3">
                {online.map(driver => <DriverCard key={driver.id} driver={driver} />)}
              </div>
            </div>
          )}
          {offline.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Offline</h2>
              <div className="space-y-3">
                {offline.map(driver => <DriverCard key={driver.id} driver={driver} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DriverCard({ driver }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0 ${driver.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}>
        {driver.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900">{driver.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${driver.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {driver.isOnline ? (driver.isAvailable ? 'Available' : 'On a ride') : 'Offline'}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-0.5">
          <Car size={12} className="inline mr-1" />{driver.vehicleModel} • {driver.vehicleColor} • {driver.vehiclePlate}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="flex items-center gap-0.5">
            {[1,2,3,4,5].map(n => (
              <Star key={n} size={11} className={n <= Math.round(driver.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
            ))}
          </span>
          <span className="text-xs text-gray-400">{driver.rating?.toFixed(1)} ({driver.ratingCount || 0} ratings) • {driver.totalRides} rides</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-gray-400">{driver.phone}</p>
      </div>
    </div>
  );
}
