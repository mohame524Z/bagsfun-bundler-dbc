'use client';

import { useState, useEffect } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

interface WalletInfo {
  address: string;
  privateKey: string;
  solBalance: number;
  tokenCount: number;
  totalValue: number;
  pnl: number;
  status: 'active' | 'empty' | 'funded';
}

export default function WalletManager() {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPrivateKeys, setShowPrivateKeys] = useState(false);

  // Generation
  const [generateCount, setGenerateCount] = useState(12);

  // Import
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  // Fund wallets
  const [fundAmount, setFundAmount] = useState(0.1);
  const [showFund, setShowFund] = useState(false);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/wallets?action=list');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load wallets');
      }

      setWallets(data.wallets || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load wallets');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (generateCount < 1 || generateCount > 100) {
      setError('Please enter a count between 1 and 100');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          count: generateCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate wallets');
      }

      setSuccess(`Successfully generated ${generateCount} wallets!`);
      await loadWallets();
    } catch (err: any) {
      setError(err.message || 'Failed to generate wallets');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      setError('Please enter private keys to import');
      return;
    }

    const privateKeys = importText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (privateKeys.length === 0) {
      setError('No valid private keys found');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import',
          privateKeys,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import wallets');
      }

      setSuccess(`Successfully imported ${privateKeys.length} wallets!`);
      setImportText('');
      setShowImport(false);
      await loadWallets();
    } catch (err: any) {
      setError(err.message || 'Failed to import wallets');
    } finally {
      setLoading(false);
    }
  };

  const handleFund = async () => {
    if (fundAmount <= 0) {
      setError('Fund amount must be greater than 0');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'fund',
          amountPerWallet: fundAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fund wallets');
      }

      setSuccess(`Successfully funded ${data.funded} wallets with ${fundAmount} SOL each!`);
      setShowFund(false);
      await loadWallets();
    } catch (err: any) {
      setError(err.message || 'Failed to fund wallets');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = wallets.map(w => w.privateKey).join('\n');
    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bundle-wallets.txt';
    a.click();
    URL.revokeObjectURL(url);
    setSuccess('Wallets exported successfully!');
  };

  const handleClearEmpty = async () => {
    if (!confirm('Are you sure you want to remove all empty wallets?')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clearEmpty',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear empty wallets');
      }

      setSuccess(`Removed ${data.removed} empty wallets!`);
      await loadWallets();
    } catch (err: any) {
      setError(err.message || 'Failed to clear empty wallets');
    } finally {
      setLoading(false);
    }
  };

  const totalSOL = wallets.reduce((sum, w) => sum + w.solBalance, 0);
  const totalValue = wallets.reduce((sum, w) => sum + w.totalValue, 0);
  const totalPnL = wallets.reduce((sum, w) => sum + w.pnl, 0);
  const activeWallets = wallets.filter(w => w.status === 'active').length;
  const emptyWallets = wallets.filter(w => w.status === 'empty').length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Wallets</div>
          <div className="text-2xl font-bold text-white">{wallets.length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Active</div>
          <div className="text-2xl font-bold text-green-400">{activeWallets}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Empty</div>
          <div className="text-2xl font-bold text-gray-500">{emptyWallets}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total SOL</div>
          <div className="text-2xl font-bold text-cyan-400">{totalSOL.toFixed(4)}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total PnL</div>
          <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(4)} SOL
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">👛 Wallet Management</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-500 rounded-lg">
            <p className="text-red-400">❌ {error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-900/30 border border-green-500 rounded-lg">
            <p className="text-green-400">✅ {success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Generate */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-300">Generate Wallets</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={generateCount}
                onChange={(e) => setGenerateCount(parseInt(e.target.value))}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                min="1"
                max="100"
              />
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 disabled:opacity-50 text-sm font-medium"
              >
                Generate
              </button>
            </div>
          </div>

          {/* Import */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-300">Import Wallets</label>
            <button
              onClick={() => setShowImport(!showImport)}
              className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm font-medium"
            >
              Import Bulk
            </button>
          </div>

          {/* Fund */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-300">Fund Wallets</label>
            <button
              onClick={() => setShowFund(!showFund)}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium"
            >
              Fund All
            </button>
          </div>

          {/* Export */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-300">Export / Clear</label>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                disabled={wallets.length === 0}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm font-medium"
              >
                Export
              </button>
              <button
                onClick={handleClearEmpty}
                disabled={emptyWallets === 0}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm font-medium"
              >
                Clear Empty
              </button>
            </div>
          </div>
        </div>

        {/* Import Modal */}
        {showImport && (
          <div className="mb-4 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-lg font-bold text-white mb-2">Import Private Keys</h3>
            <p className="text-sm text-gray-400 mb-3">Enter one private key per line (base58 format)</p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm font-mono"
              rows={6}
              placeholder="5J..."
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleImport}
                disabled={loading || !importText.trim()}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 text-sm font-medium"
              >
                Import
              </button>
              <button
                onClick={() => setShowImport(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Fund Modal */}
        {showFund && (
          <div className="mb-4 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-lg font-bold text-white mb-2">Fund All Wallets</h3>
            <p className="text-sm text-gray-400 mb-3">
              Distribute SOL from main wallet to all bundle wallets
            </p>
            <div className="flex gap-2 items-center mb-3">
              <label className="text-sm text-gray-300">Amount per wallet:</label>
              <input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(parseFloat(e.target.value))}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                step="0.01"
                min="0.01"
              />
              <span className="text-sm text-gray-400">SOL</span>
            </div>
            <p className="text-sm text-yellow-400 mb-3">
              Total needed: {(fundAmount * wallets.length).toFixed(4)} SOL (+ fees)
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleFund}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm font-medium"
              >
                Fund Now
              </button>
              <button
                onClick={() => setShowFund(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Refresh & Toggle */}
        <div className="flex gap-2">
          <button
            onClick={loadWallets}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-50 text-sm font-medium"
          >
            {loading ? 'Loading...' : '↻ Refresh'}
          </button>
          <button
            onClick={() => setShowPrivateKeys(!showPrivateKeys)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm font-medium"
          >
            {showPrivateKeys ? '🔒 Hide Keys' : '🔓 Show Keys'}
          </button>
        </div>
      </div>

      {/* Wallet List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Address</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">SOL Balance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Tokens</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">PnL</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                {showPrivateKeys && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Private Key</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {wallets.length === 0 ? (
                <tr>
                  <td colSpan={showPrivateKeys ? 8 : 7} className="px-4 py-8 text-center text-gray-400">
                    No wallets found. Generate or import wallets to get started.
                  </td>
                </tr>
              ) : (
                wallets.map((wallet, index) => (
                  <tr key={wallet.address} className="hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm text-gray-400">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-mono text-cyan-400">
                      {wallet.address.slice(0, 4)}...{wallet.address.slice(-4)}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {wallet.solBalance.toFixed(4)} SOL
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{wallet.tokenCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {wallet.totalValue.toFixed(4)} SOL
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium ${
                      wallet.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {wallet.pnl >= 0 ? '+' : ''}{wallet.pnl.toFixed(4)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        wallet.status === 'active' ? 'bg-green-900/30 text-green-400' :
                        wallet.status === 'funded' ? 'bg-blue-900/30 text-blue-400' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {wallet.status}
                      </span>
                    </td>
                    {showPrivateKeys && (
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">
                        {wallet.privateKey.slice(0, 8)}...
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
