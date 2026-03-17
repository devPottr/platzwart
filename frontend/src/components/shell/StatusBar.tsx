import { useAuthStore } from '../../stores/authStore'
import { useShellStore } from '../../stores/shellStore'
import { useFieldStore } from '../../stores/fieldStore'
import { getKW, addDays, formatShortDate } from '../../utils/date'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  platzwart: 'Platzwart',
  trainer: 'Trainer',
  member: 'Mitglied',
}

export function StatusBar() {
  const user = useAuthStore((s) => s.user)
  const weekStart = useShellStore((s) => s.weekStart)
  const fields = useFieldStore((s) => s.fields)

  const weekEnd = addDays(weekStart, 6)
  const kw = getKW(weekStart)

  return (
    <div className="h-7 bg-bg-activity border-t border-border-subtle flex items-center px-3 text-[11px] text-text-tertiary select-none" style={{ gridRow: '2', gridColumn: '1 / -1' }}>
      {/* Left: User + Role */}
      <div className="flex items-center gap-2">
        {user && (
          <>
            <span className="px-1.5 py-0.5 rounded bg-brand/15 text-brand font-medium text-[10px]">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
            <span>{user.displayName}</span>
          </>
        )}
      </div>

      {/* Center: KW + Week range */}
      <div className="flex-1 text-center">
        <span className="font-medium text-text-secondary">KW {kw}</span>
        <span className="mx-1.5 text-text-muted">·</span>
        <span>{formatShortDate(weekStart)} – {formatShortDate(weekEnd)}</span>
      </div>

      {/* Right: Stats */}
      <div className="flex items-center gap-3">
        <span>{fields.length} {fields.length === 1 ? 'Platz' : 'Plaetze'}</span>
      </div>
    </div>
  )
}
