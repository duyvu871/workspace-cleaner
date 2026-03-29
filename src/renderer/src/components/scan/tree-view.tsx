import { useState, useRef, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ChevronRight, ChevronDown, Folder } from 'lucide-react'
import type { ScanResult } from '@shared/types'
import { ScanRow } from './scan-row'
import { formatBytes } from '@/lib/format'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Group {
  parentPath: string
  items: ScanResult[]
  totalSize: number
}

type FlatRow =
  | { type: 'header'; group: Group; key: string }
  | { type: 'item'; item: ScanResult; key: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildGroups(items: ScanResult[]): Group[] {
  const map = new Map<string, ScanResult[]>()
  for (const item of items) {
    const key = item.parentPath ?? '/'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return Array.from(map.entries())
    .map(([parentPath, groupItems]) => ({
      parentPath,
      items: groupItems,
      totalSize: groupItems.reduce((s, i) => s + i.size, 0),
    }))
    .sort((a, b) => b.totalSize - a.totalSize)
}

function buildFlatRows(groups: Group[], collapsed: Set<string>): FlatRow[] {
  const rows: FlatRow[] = []
  for (const group of groups) {
    rows.push({ type: 'header', group, key: `h:${group.parentPath}` })
    if (!collapsed.has(group.parentPath)) {
      for (const item of group.items) {
        rows.push({ type: 'item', item, key: `i:${item.path}` })
      }
    }
  }
  return rows
}

// ── Components ────────────────────────────────────────────────────────────────

interface HeaderRowProps {
  group: Group
  isCollapsed: boolean
  onToggle: () => void
}

function HeaderRow({ group, isCollapsed, onToggle }: HeaderRowProps) {
  const Arrow = isCollapsed ? ChevronRight : ChevronDown
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 text-left',
        'bg-muted/40 border-b border-border/60',
        'hover:bg-muted/60 transition-colors'
      )}
    >
      <Arrow className="size-3.5 text-muted-foreground shrink-0" />
      <Folder className="size-3.5 text-primary shrink-0" />
      <span className="flex-1 truncate text-xs font-medium text-foreground min-w-0">
        {group.parentPath}
      </span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {group.items.length} item{group.items.length !== 1 ? 's' : ''} · {formatBytes(group.totalSize)}
      </span>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  items: ScanResult[]
  selectedPaths: Set<string>
  onToggle: (item: ScanResult) => void
}

const HEADER_HEIGHT = 36
const ITEM_HEIGHT = 60

export function TreeView({ items, selectedPaths, onToggle }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const parentRef = useRef<HTMLDivElement>(null)

  const groups = useMemo(() => buildGroups(items), [items])
  const flatRows = useMemo(() => buildFlatRows(groups, collapsed), [groups, collapsed])

  const virtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (flatRows[index].type === 'header' ? HEADER_HEIGHT : ITEM_HEIGHT),
    overscan: 8,
  })

  const toggleCollapse = (parentPath: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(parentPath)) next.delete(parentPath)
      else next.add(parentPath)
      return next
    })
  }

  if (items.length === 0) return null

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto min-h-0 overscroll-contain">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((vItem) => {
          const row = flatRows[vItem.index]
          return (
            <div
              key={vItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${vItem.start}px)`,
              }}
            >
              {row.type === 'header' ? (
                <HeaderRow
                  group={row.group}
                  isCollapsed={collapsed.has(row.group.parentPath)}
                  onToggle={() => toggleCollapse(row.group.parentPath)}
                />
              ) : (
                <div className="pl-6">
                  <ScanRow
                    item={row.item}
                    selected={selectedPaths.has(row.item.path)}
                    onToggle={onToggle}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
