export interface TargetConfig {
  label: string
  icon: string
  folders: string[]
}

export interface TargetInfo {
  key: string
  label: string
  icon: string
  folders: string[]
}

export interface SystemInfo {
  platform: string
  arch: string
  hostname: string
  homedir: string
  release: string
  targets: TargetInfo[]
}

export interface ScanResult {
  path: string
  size: number
  lastModified: string | null
  projectName: string
  parentPath: string
  folderName: string
  category: string
  isVirtual?: boolean
}

export interface FileFilter {
  /** Extension whitelist e.g. ['mp4','mkv'] — empty means all extensions */
  extensions: string[]
}

export interface ScanParams {
  rootPath: string
  targets: string[]
  /** Minimum file size in bytes — only used when 'file_size' target is selected */
  fileSizeThreshold?: number
  /** Extension filter — only used when 'file_size' target is selected */
  fileFilter?: FileFilter
}

export interface ScanProgress {
  currentDir: string
  scanned: number
}

export interface ScanDone {
  total: number
  scanned: number
}

export interface DeleteItemResult {
  path: string
  success: boolean
  error?: string
}

export interface DeleteDone {
  total: number
}

// ── Electron API shape (implemented in preload, consumed in renderer) ─────────

export interface ElectronAPI {
  getSystemInfo(): Promise<IpcResult<SystemInfo>>
  startScan(params: ScanParams): Promise<IpcResult>
  cancelScan(): Promise<IpcResult>
  startDelete(paths: string[]): Promise<IpcResult>
  openFolderDialog(): Promise<IpcResult<string | null>>

  onScanResult(cb: (data: ScanResult) => void): () => void
  onScanProgress(cb: (data: ScanProgress) => void): () => void
  onScanDone(cb: (data: ScanDone) => void): () => void
  onScanError(cb: (data: { message: string }) => void): () => void
  onDeleteItem(cb: (data: DeleteItemResult) => void): () => void
  onDeleteDone(cb: (data: DeleteDone) => void): () => void
}

// IPC response envelope
export interface IpcOk<T = void> {
  ok: true
  data: T
}

export interface IpcError {
  ok: false
  code: string
  message: string
  issues?: Array<{ path: string[]; message: string }>
}

export type IpcResult<T = void> = IpcOk<T> | IpcError
