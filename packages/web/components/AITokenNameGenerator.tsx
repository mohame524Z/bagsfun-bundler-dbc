'use client';

import { useState } from 'react';

interface GeneratedToken {
  name: string;
  symbol: string;
  description: string;
  memePotential: number;
  viralScore: number;
  category: string;
}

export default function AITokenNameGenerator() {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GeneratedToken[]>([]);
  const [category, setCategory] = useState('meme');
  const [theme, setTheme] = useState('');
  const isComingSoon = true; // AI generation coming soon

  const categories = [
    { value: 'meme', label: '😂 Meme', desc: 'Funny, viral, community-driven' },
    { value: 'animal', label: '🐕 Animal', desc: 'Dog/cat/pepe themed' },
    { value: 'tech', label: '🚀 Tech', desc: 'Future, AI, crypto themed' },
    { value: 'finance', label: '💰 Finance', desc: 'Money, profit, gains' },
    { value: 'culture', label: '🎭 Culture', desc: 'Pop culture references' },
    { value: 'random', label: '🎲 Random', desc: 'Completely wild' },
  ];

  const nameTemplates = {
    meme: [
      { name: 'Degen Gains', symbol: 'DEGEN', desc: 'For true crypto degens who never miss a pump' },
      { name: 'To The Moon', symbol: 'MOON', desc: 'Because lambo dreams need rocket fuel' },
      { name: 'Wen Lambo', symbol: 'WEN', desc: 'The question every trader asks daily' },
      { name: 'Gigachad Finance', symbol: 'GIGA', desc: 'Alpha moves only, no paper hands' },
      { name: 'Diamond Paws', symbol: 'DPAW', desc: 'Hold strong like a true chad' },
    ],
    animal: [
      { name: 'Shiba Moon', symbol: 'SHIBM', desc: 'The next evolution of dog coins' },
      { name: 'Pepe King', symbol: 'PKING', desc: 'All hail the meme lord' },
      { name: 'Wojak Winners', symbol: 'WOJAK', desc: 'From crying to flying' },
      { name: 'Doge Dynasty', symbol: 'DDYN', desc: 'Much wow, such gains' },
      { name: 'Ape Ascension', symbol: 'AAPE', desc: 'Together apes strong' },
    ],
    tech: [
      { name: 'Quantum Gains', symbol: 'QGAIN', desc: 'Superposition between rich and super rich' },
      { name: 'AI Degen', symbol: 'AIDGN', desc: 'Artificially intelligent trading' },
      { name: 'Web5 Finance', symbol: 'WEB5', desc: 'Skipping Web3, going straight to Web5' },
      { name: 'Metaverse Money', symbol: 'META$', desc: 'Virtual gains, real profits' },
      { name: 'Blockchain Brrr', symbol: 'BRRR', desc: 'Money printer go brrr on-chain' },
    ],
    finance: [
      { name: 'Profit Protocol', symbol: 'PROFIT', desc: 'The only protocol that matters' },
      { name: 'Bull Run Capital', symbol: 'BULL', desc: 'Riding the eternal bull market' },
      { name: 'Green Candle', symbol: 'GREEN', desc: 'Red is forbidden here' },
      { name: 'Liquidation Safe', symbol: 'SAFE', desc: 'Because getting rekt is so 2021' },
      { name: 'Pump Economics', symbol: 'PUMP', desc: 'Supply and demand, but only up' },
    ],
    culture: [
      { name: 'Based Department', symbol: 'BASED', desc: 'No cap, fr fr' },
      { name: 'Sigma Grindset', symbol: 'SIGMA', desc: 'Wake up, trade, repeat' },
      { name: 'Vibe Check', symbol: 'VIBE', desc: 'The vibes are immaculate' },
      { name: 'Rare Achievement', symbol: 'RARE', desc: 'Unlock generational wealth' },
      { name: 'Main Character', symbol: 'MAIN', desc: 'The token that drives the narrative' },
    ],
    random: [
      { name: 'Absolutely Unhinged', symbol: 'UNHNGED', desc: 'Normal is overrated' },
      { name: 'Chaos Theory', symbol: 'CHAOS', desc: 'Organized chaos leads to profit' },
      { name: 'Simulation Glitch', symbol: 'GLITCH', desc: 'Breaking the matrix one trade at a time' },
      { name: 'Cosmic Degen', symbol: 'COSMIC', desc: 'Trading across dimensions' },
      { name: 'Quantum Wojak', symbol: 'QWOJAK', desc: 'Schrodinger\'s gains' },
    ],
  };

  const generateNames = async () => {
    setLoading(true);
    setSuggestions([]);

    try {
      const response = await fetch('/api/namegen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: category !== 'random' ? category : undefined,
          count: 5,
        }),
      });

      const data = await response.json();

      if (data.success && data.suggestions) {
        // Map API response to UI format
        const templates = nameTemplates[category as keyof typeof nameTemplates] || nameTemplates.meme;
        const scored = data.suggestions.map((suggestion: any, index: number) => {
          const template = templates[index] || templates[0];
          return {
            name: theme.trim() ? `${theme} ${suggestion.name}` : suggestion.name,
            symbol: suggestion.name.substring(0, 5).toUpperCase().replace(/[^A-Z]/g, ''),
            description: template?.desc || `Amazing ${suggestion.name} token`,
            memePotential: suggestion.score,
            viralScore: Math.min(100, suggestion.score + 10),
            category,
          };
        });

        setSuggestions(scored);
      } else {
        alert('Failed to generate names');
      }
    } catch (error) {
      console.error('Error generating names:', error);
      alert('Error generating names');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white">🤖 AI Token Name Generator</h2>
          <span className="px-3 py-1 bg-yellow-600/20 border border-yellow-500/50 text-yellow-400 text-xs font-semibold rounded-full">
            🚧 COMING SOON
          </span>
        </div>
        <p className="text-gray-400 text-sm mt-1">Generate viral token names with meme potential scoring (Currently showing template suggestions)</p>
      </div>

      {/* Generator Form */}
      <div className="bg-gray-800 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">Category</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`p-3 rounded-lg text-left transition-colors ${
                  category === cat.value
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <div className="font-bold text-sm">{cat.label}</div>
                <div className="text-xs opacity-80">{cat.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">Theme (Optional)</label>
          <input
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            placeholder="e.g., Solar, Dragon, Speed..."
          />
          <p className="text-xs text-gray-400 mt-1">Add a theme for custom name variations</p>
        </div>

        <button
          onClick={generateNames}
          disabled={loading}
          className="w-full px-4 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 font-medium disabled:opacity-50"
        >
          {loading ? '🎲 Generating...' : '✨ Generate Names'}
        </button>
      </div>

      {/* Results */}
      {suggestions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((token, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:border-cyan-500 transition-colors cursor-pointer"
              onClick={() => {
                navigator.clipboard.writeText(`${token.name} ($${token.symbol})`);
                alert(`Copied: ${token.name} ($${token.symbol})`);
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{token.name}</h3>
                  <p className="text-cyan-400 font-mono">${token.symbol}</p>
                </div>
                <button
                  className="text-gray-400 hover:text-cyan-400 text-sm"
                  title="Click card to copy"
                >
                  📋
                </button>
              </div>

              <p className="text-gray-400 text-sm mb-4">{token.description}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-700 rounded p-2">
                  <div className="text-xs text-gray-400">Meme Potential</div>
                  <div className={`text-lg font-bold ${getScoreColor(token.memePotential)}`}>
                    {token.memePotential}/100
                  </div>
                </div>
                <div className="bg-gray-700 rounded p-2">
                  <div className="text-xs text-gray-400">Viral Score</div>
                  <div className={`text-lg font-bold ${getScoreColor(token.viralScore)}`}>
                    {token.viralScore}/100
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
        <h4 className="text-purple-400 font-bold mb-2">💡 Pro Tips</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
          <li>Short, memorable symbols (3-5 chars) perform best</li>
          <li>Names with cultural references get more organic engagement</li>
          <li>High meme potential = better community vibes</li>
          <li>Click any card to copy the name and symbol</li>
          <li>Mix categories for unique combinations</li>
        </ul>
      </div>
    </div>
  );
}
