import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet marker icons broken by Vite asset bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const GREEN_ICON = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});
const BLUE_ICON = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});
const RED_ICON = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

function FitBounds({ markers }) {
  const map = useMap();
  useEffect(() => {
    const valid = markers.filter(Boolean);
    if (!valid.length) return;
    if (valid.length === 1) { map.setView([valid[0].lat, valid[0].lng], 14); return; }
    const bounds = L.latLngBounds(valid.map(m => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, markers]);
  return null;
}

export default function MapView({ pickupCoords, dropoffCoords, driverCoords, className = '' }) {
  const center = pickupCoords || driverCoords || { lat: 5.6037, lng: -0.187 }; // Default: Accra, Ghana

  const markers = [pickupCoords, dropoffCoords, driverCoords].filter(Boolean);

  return (
    <div className={`rounded-2xl overflow-hidden border border-gray-200 ${className}`} style={{ minHeight: 240 }}>
      <MapContainer center={[center.lat, center.lng]} zoom={13} style={{ height: '100%', width: '100%', minHeight: 240 }}>
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds markers={markers} />
        {pickupCoords && (
          <Marker position={[pickupCoords.lat, pickupCoords.lng]} icon={GREEN_ICON}>
            <Popup>Pickup location</Popup>
          </Marker>
        )}
        {dropoffCoords && (
          <Marker position={[dropoffCoords.lat, dropoffCoords.lng]} icon={RED_ICON}>
            <Popup>Drop-off location</Popup>
          </Marker>
        )}
        {driverCoords && (
          <Marker position={[driverCoords.lat, driverCoords.lng]} icon={BLUE_ICON}>
            <Popup>Driver location</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
