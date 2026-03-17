import { useCallback, useMemo, useRef, useState } from 'react'

interface RecurrenceFormProps {
  value: string
  onChange: (value: string) => void
}

type RecurrenceMode = 'none' | 'preset' | 'custom'
type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
type EndMode = 'count' | 'until' | 'never'

const PRESETS: { label: string; value: string }[] = [
  { label: 'Nie', value: '' },
  { label: 'Täglich', value: 'FREQ=DAILY;COUNT=30' },
  { label: 'Wöchentlich', value: 'FREQ=WEEKLY;COUNT=12' },
  { label: 'Alle 2 Wochen', value: 'FREQ=WEEKLY;INTERVAL=2;COUNT=6' },
  { label: 'Monatlich', value: 'FREQ=MONTHLY;COUNT=6' },
  { label: 'Jährlich', value: 'FREQ=YEARLY;COUNT=3' },
]

const WEEKDAYS = [
  { key: 'MO', label: 'Mo' },
  { key: 'TU', label: 'Di' },
  { key: 'WE', label: 'Mi' },
  { key: 'TH', label: 'Do' },
  { key: 'FR', label: 'Fr' },
  { key: 'SA', label: 'Sa' },
  { key: 'SU', label: 'So' },
] as const

const FREQ_LABELS: Record<Frequency, { singular: string; plural: string }> = {
  DAILY: { singular: 'Tag', plural: 'Tag(e)' },
  WEEKLY: { singular: 'Woche', plural: 'Woche(n)' },
  MONTHLY: { singular: 'Monat', plural: 'Monat(e)' },
  YEARLY: { singular: 'Jahr', plural: 'Jahr(e)' },
}

const WEEKDAY_NAMES: Record<string, string> = {
  MO: 'Mo', TU: 'Di', WE: 'Mi', TH: 'Do', FR: 'Fr', SA: 'Sa', SU: 'So',
}

function parseRRule(rrule: string) {
  const defaults = {
    freq: 'WEEKLY' as Frequency,
    interval: 1,
    byDay: [] as string[],
    byMonthDay: null as number | null,
    endMode: 'count' as EndMode,
    count: 12,
    until: '',
  }
  if (!rrule) return defaults

  const parts = new Map<string, string>()
  for (const part of rrule.split(';')) {
    const [k, v] = part.split('=')
    if (k && v) parts.set(k, v)
  }

  const freq = (parts.get('FREQ') as Frequency) || defaults.freq
  const interval = parts.has('INTERVAL') ? parseInt(parts.get('INTERVAL')!) : 1
  const byDay = parts.has('BYDAY') ? parts.get('BYDAY')!.split(',') : []
  const byMonthDay = parts.has('BYMONTHDAY') ? parseInt(parts.get('BYMONTHDAY')!) : null

  let endMode: EndMode = 'never'
  let count = 12
  let until = ''
  if (parts.has('COUNT')) {
    endMode = 'count'
    count = parseInt(parts.get('COUNT')!)
  } else if (parts.has('UNTIL')) {
    endMode = 'until'
    const raw = parts.get('UNTIL')!
    until = raw.length >= 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw
  }

  return { freq, interval, byDay, byMonthDay, endMode, count, until }
}

function buildRRule(
  freq: Frequency,
  interval: number,
  byDay: string[],
  byMonthDay: number | null,
  endMode: EndMode,
  count: number,
  until: string,
): string {
  const parts = [`FREQ=${freq}`]
  if (interval > 1) parts.push(`INTERVAL=${interval}`)
  if (freq === 'WEEKLY' && byDay.length > 0) parts.push(`BYDAY=${byDay.join(',')}`)
  if (freq === 'MONTHLY' && byMonthDay !== null) parts.push(`BYMONTHDAY=${byMonthDay}`)
  if (endMode === 'count') parts.push(`COUNT=${count}`)
  if (endMode === 'until' && until) parts.push(`UNTIL=${until.replace(/-/g, '')}T235959Z`)
  return parts.join(';')
}

