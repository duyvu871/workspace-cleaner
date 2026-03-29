import fs from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import { fdir } from 'fdir'
import type { ScanResult, ScanProgress, ScanDone } from '@shared/types'
import {
  buildTargetSet,
  getTargetCategory,
  NO_RECURSE,
  SKIP_DIRS,
} from './scan-targets'
import { z } from 'zod'
import { SCAN_TARGETS } from './scan-targets'

// ── Validation ────────────────────────────────────────────────────────────────

export const ScanSchema = z.object({
  rootPath: z
    .string()
    .min(1, 'Path is required')
    .refine((p) => path.isAbsolute(p), 'Must be an absolute path')
    .refine((p) => !p.includes('..'), 'Path traversal not allowed')
    .refine((p) => {
      try {
        return fs.existsSync(p)
      } catch {
        return false
      }
    }, 'Path does not exist'),
  targets: z
    .array(z.enum(Object.keys(SCAN_TARGETS) as [string, ...string[]]))
    .min(1, 'At least one target required'),
  fileSizeThreshold: z
    .number()
    .int()
    .min(1, 'Threshold must be at least 1 byte')
    .optional(),
  fileFilter: z
    .object({ extensions: z.array(z.string()) })
    .optional(),
})

export type ScanInput = z.infer<typeof ScanSchema>

// ── Event callbacks ───────────────────────────────────────────────────────────

