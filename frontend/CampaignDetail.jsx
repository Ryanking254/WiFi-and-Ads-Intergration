import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { campaignAPI, adAPI } from '../services/api';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function CampaignDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [ads, setAds] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewAdForm, setShowNewAdForm] = useState(false);
  const [newAd, setNewAd] = useState({
    title: '',
    description: '',
    cta_text: 'Learn More',
    cta_url: 'https://example.com',
    format: 'banner',
    width: 728,
    height: 90
  });

  useEffect(() => {
    loadCampaignData();
  }, [id]);

  const loadCampaignData = async () => {
    try {
      setLoading(true);
      const [campRes, adsRes, analyticsRes] = await Promise.all([
        campaignAPI.get(id),
        adAPI.list(id),
        campaignAPI.analytics(id, 7)
      ]);

      setCampaign(campRes.data);
      setAds(adsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error(err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAd = async (e) => {
    e.preventDefault();
    try {
      await adAPI.create(id, newAd);
      setNewAd({
        title: '',
        description: '',
        cta_text: 'Learn More',
        cta_url: 'https://example.com',
        format: 'banner',
        width: 728,
        height: 90
      });
      setShowNewAdForm(false);
      loadCampaignData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      await campaignAPI.update(id, { status });
      setCampaign(prev => ({ ...prev, status }));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-slate-400">Loading campaign...</div>;
  }

  if (!campaign) {
    return <div className="text-slate-400">Campaign not found</div>;
  }

  // Prepare chart data
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: { color: '#cbd5e1' }
      }
    },
    scales: {
      y: {
        ticks: { color: '#cbd5e1' },
        grid: { color: '#1e293b' }
      },
      x: {
        ticks: { color: '#cbd5e1' },
        grid: { color: '#1e293b' }
      }
    }
  };

  const dailyData = {
    labels: (analytics?.daily_stats || []).map(d => d.date),
    datasets: [
      {
        label: 'Impressions',
        data: (analytics?.daily_stats || []).map(d => d.impressions),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Clicks',
        data: (analytics?.daily_stats || []).map(d => d.clicks),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      }
    ]
  };

  const adData = {
    labels: (analytics?.ad_performance || []).map(a => a.title.substring(0, 20)),
    datasets: [
      {
        label: 'Impressions',
        data: (analytics?.ad_performance || []).map(a => a.impressions),
        backgroundColor: '#3b82f6'
      },
      {
        label: 'Clicks',
        data: (analytics?.ad_performance || []).map(a => a.clicks),
        backgroundColor: '#10b981'
      }
    ]
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{campaign.name}</h1>
          <p className="text-slate-400 mt-1">{campaign.description}</p>
          <div className="flex items-center gap-4 mt-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              campaign.status === 'active' ? 'bg-green-900/30 text-green-200 border border-green-700' :
              campaign.status === 'paused' ? 'bg-yellow-900/30 text-yellow-200 border border-yellow-700' :
              campaign.status === 'draft' ? 'bg-slate-700 text-slate-200' :
              'bg-blue-900/30 text-blue-200 border border-blue-700'
            }`}>
              {campaign.status}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {campaign.status !== 'active' && (
            <button
              onClick={() => handleUpdateStatus('active')}
              className="btn-primary"
            >
              Launch
            </button>
          )}
          {campaign.status === 'active' && (
            <button
              onClick={() => handleUpdateStatus('paused')}
              className="btn-secondary"
            >
              Pause
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="btn-secondary"
          >
            Back
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-slate-400 text-sm mb-1">Total Budget</p>
          <p className="text-2xl font-bold text-white">${campaign.budget.toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm mb-1">Spent</p>
          <p className="text-2xl font-bold text-blue-400">${campaign.spent.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {campaign.budget > 0 ? ((campaign.spent / campaign.budget) * 100).toFixed(1) : 0}%
          </p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm mb-1">Impressions</p>
          <p className="text-2xl font-bold text-white">{analytics?.impressions || 0}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm mb-1">CTR</p>
          <p className="text-2xl font-bold text-green-400">{analytics?.ctr || 0}%</p>
          <p className="text-xs text-slate-500 mt-1">{analytics?.clicks || 0} clicks</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-bold text-white mb-4">Daily Performance (Last 7 days)</h3>
          <Line data={dailyData} options={chartOptions} height={300} />
        </div>

        <div className="card">
          <h3 className="text-lg font-bold text-white mb-4">Ad Performance</h3>
          <Bar data={adData} options={chartOptions} height={300} />
        </div>
      </div>

      {/* Ads Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Ads ({ads.length})</h2>
          <button
            onClick={() => setShowNewAdForm(!showNewAdForm)}
            className="btn-primary"
          >
            {showNewAdForm ? 'Cancel' : '+ Add Ad'}
          </button>
        </div>

        {/* New Ad Form */}
        {showNewAdForm && (
          <form onSubmit={handleCreateAd} className="mb-6 p-4 bg-slate-800/50 rounded-lg space-y-4 border border-slate-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Ad Title</label>
                <input
                  type="text"
                  value={newAd.title}
                  onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                  className="input-field"
                  placeholder="Eye-catching headline"
                  required
                />
              </div>
              <div>
                <label className="label">Format</label>
                <select
                  value={newAd.format}
                  onChange={(e) => setNewAd({ ...newAd, format: e.target.value })}
                  className="input-field"
                >
                  <option value="banner">Banner (728x90)</option>
                  <option value="rectangle">Rectangle (300x250)</option>
                  <option value="native">Native (320x480)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                value={newAd.description}
                onChange={(e) => setNewAd({ ...newAd, description: e.target.value })}
                className="input-field min-h-20"
                placeholder="Ad description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">CTA Text</label>
                <input
                  type="text"
                  value={newAd.cta_text}
                  onChange={(e) => setNewAd({ ...newAd, cta_text: e.target.value })}
                  className="input-field"
                  placeholder="Button text"
                />
              </div>
              <div>
                <label className="label">CTA URL</label>
                <input
                  type="url"
                  value={newAd.cta_url}
                  onChange={(e) => setNewAd({ ...newAd, cta_url: e.target.value })}
                  className="input-field"
                  placeholder="https://example.com"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full">
              Create Ad
            </button>
          </form>
        )}

        {/* Ads List */}
        {ads.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No ads yet. Create one to get started.</p>
        ) : (
          <div className="space-y-3">
            {ads.map((ad) => (
              <div key={ad.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{ad.title}</h4>
                    <p className="text-slate-400 text-sm mt-1">{ad.description}</p>
                    <div className="flex gap-4 mt-3 text-sm">
                      <span className="text-slate-400">Impressions: <span className="text-white font-medium">{ad.impressions}</span></span>
                      <span className="text-slate-400">Clicks: <span className="text-white font-medium">{ad.clicks}</span></span>
                      <span className="text-slate-400">CTR: <span className="text-white font-medium">
                        {ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : 0}%
                      </span></span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    ad.status === 'active' ? 'bg-green-900/30 text-green-200' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {ad.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
