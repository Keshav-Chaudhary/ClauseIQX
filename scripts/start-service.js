#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const service = (process.env.SERVICE || process.env.APP || '').toLowerCase();
const publicPort = process.env.PORT || '3000';
const nodeBin = process.execPath;
const nextBin = path.join(ROOT_DIR, 'node_modules', 'next', 'dist', 'bin', 'next');

function spawnProcess(cmd, args, options = {}) {
  const child = spawn(cmd, args, {
    stdio: 'inherit',
    cwd: ROOT_DIR,
    ...options,
  });

  child.on('error', (err) => {
    console.error(`[Process Error] Failed to start ${cmd} ${args.join(' ')}:`, err);
  });

  return child;
}

if (service === 'api') {
  console.log(`[ClauseIQX] Starting dedicated API service on port ${publicPort}...`);
  const apiProcess = spawnProcess(nodeBin, [path.join(ROOT_DIR, 'apps', 'api', 'dist', 'main.js')], {
    env: { ...process.env, PORT: publicPort },
  });

  apiProcess.on('exit', (code) => {
    process.exit(code || 0);
  });
} else if (service === 'web') {
  console.log(`[ClauseIQX] Starting dedicated Next.js Web service on port ${publicPort}...`);
  const webDir = path.join(ROOT_DIR, 'apps', 'web');
  const webProcess = spawnProcess(nodeBin, [nextBin, 'start', '-p', publicPort], {
    cwd: webDir,
    env: { ...process.env, PORT: publicPort },
  });

  webProcess.on('exit', (code) => {
    process.exit(code || 0);
  });
} else if (service === 'worker') {
  console.log('[ClauseIQX] Starting dedicated Document Processing Worker...');
  const workerProcess = spawnProcess(nodeBin, [path.join(ROOT_DIR, 'workers', 'document-processing', 'dist', 'index.js')]);

  workerProcess.on('exit', (code) => {
    process.exit(code || 0);
  });
} else {
  // Unified Full-Stack Single-Service Mode (Standard for single Render Web Service)
  const internalApiPort = process.env.INTERNAL_API_PORT || '4000';
  console.log('========================================================');
  console.log('[ClauseIQX] Launching Unified Full-Stack Service');
  console.log(`  → Public Web Port:  ${publicPort}`);
  console.log(`  → Internal API Port: ${internalApiPort}`);
  console.log('========================================================');

  // 1. Start Internal Express API
  const apiProcess = spawnProcess(nodeBin, [path.join(ROOT_DIR, 'apps', 'api', 'dist', 'main.js')], {
    env: {
      ...process.env,
      PORT: internalApiPort,
      NODE_ENV: process.env.NODE_ENV || 'production',
    },
  });

  // 2. Start Next.js on Public Port
  const webDir = path.join(ROOT_DIR, 'apps', 'web');
  const webProcess = spawnProcess(nodeBin, [nextBin, 'start', '-p', publicPort], {
    cwd: webDir,
    env: {
      ...process.env,
      PORT: publicPort,
      INTERNAL_API_URL: `http://127.0.0.1:${internalApiPort}`,
    },
  });

  const cleanup = () => {
    console.log('[ClauseIQX] Shutting down services gracefully...');
    try {
      apiProcess.kill('SIGTERM');
    } catch (_) {}
    try {
      webProcess.kill('SIGTERM');
    } catch (_) {}
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  apiProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[API Exited] Code: ${code}`);
      cleanup();
    }
  });

  webProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[Web Exited] Code: ${code}`);
      cleanup();
    }
  });
}
