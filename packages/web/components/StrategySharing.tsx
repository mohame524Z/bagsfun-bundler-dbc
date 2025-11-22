'use client';

import { useState, useEffect } from 'react';

interface SharedStrategy {
  id: string;
  name: string;
  author: string;
  rating: number;
  downloads: number;
  description: string;
  category: string;
}

export default function StrategySharing() {
  const [strategies, setStrategies] = useState<SharedStrategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [categories] = useState(['Sniper', 'Volume', 'Market Making', 'Arbitrage']);

  useEffect(() => {
    loadStrategies();
  }, [categoryFilter]);

  const loadStrategies = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      const response = await fetch(`/api/strategies?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: SharedStrategy[] = await response.json();
      setStrategies(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load strategies');
    } finally {
      setLoading(false);
    }
  };

  const uploadStrategy = async () => {
    setUploading(true);
    setError(null);
    try {
      const response = await fetch('/api/strategies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'upload',
          // In a real implementation, this would come from a form
          strategy: {
            name: 'New Strategy',
            description: 'Strategy description',
            category: 'Sniper',
          },
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await loadStrategies();
    } catch (err: any) {
      setError(err.message || 'Failed to upload strategy');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">🔄 Strategy Sharing</h2>
          <p className="text-gray-400 text-sm">Share and discover winning strategies</p>
        </div>
        <button
          onClick={uploadStrategy}
          disabled={uploading || loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload Strategy'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
          <p className="text-red-400">Error: {error}</p>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              categoryFilter === 'all' ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                categoryFilter === cat ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading strategies...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategies.map((strategy) => (
            <div key={strategy.id} className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-white font-bold">{strategy.name}</h3>
                  <p className="text-sm text-gray-400">by {strategy.author}</p>
                </div>
                <span className="px-2 py-1 bg-purple-900/30 text-purple-400 rounded text-xs">
                  {strategy.category}
                </span>
              </div>
              <p className="text-gray-300 text-sm mb-4">{strategy.description}</p>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-yellow-400">⭐ {strategy.rating}</span>
                  <span className="text-gray-400">{strategy.downloads} downloads</span>
                </div>
                <button className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 text-sm">
                  Import
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {strategies.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-400">
          No strategies found in this category
        </div>
      )}
    </div>
  );
}
