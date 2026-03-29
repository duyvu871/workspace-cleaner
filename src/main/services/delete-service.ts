import path from 'path'
import { execFile } from 'child_process'
import { z } from 'zod'
import type { DeleteItemResult, DeleteDone } from '@shared/types'
import { ALL_TARGET_FOLDERS } from './scan-targets'

// ── Validation ────────────────────────────────────────────────────────────────

export const DeleteSchema = z.object({
  paths: z
    .array(
      z.string().refine((p) => {
        if (p.startsWith('docker-image:')) return true
        if (p.startsWith('docker-volume:')) return true
        return (
          path.isAbsolute(p) &&
          !p.includes('..') &&
          ([...ALL_TARGET_FOLDERS].some((name) => p.includes(name)) ||
            p.includes('trash') ||
            p.includes('cache') ||
            p.includes('dist') ||
            p.includes('build'))
        )
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
