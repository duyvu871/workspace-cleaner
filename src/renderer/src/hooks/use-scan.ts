import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/electron-api'
import type { ScanResult, ScanParams } from '@shared/types'

export interface ScanState {
  items: ScanResult[]
  scanning: boolean
  done: boolean
  progress: string
  total: number
}

const initial: ScanState = {
  items: [],
  scanning: false,
  done: false,
  progress: '',
  total: 0,
}

/** How long to accumulate incoming scan results before flushing to React state */
const FLUSH_INTERVAL_MS = 120

export function useScan() {
  const [state, setState] = useState<ScanState>(initial)
  const unsubsRef = useRef<Array<() => void>>([])
  const bufferRef = useRef<ScanResult[]>([])
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flushBuffer = useCallback(() => {
    flushTimerRef.current = null
    const batch = bufferRef.current.splice(0)
    if (batch.length === 0) return
    setState((prev) => ({
      ...prev,
      items: [...prev.items, ...batch].sort((a, b) => b.size - a.size),
    }))
  }, [])

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) return
    flushTimerRef.current = setTimeout(flushBuffer, FLUSH_INTERVAL_MS)
  }, [flushBuffer])

  const clearSubscriptions = useCallback(() => {
    unsubsRef.current.forEach((unsub) => unsub())
    unsubsRef.current = []
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current)
      flushTimerRef.current = null
    }
  }, [])

  const startScan = useCallback(
    async (params: ScanParams) => {
      clearSubscriptions()
      bufferRef.current = []
      setState({ items: [], scanning: true, done: false, progress: 'Starting scan…', total: 0 })

      unsubsRef.current = [
        api.onScanResult((data) => {
          bufferRef.current.push(data)
          scheduleFlush()
        }),
        api.onScanProgress((data) => {
          setState((prev) => ({ ...prev, progress: data.currentDir }))
        }),
        api.onScanDone((data) => {
          // Flush any remaining buffered results immediately
          const remaining = bufferRef.current.splice(0)
          clearSubscriptions()
          setState((prev) => {
            const items = [...prev.items, ...remaining].sort((a, b) => b.size - a.size)
            return { ...prev, items, scanning: false, done: true, progress: '', total: data.total }
          })
        }),
        api.onScanError((data) => {
          clearSubscriptions()
          setState((prev) => ({ ...prev, scanning: false, done: true, progress: '' }))
          toast.error('Scan error', { description: data.message })
        }),
      ]

      const result = await api.startScan(params)
      if (!result.ok && result.code !== 'CANCELLED') {
        clearSubscriptions()
        setState((prev) => ({ ...prev, scanning: false }))
        toast.error('Scan failed', { description: result.message })
      }
    },
    [clearSubscriptions, scheduleFlush]
  )

  const cancelScan = useCallback(async () => {
    clearSubscriptions()
    setState((prev) => ({ ...prev, scanning: false, done: true, progress: '' }))
    await api.cancelScan()
  }, [clearSubscriptions])

  return { state, startScan, cancelScan }
}
