export function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i]
}

export function formatDate(isoStr: string | null | undefined): string {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const CATEGORY_LABELS: Record<string, string> = {
  node: 'Node',
  python: 'Python',
  java: 'Java',
  php: 'PHP',
  dotnet: '.NET',
  build: 'Build',
  docker: 'Docker IMG',
  docker_vol: 'Docker VOL',
  system: 'System',
  file_size: 'Large File',
}

export const CATEGORY_CLASSES: Record<string, string> = {
  node: 'bg-green-50 text-green-700 border-green-200',
  python: 'bg-blue-50 text-blue-700 border-blue-200',
  java: 'bg-orange-50 text-orange-700 border-orange-200',
  php: 'bg-purple-50 text-purple-700 border-purple-200',
  dotnet: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  build: 'bg-amber-50 text-amber-700 border-amber-200',
  docker: 'bg-sky-50 text-sky-700 border-sky-200',
  docker_vol: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  system: 'bg-pink-50 text-pink-700 border-pink-200',
  file_size: 'bg-primary/10 text-primary border-primary/30',
}

// ── Threshold helpers (log-scale, 1 MB → 10 GB) ────────────────────────────

const MIN_MB = 1
const MAX_MB = 10_000 // 10 GB

/** Map slider 0-100 → bytes (log scale) */
export function sliderToBytes(sliderVal: number): number {
  const mb = Math.round(Math.pow(10, (sliderVal / 100) * Math.log10(MAX_MB / MIN_MB)) * MIN_MB)
  return Math.max(MIN_MB, Math.min(MAX_MB, mb)) * 1024 * 1024
}

/** Map bytes → slider 0-100 (inverse log scale) */
export function bytesToSlider(bytes: number): number {
  const mb = bytes / (1024 * 1024)
  const clamped = Math.max(MIN_MB, Math.min(MAX_MB, mb))
  return Math.round((Math.log10(clamped / MIN_MB) / Math.log10(MAX_MB / MIN_MB)) * 100)
}

/** Format bytes as "X MB" or "X.X GB" for the threshold label */
export function formatThreshold(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${Math.round(mb)} MB`
}

/** Parse a string like "500" or "500 MB" or "1.5 GB" → bytes, or null if invalid */
export function parseThresholdInput(raw: string): number | null {
  const trimmed = raw.trim()
  // Try "X GB"
  const gbMatch = trimmed.match(/^([\d.]+)\s*[Gg][Bb]?$/)
  if (gbMatch) {
    const val = parseFloat(gbMatch[1])
    if (!isNaN(val) && val > 0) return Math.round(val * 1024 * 1024 * 1024)
  }
  // Try "X MB" or just "X" (assumed MB)
  const mbMatch = trimmed.match(/^([\d.]+)\s*[Mm][Bb]?$/) ?? trimmed.match(/^([\d.]+)$/)
  if (mbMatch) {
    const val = parseFloat(mbMatch[1])
    if (!isNaN(val) && val > 0) return Math.round(val * 1024 * 1024)
  }
  return null
}
