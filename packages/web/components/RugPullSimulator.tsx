'use client';

import { useState } from 'react';

interface SimulationResult {
  success: boolean;
  tokenAddress: string;
  simulationType: string;
  detectTime: number;
  protectionTriggered: boolean;
  message: string;
}

export default function RugPullSimulator() {
  const [simulation, setSimulation] = useState({
    tokenAddress: '',
    rugType: 'liquidity_removal',
    timing: 'immediate',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/rugsim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          simulationType: simulation.rugType,
          params: {
            tokenAddress: simulation.tokenAddress,
            timing: simulation.timing,
          },
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: SimulationResult = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to run simulation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">🧪 Rug Pull Simulator</h2>
      <p className="text-gray-400 text-sm">Test your defenses against rug pulls (EDUCATIONAL ONLY)</p>

      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
        <p className="text-red-300 text-sm">
          ⚠️ <strong>EDUCATIONAL TOOL ONLY</strong> - This simulates rug pull scenarios to test your detection and protection systems.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
          <p className="text-red-400">Error: {error}</p>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">Test Token Address</label>
          <input
            type="text"
            value={simulation.tokenAddress}
            onChange={(e) => setSimulation({...simulation, tokenAddress: e.target.value})}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono"
            placeholder="Enter test token address"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">Rug Type</label>
          <select
            value={simulation.rugType}
            onChange={(e) => setSimulation({...simulation, rugType: e.target.value})}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            disabled={loading}
          >
            <option value="liquidity_removal">Liquidity Removal</option>
            <option value="mint_exploit">Mint Exploit</option>
            <option value="freeze_trading">Freeze Trading</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">Timing</label>
          <select
            value={simulation.timing}
            onChange={(e) => setSimulation({...simulation, timing: e.target.value})}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            disabled={loading}
          >
            <option value="immediate">Immediate</option>
            <option value="delayed">Delayed (1 hour)</option>
            <option value="gradual">Gradual (over 24h)</option>
          </select>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading || !simulation.tokenAddress}
          className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Running Simulation...' : 'Run Simulation (Test Mode)'}
        </button>
      </div>

      {result && (
        <div className={`rounded-lg p-6 ${
          result.protectionTriggered ? 'bg-green-900/30 border border-green-500' : 'bg-yellow-900/30 border border-yellow-500'
        }`}>
          <h3 className="text-lg font-bold text-white mb-3">Simulation Results</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Token:</span>
              <span className="text-white font-mono">{result.tokenAddress.slice(0, 10)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Type:</span>
              <span className="text-white">{result.simulationType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Detection Time:</span>
              <span className={result.protectionTriggered ? 'text-green-400' : 'text-yellow-400'}>
                {result.detectTime}ms
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-700">
              <span className="text-gray-300">Protection Status:</span>
              <span className={result.protectionTriggered ? 'text-green-400 font-bold' : 'text-yellow-400 font-bold'}>
                {result.protectionTriggered ? '✓ TRIGGERED' : '✗ NOT TRIGGERED'}
              </span>
            </div>
          </div>
          <p className="text-gray-300 text-sm mt-4">{result.message}</p>
        </div>
      )}
    </div>
  );
}
