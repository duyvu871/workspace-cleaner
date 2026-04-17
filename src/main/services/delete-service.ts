import path from 'path'
import os from 'os'
import { execFile } from 'child_process'
import { z } from 'zod'
import type { DeleteItemResult, DeleteDone } from '@shared/types'
import { ALL_TARGET_FOLDERS } from './scan-targets'

// ── Validation ────────────────────────────────────────────────────────────────

const homedirPath = path.resolve(os.homedir())
const rootPath = path.parse(homedirPath).root

function isKnownCleanupPath(inputPath: string): boolean {
  const lower = inputPath.toLowerCase()
  return (
    [...ALL_TARGET_FOLDERS].some((name) => lower.includes(name.toLowerCase())) ||
    lower.includes('trash') ||
    lower.includes('cache') ||
    lower.includes('dist') ||
    lower.includes('build')
  )
}

function isSafeLocalPath(inputPath: string): boolean {
  if (!path.isAbsolute(inputPath) || inputPath.includes('..')) return false

  const resolved = path.resolve(path.normalize(inputPath))
  const lowerResolved = resolved.toLowerCase()
  const lowerHome = homedirPath.toLowerCase()
  const homePrefix = lowerHome.endsWith(path.sep.toLowerCase()) ? lowerHome : `${lowerHome}${path.sep}`

  // Never allow deleting filesystem root or the whole home directory directly.
  if (resolved === rootPath || lowerResolved === lowerHome) return false

  // Allow anything under the user's home directory, plus legacy cleanup patterns.
  return lowerResolved.startsWith(homePrefix) || isKnownCleanupPath(resolved)
}

export const DeleteSchema = z.object({
  paths: z
    .array(
      z.string().refine((p) => {
        if (p.startsWith('docker-image:')) return true
        if (p.startsWith('docker-volume:')) return true
        return isSafeLocalPath(p)
      }, 'Invalid or unsafe path')
    )
    .min(1, 'At least one path required'),
})

export type DeleteInput = z.infer<typeof DeleteSchema>

// ── Event callbacks ───────────────────────────────────────────────────────────

export interface DeleteEmitter {
  item(data: DeleteItemResult): void
  done(data: DeleteDone): void
}

// ── Execution ─────────────────────────────────────────────────────────────────

function removeDockerImage(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile('docker', ['rmi', '-f', id], { timeout: 60_000 }, (err) => {
      if (err) reject(new Error(`docker rmi failed: ${err.message}`))
      else resolve()
    })
  })
}

function removeDockerVolume(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile('docker', ['volume', 'rm', '-f', name], { timeout: 60_000 }, (err) => {
      if (err) reject(new Error(`docker volume rm failed: ${err.message}`))
      else resolve()
    })
  })
}

function removeFolder(folderPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile('rm', ['-rf', folderPath], { timeout: 60_000 }, (err) => {
      if (err) reject(new Error(`rm -rf failed: ${err.message}`))
      else resolve()
    })
  })
}

export async function deleteItems(input: DeleteInput, emit: DeleteEmitter): Promise<void> {
  for (const folderPath of input.paths) {
    try {
      if (folderPath.startsWith('docker-image:')) {
        await removeDockerImage(folderPath.slice('docker-image:'.length))
      } else if (folderPath.startsWith('docker-volume:')) {
        await removeDockerVolume(folderPath.slice('docker-volume:'.length))
      } else {
        await removeFolder(folderPath)
      }
      emit.item({ path: folderPath, success: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      emit.item({ path: folderPath, success: false, error: message })
    }
  }

  emit.done({ total: input.paths.length })
}
