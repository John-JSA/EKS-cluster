const cache = new Map();

export async function geocode(address) {
  if (!address?.trim()) return null;
  if (cache.has(address)) return cache.get(address);
  try {
    const q = new URLSearchParams({ q: address, format: 'json', limit: 1 });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${q}`, {
      headers: { 'User-Agent': 'DriveFree/1.0 (drivefree-app)' },
    });
    const data = await res.json();
    if (!data.length) return null;
    const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    cache.set(address, coords);
    return coords;
  } catch {
    return null;
  }
}
