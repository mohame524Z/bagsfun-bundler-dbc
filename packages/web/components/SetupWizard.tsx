'use client';

import { useState } from 'react';
import { StealthMode, PumpMode } from '@pump-bundler/types';

interface SetupWizardProps {
  onComplete: () => void;
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    // RPC Configuration
    primaryRpcUrl: 'https://mainnet.helius-rpc.com/?api-key=YOUR_KEY',
    primaryRpcWs: 'wss://mainnet.helius-rpc.com/?api-key=YOUR_KEY',
    addBackupRpc: true,
    backupRpcUrl: 'https://api.mainnet-beta.solana.com',
    backupRpcWs: '',

    // Wallet Configuration
    mainWalletPrivateKey: '',
    walletCount: 12,
    generateWallets: true,

    // Jito Configuration
    jitoEnabled: true,
    jitoTipPreset: 0.005,

    // Stealth Mode
    stealthMode: StealthMode.HYBRID,
    firstBundlePercent: 70,

    // Risk Management
    maxSolPerBundle: 10,
    maxSolPerWallet: 1,
    requireSimulation: true,

    // Mode
    pumpMode: PumpMode.MAYHEM,
  });

  const totalSteps = 5;

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNext = () => {
    setError(null);
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build config object
      const config = {
        mode: formData.pumpMode,
        rpc: {
          endpoints: [
            {
              id: 'primary',
              name: 'Primary RPC',
              url: formData.primaryRpcUrl,
              wsUrl: formData.primaryRpcWs || undefined,
              priority: 1,
              isCustom: false,
              maxRetries: 3,
              timeout: 30000,
              healthCheckInterval: 60000,
            },
            ...(formData.addBackupRpc ? [{
              id: 'backup',
              name: 'Backup RPC',
              url: formData.backupRpcUrl,
              wsUrl: formData.backupRpcWs || undefined,
              priority: 2,
              isCustom: false,
              maxRetries: 3,
              timeout: 30000,
              healthCheckInterval: 60000,
            }] : []),
          ],
          autoFailover: true,
          healthCheckEnabled: true,
          maxFailoverAttempts: 3,
        },
        wallet: {
          mainWalletPrivateKey: formData.mainWalletPrivateKey,
          bundleWallets: [],
          walletCount: formData.walletCount,
          generateWalletsOnStartup: formData.generateWallets,
        },
        jito: {
          enabled: formData.jitoEnabled,
          tipAmount: formData.jitoTipPreset,
          endpoints: [
            'https://mainnet.block-engine.jito.wtf/api/v1/bundles',
            'https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles',
            'https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles',
            'https://ny.mainnet.block-engine.jito.wtf/api/v1/bundles',
            'https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles',
          ],
        },
        stealth: {
          mode: formData.stealthMode,
          firstBundlePercent: formData.firstBundlePercent,
          spreadBlocks: formData.stealthMode === StealthMode.HYBRID ? 3 :
                        formData.stealthMode === StealthMode.LIGHT ? 2 :
                        formData.stealthMode === StealthMode.MEDIUM ? 3 : 5,
          randomizeAmounts: true,
          randomizeTimings: true,
          amountVariance: 15,
          timingVariance: 20,
        },
        risk: {
          maxSolPerBundle: formData.maxSolPerBundle,
          maxSolPerWallet: formData.maxSolPerWallet,
          requireSimulation: formData.requireSimulation,
          maxSlippage: 10,
          stopLossPercent: 50,
          takeProfitPercent: 100,
        },
        sniper: {
          enabled: false,
          filters: {
            minLiquidity: 5,
            maxLiquidity: 100,
            minMarketCap: 10000,
            maxMarketCap: 1000000,
            requireSocials: false,
            blacklistedCreators: [],
            whitelistedCreators: [],
          },
          buyAmount: 0.5,
          maxBuyPerToken: 2,
          autoBuy: false,
        },
        volume: {
          enabled: false,
          targetVolume: 50,
          duration: 60,
          pattern: 'random',
          wallets: [],
          randomization: {
            amountVariance: 20,
            timingVariance: 30,
            priceImpact: 1,
          },
        },
        sellStrategy: {
          type: 'gradual',
          config: {
            duration: 30,
            intervals: 10,
            percentagePerInterval: 10,
            randomizeTimings: true,
          },
        },
      };

      // Save config via API
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save configuration');
      }

      // Success!
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-gray-800 rounded-xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">🚀 Setup Wizard</h1>
          <p className="text-gray-400">Configure your Pump.fun Advanced Bundler</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-400">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-gray-400">{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg">
            <p className="text-red-400">❌ {error}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="mb-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">📡 RPC Configuration</h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Primary RPC URL *
                </label>
                <input
                  type="text"
                  value={formData.primaryRpcUrl}
                  onChange={(e) => handleInputChange('primaryRpcUrl', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="https://mainnet.helius-rpc.com/?api-key=YOUR_KEY"
                />
                <p className="text-xs text-gray-400 mt-1">Recommended: Helius or QuickNode</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Primary WebSocket URL (optional)
                </label>
                <input
                  type="text"
                  value={formData.primaryRpcWs}
                  onChange={(e) => handleInputChange('primaryRpcWs', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="wss://mainnet.helius-rpc.com/?api-key=YOUR_KEY"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.addBackupRpc}
                  onChange={(e) => handleInputChange('addBackupRpc', e.target.checked)}
                  className="mr-2"
                />
                <label className="text-gray-300">Add backup RPC endpoint (recommended)</label>
              </div>

              {formData.addBackupRpc && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Backup RPC URL
                  </label>
                  <input
                    type="text"
                    value={formData.backupRpcUrl}
                    onChange={(e) => handleInputChange('backupRpcUrl', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="https://api.mainnet-beta.solana.com"
                  />
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">🔑 Wallet Configuration</h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Main Wallet Private Key * (base58 format)
                </label>
                <input
                  type="password"
                  value={formData.mainWalletPrivateKey}
                  onChange={(e) => handleInputChange('mainWalletPrivateKey', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Your wallet private key in base58 format"
                />
                <p className="text-xs text-red-400 mt-1">⚠️ Keep this safe! Never share your private key.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Number of Bundle Wallets
                </label>
                <input
                  type="number"
                  value={formData.walletCount}
                  onChange={(e) => handleInputChange('walletCount', parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  min="1"
                  max="50"
                />
                <p className="text-xs text-gray-400 mt-1">Recommended: 12-20 wallets for optimal stealth</p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.generateWallets}
                  onChange={(e) => handleInputChange('generateWallets', e.target.checked)}
                  className="mr-2"
                />
                <label className="text-gray-300">Auto-generate bundle wallets on startup</label>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">⚡ Jito Configuration</h2>

              <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg mb-4">
                <p className="text-sm text-blue-300">
                  💡 Jito bundles provide MEV protection and faster transaction confirmation.
                  Recommended for best results!
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.jitoEnabled}
                  onChange={(e) => handleInputChange('jitoEnabled', e.target.checked)}
                  className="mr-2"
                />
                <label className="text-gray-300">Enable Jito bundling</label>
              </div>

              {formData.jitoEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Jito Tip Amount (SOL)
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {[0.001, 0.005, 0.01].map((tip) => (
                      <button
                        key={tip}
                        onClick={() => handleInputChange('jitoTipPreset', tip)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          formData.jitoTipPreset === tip
                            ? 'bg-cyan-500 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {tip} SOL
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={formData.jitoTipPreset}
                    onChange={(e) => handleInputChange('jitoTipPreset', parseFloat(e.target.value))}
                    step="0.001"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Recommended: 0.005 SOL for competitive priority</p>
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">🎯 Stealth Mode</h2>

              <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg mb-4">
                <p className="text-sm text-purple-300">
                  🥷 Stealth mode helps avoid detection by spreading your bundles across multiple blocks.
                  HYBRID mode is recommended for best balance.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stealth Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { mode: StealthMode.HYBRID, label: 'HYBRID', desc: '70% atomic + 30% spread' },
                    { mode: StealthMode.LIGHT, label: 'Light', desc: '2 blocks spread' },
                    { mode: StealthMode.MEDIUM, label: 'Medium', desc: '3 blocks spread' },
                    { mode: StealthMode.AGGRESSIVE, label: 'Aggressive', desc: '5 blocks spread' },
                  ].map((option) => (
                    <button
                      key={option.mode}
                      onClick={() => handleInputChange('stealthMode', option.mode)}
                      className={`p-4 rounded-lg text-left transition-colors ${
                        formData.stealthMode === option.mode
                          ? 'bg-cyan-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <div className="font-bold">{option.label}</div>
                      <div className="text-xs opacity-80">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {formData.stealthMode === StealthMode.HYBRID && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First Bundle Percentage (Atomic)
                  </label>
                  <input
                    type="range"
                    value={formData.firstBundlePercent}
                    onChange={(e) => handleInputChange('firstBundlePercent', parseInt(e.target.value))}
                    min="50"
                    max="90"
                    step="5"
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>50%</span>
                    <span className="text-cyan-400 font-bold">{formData.firstBundlePercent}%</span>
                    <span>90%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.firstBundlePercent}% in atomic bundle, {100 - formData.firstBundlePercent}% spread
                  </p>
                </div>
              )}
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">🛡️ Risk Management & Mode</h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Pump Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleInputChange('pumpMode', PumpMode.CLASSIC)}
                    className={`p-4 rounded-lg text-left transition-colors ${
                      formData.pumpMode === PumpMode.CLASSIC
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-bold">🎯 Classic</div>
                    <div className="text-xs opacity-80">~60 min to graduate</div>
                  </button>
                  <button
                    onClick={() => handleInputChange('pumpMode', PumpMode.MAYHEM)}
                    className={`p-4 rounded-lg text-left transition-colors ${
                      formData.pumpMode === PumpMode.MAYHEM
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-bold">⚡ Mayhem</div>
                    <div className="text-xs opacity-80">~40 min to graduate</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max SOL per Bundle
                </label>
                <input
                  type="number"
                  value={formData.maxSolPerBundle}
                  onChange={(e) => handleInputChange('maxSolPerBundle', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  min="1"
                  step="1"
                />
                <p className="text-xs text-gray-400 mt-1">Maximum total SOL to spend per bundle</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max SOL per Wallet
                </label>
                <input
                  type="number"
                  value={formData.maxSolPerWallet}
                  onChange={(e) => handleInputChange('maxSolPerWallet', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  min="0.1"
                  step="0.1"
                />
                <p className="text-xs text-gray-400 mt-1">Maximum SOL per individual wallet</p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.requireSimulation}
                  onChange={(e) => handleInputChange('requireSimulation', e.target.checked)}
                  className="mr-2"
                />
                <label className="text-gray-300">Require transaction simulation (recommended)</label>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.mainWalletPrivateKey || !formData.primaryRpcUrl}
              className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : '✅ Complete Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
