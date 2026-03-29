import { ScanForm } from '@/components/scan/scan-form'
import { Separator } from '@/components/ui/separator'
import { formatBytes } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TargetInfo, ScanResult } from '@shared/types'

interface SidebarProps {
  targets: TargetInfo[]
  homedir: string
  scanning: boolean
  scanDone: boolean
  progress: string
  items: ScanResult[]
  selected: Set<string>
  onScan: (rootPath: string, targets: string[], fileSizeThreshold?: number, fileFilter?: import('@shared/types').FileFilter) => void
  onCancel: () => void
}

export function Sidebar({
  targets,
  homedir,
  scanning,
  scanDone,
  progress,
  items,
  selected,
  onScan,
  onCancel,
}: SidebarProps) {
  const totalSize = items.reduce((sum, f) => sum + f.size, 0)
  const selectedSize = items
    .filter((f) => selected.has(f.path))
    .reduce((sum, f) => sum + f.size, 0)
  const hasResults = !scanning && items.length > 0

  return (
    <aside className="w-80 lg:w-96 bg-card border-r border-border flex flex-col flex-shrink-0 overflow-y-auto z-0">
      <div className="p-6 space-y-6 flex-1">
        <ScanForm
          targets={targets}
          homedir={homedir}
          scanning={scanning}
          onScan={onScan}
          onCancel={onCancel}
        />

        {/* Scanning progress */}
        {scanning && (
          <div className="bg-muted/50 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-foreground">Scanning…</span>
              </div>
              <span className="text-xs text-muted-foreground">{items.length} found</span>
            </div>
            <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '100%' }} />
            </div>
            {progress && (
              <p
                className="text-xs text-muted-foreground mt-2 truncate text-right"
                title={progress}
              >
                {progress}
              </p>
            )}
          </div>
        )}

        {/* Stats */}
        {hasResults && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 bg-primary/5 rounded-xl border border-primary/20 p-4 flex items-center justify-between">
                <p className="text-sm font-medium text-primary/80">Total Found</p>
                <p className="text-2xl font-bold text-primary">{formatBytes(totalSize)}</p>
              </div>
              <StatCard label="Items" value={String(items.length)} />
              <StatCard
                label="Selected"
                value={String(selected.size)}
                highlight={selected.size > 0}
                sub={selected.size > 0 ? formatBytes(selectedSize) : undefined}
              />
            </div>
          </>
        )}

        {scanDone && items.length === 0 && !scanning && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            No matching items found in that directory.
          </p>
        )}
      </div>
    </aside>
  )
}

function StatCard({
  label,
  value,
  highlight,
  sub,
}: {
  label: string
  value: string
  highlight?: boolean
  sub?: string
}) {
  return (
    <div className="bg-muted/50 rounded-xl border border-border p-3 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={cn('text-xl font-semibold', highlight ? 'text-destructive' : 'text-foreground')}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}
