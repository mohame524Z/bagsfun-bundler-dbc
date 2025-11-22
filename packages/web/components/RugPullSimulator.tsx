'use client';

import { useState } from 'react';

export default function RugPullSimulator() {
  const [simulation, setSimulation] = useState({
    tokenAddress: '',
    rugType: 'liquidity_removal',
    timing: 'immediate',
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">🧪 Rug Pull Simulator</h2>
      <p className="text-gray-400 text-sm">Test your defenses against rug pulls (EDUCATIONAL ONLY)</p>

      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
        <p className="text-red-300 text-sm">
          ⚠️ <strong>EDUCATIONAL TOOL ONLY</strong> - This simulates rug pull scenarios to test your detection and protection systems.
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">Test Token Address</label>
          <input
            type="text"
            value={simulation.tokenAddress}
            onChange={(e) => setSimulation({...simulation, tokenAddress: e.target.value})}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono"
            placeholder="Enter test token address"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">Rug Type</label>
          <select
            value={simulation.rugType}
            onChange={(e) => setSimulation({...simulation, rugType: e.target.value})}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          >
            <option value="liquidity_removal">Liquidity Removal</option>
            <option value="mint_exploit">Mint Exploit</option>
            <option value="freeze_trading">Freeze Trading</option>
          </select>
        </div>

        <button className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
          Run Simulation (Test Mode)
        </button>
      </div>
    </div>
  );
}
