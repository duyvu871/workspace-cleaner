import { useState, useEffect, useId } from 'react'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  sliderToBytes,
  bytesToSlider,
  formatThreshold,
  parseThresholdInput,
} from '@/lib/format'

interface ThresholdSliderProps {
  value: number // bytes
  onChange: (bytes: number) => void
  disabled?: boolean
}

export function ThresholdSlider({ value, onChange, disabled }: ThresholdSliderProps) {
  const inputId = useId()
  // Local draft for the text input — allows free typing without resetting on every keystroke
  const [draft, setDraft] = useState(() => formatThreshold(value))
  const [draftValid, setDraftValid] = useState(true)

  // Keep draft in sync when external value changes (e.g., slider moved)
  useEffect(() => {
    setDraft(formatThreshold(value))
    setDraftValid(true)
  }, [value])

  function handleSlider([sliderVal]: number[]) {
    onChange(sliderToBytes(sliderVal))
  }

  function handleInputChange(raw: string) {
    setDraft(raw)
    const parsed = parseThresholdInput(raw)
    setDraftValid(parsed !== null)
    if (parsed !== null) onChange(parsed)
  }

  function handleInputBlur() {
    // On blur: normalise the display to the canonical format
    const parsed = parseThresholdInput(draft)
    if (parsed !== null) {
      onChange(parsed)
      setDraft(formatThreshold(parsed))
      setDraftValid(true)
    } else {
      // Reset to last valid value
      setDraft(formatThreshold(value))
      setDraftValid(true)
    }
  }

  const sliderVal = bytesToSlider(value)

  // Tick marks at 1 MB, 10 MB, 100 MB, 1 GB, 10 GB
  const ticks = [
    { label: '1 MB', pos: 0 },
    { label: '10 MB', pos: 25 },
    { label: '100 MB', pos: 50 },
    { label: '1 GB', pos: 75 },
    { label: '10 GB', pos: 100 },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          Min. file size
        </label>
        <Input
          id={inputId}
          value={draft}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={handleInputBlur}
          disabled={disabled}
          aria-invalid={!draftValid}
          placeholder="100 MB"
          className={cn(
            'h-7 w-28 text-xs text-right tabular-nums',
            !draftValid && 'border-destructive ring-destructive/20'
          )}
        />
      </div>

      <div className="px-1">
        <Slider
          min={0}
          max={100}
          step={1}
          value={[sliderVal]}
          onValueChange={handleSlider}
          disabled={disabled}
          className="w-full"
        />

        {/* Tick labels */}
        <div className="relative mt-1.5 h-4">
          {ticks.map((t) => (
            <span
              key={t.label}
              className="absolute text-[10px] text-muted-foreground/70 -translate-x-1/2 whitespace-nowrap"
              style={{ left: `${t.pos}%` }}
            >
              {t.label}
            </span>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground/60 text-center">
        Will scan for files ≥&nbsp;
        <span className="font-medium text-muted-foreground">{formatThreshold(value)}</span>
      </p>
    </div>
  )
}
