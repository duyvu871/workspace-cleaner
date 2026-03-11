import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFile } from 'child_process';
import { z } from 'zod';

const app = express();
const PORT = 3456;
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ── Scan Targets ─────────────────────────────────────────────────────────────

interface TargetConfig {
  label: string;
  icon: string;
  folders: string[];
}

const SCAN_TARGETS: Record<string, TargetConfig> = {
  node:   { label: 'Node.js',     icon: 'hexagon',   folders: ['node_modules'] },
  python: { label: 'Python',      icon: 'egg',       folders: ['__pycache__', '.venv', 'venv', '.tox', '.eggs', '.mypy_cache', '.pytest_cache'] },
  java:   { label: 'Java',        icon: 'coffee',    folders: ['target', '.gradle', '.mvn'] },
  php:    { label: 'PHP',         icon: 'code',      folders: ['vendor'] },
  dotnet: { label: 'C# / .NET',   icon: 'binary',    folders: ['bin', 'obj'] },
  build:  { label: 'Build Art.',  icon: 'package',   folders: ['dist', 'build', 'out', '.next', '.nuxt', '.sass-cache'] },
  docker: { label: 'Docker (IMG)',icon: 'container', folders: ['docker-compose-data', '.docker'] },
  docker_vol: { label: 'Docker (VOL)', icon: 'database', folders: [] },
  system: { label: 'System',      icon: 'settings',  folders: ['Cache', 'cache', 'CachedData', 'logs', 'tmp', 'temp', '.Trash', '$RECYCLE.BIN'] },
};

const ALL_TARGET_FOLDERS = new Set(
  Object.values(SCAN_TARGETS).flatMap((t) => t.folders)
);

app.use(express.json());
app.use(express.static(path.join(PROJECT_ROOT, 'public')));

// ── Zod Schemas ──────────────────────────────────────────────────────────────

const ScanSchema = z.object({
  rootPath: z
    .string()
    .min(1, 'Path is required')
    .refine((p) => path.isAbsolute(p), 'Must be an absolute path')
    .refine((p) => !p.includes('..'), 'Path traversal not allowed')
    .refine((p) => fs.existsSync(p), 'Path does not exist'),
  targets: z
    .string()
    .transform((s) => s.split(',').filter(Boolean))
    .pipe(z.array(z.enum(Object.keys(SCAN_TARGETS) as [string, ...string[]])).min(1, 'At least one target')),
});

