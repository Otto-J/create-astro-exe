// One-click runtime launcher for Astro Node adapter (standalone)
// - Reads ./config/.env (if present)
// - Finds available port (auto-increment if occupied)
// - Starts dist/server/entry.mjs
// - Opens default browser
// - Ensures logs directory exists (shell script handles redirection)

import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function parseEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[key] = val;
  }
  return env;
}

function ensureLogsDir() {
  const logsDir = path.join(rootDir, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

function checkPortAvailability(host, port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        // Unknown error: assume unavailable
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen({ host, port });
  });
}

async function findAvailablePort(host, startPort, maxAttempts = 50) {
  let port = Number(startPort) || 4321;
  for (let i = 0; i < maxAttempts; i++) {
    // Note: On Windows, binding 0.0.0.0 may conflict. Prefer explicit host from config.
    const available = await checkPortAvailability(host, port);
    if (available) return port;
    port += 1;
  }
  throw new Error(`No available port found starting from ${startPort}, tried ${maxAttempts} ports.`);
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const ok = await new Promise((resolve) => {
        const req = http.get(url, (res) => {
          // Any HTTP response means server is up
          res.resume();
          resolve(true);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(2000, () => {
          req.destroy();
          resolve(false);
        });
      });
      if (ok) return true;
    } catch {}
    await delay(500);
  }
  return false;
}

function openBrowser(url) {
  const platform = process.platform;
  if (platform === 'darwin') {
    spawn('open', [url], { stdio: 'ignore', detached: true }).unref();
    return;
  }
  if (platform === 'win32') {
    // Use cmd 'start' to open default browser
    spawn('cmd', ['/c', 'start', '', url], { stdio: 'ignore', detached: true }).unref();
    return;
  }
  // Linux & others
  spawn('xdg-open', [url], { stdio: 'ignore', detached: true }).unref();
}

async function main() {
  ensureLogsDir();

  // Load env from ./config/.env if present (fallback to process.env)
  const envFromFile = parseEnvFile(path.join(rootDir, 'config', '.env'));
  let HOST = envFromFile.HOST || process.env.HOST || '127.0.0.1';
  const START_PORT = envFromFile.PORT || process.env.PORT || '4321';
  const NODE_ENV = envFromFile.NODE_ENV || process.env.NODE_ENV || 'production';

  process.env.NODE_ENV = NODE_ENV;

  const port = await findAvailablePort(HOST, Number(START_PORT));
  process.env.PORT = String(port);
  process.env.HOST = HOST;

  // For browser opening, avoid using 0.0.0.0; map to localhost
  const browserHost = HOST === '0.0.0.0' ? '127.0.0.1' : HOST;
  const url = `http://${browserHost}:${port}/`;
  console.log(`[create-astro-exe] Starting server at ${url} (NODE_ENV=${NODE_ENV})`);

  // Import server entry; Node adapter standalone will start the server
  const entryPath = path.join(rootDir, 'dist', 'server', 'entry.mjs');
  if (!fs.existsSync(entryPath)) {
    console.error(`[create-astro-exe] Server entry not found: ${entryPath}`);
    process.exit(1);
  }

  try {
    await import(entryPath);
  } catch (err) {
    console.error('[create-astro-exe] Failed to start server:', err);
    process.exit(1);
  }

  const up = await waitForServer(url, 30000);
  if (up) {
    console.log(`[create-astro-exe] Server is up, opening browser: ${url}`);
    openBrowser(url);
  } else {
    console.warn('[create-astro-exe] Server did not become ready in time; please open the URL manually:', url);
  }
}

main().catch((e) => {
  console.error('[create-astro-exe] Unexpected error:', e);
  process.exit(1);
});
