import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const children = [];
let isShuttingDown = false;

function stopChildren(exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  process.exitCode = exitCode;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill();
    }
  }
}

function start(label, scriptPath) {
  const child = spawn(process.execPath, [path.join(projectRoot, scriptPath)], {
    cwd: projectRoot,
    env: process.env,
    stdio: 'inherit'
  });
  children.push(child);

  child.once('error', (error) => {
    console.error(`[RigMind] Failed to start ${label}:`, error.message);
    stopChildren(1);
  });
  child.once('exit', (code, signal) => {
    if (!isShuttingDown) {
      if (signal) console.error(`[RigMind] ${label} stopped (${signal}).`);
      stopChildren(code ?? 1);
    }
  });
}

process.once('SIGINT', () => stopChildren(0));
process.once('SIGTERM', () => stopChildren(0));

start('API server', 'server/server.js');
start('Vite development server', 'node_modules/vite/bin/vite.js');