const DeleteSchema = z.object({
  paths: z
    .array(
      z
        .string()
        .refine((p) => {
          if (p.startsWith('docker-image:')) return true;
          if (p.startsWith('docker-volume:')) return true;
          return path.isAbsolute(p) && !p.includes('..') && (
            [...ALL_TARGET_FOLDERS].some((name) => p.includes(name)) ||
            p.includes('trash') || p.includes('cache') || p.includes('dist') || p.includes('build')
          );
        }, 'Invalid path')
    )
    .min(1, 'At least one path required'),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const SKIP_DIRS = new Set([
  '.git', '.cache', '.local', '.config', '.npm', '.nvm',
  '.yarn', '.pnpm-store', 'Library', 'proc', 'sys', 'dev',
]);

/**
 * Get folder size using OS-native `du` (fast for deep trees).
 */
function getFolderSize(folderPath: string): Promise<number> {
  return new Promise((resolve) => {
    execFile('du', ['-sb', folderPath], { timeout: 15000 }, (err, stdout) => {
      if (err) return resolve(0);
      const sizeStr = stdout.split('\t')[0];
      const size = parseInt(sizeStr, 10);
      resolve(isNaN(size) ? 0 : size);
    });
  });
}

/**
 * Get last modified time of a directory.
 */
function getLastModified(folderPath: string): string | null {
  try {
    return fs.statSync(folderPath).mtime.toISOString();
  } catch {
    return null;
  }
}

/**
 * Build set of target folder names from selected target keys.
 */
function buildTargetSet(targetKeys: string[]): Set<string> {
  const names = new Set<string>();
  for (const key of targetKeys) {
    if (SCAN_TARGETS[key]) {
      for (const f of SCAN_TARGETS[key].folders) names.add(f);
    }
  }
  return names;
}

/**
 * Find which target category a folder name belongs to.
 */
function getTargetCategory(folderName: string): string | null {
  for (const [key, cfg] of Object.entries(SCAN_TARGETS)) {
    if (cfg.folders.includes(folderName)) return key;
  }
  return null;
}

/**
 * Parse size string (e.g., "1.2GB", "500MB") into bytes.
 */
function parseDockerSize(sizeStr: string): number {
  let exactSize = 0;
  const match = sizeStr.trim().match(/^([\d.]+)\s?(MB|GB|KB|B|kB|mB|gB|b)$/i);
  if (match) {
    const val = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    if (unit === 'GB') exactSize = val * 1024 * 1024 * 1024;
    else if (unit === 'MB') exactSize = val * 1024 * 1024;
    else if (unit === 'KB') exactSize = val * 1024;
    else exactSize = val;
  }
  return exactSize;
}

/**
 * Scan docker images using CLI.
 */
function scanDockerImages(res: Response): Promise<void> {
  return new Promise((resolve) => {
    execFile(
      'docker',
      ['images', '--format', '{{.ID}}|{{.Repository}}|{{.Tag}}|{{.CreatedAt}}|{{.Size}}'],
      (err, stdout) => {
        if (err) return resolve();
        const lines = stdout.split('\n').filter(Boolean);
        for (const line of lines) {
          const [id, repo, tag, createdAt, sizeStr] = line.split('|');
          const exactSize = parseDockerSize(sizeStr || '');

          let name = repo;
          if (tag && tag !== '<none>') name += `:${tag}`;

          sendSSE(res, 'result', {
            path: `docker-image:${id}`,
            size: exactSize,
            lastModified: createdAt,
            projectName: name,
            parentPath: 'Docker Hub / Local Engine',
            folderName: 'docker-image',
            category: 'docker',
            isVirtual: true,
          });
        }
        resolve();
      }
    );
  });
}

/**
 * Scan docker volumes using CLI.
 */
function scanDockerVolumes(res: Response): Promise<void> {
  return new Promise((resolve) => {
    // We use docker system df -v to get volume sizes
    execFile('docker', ['system', 'df', '-v'], (err, stdout) => {
      if (err) return resolve();

      // Find the volumes section
      const lines = stdout.split('\n');
      let inVolumes = false;
      for (const line of lines) {
        if (line.startsWith('Local Volumes:')) {
          inVolumes = true;
          continue;
        }
        if (inVolumes && line.startsWith('VOLUME NAME')) continue;
        if (inVolumes && line.trim() === '') {
          // Check if we hit the next section (like Build Cache)
          if (line.includes('Build cache') || line.includes('Images') || line.includes('Containers')) {
            inVolumes = false;
            continue;
          }
        }
        
        if (inVolumes && line.trim()) {
          // Format is usually: VOLUME NAME  LINKS  SIZE
          const parts = line.trim().split(/\s{2,}/);
          if (parts.length >= 3) {
            const name = parts[0];
            const sizeStr = parts[2];
            const exactSize = parseDockerSize(sizeStr);

            sendSSE(res, 'result', {
              path: `docker-volume:${name}`,
              size: exactSize,
              lastModified: new Date().toISOString(),
              projectName: name,
              parentPath: 'Docker Volumes',
              folderName: 'docker-volume',
              category: 'docker_vol',
              isVirtual: true,
            });
          }
        }
      }
      resolve();
    });
  });
}

/**
 * Recursively scan for target folders, streaming results via SSE.
 */
async function scanDirectory(rootPath: string, targetKeys: string[], res: Response): Promise<void> {
  const targetNames = buildTargetSet(targetKeys);
  let found = 0;
  let scanned = 0;

  // Some targets (like __pycache__) exist inside projects — don't skip on match,
  // but DO skip recursing into heavy ones like node_modules, venv, target.
  const NO_RECURSE = new Set(['node_modules', '.venv', 'venv', 'target', '.gradle']);

  async function walk(dirPath: string, depth = 0) {
    if (depth > 15) return;

    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const fullPath = path.join(dirPath, entry.name);

      // Self-exclusion
      if (fullPath.startsWith(PROJECT_ROOT)) continue;

      // Skip hidden/system dirs (but allow target folders that start with '.')
      if (SKIP_DIRS.has(entry.name)) continue;
      if (entry.name.startsWith('.') && !targetNames.has(entry.name)) continue;

      if (targetNames.has(entry.name)) {
        found++;
        const [size, lastModified] = await Promise.all([
          getFolderSize(fullPath),
          Promise.resolve(getLastModified(fullPath)),
        ]);

        const parentDir = path.dirname(fullPath);
        const projectName = path.basename(parentDir);
        const category = getTargetCategory(entry.name);

        sendSSE(res, 'result', {
          path: fullPath,
          size,
          lastModified,
          projectName,
          parentPath: parentDir,
          folderName: entry.name,
          category,
        });

        // Don't recurse into heavy folders
        if (NO_RECURSE.has(entry.name)) continue;
      }

      scanned++;
      if (scanned % 50 === 0) {
        sendSSE(res, 'progress', { currentDir: dirPath, scanned });
      }

      await walk(fullPath, depth + 1);
    }
  }

  // Scan filesystem
  await walk(rootPath);

  // Scan virtual targets (Docker)
  if (targetKeys.includes('docker')) {
    await scanDockerImages(res);
  }
  if (targetKeys.includes('docker_vol')) {
    await scanDockerVolumes(res);
  }

  sendSSE(res, 'done', { total: found, scanned });
}

/**
 * Send a Server-Sent Event.
 */
function sendSSE(res: Response, event: string, data: any) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ── Routes ───────────────────────────────────────────────────────────────────

app.get('/api/system-info', (_req: Request, res: Response) => {
  res.json({
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    homedir: os.homedir(),
    release: os.release(),
    targets: Object.entries(SCAN_TARGETS).map(([key, cfg]) => ({
      key,
      label: cfg.label,
      icon: cfg.icon,
      folders: cfg.folders,
    })),
  });
});

app.get('/api/scan', (req: Request, res: Response) => {
  const result = ScanSchema.safeParse({
    rootPath: req.query.rootPath,
    targets: req.query.targets || '',
  });

  if (!result.success) {
    res.status(400).json({
      error: result.error.issues.map((i) => i.message).join(', '),
    });
    return;
  }

  const targetKeys = result.data.targets;

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  req.on('close', () => res.end());

  scanDirectory(result.data.rootPath, targetKeys, res).catch((err) => {
    sendSSE(res, 'error', { message: err.message });
    res.end();
  });
});

app.post('/api/delete', async (req: Request, res: Response) => {
  const result = DeleteSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: result.error.issues.map((i) => i.message).join(', '),
    });
    return;
  }

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const paths = result.data.paths;

  for (const folderPath of paths) {
    try {
      if (folderPath.startsWith('docker-image:')) {
        const id: string = folderPath.split(':')[1];
        await new Promise<void>((resolve, reject) => {
          execFile('docker', ['rmi', '-f', id], { timeout: 60000 }, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } else if (folderPath.startsWith('docker-volume:')) {
        const name: string = folderPath.split(':')[1];
        await new Promise<void>((resolve, reject) => {
          execFile('docker', ['volume', 'rm', '-f', name], { timeout: 60000 }, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } else {
        await new Promise<void>((resolve, reject) => {
          execFile('rm', ['-rf', folderPath], { timeout: 60000 }, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      sendSSE(res, 'deleted', { path: folderPath, success: true });
    } catch (err: any) {
      sendSSE(res, 'deleted', {
        path: folderPath,
        success: false,
        error: err.message,
      });
    }
  }

  sendSSE(res, 'delete-done', { total: paths.length });
  res.end();
});

// ── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  🗂  Workspace Cleaner`);
  console.log(`  → http://localhost:${PORT}`);
  console.log(`  → OS: ${os.platform()} (${os.arch()})`);
  console.log(`  → Home: ${os.homedir()}\n`);
});
