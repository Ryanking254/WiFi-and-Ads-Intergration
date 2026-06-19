import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { campaignAPI } from '../services/api';

export default function Dashboard({ user }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await campaignAPI.list();
      setCampaigns(response.data);
    } catch (err) {
      setError('Failed to load campaigns');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-900/30 text-green-200 border border-green-700';
      case 'paused':
        return 'bg-yellow-900/30 text-yellow-200 border border-yellow-700';
      case 'draft':
        return 'bg-slate-700 text-slate-200 border border-slate-600';
      case 'completed':
        return 'bg-blue-900/30 text-blue-200 border border-blue-700';
      default:
        return '';
    }
  };

  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + (c.total_impressions || 0), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.total_clicks || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Campaigns</h1>
          <p className="text-slate-400 mt-2">Manage and monitor your advertising campaigns</p>
        </div>
        <Link to="/campaign/new" className="btn-primary text-lg">
          + New Campaign
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-slate-400 text-sm mb-2">Total Budget</p>
          <p className="text-3xl font-bold text-white">${totalBudget.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-2">Allocated</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm mb-2">Spent</p>
          <p className="text-3xl font-bold text-blue-400">${totalSpent.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-2">
            {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}% of budget
          </p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm mb-2">Impressions</p>
          <p className="text-3xl font-bold text-white">{totalImpressions.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-2">Ad views</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm mb-2">Clicks</p>
          <p className="text-3xl font-bold text-green-400">{totalClicks.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-2">
            CTR: {totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0}%
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          {error}
        </div>
      )}

      <div className="card">
        <h2 className="text-xl font-bold text-white mb-6">All Campaigns</h2>

        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-4">No campaigns yet</p>
            <Link to="/campaign/new" className="btn-primary">
              Create your first campaign
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Campaign</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Budget</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Spent</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Impressions</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Clicks</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-white font-medium">{campaign.name}</p>
                        <p className="text-slate-500 text-sm">{campaign.description}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-white">
                      ${campaign.budget.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-blue-400">
                      ${campaign.spent.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-white">
                      {(campaign.total_impressions || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-white">
                      {(campaign.total_clicks || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      <Link
                        to={`/campaign/${campaign.id}`}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
