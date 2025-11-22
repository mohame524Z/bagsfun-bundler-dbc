'use client';

import { useState, useEffect } from 'react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'trading' | 'profit' | 'volume' | 'stealth' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt?: number;
  progress: number;
  maxProgress: number;
  reward?: string;
}

const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress'>[] = [
  // Trading Achievements
  { id: 'first_bundle', title: 'First Bundle', description: 'Create your first token bundle', icon: '🎯', category: 'trading', rarity: 'common', maxProgress: 1, reward: 'Unlocked Analytics' },
  { id: 'bundle_master', title: 'Bundle Master', description: 'Create 10 token bundles', icon: '📦', category: 'trading', rarity: 'rare', maxProgress: 10 },
  { id: 'bundle_legend', title: 'Bundle Legend', description: 'Create 50 token bundles', icon: '👑', category: 'trading', rarity: 'epic', maxProgress: 50 },
  { id: 'perfect_bundle', title: 'Perfect Bundle', description: 'Achieve 100% success rate on a bundle', icon: '💯', category: 'trading', rarity: 'rare', maxProgress: 1 },

  // Profit Achievements
  { id: 'first_profit', title: 'First Profit', description: 'Make your first profitable trade', icon: '💰', category: 'profit', rarity: 'common', maxProgress: 1 },
  { id: 'moonshot', title: 'Moonshot', description: 'Achieve 10x on a token', icon: '🌙', category: 'profit', rarity: 'epic', maxProgress: 1 },
  { id: 'diamond_hands', title: 'Diamond Hands', description: 'Hold a token through 50%+ drawdown and exit profitable', icon: '💎', category: 'profit', rarity: 'legendary', maxProgress: 1 },
  { id: 'profit_streak', title: 'Profit Streak', description: '5 profitable trades in a row', icon: '🔥', category: 'profit', rarity: 'rare', maxProgress: 5 },
  { id: 'whale_status', title: 'Whale Status', description: 'Total profits exceed 100 SOL', icon: '🐋', category: 'profit', rarity: 'legendary', maxProgress: 100 },

  // Volume Achievements
  { id: 'volume_trader', title: 'Volume Trader', description: 'Generate 1000 SOL in trading volume', icon: '📊', category: 'volume', rarity: 'rare', maxProgress: 1000 },
  { id: 'high_roller', title: 'High Roller', description: 'Single bundle with 20+ wallets', icon: '🎰', category: 'volume', rarity: 'rare', maxProgress: 1 },

  // Stealth Achievements
  { id: 'stealth_mode', title: 'Stealth Mode', description: 'Complete a bundle with AGGRESSIVE stealth', icon: '🥷', category: 'stealth', rarity: 'rare', maxProgress: 1 },
  { id: 'ghost', title: 'Ghost', description: 'Zero detection risk on 10 bundles', icon: '👻', category: 'stealth', rarity: 'epic', maxProgress: 10 },

  // Milestone Achievements
  { id: 'early_adopter', title: 'Early Adopter', description: 'Join during beta', icon: '🚀', category: 'milestone', rarity: 'legendary', maxProgress: 1 },
  { id: 'veteran', title: 'Veteran', description: 'Active for 30 days', icon: '⭐', category: 'milestone', rarity: 'epic', maxProgress: 30 },
  { id: 'no_losses', title: 'Flawless Victory', description: 'Exit 10 tokens profitable, zero losses', icon: '🏆', category: 'profit', rarity: 'legendary', maxProgress: 10 },
];

