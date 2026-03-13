#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function logPrefix(prefix, msg) {
  const lines = msg.toString().split(/\r?\n/).filter(Boolean);
  lines.forEach(line => console.log(`${prefix} ${line}`));
}

function runCommand(command, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      ...opts,
    });

    proc.stdout.on('data', data => logPrefix(opts.prefix || '', data));
    proc.stderr.on('data', data => logPrefix(opts.prefix || '', data));

    proc.on('error', err => reject(err));
    proc.on('exit', code => {
      if (code === 0) return resolve();
      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

async function ensureInstalled(dir) {
  const lockfile = path.join(dir, 'package-lock.json');
  const nodeModules = path.join(dir, 'node_modules');

  if (fs.existsSync(lockfile) || fs.existsSync(nodeModules)) {
    // assume already installed
    return;
  }

  console.log(`Installing dependencies in ${dir}`);
  await runCommand('npm', ['install'], { cwd: dir, prefix: `[npm:${path.basename(dir)}]` });
}

async function main() {
  const root = path.resolve(__dirname, '..');

  console.log('Starting infrastructure (Postgres + Redis) via docker compose...');
  try {
    await runCommand('docker', ['compose', 'up', '-d'], { prefix: '[docker]' });
  } catch (err) {
    console.warn('Unable to start docker compose automatically. If you do not have Docker installed, start Postgres/Redis manually.');
    console.warn(err.message);
  }

  // Make sure dependencies exist for each service
  await ensureInstalled(path.join(root, 'api-server'));
  await ensureInstalled(path.join(root, 'socket-server'));
  await ensureInstalled(path.join(root, 'client'));

  console.log('Starting API server (port 3001)');
  const api = spawn('npm', ['run', 'dev'], {
    cwd: path.join(root, 'api-server'),
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  api.stdout.on('data', d => logPrefix('[api]', d));
  api.stderr.on('data', d => logPrefix('[api]', d));

  console.log('Starting Socket server');
  const socket = spawn('npm', ['run', 'dev'], {
    cwd: path.join(root, 'socket-server'),
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  socket.stdout.on('data', d => logPrefix('[socket]', d));
  socket.stderr.on('data', d => logPrefix('[socket]', d));

  console.log('Starting Next.js frontend (port 3000)');
  const client = spawn('npm', ['run', 'dev'], {
    cwd: path.join(root, 'client'),
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  client.stdout.on('data', d => logPrefix('[client]', d));
  client.stderr.on('data', d => logPrefix('[client]', d));

  const cleanup = () => {
    console.log('Shutting down child processes...');
    [api, socket, client].forEach(p => {
      if (p && !p.killed) {
        p.kill();
      }
    });
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

  console.log('All services started (or are starting).');
  console.log('  - Frontend: http://localhost:3000');
  console.log('  - API:      http://localhost:3001');
  console.log('  - Socket:   http://localhost:4000 (if used)');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
