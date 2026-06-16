import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, LogOut, User, LayoutDashboard, Shield } from 'lucide-react';

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-green-500 rounded-xl p-2">
            <Car className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold text-gray-900">Drive<span className="text-green-500">Free</span></span>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">100% Free</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/drivers" className="text-sm text-gray-600 hover:text-green-600 font-medium hidden sm:block">All Drivers</Link>
          <Link to="/admin" className="text-gray-400 hover:text-gray-600 hidden sm:block" title="Admin">
            <Shield size={16} />
          </Link>
          {user ? (
            <>
              <Link
                to={role === 'driver' ? '/driver/dashboard' : '/passenger/dashboard'}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 font-medium"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-xl">
                <User size={14} className="text-green-500" />
                <span>{user.name}</span>
                <span className="text-xs text-gray-400 capitalize">({role})</span>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 font-medium">
                <LogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/passenger/login" className="text-sm text-gray-600 hover:text-green-600 font-medium">Passenger Login</Link>
              <Link to="/driver/login" className="text-sm bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 font-medium">Driver Login</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
