import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/electron-api'

export interface DeleteState {
  deleting: boolean
  progress: string
}

export type DeleteLogStatus = 'queued' | 'running' | 'success' | 'failed' | 'skipped'

export interface DeleteLogEntry {
  id: string
  path: string
  label: string
  command: string
  status: DeleteLogStatus
  error?: string
  updatedAt: number
}

function toDeleteCommand(path: string): string {
  if (path.startsWith('docker-image:')) {
    return `docker rmi -f ${path.slice('docker-image:'.length)}`
  }
  if (path.startsWith('docker-volume:')) {
    return `docker volume rm -f ${path.slice('docker-volume:'.length)}`
  }
  return `rm -rf "${path}"`
}

function toDeleteLabel(path: string): string {
  if (path.startsWith('docker-image:')) return `image:${path.slice('docker-image:'.length)}`
  if (path.startsWith('docker-volume:')) return `volume:${path.slice('docker-volume:'.length)}`
  return path.split('/').pop() ?? path
}

export function useDelete(onItemDeleted: (path: string) => void) {
  const [state, setState] = useState<DeleteState>({ deleting: false, progress: '' })
  const [logs, setLogs] = useState<DeleteLogEntry[]>([])
  const unsubsRef = useRef<Array<() => void>>([])
  const failedCountRef = useRef(0)

  const clearSubscriptions = useCallback(() => {
    unsubsRef.current.forEach((u) => u())
    unsubsRef.current = []
  }, [])

  const startDelete = useCallback(
    async (paths: string[]) => {
      if (paths.length === 0) return

      const now = Date.now()
      setLogs(
        paths.map((path, index) => ({
          id: `${now}-${index}`,
          path,
          label: toDeleteLabel(path),
          command: toDeleteCommand(path),
          status: 'queued',
          updatedAt: now,
        }))
      )

      clearSubscriptions()
      failedCountRef.current = 0
      setState({ deleting: true, progress: 'Starting deletion…' })

      unsubsRef.current = [
        api.onDeleteItem((data) => {
          const label = toDeleteLabel(data.path)
          if (data.success) {
            setState((prev) => ({ ...prev, progress: `Deleted: ${label}` }))
            onItemDeleted(data.path)
            setLogs((prev) =>
              prev.map((entry) =>
                entry.path === data.path
                  ? { ...entry, status: 'success', updatedAt: Date.now(), error: undefined }
                  : entry
              )
            )
          } else {
            failedCountRef.current++
            setState((prev) => ({ ...prev, progress: `Failed: ${label}` }))
            toast.error(`Failed to delete: ${label}`, { description: data.error })
            setLogs((prev) =>
              prev.map((entry) =>
                entry.path === data.path
                  ? { ...entry, status: 'failed', updatedAt: Date.now(), error: data.error }
                  : entry
              )
            )
          }
        }),
        api.onDeleteDone((data) => {
          clearSubscriptions()
          setState({ deleting: false, progress: '' })
          setLogs((prev) =>
            prev.map((entry) =>
              entry.status === 'queued'
                ? {
                    ...entry,
                    status: 'skipped',
                    error: entry.error ?? 'Not executed (validation or cancellation).',
                    updatedAt: Date.now(),
                  }
                : entry
            )
          )
          const failed = failedCountRef.current
          if (failed > 0) {
            toast.warning(`Deleted ${data.total - failed} of ${data.total} items`, {
              description: `${failed} item(s) could not be deleted.`,
            })
          } else {
            toast.success(`Deleted ${data.total} item(s) successfully`)
          }
        }),
      ]

      const result = await api.startDelete(paths)
      if (!result.ok) {
        clearSubscriptions()
        setState({ deleting: false, progress: '' })
        toast.error('Delete failed', { description: result.message })
        setLogs((prev) => {
          const issueMap = new Map<number, string>()
          result.issues?.forEach((issue) => {
            const idx = Number(issue.path[1])
            if (Number.isFinite(idx)) issueMap.set(idx, issue.message)
          })
          return prev.map((entry, index) => {
            const issue = issueMap.get(index)
            return {
              ...entry,
              status: 'failed',
              error: issue ?? result.message,
              updatedAt: Date.now(),
            }
          })
        })
      }
    },
    [clearSubscriptions, onItemDeleted]
  )

  return { state, logs, startDelete }
}
