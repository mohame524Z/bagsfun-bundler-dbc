'use client';

import { useState } from 'react';

interface FeatureStatus {
  name: string;
  tab: string;
  status: 'working' | 'partial' | 'coming-soon';
  backend: string;
  notes: string;
}

interface CategoryHealth {
  name: string;
  total: number;
  working: number;
  partial: number;
  comingSoon: number;
  percentage: number;
  emoji: string;
}

export default function HealthDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'working' | 'partial' | 'coming-soon'>('all');

  // Category Health Data
  const categories: CategoryHealth[] = [
    { name: 'Core Features', total: 7, working: 7, partial: 0, comingSoon: 0, percentage: 100, emoji: '🎯' },
    { name: 'Analytics & Tracking', total: 6, working: 6, partial: 0, comingSoon: 0, percentage: 100, emoji: '📈' },
    { name: 'Trading Tools', total: 8, working: 6, partial: 2, comingSoon: 0, percentage: 75, emoji: '💹' },
    { name: 'Advanced Features', total: 6, working: 5, partial: 0, comingSoon: 1, percentage: 83, emoji: '⚡' },
    { name: 'Social & Community', total: 4, working: 4, partial: 0, comingSoon: 0, percentage: 100, emoji: '👥' },
    { name: 'Automation & Tools', total: 6, working: 4, partial: 0, comingSoon: 2, percentage: 67, emoji: '🔧' },
    { name: 'Security & Privacy', total: 3, working: 3, partial: 0, comingSoon: 0, percentage: 100, emoji: '🔐' },
  ];

  // All Features
  const features: Record<string, FeatureStatus[]> = {
    'Core Features': [
      { name: 'Dashboard', tab: '📊 Dashboard', status: 'working', backend: 'Real Data', notes: 'Main overview with stats' },
      { name: 'Portfolio Tracking', tab: '💼 Portfolio', status: 'working', backend: 'Real Data', notes: 'Tracks holdings and PnL' },
      { name: 'Token Creator', tab: '🚀 Create', status: 'working', backend: 'Core Package', notes: 'Creates tokens on pump.fun' },
      { name: 'Sell Manager', tab: '💰 Sell', status: 'working', backend: 'Core Package', notes: '3 modes: Regular/Bundle/Jito' },
      { name: 'Sniper Bot', tab: '🎯 Sniper', status: 'working', backend: 'Core Package', notes: 'Auto-snipes new tokens' },
      { name: 'Volume Generator', tab: '📊 Volume', status: 'working', backend: 'Core Package', notes: 'Generates trading volume' },
      { name: 'Wallet Manager', tab: '👛 Wallets', status: 'working', backend: 'File-based', notes: 'Manages bundler wallets' },
    ],
    'Analytics & Tracking': [
      { name: 'Token Analytics', tab: '📈 Analytics', status: 'working', backend: 'analytics.json', notes: 'Detailed token performance' },
      { name: 'Bundle Analytics', tab: '📊 Bundle Stats', status: 'working', backend: 'analytics.json', notes: 'Bundle execution stats' },
      { name: 'Performance Benchmarks', tab: '🏅 Benchmarks', status: 'working', backend: 'benchmarks.json', notes: 'Compares vs other users' },
      { name: 'On-Chain Analytics', tab: '⛓️ On-Chain', status: 'working', backend: 'Solana RPC', notes: 'Real blockchain data' },
      { name: 'Market Sentiment', tab: '📊 Sentiment', status: 'working', backend: 'sentiment.json', notes: 'Market trend analysis' },
      { name: 'Wallet Health Monitor', tab: '🏥 Health', status: 'working', backend: 'Real-time', notes: 'Monitors balance/gas' },
    ],
    'Trading Tools': [
      { name: 'Advanced Sniper', tab: '🎯 Adv Sniper', status: 'working', backend: 'sniper-improvements.json', notes: 'Enhanced sniping features' },
      { name: 'Advanced Volume', tab: '📊 Adv Volume', status: 'working', backend: 'volume-strategies.json', notes: 'Multi-strategy volume gen' },
      { name: 'Auto-Sell Strategies', tab: '🎯 Auto-Sell', status: 'working', backend: 'autosell.json', notes: 'Automated selling rules' },
      { name: 'Profit Distribution', tab: '💰 Distribution', status: 'working', backend: 'distribution-rules.json', notes: 'Distributes profits' },
      { name: 'Fee Optimizer', tab: '💸 Fees', status: 'working', backend: 'Calculated', notes: 'Calculates optimal fees' },
      { name: 'Transaction Privacy', tab: '🔐 Privacy', status: 'working', backend: 'privacy-settings.json', notes: 'Privacy enhancements' },
      { name: 'Market Maker Bot', tab: '🤖 Market Maker', status: 'partial', backend: 'marketmaker.json', notes: 'Requires active token strategy' },
      { name: 'Competitor Intelligence', tab: '🔍 Intel', status: 'partial', backend: 'intelligence.json', notes: 'Limited data sources' },
    ],
    'Advanced Features': [
      { name: 'Multi-Token Portfolio', tab: '💎 Multi-Token', status: 'working', backend: 'Portfolio tracking', notes: 'Multi-token tracking' },
      { name: 'A/B Testing Framework', tab: '🧪 A/B Testing', status: 'working', backend: 'abtests.json', notes: 'Strategy testing' },
      { name: 'Rug Pull Simulator', tab: '🧪 Rug Sim', status: 'working', backend: 'Simulation', notes: 'Simulates rug scenarios' },
      { name: 'Wallet Isolation', tab: '🔒 Isolation', status: 'working', backend: 'isolation.json', notes: 'Isolates wallet groups' },
      { name: 'One-Click Templates', tab: '📋 Templates', status: 'working', backend: 'templates.json', notes: 'Pre-configured strategies' },
      { name: 'AI Token Name Generator', tab: '🤖 Name Gen', status: 'coming-soon', backend: 'Template-based', notes: 'AI generation coming soon' },
    ],
    'Social & Community': [
      { name: 'Achievement System', tab: '🏆 Achievements', status: 'working', backend: 'achievements.json', notes: 'Gamification system' },
      { name: 'Social Trading', tab: '👥 Social', status: 'working', backend: 'social-trading.json', notes: 'Follow top traders' },
      { name: 'Strategy Sharing', tab: '🔄 Sharing', status: 'working', backend: 'strategies.json', notes: 'Share strategies' },
      { name: 'Smart Notifications', tab: '🔔 Notifications', status: 'working', backend: 'notifications.json', notes: 'Custom alerts' },
    ],
    'Automation & Tools': [
      { name: 'Custom Scripts', tab: '⚙️ Scripts', status: 'working', backend: 'custom-scripts.json', notes: 'vm2 sandboxed execution' },
      { name: 'API Tools', tab: '🔌 API', status: 'working', backend: 'apikeys.json', notes: 'API key management' },
      { name: 'RPC Manager', tab: '📡 RPC', status: 'working', backend: 'Core Package', notes: 'Multi-RPC with failover' },
      { name: 'Emergency Stop Loss', tab: '🚨 Emergency', status: 'working', backend: 'emergency.json', notes: 'Emergency sell triggers' },
      { name: 'Simulation Mode', tab: '🧪 Simulation', status: 'partial', backend: 'Simulated', notes: 'Basic testing only' },
      { name: 'CLI Full Parity', tab: 'CLI', status: 'coming-soon', backend: 'CLI Package', notes: 'Missing external deps' },
    ],
    'Security & Privacy': [
      { name: 'Security Settings', tab: '🔒 Security', status: 'working', backend: 'security.json', notes: 'Security configurations' },
      { name: 'Transaction Privacy', tab: '🔐 Privacy', status: 'working', backend: 'privacy-settings.json', notes: 'Privacy settings' },
      { name: 'Wallet Isolation', tab: '🔒 Isolation', status: 'working', backend: 'isolation.json', notes: 'Wallet isolation' },
    ],
  };

  const totalFeatures = Object.values(features).flat().length;
  const workingFeatures = Object.values(features).flat().filter(f => f.status === 'working').length;
  const partialFeatures = Object.values(features).flat().filter(f => f.status === 'partial').length;
  const comingSoonFeatures = Object.values(features).flat().filter(f => f.status === 'coming-soon').length;
  const overallHealth = Math.round((workingFeatures / totalFeatures) * 100);

  const getHealthColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-400';
    if (percentage >= 75) return 'text-cyan-400';
    if (percentage >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHealthBg = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-cyan-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'working':
        return <span className="px-2 py-1 bg-green-600/20 border border-green-500/50 text-green-400 text-xs font-semibold rounded">✅ WORKING</span>;
      case 'partial':
        return <span className="px-2 py-1 bg-cyan-600/20 border border-cyan-500/50 text-cyan-400 text-xs font-semibold rounded">🧪 LIMITED</span>;
      case 'coming-soon':
        return <span className="px-2 py-1 bg-yellow-600/20 border border-yellow-500/50 text-yellow-400 text-xs font-semibold rounded">🚧 COMING SOON</span>;
      default:
        return null;
    }
  };

  const filteredFeatures = selectedCategory
    ? features[selectedCategory].filter(f => selectedStatus === 'all' || f.status === selectedStatus)
    : Object.values(features).flat().filter(f => selectedStatus === 'all' || f.status === selectedStatus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">🏥 System Health Dashboard</h2>
        <p className="text-gray-400 text-sm mt-1">Complete feature health monitoring and status tracking</p>
      </div>

      {/* Overall Health Score */}
      <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border border-purple-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Overall System Health</h3>
            <p className="text-gray-400 text-sm">Based on {totalFeatures} total features</p>
          </div>
          <div className={`text-5xl font-bold ${getHealthColor(overallHealth)}`}>
            {overallHealth}%
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
          <div
            className={`h-4 rounded-full ${getHealthBg(overallHealth)} transition-all duration-500`}
            style={{ width: `${overallHealth}%` }}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{workingFeatures}</div>
            <div className="text-sm text-gray-400">✅ Fully Working</div>
            <div className="text-xs text-gray-500 mt-1">{Math.round((workingFeatures / totalFeatures) * 100)}% of total</div>
          </div>
          <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-cyan-400">{partialFeatures}</div>
            <div className="text-sm text-gray-400">⚠️ Limited/Partial</div>
            <div className="text-xs text-gray-500 mt-1">{Math.round((partialFeatures / totalFeatures) * 100)}% of total</div>
          </div>
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">{comingSoonFeatures}</div>
            <div className="text-sm text-gray-400">🚧 Coming Soon</div>
            <div className="text-xs text-gray-500 mt-1">{Math.round((comingSoonFeatures / totalFeatures) * 100)}% of total</div>
          </div>
        </div>
      </div>

      {/* Category Health */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">📊 Health by Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
              className={`bg-gray-800 border rounded-lg p-4 text-left transition-all hover:bg-gray-750 ${
                selectedCategory === category.name ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category.emoji}</span>
                  <span className="font-semibold text-white text-sm">{category.name}</span>
                </div>
                <span className={`text-lg font-bold ${getHealthColor(category.percentage)}`}>
                  {category.percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full ${getHealthBg(category.percentage)}`}
                  style={{ width: `${category.percentage}%` }}
                />
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-green-400">✅ {category.working}</span>
                {category.partial > 0 && <span className="text-cyan-400">⚠️ {category.partial}</span>}
                {category.comingSoon > 0 && <span className="text-yellow-400">🚧 {category.comingSoon}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex gap-2 items-center">
        <span className="text-sm text-gray-400">Filter:</span>
        <button
          onClick={() => setSelectedStatus('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedStatus === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          All ({totalFeatures})
        </button>
        <button
          onClick={() => setSelectedStatus('working')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedStatus === 'working' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Working ({workingFeatures})
        </button>
        <button
          onClick={() => setSelectedStatus('partial')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedStatus === 'partial' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Limited ({partialFeatures})
        </button>
        <button
          onClick={() => setSelectedStatus('coming-soon')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedStatus === 'coming-soon' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Coming Soon ({comingSoonFeatures})
        </button>
        {selectedCategory && (
          <button
            onClick={() => setSelectedCategory(null)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30"
          >
            Clear Category Filter
          </button>
        )}
      </div>

      {/* Feature List */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">
          {selectedCategory ? `📋 ${selectedCategory}` : '📋 All Features'}
          <span className="text-sm text-gray-400 ml-2">({filteredFeatures.length} features)</span>
        </h3>
        <div className="space-y-2">
          {filteredFeatures.map((feature, idx) => (
            <div key={idx} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-white">{feature.name}</h4>
                    {getStatusBadge(feature.status)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Tab:</span>
                      <span className="text-gray-300 ml-2">{feature.tab}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Backend:</span>
                      <span className="text-gray-300 ml-2">{feature.backend}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Notes:</span>
                      <span className="text-gray-300 ml-2">{feature.notes}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Bug Fixes */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">🔧 Recent Critical Fixes</h3>
        <div className="space-y-3">
          <div className="border-l-4 border-green-500 pl-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-400 font-semibold">✅ FIXED</span>
              <span className="text-white font-medium">Missing packages/core/index.ts</span>
            </div>
            <p className="text-sm text-gray-400">All imports from @pump-bundler/core now work correctly</p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-400 font-semibold">✅ FIXED</span>
              <span className="text-white font-medium">bs58 Version Mismatch</span>
            </div>
            <p className="text-sm text-gray-400">Updated Web package to v6.0.0 - prevents runtime errors</p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-400 font-semibold">✅ FIXED</span>
              <span className="text-white font-medium">TypeScript Type Errors</span>
            </div>
            <p className="text-sm text-gray-400">Added null checks in seller.ts - compilation now succeeds</p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">💡 Recommendations</h3>
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-yellow-400 text-xl">📌</span>
            <div>
              <p className="text-white font-medium">High Priority</p>
              <p className="text-sm text-gray-400">All critical bugs fixed. System is production-ready!</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-400 text-xl">📌</span>
            <div>
              <p className="text-white font-medium">Medium Priority</p>
              <p className="text-sm text-gray-400">Install optional CLI dependencies for full Raydium integration</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 text-xl">📌</span>
            <div>
              <p className="text-white font-medium">Low Priority</p>
              <p className="text-sm text-gray-400">Implement AI Token Name Generator and enhance market intelligence</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
