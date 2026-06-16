import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as db from './db.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

const JWT_SECRET = 'drivefree-secret-2024';
const ADMIN_KEY  = 'drivefree-admin-2024';

function adminAuth(req, res, next) {
  if (req.headers['x-admin-key'] !== ADMIN_KEY)
    return res.status(403).json({ error: 'Forbidden' });
  next();
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(header.split(' ')[1], JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}
function safe(obj) {
  if (!obj) return null;
  const { password, ...rest } = obj;
  return rest;
}

// ── Passenger ────────────────────────────────────────────────────────────────
app.post('/api/passenger/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (db.passengers.findOne(u => u.email === email))
    return res.status(400).json({ error: 'Email already registered' });
  const hashed = await bcrypt.hash(password, 10);
  const user = db.passengers.insert({ id: uuidv4(), name, email, phone, password: hashed, role: 'passenger' });
  res.json({ token: signToken({ id: user.id, role: 'passenger' }), user: safe(user) });
});

app.post('/api/passenger/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.passengers.findOne(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ token: signToken({ id: user.id, role: 'passenger' }), user: safe(user) });
});

// ── Driver ────────────────────────────────────────────────────────────────────
app.post('/api/driver/register', async (req, res) => {
  const { name, email, phone, password, vehicleModel, vehiclePlate, vehicleColor } = req.body;
  if (db.drivers.findOne(d => d.email === email))
    return res.status(400).json({ error: 'Email already registered' });
  const hashed = await bcrypt.hash(password, 10);
  const driver = db.drivers.insert({
    id: uuidv4(), name, email, phone, password: hashed,
    vehicleModel, vehiclePlate, vehicleColor,
    isOnline: false, isAvailable: true,
    rating: 5.0, ratingCount: 0, totalRides: 0,
    location: null, role: 'driver',
  });
  res.json({ token: signToken({ id: driver.id, role: 'driver' }), driver: safe(driver) });
});

app.post('/api/driver/login', async (req, res) => {
  const { email, password } = req.body;
  const driver = db.drivers.findOne(d => d.email === email);
  if (!driver || !(await bcrypt.compare(password, driver.password)))
    return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ token: signToken({ id: driver.id, role: 'driver' }), driver: safe(driver) });
});

app.get('/api/drivers', (_req, res) => {
  res.json(db.drivers.all().map(safe));
});

app.get('/api/drivers/available', (_req, res) => {
  res.json(db.drivers.find(d => d.isOnline && d.isAvailable).map(safe));
});

// ── Rides ─────────────────────────────────────────────────────────────────────
app.post('/api/rides/request', auth, (req, res) => {
  if (req.user.role !== 'passenger') return res.status(403).json({ error: 'Passengers only' });
  const { pickupAddress, dropoffAddress, pickupCoords, dropoffCoords } = req.body;
  const ride = db.rides.insert({
    id: uuidv4(),
    passengerId: req.user.id,
    driverId: null,
    pickupAddress, dropoffAddress,
    pickupCoords: pickupCoords || null,
    dropoffCoords: dropoffCoords || null,
    status: 'requested',
    price: 0,
    rating: null,
    ratingComment: '',
    requestedAt: new Date().toISOString(),
    acceptedAt: null,
    completedAt: null,
  });
  io.emit('new_ride_request', ride);
  res.json(ride);
});

app.get('/api/rides', auth, (req, res) => {
  if (req.user.role === 'passenger')
    return res.json(db.rides.find(r => r.passengerId === req.user.id));
  if (req.user.role === 'driver')
    return res.json(db.rides.find(r => r.driverId === req.user.id || r.status === 'requested'));
  res.json(db.rides.all());
});

app.patch('/api/rides/:id/accept', auth, (req, res) => {
  if (req.user.role !== 'driver') return res.status(403).json({ error: 'Drivers only' });
  const ride = db.rides.findOne(r => r.id === req.params.id);
  if (!ride) return res.status(404).json({ error: 'Ride not found' });
  if (ride.status !== 'requested') return res.status(400).json({ error: 'Ride already taken' });
  const updated = db.rides.update(r => r.id === req.params.id, {
    status: 'accepted', driverId: req.user.id, acceptedAt: new Date().toISOString(),
  });
  db.drivers.update(d => d.id === req.user.id, { isAvailable: false });
  io.emit('ride_accepted', updated);
  res.json(updated);
});

