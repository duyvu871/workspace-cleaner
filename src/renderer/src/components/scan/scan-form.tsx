import { useState, type FormEvent } from 'react'
import { Search, X, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { api } from '@/lib/electron-api'
import { ThresholdSlider } from './threshold-slider'
import { FileFilter, type FileFilterValue } from './file-filter'
import type { TargetInfo, FileFilter as SharedFileFilter } from '@shared/types'

const DEFAULT_THRESHOLD_BYTES = 100 * 1024 * 1024 // 100 MB

interface ScanFormProps {
  targets: TargetInfo[]
  homedir: string
  scanning: boolean
  onScan: (rootPath: string, targets: string[], fileSizeThreshold?: number, fileFilter?: SharedFileFilter) => void
  onCancel: () => void
}

export function ScanForm({ targets, homedir, scanning, onScan, onCancel }: ScanFormProps) {
  const [scanPath, setScanPath] = useState(homedir)
  const [activeTargets, setActiveTargets] = useState<string[]>(['node'])
  const [fileSizeThreshold, setFileSizeThreshold] = useState(DEFAULT_THRESHOLD_BYTES)
  const [fileFilter, setFileFilter] = useState<FileFilterValue>({ extensions: [] })

  const fileSizeActive = activeTargets.includes('file_size')
  const folderTargets = targets.filter((t) => t.key !== 'file_size')
  const fileSizeTarget = targets.find((t) => t.key === 'file_size')

  const quickPaths = [
    { label: '~ Home', path: homedir },
    { label: '/ Root', path: '/' },
    { label: '/tmp', path: '/tmp' },
  ]

  function toggleTarget(key: string) {
    setActiveTargets((prev) => {
      if (prev.includes(key)) {
        return prev.length > 1 ? prev.filter((t) => t !== key) : prev
      }
      return [...prev, key]
    })
  }

  async function handleBrowse() {
    const result = await api.openFolderDialog()
    if (result.ok && result.data) setScanPath(result.data)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!scanning && scanPath.trim() && activeTargets.length > 0) {
      onScan(
        scanPath.trim(),
        activeTargets,
        fileSizeActive ? fileSizeThreshold : undefined,
        fileSizeActive ? fileFilter : undefined
      )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Path input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Scan Directory</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={scanPath}
              onChange={(e) => setScanPath(e.target.value)}
              placeholder="/home/user/projects"
              disabled={scanning}
              className="pl-9 text-sm"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={scanning}
            onClick={handleBrowse}
            title="Browse for folder"
          >
            <FolderOpen className="size-4" />
          </Button>
        </div>

        {/* Quick paths */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground">Quick:</span>
          {quickPaths.map((qp) => (
            <button
              key={qp.path}
              type="button"
              disabled={scanning}
              onClick={() => setScanPath(qp.path)}
              className="text-xs px-2 py-1 rounded-md border border-border text-muted-foreground
                         hover:bg-accent hover:text-accent-foreground hover:border-primary/30
                         transition-colors disabled:opacity-40 cursor-pointer"
            >
              {qp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Folder targets */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Folder Targets</label>
        <div className="flex flex-wrap gap-1.5">
          {folderTargets.map((t) => {
            const active = activeTargets.includes(t.key)
            return (
              <button
                key={t.key}
                type="button"
                disabled={scanning}
                onClick={() => toggleTarget(t.key)}
                className={cn(
                  'text-xs px-2.5 py-1.5 rounded-md border transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1',
                  active
                    ? 'bg-primary/10 text-primary border-primary/40 font-medium'
                    : 'bg-card text-muted-foreground border-border hover:border-border/80 hover:text-foreground'
                )}
              >
                {t.label}
                {active && <span className="text-primary text-[10px]">✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* File size target + threshold + filter */}
      {fileSizeTarget && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">File Scan</label>
              <button
                type="button"
                disabled={scanning}
                onClick={() => toggleTarget('file_size')}
                className={cn(
                  'text-xs px-2.5 py-1.5 rounded-md border transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1',
                  fileSizeActive
                    ? 'bg-primary/10 text-primary border-primary/40 font-medium'
                    : 'bg-card text-muted-foreground border-border hover:border-border/80 hover:text-foreground'
                )}
              >
                {fileSizeTarget.label}
                {fileSizeActive && <span className="text-primary text-[10px]">✓</span>}
              </button>
            </div>

            {fileSizeActive && (
              <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Min file size</p>
                  <ThresholdSlider
                    value={fileSizeThreshold}
                    onChange={setFileSizeThreshold}
                    disabled={scanning}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">File types</p>
                  <FileFilter value={fileFilter} onChange={setFileFilter} />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          disabled={scanning || !scanPath.trim() || activeTargets.length === 0}
          className="flex-1"
        >
          <Search className={cn('size-4', scanning && 'animate-pulse')} />
          {scanning ? 'Scanning…' : 'Start Scan'}
        </Button>
        {scanning && (
          <Button type="button" variant="outline" size="icon" onClick={onCancel}>
            <X className="size-4" />
          </Button>
        )}
      </div>
    </form>
  )
}
