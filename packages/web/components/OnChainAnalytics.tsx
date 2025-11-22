'use client';

import { useState } from 'react';

export default function OnChainAnalytics() {
  const [metrics] = useState({
    totalTransactions: 1234,
    uniqueTokens: 45,
    avgGasSpent: 0.0023,
    onChainProfit: 15.4,
    smartContractInteractions: 678,
    uniqueCounterparties: 89,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">⛓️ On-Chain Analytics</h2>
      <p className="text-gray-400 text-sm">Deep on-chain data analysis</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Transactions</div>
          <div className="text-2xl font-bold text-white">{metrics.totalTransactions}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Unique Tokens</div>
          <div className="text-2xl font-bold text-cyan-400">{metrics.uniqueTokens}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Avg Gas Spent</div>
          <div className="text-2xl font-bold text-orange-400">{metrics.avgGasSpent} SOL</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">On-Chain Profit</div>
          <div className="text-2xl font-bold text-green-400">+{metrics.onChainProfit} SOL</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Contract Calls</div>
          <div className="text-2xl font-bold text-purple-400">{metrics.smartContractInteractions}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Counterparties</div>
          <div className="text-2xl font-bold text-blue-400">{metrics.uniqueCounterparties}</div>
        </div>
      </div>
    </div>
  );
}
