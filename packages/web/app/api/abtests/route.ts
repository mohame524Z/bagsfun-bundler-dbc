import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const TESTS_FILE = path.join(DATA_DIR, 'abtests.json');

interface ABTest {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variantA: {
    name: string;
    config: Record<string, any>;
    results: {
      trials: number;
      successRate: number;
      avgProfit: number;
      avgGasUsed: number;
      totalProfit: number;
    };
  };
  variantB: {
    name: string;
    config: Record<string, any>;
    results: {
      trials: number;
      successRate: number;
      avgProfit: number;
      avgGasUsed: number;
      totalProfit: number;
    };
  };
  winner?: 'A' | 'B' | 'tie';
  confidence?: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  targetTrials: number;
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(TESTS_FILE)) {
  fs.writeFileSync(TESTS_FILE, JSON.stringify([], null, 2));
}

function loadTests(): ABTest[] {
  try {
    return JSON.parse(fs.readFileSync(TESTS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveTests(tests: ABTest[]) {
  fs.writeFileSync(TESTS_FILE, JSON.stringify(tests, null, 2));
}

// Statistical significance calculation (simplified Z-test)
function calculateSignificance(variantA: any, variantB: any): { winner: 'A' | 'B' | 'tie', confidence: number } {
  const trialsA = variantA.results.trials;
  const trialsB = variantB.results.trials;

  if (trialsA < 10 || trialsB < 10) {
    return { winner: 'tie', confidence: 0 };
  }

  const successA = variantA.results.successRate / 100;
  const successB = variantB.results.successRate / 100;

  const pooled = ((successA * trialsA) + (successB * trialsB)) / (trialsA + trialsB);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / trialsA + 1 / trialsB));

  if (se === 0) {
    return { winner: 'tie', confidence: 0 };
  }

  const z = Math.abs(successA - successB) / se;
  const confidence = Math.min(99.9, (1 - Math.exp(-z * z / 2)) * 100);

  let winner: 'A' | 'B' | 'tie' = 'tie';
  if (confidence > 95) {
    winner = successA > successB ? 'A' : 'B';
  }

  return { winner, confidence };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    if (action === 'list') {
      const tests = loadTests();
      return NextResponse.json({ success: true, tests });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      const { name, variantA, variantB, targetTrials } = body;

      const tests = loadTests();
      const newTest: ABTest = {
        id: `test_${Date.now()}`,
        name,
        status: 'draft',
        variantA: {
          name: variantA.name,
          config: variantA.config,
          results: {
            trials: 0,
            successRate: 0,
            avgProfit: 0,
            avgGasUsed: 0,
            totalProfit: 0,
          },
        },
        variantB: {
          name: variantB.name,
          config: variantB.config,
          results: {
            trials: 0,
            successRate: 0,
            avgProfit: 0,
            avgGasUsed: 0,
            totalProfit: 0,
          },
        },
        targetTrials: targetTrials || 50,
        createdAt: Date.now(),
      };

      tests.unshift(newTest);
      saveTests(tests);

      return NextResponse.json({ success: true, test: newTest });
    }

    if (action === 'start') {
      const { testId } = body;
      const tests = loadTests();
      const test = tests.find(t => t.id === testId);

      if (!test) {
        return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 });
      }

      if (test.status !== 'draft' && test.status !== 'paused') {
        return NextResponse.json(
          { success: false, error: 'Test must be in draft or paused status' },
          { status: 400 }
        );
      }

      test.status = 'running';
      test.startedAt = test.startedAt || Date.now();
      saveTests(tests);

      return NextResponse.json({ success: true, test });
    }

    if (action === 'pause') {
      const { testId } = body;
      const tests = loadTests();
      const test = tests.find(t => t.id === testId);

      if (!test) {
        return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 });
      }

      test.status = 'paused';
      saveTests(tests);

      return NextResponse.json({ success: true, test });
    }

    if (action === 'recordResult') {
      const { testId, variant, success, profit, gasUsed } = body;
      const tests = loadTests();
      const test = tests.find(t => t.id === testId);

      if (!test) {
        return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 });
      }

      if (test.status !== 'running') {
        return NextResponse.json(
          { success: false, error: 'Test must be running to record results' },
          { status: 400 }
        );
      }

      const variantData = variant === 'A' ? test.variantA : test.variantB;
      const results = variantData.results;

      // Update results
      results.trials += 1;
      results.totalProfit += profit;
      const previousSuccesses = (results.successRate / 100) * (results.trials - 1);
      results.successRate = ((previousSuccesses + (success ? 1 : 0)) / results.trials) * 100;
      results.avgProfit = results.totalProfit / results.trials;

      const previousAvgGas = results.avgGasUsed;
      results.avgGasUsed = ((previousAvgGas * (results.trials - 1)) + gasUsed) / results.trials;

      // Check if test is complete
      const totalTrials = test.variantA.results.trials + test.variantB.results.trials;
      if (totalTrials >= test.targetTrials) {
        test.status = 'completed';
        test.completedAt = Date.now();

        // Calculate winner
        const significance = calculateSignificance(test.variantA, test.variantB);
        test.winner = significance.winner;
        test.confidence = significance.confidence;
      }

      saveTests(tests);

      return NextResponse.json({ success: true, test });
    }

    if (action === 'complete') {
      const { testId } = body;
      const tests = loadTests();
      const test = tests.find(t => t.id === testId);

      if (!test) {
        return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 });
      }

      test.status = 'completed';
      test.completedAt = Date.now();

      // Calculate winner
      const significance = calculateSignificance(test.variantA, test.variantB);
      test.winner = significance.winner;
      test.confidence = significance.confidence;

      saveTests(tests);

      return NextResponse.json({ success: true, test });
    }

    if (action === 'delete') {
      const { testId } = body;
      const tests = loadTests();
      const filteredTests = tests.filter(t => t.id !== testId);
      saveTests(filteredTests);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
