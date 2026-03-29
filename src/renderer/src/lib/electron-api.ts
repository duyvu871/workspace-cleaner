import type { ElectronAPI } from '@shared/types'

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export const api: ElectronAPI = window.electronAPI
