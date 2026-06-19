import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CampaignDetail from './pages/CampaignDetail';
import NewCampaign from './pages/NewCampaign';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import './index.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('dsp_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-slate-950">
      <div className="text-white">Loading...</div>
    </div>;
  }

  return (
    <BrowserRouter>
      {user ? (
        <div className="min-h-screen bg-slate-950">
          <Navbar user={user} setUser={setUser} />
          <div className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/campaign/new" element={<NewCampaign user={user} />} />
              <Route path="/campaign/:id" element={<CampaignDetail user={user} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<Login setUser={setUser} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}
