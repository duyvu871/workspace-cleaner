import { AlertTriangle, FolderMinus } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatBytes } from '@/lib/format'
import type { ScanResult } from '@shared/types'

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selected: Set<string>
  items: ScanResult[]
  onConfirm: () => void
}

export function DeleteDialog({
  open,
  onOpenChange,
  selected,
  items,
  onConfirm,
}: DeleteDialogProps) {
  const selectedItems = items.filter((f) => selected.has(f.path))
  const totalSize = selectedItems.reduce((sum, f) => sum + f.size, 0)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="size-10 bg-destructive/10 rounded-full flex items-center justify-center shrink-0">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <ScrollArea className="max-h-48 rounded-lg border border-border bg-muted/30 p-3">
          <div className="space-y-1.5">
            {selectedItems.map((item) => (
              <div
                key={item.path}
                className="text-xs text-muted-foreground flex items-start gap-2 min-w-0"
              >
                <FolderMinus className="size-3.5 text-destructive/70 shrink-0" />
                <span className="min-w-0 break-all">
                  {item.isVirtual
                    ? item.path.replace(/docker-(image|volume):/, 'ID: ')
                    : item.path}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>

        <p className="text-sm text-muted-foreground">
          Free up{' '}
          <span className="font-semibold text-primary">{formatBytes(totalSize)}</span> by
          deleting{' '}
          <span className="font-semibold text-foreground">{selected.size}</span> item
          {selected.size !== 1 ? 's' : ''}?
        </p>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Yes, Delete All
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
