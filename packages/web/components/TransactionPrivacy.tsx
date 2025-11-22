'use client';
import { useState, useEffect } from 'react';

interface PrivacyConfig {
  torRouting: boolean;
  randomizeAmounts: boolean;
  timingDelays: boolean;
  proxyWallets: boolean;
}

export default function TransactionPrivacy() {
  const [config, setConfig] = useState<PrivacyConfig>({
    torRouting: false,
    randomizeAmounts: true,
    timingDelays: true,
    proxyWallets: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/privacy');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && data.settings) {
        setConfig(data.settings);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const savePrivacySettings = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await fetch('/api/privacy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof PrivacyConfig) => {
    setConfig({ ...config, [key]: !config[key] });
    setSuccess(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">🔐 Transaction Privacy</h2>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
          <p className="text-red-400">Error: {error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-900/30 border border-green-500 rounded-lg">
          <p className="text-green-400">Settings saved successfully</p>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg p-6 space-y-4">
        {Object.entries(config).map(([key, value]) => (
          <label key={key} className="flex items-center gap-2 text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={value}
              onChange={() => handleToggle(key as keyof PrivacyConfig)}
              className="w-4 h-4"
            />
            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          </label>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={savePrivacySettings}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
        <button
          onClick={loadPrivacySettings}
          disabled={loading}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50"
        >
          Reload
        </button>
      </div>
    </div>
  );
}
