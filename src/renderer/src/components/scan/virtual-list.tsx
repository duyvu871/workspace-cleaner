import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { ScanResult } from '@shared/types'
import { ScanRow } from './scan-row'

interface Props {
  items: ScanResult[]
  selectedPaths: Set<string>
  onToggle: (item: ScanResult) => void
}

const ROW_HEIGHT = 60

export function VirtualList({ items, selectedPaths, onToggle }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  })

  if (items.length === 0) return null

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto min-h-0 overscroll-contain">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((vItem) => (
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
            <ScanRow
              item={items[vItem.index]}
              selected={selectedPaths.has(items[vItem.index].path)}
              onToggle={onToggle}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
