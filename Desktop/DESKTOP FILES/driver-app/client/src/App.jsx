import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PassengerRegister from './pages/passenger/PassengerRegister';
import PassengerLogin from './pages/passenger/PassengerLogin';
import PassengerDashboard from './pages/passenger/PassengerDashboard';
import DriverRegister from './pages/driver/DriverRegister';
import DriverLogin from './pages/driver/DriverLogin';
import DriverDashboard from './pages/driver/DriverDashboard';
import DriversListing from './pages/DriversListing';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

function ProtectedRoute({ children, requiredRole }) {
  const { user, role } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/drivers" element={<DriversListing />} />
        <Route path="/passenger/register" element={<PassengerRegister />} />
        <Route path="/passenger/login" element={<PassengerLogin />} />
        <Route path="/passenger/dashboard" element={
          <ProtectedRoute requiredRole="passenger"><PassengerDashboard /></ProtectedRoute>
        } />
        <Route path="/driver/register" element={<DriverRegister />} />
        <Route path="/driver/login" element={<DriverLogin />} />
        <Route path="/driver/dashboard" element={
          <ProtectedRoute requiredRole="driver"><DriverDashboard /></ProtectedRoute>
        } />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
