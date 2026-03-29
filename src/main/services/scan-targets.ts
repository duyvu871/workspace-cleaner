import type { TargetConfig } from '@shared/types'

export const SCAN_TARGETS: Record<string, TargetConfig> = {
  node: { label: 'Node.js', icon: 'hexagon', folders: ['node_modules'] },
  python: {
    label: 'Python',
    icon: 'egg',
    folders: ['__pycache__', '.venv', 'venv', '.tox', '.eggs', '.mypy_cache', '.pytest_cache'],
  },
  java: { label: 'Java', icon: 'coffee', folders: ['target', '.gradle', '.mvn'] },
  php: { label: 'PHP', icon: 'code', folders: ['vendor'] },
  dotnet: { label: 'C# / .NET', icon: 'binary', folders: ['bin', 'obj'] },
  build: {
    label: 'Build Art.',
    icon: 'package',
    folders: ['dist', 'build', 'out', '.next', '.nuxt', '.sass-cache'],
  },
  docker: {
    label: 'Docker (IMG)',
    icon: 'container',
    folders: ['docker-compose-data', '.docker'],
  },
  docker_vol: { label: 'Docker (VOL)', icon: 'database', folders: [] },
  system: {
    label: 'System',
    icon: 'settings',
    folders: ['Cache', 'cache', 'CachedData', 'logs', 'tmp', 'temp', '.Trash', '$RECYCLE.BIN'],
  },
  // Special target: scan individual files above a size threshold (no folder names)
  file_size: { label: 'Large Files', icon: 'file', folders: [] },
}

export const ALL_TARGET_FOLDERS = new Set(
  Object.values(SCAN_TARGETS).flatMap((t) => t.folders)
)

// Folders that should not be recursed into when found
export const NO_RECURSE = new Set([
  'node_modules',
  '.venv',
  'venv',
  'target',
  '.gradle',
])

export const SKIP_DIRS = new Set([
  '.git',
  '.cache',
  '.local',
  '.config',
  '.npm',
  '.nvm',
  '.yarn',
  '.pnpm-store',
  'Library',
  'proc',
  'sys',
  'dev',
])

export function buildTargetSet(targetKeys: string[]): Set<string> {
  const names = new Set<string>()
  for (const key of targetKeys) {
    if (SCAN_TARGETS[key]) {
      for (const f of SCAN_TARGETS[key].folders) names.add(f)
    }
  }
  return names
}

export function getTargetCategory(folderName: string): string | null {
  for (const [key, cfg] of Object.entries(SCAN_TARGETS)) {
    if (cfg.folders.includes(folderName)) return key
  }
  return null
}
