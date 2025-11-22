'use client';
import { useState } from 'react';

export default function TransactionPrivacy() {
  const [config, setConfig] = useState({
    useTorRouting: false,
    randomizeAmounts: true,
    delayTransactions: true,
    useProxyWallets: false,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">🔐 Transaction Privacy</h2>
      <div className="bg-gray-800 rounded-lg p-6 space-y-4">
        {Object.entries(config).map(([key, value]) => (
          <label key={key} className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => setConfig({...config, [key]: e.target.checked})}
              className="w-4 h-4"
            />
            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          </label>
        ))}
      </div>
    </div>
  );
}
