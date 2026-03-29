import { Folder, Package, Database } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatBytes, formatDate, CATEGORY_LABELS, CATEGORY_CLASSES } from '@/lib/format'
import { getFileTypeInfo } from '@/lib/file-icons'
import type { ScanResult } from '@shared/types'

interface ScanRowProps {
  item: ScanResult
  selected: boolean
  onToggle: (item: ScanResult) => void
}

export function ScanRow({ item, selected, onToggle }: ScanRowProps) {
  const label = CATEGORY_LABELS[item.category] ?? item.category
  const badgeClass = CATEGORY_CLASSES[item.category] ?? 'bg-slate-100 text-slate-600 border-slate-200'
  const isLarge = item.size > 200 * 1024 * 1024
  const isMedium = item.size > 50 * 1024 * 1024

  const fileInfo = item.category === 'file_size' ? getFileTypeInfo(item.projectName) : null
  const FileTypeIcon = fileInfo?.icon

  return (
    <div
      onClick={() => onToggle(item)}
      className={cn(
        'flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors cursor-pointer group',
        selected && 'bg-destructive/5 hover:bg-destructive/8'
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={() => onToggle(item)}
        onClick={(e) => e.stopPropagation()}
        className="flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {item.category === 'docker' && item.isVirtual ? (
            <Package className="size-4 text-primary flex-shrink-0" />
          ) : item.category === 'docker_vol' && item.isVirtual ? (
            <Database className="size-4 text-primary flex-shrink-0" />
          ) : FileTypeIcon ? (
            <FileTypeIcon className={cn('size-4 flex-shrink-0', fileInfo?.color)} />
          ) : (
            <Folder className="size-4 text-primary flex-shrink-0" />
          )}

          <span className="text-sm font-semibold text-foreground truncate">
            {item.projectName}
          </span>
          <Badge className={cn('text-[10px] px-1.5 py-0.5 flex-shrink-0 border', badgeClass)}>
            {label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {item.category === 'file_size' ? (
            <span className="truncate" title={item.path}>{item.parentPath}</span>
          ) : (
            <>
              <span className="text-foreground/60">
                {item.isVirtual
                  ? item.category === 'docker' ? 'Image' : 'Volume'
                  : item.folderName}
              </span>
              <span className="mx-1">·</span>
              <span className="truncate">
                {item.isVirtual ? item.path.replace(/docker-(image|volume):/, 'ID: ') : item.path}
              </span>
            </>
          )}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <p
          className={cn(
            'text-sm font-semibold tabular-nums',
            isLarge ? 'text-destructive' : isMedium ? 'text-amber-500' : 'text-foreground'
          )}
        >
          {formatBytes(item.size)}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(item.lastModified)}</p>
      </div>
    </div>
  )
}
