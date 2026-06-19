import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('dsp_user');
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">DSP</span>
          </div>
          <span className="text-xl font-bold text-white">AdFlow</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/" className="text-slate-300 hover:text-white transition-colors">
            Campaigns
          </Link>
          <Link to="/campaign/new" className="btn-primary">
            New Campaign
          </Link>
          <div className="flex items-center gap-4 pl-4 border-l border-slate-800">
            <div className="text-right">
              <p className="text-sm text-white font-medium">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.company}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
