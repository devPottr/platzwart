interface RecurrenceFormProps {
  value: string
  onChange: (value: string) => void
}

export function RecurrenceForm({ value, onChange }: RecurrenceFormProps) {
  const presets = [
    { label: 'Einmalig', value: '' },
    { label: 'Woechentlich', value: 'FREQ=WEEKLY;COUNT=12' },
    { label: '2-woechentlich', value: 'FREQ=WEEKLY;INTERVAL=2;COUNT=6' },
  ]

  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1">Wiederholung</label>
      <select
        value={presets.find((p) => p.value === value) ? value : 'custom'}
        onChange={(e) => onChange(e.target.value === 'custom' ? value : e.target.value)}
        className="w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm text-text-primary"
      >
        {presets.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
        <option value="custom">Benutzerdefiniert (RRULE)</option>
      </select>
      {!presets.find((p) => p.value === value) && value !== '' && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="FREQ=WEEKLY;COUNT=10"
          className="w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm text-text-primary mt-2 font-mono"
        />
      )}
    </div>
  )
}
