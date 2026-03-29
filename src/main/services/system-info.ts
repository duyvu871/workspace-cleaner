import os from 'os'
import type { SystemInfo } from '@shared/types'
import { SCAN_TARGETS } from './scan-targets'

export function getSystemInfo(): SystemInfo {
  return {
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    homedir: os.homedir(),
    release: os.release(),
    targets: Object.entries(SCAN_TARGETS).map(([key, cfg]) => ({
      key,
      label: cfg.label,
      icon: cfg.icon,
      folders: cfg.folders,
    })),
  }
}
