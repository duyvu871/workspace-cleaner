import { useState, useCallback } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { ScanResults } from '@/components/scan/scan-results'
import { DeleteBar } from '@/components/delete/delete-bar'
import { DeleteDialog } from '@/components/delete/delete-dialog'
import { DeleteLogPanel } from '@/components/delete/delete-log-panel'
import { useSystemInfo } from '@/hooks/use-system-info'
import { useScan } from '@/hooks/use-scan'
import { useDelete } from '@/hooks/use-delete'
import type { ScanParams, ScanResult, FileFilter } from '@shared/types'

export default function WorkspaceCleanerPage() {
  const { data: systemInfo, isLoading: infoLoading } = useSystemInfo()
  const { state: scanState, startScan, cancelScan } = useScan()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleItemDeleted = useCallback((path: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(path)
      return next
    })
  }, [])

  const { state: deleteState, logs: deleteLogs, startDelete } = useDelete(handleItemDeleted)

  function handleScan(
    rootPath: string,
    targets: string[],
    fileSizeThreshold?: number,
    fileFilter?: FileFilter
  ) {
    setSelected(new Set())
    const params: ScanParams = { rootPath, targets, fileSizeThreshold, fileFilter }
    startScan(params)
  }

  function handleToggle(item: ScanResult) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(item.path)) next.delete(item.path)
      else next.add(item.path)
      return next
    })
  }

  function handleToggleAll() {
    if (selected.size === scanState.items.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(scanState.items.map((i) => i.path)))
    }
  }

  function handleConfirmDelete() {
    setConfirmOpen(false)
    startDelete([...selected])
  }

  return (
    <TooltipProvider>
      <div className="h-screen overflow-hidden flex flex-col bg-background">
        <Header systemInfo={systemInfo} isLoading={infoLoading} />

        <main className="flex-1 flex overflow-hidden">
          <Sidebar
            targets={systemInfo?.targets ?? []}
            homedir={systemInfo?.homedir ?? ''}
            scanning={scanState.scanning}
            scanDone={scanState.done}
            progress={scanState.progress}
            items={scanState.items}
            selected={selected}
            onScan={handleScan}
            onCancel={cancelScan}
          />

          <section className="flex-1 flex flex-col bg-background relative min-w-0">
            <div
              className="flex-1 flex flex-col min-h-0 p-4 overflow-hidden transition-all duration-300"
              style={{ paddingBottom: selected.size > 0 ? '88px' : undefined }}
            >
              <ScanResults
                items={scanState.items}
                scanning={scanState.scanning}
                done={scanState.done}
                selected={selected}
                onToggle={handleToggle}
                onToggleAll={handleToggleAll}
              />
            </div>

            <DeleteBar
              selected={selected}
              items={scanState.items}
              onClear={() => setSelected(new Set())}
              onDelete={() => setConfirmOpen(true)}
            />
          </section>

          <DeleteLogPanel logs={deleteLogs} deleting={deleteState.deleting} />
        </main>

        <DeleteDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          selected={selected}
          items={scanState.items}
          onConfirm={handleConfirmDelete}
        />

        {deleteState.deleting && (
          <div className="fixed top-5 right-5 z-50 bg-card rounded-xl border border-border shadow-lg p-4 w-72">
            <div className="flex items-center gap-3 mb-1">
              <span className="size-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm font-medium text-foreground">Deleting…</span>
            </div>
            {deleteState.progress && (
              <p className="text-xs text-muted-foreground truncate">{deleteState.progress}</p>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
