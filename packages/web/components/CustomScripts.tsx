'use client';

import { useState } from 'react';

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
  const [scripts, setScripts] = useState<CustomScript[]>([
    { id: '1', name: 'Auto Snipe New Pairs', enabled: true, code: '// Script code', trigger: 'event', runs: 45 },
    { id: '2', name: 'Rebalance Portfolio Daily', enabled: false, code: '// Script code', trigger: 'interval', interval: 86400, runs: 12 },
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">⚙️ Custom Scripts</h2>
      <p className="text-gray-400 text-sm">Automate custom workflows with JavaScript</p>

      <div className="space-y-3">
        {scripts.map((script) => (
          <div key={script.id} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
            <div>
              <h3 className="text-white font-medium">{script.name}</h3>
              <p className="text-sm text-gray-400">
                {script.runs} executions • {script.trigger} trigger
              </p>
            </div>
            <button
              className={`px-4 py-2 rounded font-medium ${
                script.enabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
              }`}
            >
              {script.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
