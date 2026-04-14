import { execSync } from 'node:child_process';

const PORTS = [3000, 4000];

function run(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

function killOnWindows() {
  const output = run('netstat -ano -p tcp');
  const pids = new Set();

  for (const line of output.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('TCP')) {
      continue;
    }

    const parts = trimmed.split(/\s+/);
    const localAddress = parts[1] || '';
    const state = (parts[3] || '').toUpperCase();
    const pid = parts[4] || '';

    const matchesPort = PORTS.some((port) => localAddress.endsWith(`:${port}`));
    if (matchesPort && state === 'LISTENING' && pid && pid !== '0') {
      pids.add(pid);
    }
  }

  for (const pid of pids) {
    run(`taskkill /PID ${pid} /F`);
  }

  return pids.size;
}

function killOnUnix() {
  const targets = PORTS.map((port) => `${port}/tcp`).join(' ');
  run(`fuser -k ${targets}`);
  return 0;
}

const killed = process.platform === 'win32' ? killOnWindows() : killOnUnix();
if (process.platform === 'win32') {
  console.log(`Killed ${killed} process(es) on ports ${PORTS.join(', ')}`);
}
