import { NextRequest, NextResponse } from 'next/server';

interface NameSuggestion {
  name: string;
  score: number;
  reasons: string[];
}

const PREFIXES = ['Moon', 'Doge', 'Pepe', 'Shiba', 'Floki', 'Baby', 'Safe', 'Meta', 'Elon', 'Rocket', 'Diamond', 'Gold', 'Mega', 'Super', 'Hyper'];
const MIDDLES = ['', 'Inu', 'Token', 'Coin', 'Cash', 'Finance', 'Swap', 'AI', 'DAO', 'DeFi'];
const SUFFIXES = ['', 'X', 'Pro', '2.0', 'Max', 'Plus', 'Elite', 'Prime', 'Ultra'];

const THEMES: Record<string, string[]> = {
  meme: ['Doge', 'Pepe', 'Wojak', 'Chad', 'Based', 'Bonk', 'Smol', 'Chonk'],
  defi: ['Yield', 'Stake', 'Farm', 'Liquidity', 'Protocol', 'Finance', 'Vault'],
  tech: ['AI', 'Quantum', 'Cyber', 'Neural', 'Crypto', 'Block', 'Chain', 'Web3'],
  animal: ['Dog', 'Cat', 'Frog', 'Bear', 'Bull', 'Lion', 'Tiger', 'Wolf'],
  space: ['Moon', 'Mars', 'Stellar', 'Orbit', 'Galaxy', 'Cosmos', 'Nebula'],
};

function generateName(theme?: string): string {
  if (theme && THEMES[theme]) {
    const themeWords = THEMES[theme];
    const word1 = themeWords[Math.floor(Math.random() * themeWords.length)];
    const word2 = MIDDLES[Math.floor(Math.random() * MIDDLES.length)];
    const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
    return `${word1}${word2}${suffix}`.trim();
  }

  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const middle = MIDDLES[Math.floor(Math.random() * MIDDLES.length)];
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];

  return `${prefix}${middle}${suffix}`.trim();
}

function scoreTokenName(name: string): { score: number; reasons: string[] } {
  let score = 50;
  const reasons: string[] = [];

  // Length check (5-15 characters is ideal)
  if (name.length >= 5 && name.length <= 15) {
    score += 20;
    reasons.push('Good length (5-15 chars)');
  } else if (name.length < 5) {
    score -= 10;
    reasons.push('Too short');
  } else {
    score -= 5;
    reasons.push('Slightly long');
  }

  // Memorable words
  const memorable = ['moon', 'doge', 'pepe', 'safe', 'rocket', 'diamond'];
  if (memorable.some(word => name.toLowerCase().includes(word))) {
    score += 15;
    reasons.push('Contains memorable word');
  }

  // Easy to pronounce (no complex consonant clusters)
  const vowels = (name.match(/[aeiou]/gi) || []).length;
  const vowelRatio = vowels / name.length;
  if (vowelRatio >= 0.3 && vowelRatio <= 0.5) {
    score += 10;
    reasons.push('Easy to pronounce');
  }

  // Trending themes
  if (name.toLowerCase().includes('ai') || name.toLowerCase().includes('pepe')) {
    score += 15;
    reasons.push('Trending theme');
  }

  // No numbers (cleaner look)
  if (!/\d/.test(name)) {
    score += 5;
    reasons.push('No numbers');
  }

  return { score: Math.min(100, score), reasons };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { theme, count } = body;

    const suggestions: NameSuggestion[] = [];
    const generatedNames = new Set<string>();

    // Generate unique names
    while (suggestions.length < (count || 5)) {
      const name = generateName(theme);

      if (!generatedNames.has(name)) {
        generatedNames.add(name);
        const { score, reasons } = scoreTokenName(name);
        suggestions.push({ name, score, reasons });
      }
    }

    // Sort by score
    suggestions.sort((a, b) => b.score - a.score);

    return NextResponse.json({ success: true, suggestions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
