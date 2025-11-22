'use client';

import { useState } from 'react';
import { PumpMode, StealthMode } from '@pump-bundler/types';

export default function TokenCreator({ mode }: { mode: PumpMode }) {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    twitter: '',
    telegram: '',
    website: '',
    image: null as File | null,
    buyAmount: 0.1,
    walletCount: 12,
    stealthMode: StealthMode.HYBRID,
    firstBundlePercent: 70,
    jitoEnabled: true,
    jitoTip: 0.005,
    priorityFee: 200000,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Convert image to base64
      let imageBase64 = '';
      if (formData.image) {
        const reader = new FileReader();
        imageBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(formData.image!);
        });
      }

      const response = await fetch('/api/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          image: imageBase64,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create token');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800/50 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6">🚀 Create & Bundle Token</h2>

        {result && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-500 rounded-lg">
            <h3 className="text-lg font-bold text-green-400 mb-2">✅ Token Created Successfully!</h3>
            <div className="space-y-1 text-sm">
              <p className="text-white"><span className="text-gray-400">Token Address:</span> <span className="font-mono text-cyan-400">{result.tokenAddress}</span></p>
              <p className="text-white"><span className="text-gray-400">Transactions:</span> {result.transactions}</p>
              <p className="text-white"><span className="text-gray-400">Success Rate:</span> {(result.successRate * 100).toFixed(1)}%</p>
              <p className="text-white"><span className="text-gray-400">Avg Confirmation:</span> {result.averageConfirmationTime.toFixed(0)}ms</p>
              <p className="text-white"><span className="text-gray-400">Stealth Mode:</span> {result.mode}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg">
            <p className="text-red-400">❌ {error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Token Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Token Name *
              </label>
              <input
                type="text"
                placeholder="My Awesome Token"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Symbol *
              </label>
              <input
                type="text"
                placeholder="AWESOME"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              placeholder="Describe your token..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Twitter
              </label>
              <input
                type="url"
                placeholder="https://x.com/..."
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Telegram
              </label>
              <input
                type="url"
                placeholder="https://t.me/..."
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                value={formData.telegram}
                onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Website
              </label>
              <input
                type="url"
                placeholder="https://..."
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Token Image *
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-700 border-dashed rounded-lg cursor-pointer bg-gray-900 hover:bg-gray-800">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {formData.image ? (
                    <div className="text-center">
                      <p className="text-sm text-green-400 mb-2">✓ {formData.image.name}</p>
                      <p className="text-xs text-gray-500">Click to change</p>
                    </div>
                  ) : (
                    <>
                      <svg
                        className="w-12 h-12 mb-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="mb-2 text-sm text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 800x800px)</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                  required
                />
              </label>
            </div>
          </div>

          {/* Bundle Settings */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-bold text-white mb-4">Bundle Settings</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bundler Wallets
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  value={formData.walletCount}
                  onChange={(e) => setFormData({ ...formData, walletCount: parseInt(e.target.value) })}
                  min={1}
                  max={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Buy Amount per Wallet (SOL)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  value={formData.buyAmount}
                  onChange={(e) => setFormData({ ...formData, buyAmount: parseFloat(e.target.value) })}
                  min={0.01}
                />
              </div>
            </div>
          </div>

          {/* Anti-MEV & Stealth Settings */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-bold text-white mb-4">🥷 Anti-MEV & Stealth Settings</h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stealth Mode
                </label>
                <select
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  value={formData.stealthMode}
                  onChange={(e) => setFormData({ ...formData, stealthMode: e.target.value as StealthMode })}
                >
                  <option value={StealthMode.NONE}>NONE - Atomic Jito (fastest, 1 block, detectable, MEV protected)</option>
                  <option value={StealthMode.HYBRID}>HYBRID - 70% atomic + 30% spread (BEST - MEV protected + organic) [Recommended]</option>
                  <option value={StealthMode.LIGHT}>LIGHT - 2-block spread (fast, some MEV risk)</option>
                  <option value={StealthMode.MEDIUM}>MEDIUM - 3-block spread (balanced, moderate MEV risk)</option>
                  <option value={StealthMode.AGGRESSIVE}>AGGRESSIVE - 4-5 block spread (slowest, HIGH MEV risk)</option>
                </select>

                {formData.stealthMode === StealthMode.HYBRID && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      First Bundle Percentage (MEV Protected): {formData.firstBundlePercent}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="90"
                      step="5"
                      className="w-full"
                      value={formData.firstBundlePercent}
                      onChange={(e) => setFormData({ ...formData, firstBundlePercent: parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {formData.firstBundlePercent}% of wallets in atomic bundle (MEV protected), {100 - formData.firstBundlePercent}% spread for organic appearance
                    </p>
                  </div>
                )}

                {[StealthMode.LIGHT, StealthMode.MEDIUM, StealthMode.AGGRESSIVE].includes(formData.stealthMode as StealthMode) && (
                  <div className="mt-2 p-3 bg-yellow-900/20 border border-yellow-500/50 rounded-lg">
                    <p className="text-xs text-yellow-400">
                      ⚠️ Warning: Multi-block modes have MEV risk. Bots may front-run later transactions.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="w-5 h-5 bg-gray-900 border border-gray-700 rounded focus:ring-purple-500"
                      checked={formData.jitoEnabled}
                      onChange={(e) => setFormData({ ...formData, jitoEnabled: e.target.checked })}
                    />
                    <span className="text-sm font-medium text-gray-300">Enable Jito Bundling</span>
                  </label>
                  {formData.jitoEnabled && (
                    <div className="mt-2 ml-7">
                      <label className="block text-xs text-gray-400 mb-1">Jito Tip (SOL)</label>
                      <input
                        type="number"
                        step="0.001"
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:border-purple-500 focus:outline-none"
                        value={formData.jitoTip}
                        onChange={(e) => setFormData({ ...formData, jitoTip: parseFloat(e.target.value) })}
                        min={0.001}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Priority Fee (microLamports)
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    value={formData.priorityFee}
                    onChange={(e) => setFormData({ ...formData, priorityFee: parseInt(e.target.value) })}
                    min={1000}
                  />
                  <p className="text-xs text-gray-400 mt-1">Recommended: 200,000+ for anti-MEV</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 ${
              loading
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creating Token...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Create & Bundle Token</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
