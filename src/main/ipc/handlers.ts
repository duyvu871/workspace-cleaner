import { ipcMain, dialog, app } from 'electron'
import type { WebContents } from 'electron'
import { IPC, PUSH } from '@shared/ipc-channels'
import { ipcErrorFromZod, makeError, ErrorCode } from '@shared/errors'
import { getSystemInfo } from '../services/system-info'
import { scanDirectory, ScanSchema } from '../services/scan-service'
import { deleteItems, DeleteSchema } from '../services/delete-service'

let scanAbortController: AbortController | null = null

function getSender(event: Electron.IpcMainInvokeEvent): WebContents {
  return event.sender
}

export function registerHandlers(): void {
  // ── system:info ──────────────────────────────────────────────────────────
  ipcMain.handle(IPC.SYSTEM_INFO, () => {
    try {
      return { ok: true, data: getSystemInfo() }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get system info'
      return makeError(ErrorCode.UNKNOWN, msg)
    }
  })

  // ── scan:start ───────────────────────────────────────────────────────────
  ipcMain.handle(IPC.SCAN_START, async (event, rawParams: unknown) => {
    const parsed = ScanSchema.safeParse(rawParams)
    if (!parsed.success) return ipcErrorFromZod(parsed.error)

    // Cancel any in-progress scan
    if (scanAbortController) {
      scanAbortController.abort()
    }
    scanAbortController = new AbortController()
    const { signal } = scanAbortController
    const sender = getSender(event)

    try {
      await scanDirectory(parsed.data, app.getAppPath(), signal, {
        result: (data) => {
          if (!sender.isDestroyed()) sender.send(PUSH.SCAN_RESULT, data)
        },
        progress: (data) => {
          if (!sender.isDestroyed()) sender.send(PUSH.SCAN_PROGRESS, data)
        },
        done: (data) => {
          if (!sender.isDestroyed()) sender.send(PUSH.SCAN_DONE, data)
          scanAbortController = null
        },
        error: (message) => {
          if (!sender.isDestroyed()) sender.send(PUSH.SCAN_ERROR, { message })
          scanAbortController = null
        },
      })
      return { ok: true, data: undefined }
    } catch (err: unknown) {
      scanAbortController = null
      if (signal.aborted) return makeError(ErrorCode.CANCELLED, 'Scan was cancelled')
      const msg = err instanceof Error ? err.message : 'Scan failed'
      return makeError(ErrorCode.SCAN_FAILED, msg)
    }
  })

  // ── scan:cancel ──────────────────────────────────────────────────────────
  ipcMain.handle(IPC.SCAN_CANCEL, () => {
    if (scanAbortController) {
      scanAbortController.abort()
      scanAbortController = null
    }
    return { ok: true, data: undefined }
  })

  // ── delete:start ─────────────────────────────────────────────────────────
  ipcMain.handle(IPC.DELETE_START, async (event, rawPaths: unknown) => {
    const parsed = DeleteSchema.safeParse({ paths: rawPaths })
    if (!parsed.success) return ipcErrorFromZod(parsed.error)

    const sender = getSender(event)

    try {
      await deleteItems(parsed.data, {
        item: (data) => {
          if (!sender.isDestroyed()) sender.send(PUSH.DELETE_ITEM, data)
        },
        done: (data) => {
          if (!sender.isDestroyed()) sender.send(PUSH.DELETE_DONE, data)
        },
      })
      return { ok: true, data: undefined }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed'
      return makeError(ErrorCode.DELETE_FAILED, msg)
    }
  })

  // ── dialog:open-folder ───────────────────────────────────────────────────
  ipcMain.handle(IPC.DIALOG_OPEN_FOLDER, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select directory to scan',
    })
    return result.canceled ? { ok: true, data: null } : { ok: true, data: result.filePaths[0] }
  })
}
