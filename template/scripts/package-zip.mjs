// Packaging script: build Astro (standalone), seed DB, produce platform-specific zip bundles
// Platforms: mac, win, or all

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import archiver from 'archiver';
import { spawnSync as spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function sh(cmd, args, options = {}) {
  const res = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });
  if (res.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
}

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copy(src, dest) {
  // Prefer Node's native recursive copy for reliability
  // Available in Node >=16
  if (fs.cpSync) {
    ensureDir(path.dirname(dest));
    fs.cpSync(src, dest, { recursive: true });
    return;
  }
  // Fallback manual copy
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const entry of fs.readdirSync(src)) {
      copy(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

function writeFile(p, content) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content);
}

function createZip(srcDir, outZip) {
  ensureDir(path.dirname(outZip));
  const output = fs.createWriteStream(outZip);
  const archive = archiver('zip', { zlib: { level: 9 } });
  return new Promise((resolve, reject) => {
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(srcDir, false);
    archive.finalize();
  });
}

function generateReadmeRun(platform, portDefault) {
  const platformName = platform === 'mac' ? 'macOS' : 'Windows';
  return `One-click run (${platformName})\n\n` +
    `1) 安装 Node.js >= 20\n` +
    `2) 双击运行 ${platform === 'mac' ? 'run.command' : 'run.bat'}\n` +
    `3) 程序将自动寻找可用端口（默认从 ${portDefault} 开始，冲突则递增），并自动打开浏览器\n\n` +
    `配置：\n` +
    `- 可在 ./config/.env 中设置 HOST、PORT、NODE_ENV 等\n` +
    `- 日志输出在 ./logs/app.log\n` +
    `- 如需初始化数据库，已在打包阶段执行（如有 seed），或在首次启动时由应用自行初始化（视项目而定）\n` +
    `\n` +
    `许可：\n` +
    `- 见 ./THIRD_PARTY_LICENSES.txt\n`;
}

function generateLicenses() {
  // Try license-checker if available; otherwise create minimal stub from package.json deps
  try {
    const res = spawnSync('node', [path.join(root, 'node_modules', 'license-checker', 'bin', 'license-checker'), '--json'], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });
    if (res.status === 0) {
      const json = JSON.parse(res.stdout.toString('utf-8'));
      const lines = [];
      for (const [pkg, info] of Object.entries(json)) {
        lines.push(`${pkg} | ${info.license} | ${info.repository || ''}`);
      }
      return lines.join('\n') + '\n';
    }
  } catch {}
  const pkg = readJSON(path.join(root, 'package.json'));
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const lines = ['依赖列表（未解析具体许可证）：'];
  for (const [name, ver] of Object.entries(deps)) {
    lines.push(`${name}@${ver}`);
  }
  return lines.join('\n') + '\n';
}

// Find external (unbundled) packages by scanning dist/server code
function findExternalsInDist(distServerDir) {
  const builtins = new Set([
    'node:fs','fs','node:path','path','node:url','url','node:http','http','node:https','https','node:net','net','node:os','os','node:stream','stream','node:zlib','zlib','events','crypto','buffer','timers','tty','child_process','cluster','dns','module','process','worker_threads'
  ]);
  const exts = new Set();
  const isBare = (s) => s && !s.startsWith('.') && !s.startsWith('/') && !s.startsWith('data:') && !s.startsWith('node:');
  const scanFile = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const importRe = /import\s+(?:[^'"\n]+\s+from\s+)?['"]([^'"\n]+)['"];?/g;
    const dynImportRe = /import\(\s*['"]([^'"\n]+)['"]\s*\)/g;
    const requireRe = /require\(\s*['"]([^'"\n]+)['"]\s*\)/g;
    for (const re of [importRe, dynImportRe, requireRe]) {
      let m;
      while ((m = re.exec(content))) {
        const spec = m[1];
        if (isBare(spec) && !builtins.has(spec)) {
          exts.add(spec);
        }
      }
    }
  };
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir)) {
      const p = path.join(dir, entry);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else if (/\.(m?js|cjs|ts)$/.test(entry)) scanFile(p);
    }
  };
  walk(distServerDir);
  return Array.from(exts).sort();
}