function getSummary(
  freq: Frequency,
  interval: number,
  byDay: string[],
  byMonthDay: number | null,
  endMode: EndMode,
  count: number,
  until: string,
): string {
  const freqLabel = FREQ_LABELS[freq]
  let base = ''

  if (freq === 'WEEKLY' && byDay.length > 0) {
    const dayNames = byDay.map((d) => WEEKDAY_NAMES[d] || d).join(', ')
    base = interval > 1 ? `Alle ${interval} Wochen am ${dayNames}` : `Jeden ${dayNames}`
  } else if (freq === 'MONTHLY' && byMonthDay !== null) {
    base = interval > 1 ? `Am ${byMonthDay}. jeden ${interval}. Monats` : `Am ${byMonthDay}. jeden Monats`
  } else if (interval > 1) {
    base = `Alle ${interval} ${freqLabel.plural}`
  } else {
    const map: Record<Frequency, string> = {
      DAILY: 'Täglich',
      WEEKLY: 'Wöchentlich',
      MONTHLY: 'Monatlich',
      YEARLY: 'Jährlich',
    }
    base = map[freq]
  }

  if (endMode === 'count') return `${base}, ${count} Termine`
  if (endMode === 'until' && until) return `${base}, bis ${new Date(until).toLocaleDateString('de-DE')}`
  if (endMode === 'until') return `${base}, bis ...`
  return `${base}, unbegrenzt`
}