app.patch('/api/rides/:id/start', auth, (req, res) => {
  const ride = db.rides.findOne(r => r.id === req.params.id);
  if (!ride || ride.driverId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const updated = db.rides.update(r => r.id === req.params.id, { status: 'in_progress' });
  io.emit('ride_started', updated);
  res.json(updated);
});

app.patch('/api/rides/:id/complete', auth, (req, res) => {
  const ride = db.rides.findOne(r => r.id === req.params.id);
  if (!ride || ride.driverId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const updated = db.rides.update(r => r.id === req.params.id, {
    status: 'completed', completedAt: new Date().toISOString(),
  });
  const driver = db.drivers.findOne(d => d.id === req.user.id);
  if (driver) db.drivers.update(d => d.id === req.user.id, {
    isAvailable: true, totalRides: driver.totalRides + 1,
  });
  io.emit('ride_completed', updated);
  res.json(updated);
});

app.patch('/api/rides/:id/cancel', auth, (req, res) => {
  const ride = db.rides.findOne(r => r.id === req.params.id);
  if (!ride) return res.status(404).json({ error: 'Not found' });
  const updated = db.rides.update(r => r.id === req.params.id, { status: 'cancelled' });
  if (ride.driverId) db.drivers.update(d => d.id === ride.driverId, { isAvailable: true });
  io.emit('ride_cancelled', updated);
  res.json(updated);
});

// ── Rating ────────────────────────────────────────────────────────────────────
app.post('/api/rides/:id/rate', auth, (req, res) => {
  if (req.user.role !== 'passenger') return res.status(403).json({ error: 'Passengers only' });
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });

  const ride = db.rides.findOne(r => r.id === req.params.id);
  if (!ride) return res.status(404).json({ error: 'Ride not found' });
  if (ride.passengerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (ride.status !== 'completed') return res.status(400).json({ error: 'Can only rate completed rides' });
  if (ride.rating) return res.status(400).json({ error: 'Already rated' });

  const updated = db.rides.update(r => r.id === req.params.id, {
    rating, ratingComment: comment || '',
  });

  // Recalculate driver average rating
  const driver = db.drivers.findOne(d => d.id === ride.driverId);
  if (driver) {
    const prevCount = driver.ratingCount || 0;
    const prevRating = driver.rating || 5;
    const newCount = prevCount + 1;
    const newRating = ((prevRating * prevCount) + rating) / newCount;
    db.drivers.update(d => d.id === driver.id, {
      rating: Math.round(newRating * 10) / 10,
      ratingCount: newCount,
    });
  }
  io.emit('ride_rated', updated);
  res.json(updated);
});

// ── Admin ─────────────────────────────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  if (req.body.key !== ADMIN_KEY) return res.status(403).json({ error: 'Wrong admin key' });
  res.json({ key: ADMIN_KEY });
});

app.get('/api/admin/stats', adminAuth, (_req, res) => {
  const allRides = db.rides.all();
  res.json({
    totalPassengers: db.passengers.all().length,
    totalDrivers:    db.drivers.all().length,
    totalRides:      allRides.length,
    byStatus: {
      requested:   allRides.filter(r => r.status === 'requested').length,
      accepted:    allRides.filter(r => r.status === 'accepted').length,
      in_progress: allRides.filter(r => r.status === 'in_progress').length,
      completed:   allRides.filter(r => r.status === 'completed').length,
      cancelled:   allRides.filter(r => r.status === 'cancelled').length,
    },
    onlineDrivers:    db.drivers.find(d => d.isOnline).length,
    availableDrivers: db.drivers.find(d => d.isOnline && d.isAvailable).length,
  });
});

app.get('/api/admin/passengers', adminAuth, (_req, res) => {
  res.json(db.passengers.all().map(safe));
});

app.get('/api/admin/drivers', adminAuth, (_req, res) => {
  res.json(db.drivers.all().map(safe));
});

app.get('/api/admin/rides', adminAuth, (_req, res) => {
  const allRides = db.rides.all();
  const allPassengers = db.passengers.all();
  const allDrivers    = db.drivers.all();
  const enriched = allRides.map(ride => ({
    ...ride,
    passengerName: allPassengers.find(p => p.id === ride.passengerId)?.name || 'Unknown',
    driverName:    allDrivers.find(d => d.id === ride.driverId)?.name    || '—',
  }));
  res.json(enriched.slice().reverse());
});

app.delete('/api/admin/rides/:id', adminAuth, (req, res) => {
  db.rides.remove(r => r.id === req.params.id);
  res.json({ ok: true });
});

// ── Socket.IO ─────────────────────────────────────────────────────────────────
io.on('connection', socket => {
  socket.on('driver_location', ({ driverId, location }) => {
    db.drivers.update(d => d.id === driverId, { location });
    io.emit('driver_location_update', { driverId, location });
  });
  socket.on('driver_online', ({ driverId }) => {
    db.drivers.update(d => d.id === driverId, { isOnline: true });
    io.emit('driver_status_change', { driverId, isOnline: true });
  });
  socket.on('driver_offline', ({ driverId }) => {
    db.drivers.update(d => d.id === driverId, { isOnline: false, isAvailable: true });
    io.emit('driver_status_change', { driverId, isOnline: false });
  });

  // ── Chat ──────────────────────────────────────────────────────────────────
  socket.on('join_ride_chat', ({ rideId }) => {
    socket.join(`chat:${rideId}`);
  });
  socket.on('leave_ride_chat', ({ rideId }) => {
    socket.leave(`chat:${rideId}`);
  });
  socket.on('chat_message', ({ rideId, senderId, senderName, senderRole, text }) => {
    const message = {
      id: uuidv4(),
      senderId, senderName, senderRole, text,
      timestamp: new Date().toISOString(),
    };
    io.to(`chat:${rideId}`).emit('chat_message', message);
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log(`DriveFree server on port ${PORT}`));
