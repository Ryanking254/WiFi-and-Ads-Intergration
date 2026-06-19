import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignAPI } from '../services/api';

export default function NewCampaign({ user }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    budget: 1000,
    daily_budget: 100,
    target_url: 'https://example.com',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'budget' || name === 'daily_budget' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (formData.daily_budget > formData.budget) {
        setError('Daily budget cannot exceed total budget');
        setLoading(false);
        return;
      }

      const response = await campaignAPI.create(formData);
      navigate(`/campaign/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Create Campaign</h1>
        <p className="text-slate-400 mt-2">Set up a new advertising campaign</p>
      </div>

      <div className="card">
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Campaign Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="label">Campaign Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Summer Sale Campaign"
                  required
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input-field min-h-24"
                  placeholder="Describe your campaign goals and target audience"
                />
              </div>

              <div>
                <label className="label">Target URL</label>
                <input
                  type="url"
                  name="target_url"
                  value={formData.target_url}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="https://example.com"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Where users will be directed when they click</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Budget</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Total Budget</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    className="input-field pl-7"
                    placeholder="1000"
                    min="10"
                    step="10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Daily Budget</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                  <input
                    type="number"
                    name="daily_budget"
                    value={formData.daily_budget}
                    onChange={handleChange}
                    className="input-field pl-7"
                    placeholder="100"
                    min="1"
                    step="1"
                    required
                  />
                </div>
              </div>
            </div>

            {formData.daily_budget > formData.budget && (
              <p className="text-red-400 text-sm mt-2">⚠️ Daily budget exceeds total budget</p>
            )}

            <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
              <p className="text-slate-300 text-sm">
                Campaign duration: ~{Math.ceil(formData.budget / formData.daily_budget)} days
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Schedule</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">End Date</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-slate-800">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50 text-lg"
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 btn-secondary text-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
