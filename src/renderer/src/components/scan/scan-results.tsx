import { useState, useMemo } from 'react'
import { ArrowDownWideNarrow, ArrowDownAZ, CheckCircle2, List, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { VirtualList } from './virtual-list'
import { TreeView } from './tree-view'
import type { ScanResult } from '@shared/types'

type SortKey = 'size' | 'name'
type ViewMode = 'flat' | 'tree'

interface ScanResultsProps {
  items: ScanResult[]
  scanning: boolean
  done: boolean
  selected: Set<string>
  onToggle: (item: ScanResult) => void
  onToggleAll: () => void
}

export function ScanResults({ items, scanning, done, selected, onToggle, onToggleAll }: ScanResultsProps) {
  const [sortKey, setSortKey] = useState<SortKey>('size')
  const [sortAsc, setSortAsc] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('flat')

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v)
    else { setSortKey(key); setSortAsc(key === 'name') }
  }

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const cmp = sortKey === 'size' ? b.size - a.size : a.projectName.localeCompare(b.projectName)
      return sortAsc ? -cmp : cmp
    })
  }, [items, sortKey, sortAsc])

  const allSelected = items.length > 0 && selected.size === items.length

  if (scanning && items.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border flex flex-col flex-1 min-h-0 shadow-sm overflow-hidden">
        <div className="p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="size-4 rounded" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-72" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (done && items.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-16 text-center shadow-sm flex-1 flex flex-col items-center justify-center">
        <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="size-8 text-primary" />
        </div>
        <p className="text-foreground font-semibold text-lg">Clean Directory</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          No matching folders or targets were found. Your directory is already clean.
        </p>
      </div>
    )
  }

  if (items.length === 0) return null

  return (
    <div className="bg-card rounded-xl border border-border flex flex-col flex-1 min-h-0 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Checkbox checked={allSelected} onCheckedChange={onToggleAll} />
            {allSelected ? 'Deselect all' : 'Select all'}
          </label>

          {/* View toggle */}
          <div className="flex items-center rounded-md border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('flat')}
              title="List view"
              className={`flex items-center px-2 py-1 text-xs gap-1 transition-colors ${
                viewMode === 'flat'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <List className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              title="Tree view (grouped by folder)"
              className={`flex items-center px-2 py-1 text-xs gap-1 transition-colors border-l border-border ${
                viewMode === 'tree'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <GitBranch className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Sort controls — only in flat view */}
        {viewMode === 'flat' && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSort('size')}
              className="text-xs text-muted-foreground hover:text-primary gap-1.5 h-7 px-2"
            >
              <ArrowDownWideNarrow className="size-3.5" />
              Size {sortKey === 'size' && (sortAsc ? '↑' : '↓')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSort('name')}
              className="text-xs text-muted-foreground hover:text-primary gap-1.5 h-7 px-2"
            >
              <ArrowDownAZ className="size-3.5" />
              Name {sortKey === 'name' && (sortAsc ? '↑' : '↓')}
            </Button>
          </div>
        )}
      </div>

      {/* Content — flex-1 min-h-0 so virtualizer gets a constrained height */}
      <div className="flex flex-col flex-1 min-h-0">
        {viewMode === 'flat' ? (
          <VirtualList items={sorted} selectedPaths={selected} onToggle={onToggle} />
        ) : (
          <TreeView items={sorted} selectedPaths={selected} onToggle={onToggle} />
        )}
      </div>
    </div>
  )
}
