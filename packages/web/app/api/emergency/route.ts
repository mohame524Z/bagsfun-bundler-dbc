import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const EMERGENCY_STATE_PATH = path.join(process.cwd(), '..', '..', 'data', 'emergency-state.json');

interface EmergencyState {
  killSwitchActive: boolean;
  activatedAt?: number;
  activatedBy?: string;
  reason?: string;
  pausedOperations: string[];
  emergencySellTriggered: boolean;
  emergencySellStatus?: {
    initiated: boolean;
    tokensSold: number;
    totalTokens: number;
    solRecovered: number;
  };
}

// Load emergency state
function loadEmergencyState(): EmergencyState {
  try {
    if (!fs.existsSync(EMERGENCY_STATE_PATH)) {
      return {
        killSwitchActive: false,
        pausedOperations: [],
        emergencySellTriggered: false,
      };
    }
    const data = fs.readFileSync(EMERGENCY_STATE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {
      killSwitchActive: false,
      pausedOperations: [],
      emergencySellTriggered: false,
    };
  }
}

// Save emergency state
function saveEmergencyState(state: EmergencyState): void {
  const dir = path.dirname(EMERGENCY_STATE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(EMERGENCY_STATE_PATH, JSON.stringify(state, null, 2));
}

export async function GET(request: NextRequest) {
  try {
    const state = loadEmergencyState();
    return NextResponse.json({ success: true, state });
  } catch (error) {
    console.error('Failed to load emergency state:', error);
    return NextResponse.json({ error: 'Failed to load emergency state' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const state = loadEmergencyState();

    switch (action) {
      case 'activateKillSwitch': {
        const { reason } = body;

        state.killSwitchActive = true;
        state.activatedAt = Date.now();
        state.reason = reason || 'Manual activation';
        state.pausedOperations = ['create', 'sniper', 'volume', 'bundle'];

        saveEmergencyState(state);

        return NextResponse.json({
          success: true,
          message: 'Kill switch activated - all operations paused',
        });
      }

      case 'deactivateKillSwitch': {
        state.killSwitchActive = false;
        state.pausedOperations = [];
        state.activatedAt = undefined;
        state.reason = undefined;

        saveEmergencyState(state);

        return NextResponse.json({
          success: true,
          message: 'Kill switch deactivated - operations resumed',
        });
      }

      case 'emergencySell': {
        if (!state.killSwitchActive) {
          return NextResponse.json(
            { error: 'Kill switch must be active to trigger emergency sell' },
            { status: 400 }
          );
        }

        // In production, this would trigger actual sell operations
        state.emergencySellTriggered = true;
        state.emergencySellStatus = {
          initiated: true,
          tokensSold: 0,
          totalTokens: 0,
          solRecovered: 0,
        };

        saveEmergencyState(state);

        return NextResponse.json({
          success: true,
          message: 'Emergency sell initiated',
        });
      }

      case 'pauseOperation': {
        const { operation } = body;

        if (!state.pausedOperations.includes(operation)) {
          state.pausedOperations.push(operation);
        }

        saveEmergencyState(state);

        return NextResponse.json({
          success: true,
          message: `Operation "${operation}" paused`,
        });
      }

      case 'resumeOperation': {
        const { operation } = body;

        state.pausedOperations = state.pausedOperations.filter(op => op !== operation);

        saveEmergencyState(state);

        return NextResponse.json({
          success: true,
          message: `Operation "${operation}" resumed`,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Emergency operation failed:', error);
    return NextResponse.json({ error: 'Emergency operation failed' }, { status: 500 });
  }
}
