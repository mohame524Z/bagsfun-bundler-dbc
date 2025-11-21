'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { PumpMode } from '@pump-bundler/types';

export default function Dashboard({ mode }: { mode: PumpMode }) {
  const { publicKey } = useWallet();

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Volume"
          value="1,234 SOL"
          change="+12.5%"
          icon="💰"
        />
        <StatCard
          title="Tokens Created"
          value="42"
          change="+5"
          icon="🪙"
        />
        <StatCard
          title="Active Bundles"
          value="3"
          change="0"
          icon="📦"
        />
        <StatCard
          title="Success Rate"
          value="98.5%"
          change="+1.2%"
          icon="✅"
        />
      </div>

      {/* Mode Indicator */}
      <div className={`p-6 rounded-xl border-2 ${
        mode === PumpMode.MAYHEM
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-blue-500/10 border-blue-500/30'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">
              Current Mode: {mode === PumpMode.MAYHEM ? '⚡ Mayhem' : '🎯 Classic'}
            </h3>
            <p className="text-gray-400">
              {mode === PumpMode.MAYHEM
                ? '50% faster bonding curve - Graduate in ~40 minutes'
                : 'Standard bonding curve - Graduate in ~60 minutes'}
            </p>
          </div>
          <div className="text-4xl">
            {mode === PumpMode.MAYHEM ? '⚡' : '🎯'}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800/50 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                  🪙
                </div>
                <div>
                  <p className="text-white font-medium">Token Created</p>
                  <p className="text-sm text-gray-400">2 hours ago</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">+123.45 SOL</p>
                <p className="text-sm text-green-400">+45.2%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  icon,
}: {
  title: string;
  value: string;
  change: string;
  icon: string;
}) {
  const isPositive = change.startsWith('+');

  return (
    <div className="bg-gray-800/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-sm">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-white mb-2">{value}</p>
      <p className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {change} from last week
      </p>
    </div>
  );
}