function resolveInstalledVersion(pkgName) {
  try {
    const res = spawn('pnpm', ['ls', pkgName, '--depth=0', '--json'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' });
    if (res.status === 0) {
      const arr = JSON.parse(res.stdout.toString('utf-8'));
      // pnpm ls --json may output array per importer
      const item = Array.isArray(arr) ? arr.find(Boolean) : arr;
      const dep = (item && item.dependencies && item.dependencies[pkgName]) || null;
      const version = dep && (dep.version || dep.from);
      if (version) return version;
    }
  } catch {}
  return null;
}

function createMinimalRuntimePackage(outDir, externals) {
  const rootPkg = readJSON(path.join(root, 'package.json'));
  const depsSrc = { ...(rootPkg.dependencies || {}), ...(rootPkg.optionalDependencies || {}) };
  const runtimeDeps = {};
  const missing = [];
  for (const name of externals) {
    if (depsSrc[name]) {
      runtimeDeps[name] = depsSrc[name];
    } else {
      // try resolve installed version from pnpm ls
      const ver = resolveInstalledVersion(name);
      if (ver) {
        runtimeDeps[name] = ver;
      } else {
        missing.push(name);
      }
    }
  }
  if (missing.length) {
    console.warn(`[package-zip] WARN: Some externals not found in root dependencies and could not resolve version: ${missing.join(', ')}`);
    console.warn('[package-zip] You may need to add them to package.json explicitly to ensure install succeeds.');
  }
  const runtimePkg = {
    name: `${rootPkg.name || 'app'}-runtime`,
    private: true,
    type: 'module',
    engines: { node: '>=20' },
    scripts: { start: 'node ./scripts/run.mjs' },
    dependencies: runtimeDeps,
    packageManager: rootPkg.packageManager || undefined,
  };
  writeFile(path.join(outDir, 'package.json'), JSON.stringify(runtimePkg, null, 2));
  // Copy lockfile if present to pin versions
  const lockPath = path.join(root, 'pnpm-lock.yaml');
  if (fs.existsSync(lockPath)) {
    copy(lockPath, path.join(outDir, 'pnpm-lock.yaml'));
  }
  // Copy .npmrc/.pnpmrc if present to preserve registry settings
  const npmrc = path.join(root, '.npmrc');
  if (fs.existsSync(npmrc)) copy(npmrc, path.join(outDir, '.npmrc'));
}

async function main() {
  const arg = (process.argv[2] || 'all').toLowerCase();
  const platforms = arg === 'all' ? ['mac', 'win'] : [arg];
  const pkg = readJSON(path.join(root, 'package.json'));
  const projectName = pkg.name || 'create-astro-exe';
  const version = pkg.version || '0.0.0';

  const releaseRoot = path.join(root, 'release');
  const deliverRoot = path.join(root, 'deliver');

  rmrf(releaseRoot);
  ensureDir(releaseRoot);
  rmrf(deliverRoot);
  ensureDir(deliverRoot);

  // Build
  sh('pnpm', ['run', 'build']);

  // Optional DB seed (if present) — Astro DB v0.18 uses `astro db execute <file>`
  if (fs.existsSync(path.join(root, 'db', 'seed.ts'))) {
    try {
      // If your DB is remote, you can append '--remote'; here we detect by reading logs above, but to be safe you can add '--remote'
      sh('pnpm', ['run', 'astro', 'db', 'execute', 'db/seed.ts']);
    } catch (e) {
      console.warn('[package-zip] DB seed failed or not applicable:', e.message);
    }
  }

  const licensesContent = generateLicenses();

  for (const platform of platforms) {
    const outDir = path.join(releaseRoot, platform);
    ensureDir(outDir);

    // Copy dist
    copy(path.join(root, 'dist'), path.join(outDir, 'dist'));
    // Copy scripts
    copy(path.join(root, 'scripts', 'run.mjs'), path.join(outDir, 'scripts', 'run.mjs'));
    if (platform === 'mac') {
      copy(path.join(root, 'scripts', 'run.command'), path.join(outDir, 'run.command'));
      // chmod +x
      try { fs.chmodSync(path.join(outDir, 'run.command'), 0o755); } catch {}
    } else {
      copy(path.join(root, 'scripts', 'run.bat'), path.join(outDir, 'run.bat'));
    }

    // Ensure local DB presence for file-based config (e.g., ASTRO_DATABASE_FILE=file:./db/local.db)
    const dbDirOut = path.join(outDir, 'db');
    ensureDir(dbDirOut);
    const localDbSrc = path.join(root, 'db', 'local.db');
    const localDbOut = path.join(dbDirOut, 'local.db');
    if (fs.existsSync(localDbSrc)) {
      copy(localDbSrc, localDbOut);
    } else {
      // Create an empty file to allow libsql to open; some drivers create file on first connect
      writeFile(localDbOut, '');
    }

    // Config: copy sample and concrete env if present
    const envSamplePath = path.join(root, 'config', '.env.sample');
    if (fs.existsSync(envSamplePath)) {
      copy(envSamplePath, path.join(outDir, 'config', '.env.sample'));
    } else {
      writeFile(
        path.join(outDir, 'config', '.env.sample'),
        [
          'HOST=127.0.0.1',
          'PORT=4321',
          'NODE_ENV=production',
          '',
          '# 数据库（可选）：如使用本地文件数据库',
          '# ASTRO_DATABASE_FILE=file:./db/local.db',
          '# ASTRO_DB_REMOTE_URL=file:./db/local.db',
          ''
        ].join('\n')
      );
    }
    // If root .env exists, ship it as runtime config
    const rootEnv = path.join(root, '.env');
    if (fs.existsSync(rootEnv)) {
      copy(rootEnv, path.join(outDir, 'config', '.env'));
    }

    // README-run
    writeFile(path.join(outDir, 'README-run.txt'), generateReadmeRun(platform, 4321));

    // Licenses
    writeFile(path.join(outDir, 'THIRD_PARTY_LICENSES.txt'), licensesContent);

    // Generate minimal runtime package.json with only external (unbundled) dependencies
    const externals = findExternalsInDist(path.join(outDir, 'dist', 'server'));
    console.log(`[package-zip] Detected externals: ${externals.join(', ') || '(none)'}`);
    createMinimalRuntimePackage(outDir, externals);

    // Zip
    const zipName = `${projectName}-${platform}-${version}.zip`;
    const zipPath = path.join(deliverRoot, zipName);
    console.log(`[package-zip] Creating ${zipName} ...`);
    await createZip(outDir, zipPath);
    console.log(`[package-zip] Done: ${zipPath}`);
  }
}

main().catch((e) => {
  console.error('[package-zip] Failed:', e);
  process.exit(1);
});
