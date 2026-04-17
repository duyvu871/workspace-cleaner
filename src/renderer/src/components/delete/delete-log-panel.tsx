import { useCallback, useRef, useState } from 'react'
import { Check, CheckCircle2, ChevronDown, Circle, Clock3, Copy, Terminal, XCircle } from 'lucide-react'
import type { DeleteLogEntry, DeleteLogStatus } from '@/hooks/use-delete'

interface DeleteLogPanelProps {
  logs: DeleteLogEntry[]
  deleting: boolean
}

function statusTone(status: DeleteLogStatus): string {
  switch (status) {
    case 'success':
      return 'text-emerald-600'
    case 'failed':
      return 'text-destructive'
    case 'running':
      return 'text-blue-600'
    case 'skipped':
      return 'text-amber-600'
    default:
      return 'text-muted-foreground'
  }
}

function statusLabel(status: DeleteLogStatus): string {
  switch (status) {
    case 'success':
      return 'Success'
    case 'failed':
      return 'Failed'
    case 'running':
      return 'Running'
    case 'skipped':
      return 'Skipped'
    default:
      return 'Queued'
  }
}

function StatusIcon({ status }: { status: DeleteLogStatus }) {
  const tone = statusTone(status)

  if (status === 'success') return <CheckCircle2 className={`size-4 ${tone}`} />
  if (status === 'failed') return <XCircle className={`size-4 ${tone}`} />
  if (status === 'running') return <Clock3 className={`size-4 ${tone}`} />
  if (status === 'skipped') return <Clock3 className={`size-4 ${tone}`} />
  return <Circle className={`size-4 ${tone}`} />
}

export function DeleteLogPanel({ logs, deleting }: DeleteLogPanelProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const copiedTimeoutRef = useRef<number | null>(null)

  const handleCopy = useCallback(async (key: string, value: string) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      if (copiedTimeoutRef.current) {
        window.clearTimeout(copiedTimeoutRef.current)
      }
      copiedTimeoutRef.current = window.setTimeout(() => {
        setCopiedKey(null)
        copiedTimeoutRef.current = null
      }, 1200)
    } catch {
      // Clipboard may be unavailable in restricted environments.
    }
  }, [])

  return (
    <aside className="w-[380px] shrink-0 border-l border-border bg-card/40">
      <div className="h-full flex flex-col">
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Terminal className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Delete Details</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {logs.length} command{logs.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {deleting
              ? 'Running delete commands...'
              : logs.length > 0
                ? 'Last delete execution result.'
                : 'No delete task started yet.'}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {logs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
              Select items and click delete to see detailed execution logs here.
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <details
                  key={log.id}
                  className="group rounded-lg border border-border bg-background open:shadow-sm"
                >
                  <summary className="list-none cursor-pointer px-3 py-2">
                    <div className="flex items-start gap-2">
                      <StatusIcon status={log.status} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-medium text-foreground">{log.label}</p>
                          <span className={`text-[11px] font-medium ${statusTone(log.status)}`}>
                            {statusLabel(log.status)}
                          </span>
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground">{log.path}</p>
                      </div>
                      <ChevronDown className="mt-0.5 size-4 text-muted-foreground transition-transform group-open:rotate-180" />
                    </div>
                  </summary>
                  <div className="border-t border-border px-3 py-2 text-[11px]">
                    <div className="group/cmd">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="font-medium text-muted-foreground">Command</p>
                        <button
                          type="button"
                          onClick={() => handleCopy(`${log.id}:cmd`, log.command)}
                          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground opacity-0 transition hover:bg-muted/60 hover:text-foreground group-hover/cmd:opacity-100"
                        >
                          {copiedKey === `${log.id}:cmd` ? (
                            <>
                              <Check className="size-3" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="size-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="overflow-x-auto rounded-md bg-muted/40 p-2 text-foreground">
{log.command}
                      </pre>
                    </div>
                    {log.error && (
                      <div className="group/err mt-2">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className="font-medium text-destructive">Error</p>
                          <button
                            type="button"
                            onClick={() => handleCopy(`${log.id}:err`, log.error!)}
                            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground opacity-0 transition hover:bg-muted/60 hover:text-foreground group-hover/err:opacity-100"
                          >
                            {copiedKey === `${log.id}:err` ? (
                              <>
                                <Check className="size-3" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="size-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="overflow-x-auto rounded-md bg-destructive/10 p-2 text-destructive">
{log.error}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