export default function AchievementSystem() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<Achievement['category'] | 'all'>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    setLoading(true);
    try {
      // In production, load from API
      // For now, use mock data
      const mockAchievements: Achievement[] = ACHIEVEMENTS.map(a => ({
        ...a,
        unlocked: Math.random() > 0.6,
        unlockedAt: Math.random() > 0.6 ? Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000 : undefined,
        progress: Math.floor(Math.random() * a.maxProgress),
      }));

      setAchievements(mockAchievements);
    } catch (err) {
      console.error('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = achievements
    .filter(a => {
      if (filter === 'unlocked' && !a.unlocked) return false;
      if (filter === 'locked' && a.unlocked) return false;
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
      return true;
    });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'border-gray-500 bg-gray-500/10';
      case 'rare':
        return 'border-blue-500 bg-blue-500/10';
      case 'epic':
        return 'border-purple-500 bg-purple-500/10';
      case 'legendary':
        return 'border-yellow-500 bg-yellow-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-700 text-gray-300';
      case 'rare':
        return 'bg-blue-900/50 text-blue-400';
      case 'epic':
        return 'bg-purple-900/50 text-purple-400';
      case 'legendary':
        return 'bg-yellow-900/50 text-yellow-400';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const completionPercent = (unlockedCount / totalCount) * 100;

  const rarityCount = {
    legendary: achievements.filter(a => a.unlocked && a.rarity === 'legendary').length,
    epic: achievements.filter(a => a.unlocked && a.rarity === 'epic').length,
    rare: achievements.filter(a => a.unlocked && a.rarity === 'rare').length,
    common: achievements.filter(a => a.unlocked && a.rarity === 'common').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">🏆 Achievements</h2>
        <p className="text-gray-400 text-sm mt-1">Track your progress and unlock rewards</p>
      </div>

      {/* Progress Overview */}
      <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border border-purple-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-white">Overall Progress</h3>
            <p className="text-gray-300">{unlockedCount} of {totalCount} achievements unlocked</p>
          </div>
          <div className="text-6xl">{completionPercent === 100 ? '👑' : '🎯'}</div>
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-sm text-gray-300 mb-1">
            <span>Completion</span>
            <span>{completionPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-purple-500 to-cyan-500 h-4 rounded-full transition-all"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="text-center">
            <div className="text-yellow-400 text-2xl font-bold">{rarityCount.legendary}</div>
            <div className="text-xs text-gray-400">Legendary</div>
          </div>
          <div className="text-center">
            <div className="text-purple-400 text-2xl font-bold">{rarityCount.epic}</div>
            <div className="text-xs text-gray-400">Epic</div>
          </div>
          <div className="text-center">
            <div className="text-blue-400 text-2xl font-bold">{rarityCount.rare}</div>
            <div className="text-xs text-gray-400">Rare</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-2xl font-bold">{rarityCount.common}</div>
            <div className="text-xs text-gray-400">Common</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-2">
            <span className="text-gray-400 text-sm py-2">Show:</span>
            {['all', 'unlocked', 'locked'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  filter === f ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <span className="text-gray-400 text-sm py-2">Category:</span>
            {['all', 'trading', 'profit', 'volume', 'stealth', 'milestone'].map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c as any)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  categoryFilter === c ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:scale-105 ${
              getRarityColor(achievement.rarity)
            } ${!achievement.unlocked && 'opacity-60 grayscale'}`}
            onClick={() => setSelectedAchievement(achievement)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="text-5xl">{achievement.unlocked ? achievement.icon : '🔒'}</div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getRarityBadge(achievement.rarity)}`}>
                {achievement.rarity.toUpperCase()}
              </span>
            </div>

            <h3 className="text-lg font-bold text-white mb-1">{achievement.title}</h3>
            <p className="text-sm text-gray-400 mb-3">{achievement.description}</p>

            {achievement.unlocked ? (
              <div className="text-xs text-green-400">
                ✅ Unlocked {achievement.unlockedAt && new Date(achievement.unlockedAt).toLocaleDateString()}
              </div>
            ) : (
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{achievement.progress}/{achievement.maxProgress}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-cyan-500 h-2 rounded-full"
                    style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {achievement.reward && achievement.unlocked && (
              <div className="mt-2 text-xs text-yellow-400">
                🎁 {achievement.reward}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No achievements match the selected filters
        </div>
      )}

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedAchievement(null)}
        >
          <div
            className={`border-4 rounded-xl p-6 max-w-md w-full ${getRarityColor(selectedAchievement.rarity)}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="text-8xl mb-4">{selectedAchievement.unlocked ? selectedAchievement.icon : '🔒'}</div>
              <span className={`px-3 py-1 rounded text-sm font-medium ${getRarityBadge(selectedAchievement.rarity)}`}>
                {selectedAchievement.rarity.toUpperCase()}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white text-center mb-2">{selectedAchievement.title}</h2>
            <p className="text-gray-300 text-center mb-4">{selectedAchievement.description}</p>

            {selectedAchievement.unlocked ? (
              <div className="bg-green-900/30 border border-green-500 rounded p-4 text-center">
                <div className="text-green-400 font-bold mb-1">✅ UNLOCKED</div>
                {selectedAchievement.unlockedAt && (
                  <div className="text-sm text-gray-300">
                    {new Date(selectedAchievement.unlockedAt).toLocaleString()}
                  </div>
                )}
                {selectedAchievement.reward && (
                  <div className="mt-2 text-yellow-400">
                    🎁 Reward: {selectedAchievement.reward}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-700 rounded p-4">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>Progress</span>
                  <span className="font-bold">{selectedAchievement.progress}/{selectedAchievement.maxProgress}</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 h-3 rounded-full"
                    style={{ width: `${(selectedAchievement.progress / selectedAchievement.maxProgress) * 100}%` }}
                  />
                </div>
                <div className="text-center text-sm text-gray-400 mt-2">
                  {selectedAchievement.maxProgress - selectedAchievement.progress} more to unlock
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedAchievement(null)}
              className="w-full mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
