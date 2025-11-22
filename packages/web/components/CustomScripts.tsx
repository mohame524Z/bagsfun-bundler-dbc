'use client';

import { useState, useEffect } from 'react';

interface CustomScript {
  id: string;
  name: string;
  enabled: boolean;
  code: string;
  trigger: 'manual' | 'interval' | 'event';
  interval?: number;
  runs: number;
  lastRun?: number;
}

export default function CustomScripts() {
  const [scripts, setScripts] = useState<CustomScript[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);

  useEffect(() => {
    loadScripts();
  }, []);

  const loadScripts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/scripts');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: CustomScript[] = await response.json();
      setScripts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load scripts');
    } finally {
      setLoading(false);
    }
  };

  const executeScript = async (scriptId: string) => {
    setExecuting(scriptId);
    setError(null);
    try {
      const response = await fetch('/api/scripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'execute',
          scriptId,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Reload scripts to get updated run count
      await loadScripts();
    } catch (err: any) {
      setError(err.message || 'Failed to execute script');
    } finally {
      setExecuting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">⚙️ Custom Scripts</h2>
          <p className="text-gray-400 text-sm">Automate custom workflows with JavaScript</p>
        </div>
        <button
          onClick={loadScripts}
          disabled={loading}
          className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
          <p className="text-red-400">Error: {error}</p>
        </div>
      )}

      <div className="space-y-3">
        {scripts.map((script) => (
          <div key={script.id} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
            <div>
              <h3 className="text-white font-medium">{script.name}</h3>
              <p className="text-sm text-gray-400">
                {script.runs} executions • {script.trigger} trigger
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => executeScript(script.id)}
                disabled={executing === script.id || !script.enabled}
                className={`px-4 py-2 rounded font-medium ${
                  script.enabled
                    ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                    : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                }`}
              >
                {executing === script.id ? 'Executing...' : 'Execute'}
              </button>
              <button
                className={`px-4 py-2 rounded font-medium ${
                  script.enabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                }`}
              >
                {script.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {scripts.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-400">
          No scripts found. Create one to get started.
        </div>
      )}
    </div>
  );
}