export interface ScanEmitter {
  result(data: ScanResult): void
  progress(data: ScanProgress): void
  done(data: ScanDone): void
  error(message: string): void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFolderSize(folderPath: string): Promise<number> {
  return new Promise((resolve) => {
    execFile('du', ['-sb', folderPath], { timeout: 15_000 }, (err, stdout) => {
      if (err) return resolve(0)
      const size = parseInt(stdout.split('\t')[0], 10)
      resolve(isNaN(size) ? 0 : size)
    })
  })
}

function getLastModified(folderPath: string): string | null {
  try {
    return fs.statSync(folderPath).mtime.toISOString()
  } catch {
    return null
  }
}

function parseDockerSize(sizeStr: string): number {
  const match = sizeStr.trim().match(/^([\d.]+)\s?(MB|GB|KB|B|kB|mB|gB|b)$/i)
  if (!match) return 0
  const val = parseFloat(match[1])
  const unit = match[2].toUpperCase()
  if (unit === 'GB') return val * 1024 * 1024 * 1024
  if (unit === 'MB') return val * 1024 * 1024
  if (unit === 'KB') return val * 1024
  return val
}

// ── Docker targets ────────────────────────────────────────────────────────────

function scanDockerImages(emit: ScanEmitter): Promise<void> {
  return new Promise((resolve) => {
    execFile(
      'docker',
      ['images', '--format', '{{.ID}}|{{.Repository}}|{{.Tag}}|{{.CreatedAt}}|{{.Size}}'],
      (err, stdout) => {
        if (err) return resolve()
        for (const line of stdout.split('\n').filter(Boolean)) {
          const [id, repo, tag, createdAt, sizeStr] = line.split('|')
          const exactSize = parseDockerSize(sizeStr || '')
          const name = tag && tag !== '<none>' ? `${repo}:${tag}` : repo
          emit.result({
            path: `docker-image:${id}`,
            size: exactSize,
            lastModified: createdAt,
            projectName: name,
            parentPath: 'Docker Hub / Local Engine',
            folderName: 'docker-image',
            category: 'docker',
            isVirtual: true,
          })
        }
        resolve()
      }
    )
  })
}

function scanDockerVolumes(emit: ScanEmitter): Promise<void> {
  return new Promise((resolve) => {
    execFile('docker', ['system', 'df', '-v'], (err, stdout) => {
      if (err) return resolve()
      const lines = stdout.split('\n')
      let inVolumes = false
      for (const line of lines) {
        if (line.startsWith('Local Volumes:')) { inVolumes = true; continue }
        if (inVolumes && line.startsWith('VOLUME NAME')) continue
        if (inVolumes && line.trim() === '') { inVolumes = false; continue }
        if (!inVolumes || !line.trim()) continue

        const parts = line.trim().split(/\s{2,}/)
        if (parts.length >= 3) {
          const name = parts[0]
          const exactSize = parseDockerSize(parts[2])
          emit.result({
            path: `docker-volume:${name}`,
            size: exactSize,
            lastModified: new Date().toISOString(),
            projectName: name,
            parentPath: 'Docker Volumes',
            folderName: 'docker-volume',
            category: 'docker_vol',
            isVirtual: true,
          })
        }
      }
      resolve()
    })
  })
}

// ── Large file scan (fdir-powered) ───────────────────────────────────────────
// Note: fdir v6 has no `.withStats()` — we collect paths then stat in batches.

const appPathNorm = (p: string) => path.normalize(p)

async function scanLargeFiles(
  rootPath: string,
  threshold: number,
  appPath: string,
  extensions: string[],
  signal: AbortSignal,
  emit: ScanEmitter
): Promise<{ found: number; scanned: number }> {
  const extSet = new Set(extensions.map((e) => e.toLowerCase().replace(/^\./, '')))
  const appNorm = appPathNorm(appPath)

  let filePaths: string[] = []
  try {
    filePaths = (await new fdir()
      .withFullPaths()
      .withAbortSignal(signal)
      .exclude((dirName, dirPath) => {
        const d = appPathNorm(dirPath)
        if (d === appNorm || d.startsWith(appNorm + path.sep)) return true
        return SKIP_DIRS.has(dirName) || NO_RECURSE.has(dirName) || dirName.startsWith('.')
      })
      .filter((filePath, isDirectory) => {
        if (isDirectory) return false
        if (extSet.size > 0) {
          const ext = path.extname(filePath).toLowerCase().slice(1)
          return extSet.has(ext)
        }
        return true
      })
      .crawl(rootPath)
      .withPromise()) as string[]
  } catch (err) {
    if (signal.aborted) return { found: 0, scanned: 0 }
    console.error('[scanLargeFiles] fdir crawl failed:', err)
    return { found: 0, scanned: 0 }
  }

  let found = 0
  const scanned = filePaths.length
  const BATCH = 100

  for (let i = 0; i < filePaths.length; i += BATCH) {
    if (signal.aborted) break

    const batch = filePaths.slice(i, i + BATCH)
    for (const filePath of batch) {
      let stats: fs.Stats
      try {
        stats = await fs.promises.stat(filePath)
      } catch {
        continue
      }
      if (!stats.isFile() || stats.size < threshold) continue
      found++
      emit.result({
        path: filePath,
        size: stats.size,
        lastModified: stats.mtime.toISOString(),
        projectName: path.basename(filePath),
        parentPath: path.dirname(filePath),
        folderName: path.basename(filePath),
        category: 'file_size',
      })
    }

    emit.progress({
      currentDir: `Checked ${Math.min(i + BATCH, filePaths.length)} / ${filePaths.length} files…`,
      scanned: i + BATCH,
    })

    await new Promise<void>((r) => setImmediate(r))
  }

  return { found, scanned }
}

// ── Main scan ─────────────────────────────────────────────────────────────────

export async function scanDirectory(
  input: ScanInput,
  appPath: string,
  signal: AbortSignal,
  emit: ScanEmitter
): Promise<void> {
  const targetNames = buildTargetSet(input.targets)
  let found = 0
  let scanned = 0

  async function walk(dirPath: string, depth = 0): Promise<void> {
    if (signal.aborted) return
    if (depth > 15) return

    let entries: fs.Dirent[]
    try {
      entries = await fs.promises.readdir(dirPath, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (signal.aborted) return
      if (!entry.isDirectory()) continue

      const fullPath = path.join(dirPath, entry.name)

      // Never scan the application's own directory
      if (fullPath.startsWith(appPath)) continue

      if (SKIP_DIRS.has(entry.name)) continue
      if (entry.name.startsWith('.') && !targetNames.has(entry.name)) continue

      if (targetNames.has(entry.name)) {
        found++
        const [size, lastModified] = await Promise.all([
          getFolderSize(fullPath),
          Promise.resolve(getLastModified(fullPath)),
        ])

        emit.result({
          path: fullPath,
          size,
          lastModified,
          projectName: path.basename(path.dirname(fullPath)),
          parentPath: path.dirname(fullPath),
          folderName: entry.name,
          category: getTargetCategory(entry.name) ?? 'unknown',
        })

        if (NO_RECURSE.has(entry.name)) continue
      }

      scanned++
      if (scanned % 50 === 0) {
        emit.progress({ currentDir: dirPath, scanned })
      }

      await walk(fullPath, depth + 1)
    }
  }

  await walk(input.rootPath)

  // Large file scan (separate pass, only files)
  let fileScanFound = 0
  let fileScanScanned = 0
  if (!signal.aborted && input.targets.includes('file_size')) {
    const threshold = input.fileSizeThreshold ?? 100 * 1024 * 1024 // default 100 MB
    const extensions = input.fileFilter?.extensions ?? []
    const result = await scanLargeFiles(input.rootPath, threshold, appPath, extensions, signal, emit)
    fileScanFound = result.found
    fileScanScanned = result.scanned
  }

  if (!signal.aborted) {
    if (input.targets.includes('docker')) await scanDockerImages(emit)
    if (input.targets.includes('docker_vol')) await scanDockerVolumes(emit)
  }

  if (!signal.aborted) {
    emit.done({ total: found + fileScanFound, scanned: scanned + fileScanScanned })
  }
}
