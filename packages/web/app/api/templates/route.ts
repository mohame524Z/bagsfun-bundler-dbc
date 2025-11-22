import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { AppConfig } from '@pump-bundler/types';

const CONFIG_PATH = path.join(process.cwd(), '..', '..', 'config', 'bundler-config.json');
const TEMPLATES_PATH = path.join(process.cwd(), '..', '..', 'data', 'templates.json');

interface LaunchTemplate {
  id: string;
  name: string;
  description: string;
  category: 'safe' | 'balanced' | 'aggressive' | 'custom';
  config: {
    walletCount: number;
    totalSol: number;
    stealthMode: string;
    jitoEnabled: boolean;
    jitoTip: number;
    priorityFee: number;
    mode: 'classic' | 'mayhem';
    maxSolPerBundle: number;
    requireSimulation: boolean;
    autoSellEnabled: boolean;
    autoSellConfig?: {
      takeProfitPercent: number;
      stopLossPercent: number;
    };
  };
}

const DEFAULT_TEMPLATES: LaunchTemplate[] = [
  {
    id: 'safe-launch',
    name: '🛡️ Safe Launch',
    description: 'Conservative settings with maximum stealth and MEV protection',
    category: 'safe',
    config: {
      walletCount: 15,
      totalSol: 3,
      stealthMode: 'AGGRESSIVE',
      jitoEnabled: true,
      jitoTip: 0.005,
      priorityFee: 200000,
      mode: 'classic',
      maxSolPerBundle: 5,
      requireSimulation: true,
      autoSellEnabled: true,
      autoSellConfig: {
        takeProfitPercent: 50,
        stopLossPercent: 30,
      },
    },
  },
  {
    id: 'hybrid-balanced',
    name: '⚖️ Balanced Hybrid',
    description: 'Best balance of speed, stealth, and cost - RECOMMENDED',
    category: 'balanced',
    config: {
      walletCount: 12,
      totalSol: 5,
      stealthMode: 'HYBRID',
      jitoEnabled: true,
      jitoTip: 0.005,
      priorityFee: 200000,
      mode: 'mayhem',
      maxSolPerBundle: 10,
      requireSimulation: true,
      autoSellEnabled: true,
      autoSellConfig: {
        takeProfitPercent: 100,
        stopLossPercent: 50,
      },
    },
  },
  {
    id: 'degen-mode',
    name: '⚡ Degen Mode',
    description: 'Maximum speed, high risk, fast graduation',
    category: 'aggressive',
    config: {
      walletCount: 20,
      totalSol: 10,
      stealthMode: 'LIGHT',
      jitoEnabled: true,
      jitoTip: 0.01,
      priorityFee: 500000,
      mode: 'mayhem',
      maxSolPerBundle: 15,
      requireSimulation: false,
      autoSellEnabled: true,
      autoSellConfig: {
        takeProfitPercent: 200,
        stopLossPercent: 40,
      },
    },
  },
  {
    id: 'stealth-master',
    name: '🥷 Stealth Master',
    description: 'Maximum anti-detection, slower but safest',
    category: 'safe',
    config: {
      walletCount: 18,
      totalSol: 4,
      stealthMode: 'AGGRESSIVE',
      jitoEnabled: true,
      jitoTip: 0.003,
      priorityFee: 150000,
      mode: 'classic',
      maxSolPerBundle: 6,
      requireSimulation: true,
      autoSellEnabled: false,
    },
  },
  {
    id: 'quick-flip',
    name: '💸 Quick Flip',
    description: 'Fast launch with aggressive take-profit strategy',
    category: 'aggressive',
    config: {
      walletCount: 10,
      totalSol: 7,
      stealthMode: 'MEDIUM',
      jitoEnabled: true,
      jitoTip: 0.007,
      priorityFee: 300000,
      mode: 'mayhem',
      maxSolPerBundle: 12,
      requireSimulation: false,
      autoSellEnabled: true,
      autoSellConfig: {
        takeProfitPercent: 150,
        stopLossPercent: 35,
      },
    },
  },
];

// Load templates
function loadTemplates(): LaunchTemplate[] {
  try {
    if (!fs.existsSync(TEMPLATES_PATH)) {
      // Return defaults if no custom templates
      return DEFAULT_TEMPLATES;
    }
    const data = fs.readFileSync(TEMPLATES_PATH, 'utf-8');
    const custom = JSON.parse(data);
    return [...DEFAULT_TEMPLATES, ...custom];
  } catch (error) {
    return DEFAULT_TEMPLATES;
  }
}

// Save custom templates
function saveTemplates(templates: LaunchTemplate[]): void {
  const dir = path.dirname(TEMPLATES_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  // Only save custom templates
  const custom = templates.filter(t => !DEFAULT_TEMPLATES.find(d => d.id === t.id));
  fs.writeFileSync(TEMPLATES_PATH, JSON.stringify(custom, null, 2));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const templates = loadTemplates();

    switch (action) {
      case 'list': {
        const category = searchParams.get('category');
        const filtered = category && category !== 'all'
          ? templates.filter(t => t.category === category)
          : templates;
        return NextResponse.json({ success: true, templates: filtered });
      }

      case 'get': {
        const id = searchParams.get('id');
        const template = templates.find(t => t.id === id);
        if (!template) {
          return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, template });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Template fetch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const templates = loadTemplates();

    switch (action) {
      case 'apply': {
        const { id } = body;

        const template = templates.find(t => t.id === id);
        if (!template) {
          return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        // Load current config
        if (!fs.existsSync(CONFIG_PATH)) {
          return NextResponse.json({ error: 'Config not found. Run setup first.' }, { status: 404 });
        }

        const configData = fs.readFileSync(CONFIG_PATH, 'utf-8');
        const config: AppConfig = JSON.parse(configData);

        // Apply template settings (without overwriting wallet or RPC config)
        config.mode = template.config.mode as any;

        if (config.stealth) {
          config.stealth.mode = template.config.stealthMode as any;
        }

        if (config.jito) {
          config.jito.enabled = template.config.jitoEnabled;
          config.jito.tipAmount = template.config.jitoTip;
        }

        if (config.risk) {
          config.risk.maxSolPerBundle = template.config.maxSolPerBundle;
          config.risk.requireSimulation = template.config.requireSimulation;
        }

        // Save updated config
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

        return NextResponse.json({
          success: true,
          message: `Template "${template.name}" applied successfully`,
          config: template.config,
        });
      }

      case 'save': {
        const { name, description, category, config } = body;

        const newTemplate: LaunchTemplate = {
          id: `custom_${Date.now()}`,
          name,
          description,
          category,
          config,
        };

        const allTemplates = loadTemplates();
        allTemplates.push(newTemplate);
        saveTemplates(allTemplates);

        return NextResponse.json({ success: true, template: newTemplate });
      }

      case 'delete': {
        const { id } = body;

        // Can't delete default templates
        if (DEFAULT_TEMPLATES.find(t => t.id === id)) {
          return NextResponse.json({ error: 'Cannot delete default template' }, { status: 400 });
        }

        const allTemplates = loadTemplates();
        const filtered = allTemplates.filter(t => t.id !== id);
        saveTemplates(filtered);

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Template operation failed:', error);
    return NextResponse.json({ error: 'Template operation failed' }, { status: 500 });
  }
}
