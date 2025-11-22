'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection } from '@solana/web3.js';
import { PumpMode } from '@pump-bundler/types';
import Dashboard from '../components/Dashboard';
import TokenCreator from '../components/TokenCreator';
import SniperPanel from '../components/SniperPanel';
import VolumePanel from '../components/VolumePanel';
import RPCManager from '../components/RPCManager';
import PortfolioPanel from '../components/PortfolioPanel';
import SellPanel from '../components/SellPanel';
import WalletManager from '../components/WalletManager';
import SetupWizard from '../components/SetupWizard';

// Initialize connection (should come from RPC manager in production)
const connection = new Connection('https://api.mainnet-beta.solana.com');

export default function Home() {
  const { connected } = useWallet();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'portfolio' | 'create' | 'sell' | 'sniper' | 'volume' | 'rpc' | 'wallets'>('dashboard');
  const [mode, setMode] = useState<PumpMode>(PumpMode.MAYHEM);
  const [configExists, setConfigExists] = useState<boolean | null>(null);
  const [checkingConfig, setCheckingConfig] = useState(true);

  // Check if config exists on mount
  useEffect(() => {
    checkConfig();
  }, []);

  const checkConfig = async () => {
    setCheckingConfig(true);
    try {
      const response = await fetch('/api/config');
      setConfigExists(response.ok);
    } catch (error) {
      setConfigExists(false);
    } finally {
      setCheckingConfig(false);
    }
  };

  const handleSetupComplete = () => {
    setConfigExists(true);
  };

  // Show loading while checking config
  if (checkingConfig) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show setup wizard if no config exists
  if (configExists === false) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Header */}
      <header className="border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Pump.fun <span className="text-purple-400">Bundler</span>
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Professional token bundler with advanced features
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Mode Selector */}
              <div className="flex gap-2 bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setMode(PumpMode.CLASSIC)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === PumpMode.CLASSIC
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Classic
                </button>
                <button
                  onClick={() => setMode(PumpMode.MAYHEM)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === PumpMode.MAYHEM
                      ? 'bg-red-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Mayhem
                </button>
              </div>

              {/* Wallet Button */}
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex gap-2 mt-6 flex-wrap">
            {[
              { id: 'dashboard', label: '📊 Dashboard' },
              { id: 'wallets', label: '👛 Wallets' },
              { id: 'portfolio', label: '💼 Portfolio' },
              { id: 'create', label: '🚀 Create' },
              { id: 'sell', label: '💰 Sell' },
              { id: 'sniper', label: '🎯 Sniper' },
              { id: 'volume', label: '📈 Volume' },
              { id: 'rpc', label: '📡 RPC' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {!connected ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">🔐</div>
              <h2 className="text-2xl font-bold text-white">Connect Your Wallet</h2>
              <p className="text-gray-400 max-w-md">
                Connect your Solana wallet to start creating tokens, sniping, and generating volume.
              </p>
              <div className="pt-4">
                <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !text-lg !py-3 !px-6" />
              </div>
            </div>
          </div>
        ) : (
          <div>
            {activeTab === 'dashboard' && <Dashboard mode={mode} />}
            {activeTab === 'wallets' && <WalletManager />}
            {activeTab === 'portfolio' && <PortfolioPanel connection={connection} mode={mode} />}
            {activeTab === 'create' && <TokenCreator mode={mode} />}
            {activeTab === 'sell' && <SellPanel connection={connection} mode={mode} />}
            {activeTab === 'sniper' && <SniperPanel mode={mode} />}
            {activeTab === 'volume' && <VolumePanel mode={mode} />}
            {activeTab === 'rpc' && <RPCManager />}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-700/50 bg-gray-900/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <p>© 2024 Pump.fun Advanced Bundler. Built with ❤️ for Solana.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Docs</a>
              <a href="#" className="hover:text-white transition-colors">GitHub</a>
              <a href="#" className="hover:text-white transition-colors">Discord</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
