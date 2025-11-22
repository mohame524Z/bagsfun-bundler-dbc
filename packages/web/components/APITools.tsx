'use client';

import { useState } from 'react';

export default function APITools() {
  const [apiKey, setApiKey] = useState('••••••••••••••••');
  const [endpoints] = useState([
    { method: 'POST', path: '/api/v1/bundle/create', desc: 'Create token bundle' },
    { method: 'GET', path: '/api/v1/portfolio', desc: 'Get portfolio data' },
    { method: 'POST', path: '/api/v1/sniper/start', desc: 'Start sniper bot' },
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">🔌 API for External Tools</h2>
      <p className="text-gray-400 text-sm">Integrate with external applications</p>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-white font-bold mb-4">API Key</h3>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            readOnly
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono"
          />
          <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
            Regenerate
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-white font-bold mb-4">Available Endpoints</h3>
        <div className="space-y-2">
          {endpoints.map((endpoint, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-700 rounded">
              <span className={`px-2 py-1 rounded text-xs font-mono ${
                endpoint.method === 'GET' ? 'bg-blue-600' : 'bg-green-600'
              } text-white`}>
                {endpoint.method}
              </span>
              <code className="text-cyan-400 font-mono text-sm">{endpoint.path}</code>
              <span className="text-gray-400 text-sm ml-auto">{endpoint.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
