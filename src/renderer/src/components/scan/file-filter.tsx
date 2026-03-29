import { useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Preset {
  label: string
  extensions: string[]
}

const PRESETS: Preset[] = [
  { label: 'Videos', extensions: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mts', 'vob'] },
  { label: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'tiff', 'heic', 'raw', 'cr2', 'avif'] },
  { label: 'Audio',  extensions: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'opus', 'wma', 'aiff'] },
  { label: 'Archives', extensions: ['zip', 'tar', 'gz', 'bz2', 'xz', '7z', 'rar', 'zst'] },
  { label: 'Documents', extensions: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'odt', 'rtf'] },
  { label: 'Code', extensions: ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'go', 'rs', 'rb', 'php', 'cs', 'swift', 'kt'] },
]

export interface FileFilterValue {
  extensions: string[]
}

interface Props {
  value: FileFilterValue
  onChange: (v: FileFilterValue) => void
}

export function FileFilter({ value, onChange }: Props) {
  const [inputValue, setInputValue] = useState('')

  const isAllActive = value.extensions.length === 0

  const activePreset = PRESETS.find(
    (p) =>
      p.extensions.length === value.extensions.length &&
      p.extensions.every((e) => value.extensions.includes(e))
  )

  const togglePreset = useCallback(
    (preset: Preset) => {
      if (activePreset?.label === preset.label) {
        onChange({ extensions: [] }) // clear → all
      } else {
        onChange({ extensions: preset.extensions })
      }
    },
    [activePreset, onChange]
  )

  const removeExtension = useCallback(
    (ext: string) => {
      const next = value.extensions.filter((e) => e !== ext)
      onChange({ extensions: next })
    },
    [value.extensions, onChange]
  )

  const addCustomExtensions = useCallback(() => {
    const exts = inputValue
      .split(/[\s,;]+/)
      .map((e) => e.toLowerCase().replace(/^\./, '').trim())
      .filter(Boolean)
    if (exts.length === 0) return
    const merged = [...new Set([...value.extensions, ...exts])]
    onChange({ extensions: merged })
    setInputValue('')
  }, [inputValue, value.extensions, onChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') addCustomExtensions()
    },
    [addCustomExtensions]
  )

  return (
    <div className="space-y-2.5">
      {/* Preset chips */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onChange({ extensions: [] })}
          className={cn(
            'rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors',
            isAllActive
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          All types
        </button>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => togglePreset(preset)}
            className={cn(
              'rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors',
              activePreset?.label === preset.label
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom extension tags */}
      {value.extensions.length > 0 && !activePreset && (
        <div className="flex flex-wrap gap-1">
          {value.extensions.map((ext) => (
            <Badge key={ext} variant="secondary" className="gap-1 text-xs pr-1">
              .{ext}
              <button
                type="button"
                onClick={() => removeExtension(ext)}
                className="hover:text-destructive ml-0.5"
              >
                <X className="size-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Custom input */}
      <div className="flex gap-2">
        <Input
          placeholder="mp4, mkv, pdf…"
          className="h-7 text-xs"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          onClick={addCustomExtensions}
        >
          Add
        </Button>
      </div>
    </div>
  )
}
