import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatBytes } from '@/lib/format'
import type { ScanResult } from '@shared/types'

interface DeleteBarProps {
  selected: Set<string>
  items: ScanResult[]
  onClear: () => void
  onDelete: () => void
}

export function DeleteBar({ selected, items, onClear, onDelete }: DeleteBarProps) {
  if (selected.size === 0) return null

  const selectedSize = items
    .filter((f) => selected.has(f.path))
    .reduce((sum, f) => sum + f.size, 0)

  return (
    <div className="absolute bottom-0 inset-x-0 bg-card border-t border-border shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.05)] z-20">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{selected.size}</span> item
          {selected.size !== 1 ? 's' : ''} selected
          <span className="text-border mx-2">|</span>
          <span className="font-semibold text-primary text-base">{formatBytes(selectedSize)}</span>
          {' '}to free up
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClear}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete} className="gap-2">
            <Trash2 className="size-4" />
            Delete Selected
          </Button>
        </div>
      </div>
    </div>
  )
}