export function RecurrenceForm({ value, onChange }: RecurrenceFormProps) {
  const [mode, setMode] = useState<RecurrenceMode>(() => {
    if (!value) return 'none'
    return PRESETS.some((p) => p.value === value) ? 'preset' : 'custom'
  })
  const [freq, setFreq] = useState<Frequency>('WEEKLY')
  const [interval, setIntervalVal] = useState(1)
  const [byDay, setByDay] = useState<string[]>([])
  const [byMonthDay, setByMonthDay] = useState<number | null>(null)
  const [endMode, setEndMode] = useState<EndMode>('count')
  const [count, setCount] = useState(12)
  const [until, setUntil] = useState('')

  // Track the last value we emitted to distinguish internal vs external changes
  const lastEmitted = useRef(value)

  // Sync from external value changes only (not our own onChange calls)
  const prevValue = useRef(value)
  if (value !== prevValue.current) {
    prevValue.current = value
    if (value !== lastEmitted.current) {
      // External change — sync all fields
      const parsed = parseRRule(value)
      setFreq(parsed.freq)
      setIntervalVal(parsed.interval)
      setByDay(parsed.byDay)
      setByMonthDay(parsed.byMonthDay)
      setEndMode(parsed.endMode)
      setCount(parsed.count)
      setUntil(parsed.until)
      if (!value) {
        setMode('none')
      } else if (PRESETS.some((p) => p.value === value)) {
        setMode('preset')
      } else {
        setMode('custom')
      }
    }
  }

  const emit = useCallback((rrule: string) => {
    lastEmitted.current = rrule
    onChange(rrule)
  }, [onChange])

  const dropdownValue = useMemo(() => {
    if (mode === 'custom') return 'custom'
    const preset = PRESETS.find((p) => p.value === value)
    if (preset) return preset.value
    if (!value) return ''
    return 'custom'
  }, [mode, value])

  const handlePresetChange = (selected: string) => {
    if (selected === 'custom') {
      setMode('custom')
      if (!value) {
        // Initialize with sensible defaults
        setFreq('WEEKLY')
        setIntervalVal(1)
        setByDay([])
        setByMonthDay(null)
        setEndMode('count')
        setCount(12)
        setUntil('')
        emit(buildRRule('WEEKLY', 1, [], null, 'count', 12, ''))
      }
      return
    }
    setMode(selected === '' ? 'none' : 'preset')
    emit(selected)
  }

  // All custom handlers: update local state + emit RRULE from explicit values (no stale closures)
  const handleFreqChange = (f: Frequency) => {
    setFreq(f)
    setByDay([])
    setByMonthDay(null)
    emit(buildRRule(f, interval, [], null, endMode, count, until))
  }

  const handleIntervalChange = (v: number) => {
    const clamped = Math.max(1, v)
    setIntervalVal(clamped)
    emit(buildRRule(freq, clamped, byDay, byMonthDay, endMode, count, until))
  }

  const toggleDay = (day: string) => {
    const next = byDay.includes(day) ? byDay.filter((d) => d !== day) : [...byDay, day]
    setByDay(next)
    emit(buildRRule(freq, interval, next, byMonthDay, endMode, count, until))
  }

  const handleMonthDay = (day: number) => {
    const next = byMonthDay === day ? null : day
    setByMonthDay(next)
    emit(buildRRule(freq, interval, byDay, next, endMode, count, until))
  }

  const handleEndModeChange = (em: EndMode) => {
    setEndMode(em)
    emit(buildRRule(freq, interval, byDay, byMonthDay, em, count, until))
  }

  const handleCountChange = (c: number) => {
    const clamped = Math.max(1, c)
    setCount(clamped)
    emit(buildRRule(freq, interval, byDay, byMonthDay, endMode, clamped, until))
  }

  const handleUntilChange = (u: string) => {
    setUntil(u)
    emit(buildRRule(freq, interval, byDay, byMonthDay, endMode, count, u))
  }

  const summary = mode === 'custom' ? getSummary(freq, interval, byDay, byMonthDay, endMode, count, until) : ''

  const selectClass = 'w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'
  const inputClass = 'bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'

  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1">Wiederholung</label>
      <select
        value={dropdownValue}
        onChange={(e) => handlePresetChange(e.target.value)}
        className={selectClass}
      >
        {PRESETS.map((p) => (
          <option key={p.label} value={p.value}>{p.label}</option>
        ))}
        <option value="custom">Eigene...</option>
      </select>

      {mode === 'custom' && (
        <div className="mt-3 space-y-3 rounded-lg border border-border-control bg-bg-card p-3">
          {/* Frequency */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Häufigkeit</label>
            <select
              value={freq}
              onChange={(e) => handleFreqChange(e.target.value as Frequency)}
              className={selectClass}
            >
              <option value="DAILY">Täglich</option>
              <option value="WEEKLY">Wöchentlich</option>
              <option value="MONTHLY">Monatlich</option>
              <option value="YEARLY">Jährlich</option>
            </select>
          </div>

          {/* Interval */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Alle</span>
            <input
              type="number"
              min={1}
              value={interval}
              onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
              className={`${inputClass} w-16 text-center`}
            />
            <span className="text-sm text-text-secondary">{FREQ_LABELS[freq].plural}</span>
          </div>

          {/* Weekday chips (WEEKLY only) */}
          {freq === 'WEEKLY' && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">An</label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((wd) => {
                  const active = byDay.includes(wd.key)
                  return (
                    <button
                      key={wd.key}
                      type="button"
                      onClick={() => toggleDay(wd.key)}
                      className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${
                        active
                          ? 'bg-brand text-text-on-brand'
                          : 'bg-bg-input border border-border-control text-text-primary hover:bg-brand-muted'
                      }`}
                    >
                      {wd.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Month day grid (MONTHLY only) */}
          {freq === 'MONTHLY' && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Am Tag</label>
              <div className="grid grid-cols-8 gap-1">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                  const active = byMonthDay === day
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleMonthDay(day)}
                      className={`h-8 rounded text-xs font-medium transition-colors ${
                        active
                          ? 'bg-brand text-text-on-brand'
                          : 'bg-bg-input border border-border-control text-text-primary hover:bg-brand-muted'
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* End condition */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Endet</label>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={endMode}
                onChange={(e) => handleEndModeChange(e.target.value as EndMode)}
                className={`${selectClass} w-auto`}
              >
                <option value="count">Nach</option>
                <option value="until">Bis</option>
                <option value="never">Nie</option>
              </select>
              {endMode === 'count' && (
                <>
                  <input
                    type="number"
                    min={1}
                    value={count}
                    onChange={(e) => handleCountChange(parseInt(e.target.value) || 1)}
                    className={`${inputClass} w-16 text-center`}
                  />
                  <span className="text-sm text-text-secondary">Terminen</span>
                </>
              )}
              {endMode === 'until' && (
                <input
                  type="date"
                  value={until}
                  onChange={(e) => handleUntilChange(e.target.value)}
                  className={`${inputClass} w-auto`}
                />
              )}
            </div>
          </div>

          {/* Summary */}
          {summary && (
            <p className="text-xs text-text-tertiary italic">{summary}</p>
          )}
        </div>
      )}
    </div>
  )
}
