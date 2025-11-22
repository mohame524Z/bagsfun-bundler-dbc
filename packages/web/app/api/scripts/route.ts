import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { VM } from 'vm2';

const DATA_DIR = path.join(process.cwd(), 'data');
const SCRIPTS_FILE = path.join(DATA_DIR, 'custom-scripts.json');

interface CustomScript {
  id: string;
  name: string;
  code: string;
  trigger: 'manual' | 'interval' | 'event';
  intervalMinutes?: number;
  eventType?: string;
  enabled: boolean;
  lastRun?: number;
  executions: number;
  successCount: number;
  failureCount: number;
  createdAt: number;
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(SCRIPTS_FILE)) {
  fs.writeFileSync(SCRIPTS_FILE, JSON.stringify({ scripts: [] }, null, 2));
}

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(SCRIPTS_FILE, 'utf-8'));
  } catch {
    return { scripts: [] };
  }
}

function saveData(data: any) {
  fs.writeFileSync(SCRIPTS_FILE, JSON.stringify(data, null, 2));
}

export async function GET(request: NextRequest) {
  try {
    const data = loadData();
    return NextResponse.json({ success: true, scripts: data.scripts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    const data = loadData();

    if (action === 'create') {
      const { name, code, trigger, intervalMinutes, eventType } = body;

      const newScript: CustomScript = {
        id: `script_${Date.now()}`,
        name,
        code,
        trigger,
        intervalMinutes,
        eventType,
        enabled: false,
        executions: 0,
        successCount: 0,
        failureCount: 0,
        createdAt: Date.now(),
      };

      data.scripts.push(newScript);
      saveData(data);

      return NextResponse.json({ success: true, script: newScript });
    }

    if (action === 'execute') {
      const { scriptId } = body;
      const script = data.scripts.find((s: CustomScript) => s.id === scriptId);

      if (!script) {
        return NextResponse.json({ success: false, error: 'Script not found' }, { status: 404 });
      }

      try {
        // Execute script in sandboxed environment
        const vm = new VM({
          timeout: 5000,
          sandbox: {
            console: {
              log: (...args: any[]) => console.log('[Script]', ...args),
            },
          },
        });

        const result = vm.run(script.code);

        // Update stats
        script.executions++;
        script.successCount++;
        script.lastRun = Date.now();
        saveData(data);

        return NextResponse.json({ success: true, result, script });
      } catch (error: any) {
        script.executions++;
        script.failureCount++;
        script.lastRun = Date.now();
        saveData(data);

        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    if (action === 'toggle') {
      const { scriptId } = body;
      const script = data.scripts.find((s: CustomScript) => s.id === scriptId);

      if (!script) {
        return NextResponse.json({ success: false, error: 'Script not found' }, { status: 404 });
      }

      script.enabled = !script.enabled;
      saveData(data);

      return NextResponse.json({ success: true, script });
    }

    if (action === 'delete') {
      const { scriptId } = body;
      data.scripts = data.scripts.filter((s: CustomScript) => s.id !== scriptId);
      saveData(data);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
