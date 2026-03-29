import { contextBridge, ipcRenderer } from 'electron'
import { IPC, PUSH } from '@shared/ipc-channels'
import type {
  SystemInfo,
  ScanResult,
  ScanProgress,
  ScanDone,
  DeleteItemResult,
  DeleteDone,
  ScanParams,
  IpcResult,
} from '@shared/types'

type Unsubscribe = () => void

function subscribe<T>(channel: string, callback: (data: T) => void): Unsubscribe {
  const handler = (_event: Electron.IpcRendererEvent, data: T) => callback(data)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

const electronAPI = {
  // ── Invoke (request-response) ──────────────────────────────────────────
  getSystemInfo: (): Promise<IpcResult<SystemInfo>> =>
    ipcRenderer.invoke(IPC.SYSTEM_INFO),

  startScan: (params: ScanParams): Promise<IpcResult> =>
    ipcRenderer.invoke(IPC.SCAN_START, params),

  cancelScan: (): Promise<IpcResult> =>
    ipcRenderer.invoke(IPC.SCAN_CANCEL),

  startDelete: (paths: string[]): Promise<IpcResult> =>
    ipcRenderer.invoke(IPC.DELETE_START, paths),

  openFolderDialog: (): Promise<IpcResult<string | null>> =>
    ipcRenderer.invoke(IPC.DIALOG_OPEN_FOLDER),

  // ── Push (main → renderer subscriptions) ──────────────────────────────
  onScanResult: (cb: (data: ScanResult) => void): Unsubscribe =>
    subscribe(PUSH.SCAN_RESULT, cb),

  onScanProgress: (cb: (data: ScanProgress) => void): Unsubscribe =>
    subscribe(PUSH.SCAN_PROGRESS, cb),

  onScanDone: (cb: (data: ScanDone) => void): Unsubscribe =>
    subscribe(PUSH.SCAN_DONE, cb),

  onScanError: (cb: (data: { message: string }) => void): Unsubscribe =>
    subscribe(PUSH.SCAN_ERROR, cb),

  onDeleteItem: (cb: (data: DeleteItemResult) => void): Unsubscribe =>
    subscribe(PUSH.DELETE_ITEM, cb),

  onDeleteDone: (cb: (data: DeleteDone) => void): Unsubscribe =>
    subscribe(PUSH.DELETE_DONE, cb),
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Ensure implementation matches the shared interface
import type { ElectronAPI as IElectronAPI } from '@shared/types'
const _typeCheck: IElectronAPI = electronAPI
void _typeCheck
