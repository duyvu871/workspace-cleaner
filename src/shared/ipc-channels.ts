// Invoke channels (renderer → main, request-response)
export const IPC = {
  SYSTEM_INFO: 'system:info',
  SCAN_START: 'scan:start',
  SCAN_CANCEL: 'scan:cancel',
  DELETE_START: 'delete:start',
  DIALOG_OPEN_FOLDER: 'dialog:open-folder',
} as const

// Push channels (main → renderer, events)
export const PUSH = {
  SCAN_RESULT: 'scan:result',
  SCAN_PROGRESS: 'scan:progress',
  SCAN_DONE: 'scan:done',
  SCAN_ERROR: 'scan:error',
  DELETE_ITEM: 'delete:item',
  DELETE_DONE: 'delete:done',
} as const
