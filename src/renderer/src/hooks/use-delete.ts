import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/electron-api'

export interface DeleteState {
  deleting: boolean
  progress: string
}

export function useDelete(onItemDeleted: (path: string) => void) {
  const [state, setState] = useState<DeleteState>({ deleting: false, progress: '' })
  const unsubsRef = useRef<Array<() => void>>([])
  const failedCountRef = useRef(0)

  const clearSubscriptions = useCallback(() => {
    unsubsRef.current.forEach((u) => u())
    unsubsRef.current = []
  }, [])

  const startDelete = useCallback(
    async (paths: string[]) => {
      if (paths.length === 0) return

      clearSubscriptions()
      failedCountRef.current = 0
      setState({ deleting: true, progress: 'Starting deletion…' })

      unsubsRef.current = [
        api.onDeleteItem((data) => {
          const label = data.path.split('/').pop() ?? data.path
          if (data.success) {
            setState((prev) => ({ ...prev, progress: `Deleted: ${label}` }))
            onItemDeleted(data.path)
          } else {
            failedCountRef.current++
            setState((prev) => ({ ...prev, progress: `Failed: ${label}` }))
            toast.error(`Failed to delete: ${label}`, { description: data.error })
          }
        }),
        api.onDeleteDone((data) => {
          clearSubscriptions()
          setState({ deleting: false, progress: '' })
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
      }
    },
    [clearSubscriptions, onItemDeleted]
  )

  return { state, startDelete }
}
