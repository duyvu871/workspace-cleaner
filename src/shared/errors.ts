import type { IpcError } from './types'

export const ErrorCode = {
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION: 'PERMISSION_DENIED',
  SCAN_FAILED: 'SCAN_FAILED',
  DELETE_FAILED: 'DELETE_FAILED',
  CANCELLED: 'CANCELLED',
  UNKNOWN: 'UNKNOWN_ERROR',
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

export function makeError(code: ErrorCode, message: string, issues?: IpcError['issues']): IpcError {
  return { ok: false, code, message, ...(issues ? { issues } : {}) }
}

export function ipcErrorFromZod(err: import('zod').ZodError): IpcError {
  return makeError(
    ErrorCode.VALIDATION,
    err.issues.map((i) => i.message).join(', '),
    err.issues.map((i) => ({ path: i.path.map(String), message: i.message }))
  )
}
