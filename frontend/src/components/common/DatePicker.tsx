interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

export function DatePicker({ value, onChange, label }: DatePickerProps) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
      />
    </div>
  )
}
