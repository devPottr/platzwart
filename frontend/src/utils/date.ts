export function toLocalISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getMonday(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return toLocalISO(d)
}

export function formatDateDE(date: string): string {
  const months = [
    'Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ]
  const d = new Date(date + 'T00:00:00')
  return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toLocalISO(d)
}

export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()}.${d.getMonth() + 1}.`
}

export function getKW(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00')
  const dayOfWeek = d.getDay() || 7
  const thu = new Date(d)
  thu.setDate(d.getDate() + 4 - dayOfWeek)
  const yearStart = new Date(thu.getFullYear(), 0, 1)
  return Math.ceil(((thu.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export function getMonthDays(year: number, month: number): { date: string; inMonth: boolean }[] {
  const first = new Date(year, month, 1)
  const startDow = (first.getDay() + 6) % 7
  const lastDate = new Date(year, month + 1, 0).getDate()

  const days: { date: string; inMonth: boolean }[] = []

  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    days.push({ date: toLocalISO(d), inMonth: false })
  }

  for (let d = 1; d <= lastDate; d++) {
    const dt = new Date(year, month, d)
    days.push({ date: toLocalISO(dt), inMonth: true })
  }

  while (days.length < 42) {
    const dt = new Date(year, month + 1, days.length - startDow - lastDate + 1)
    days.push({ date: toLocalISO(dt), inMonth: false })
  }

  return days
}

const DAY_NAMES = ['SONNTAG', 'MONTAG', 'DIENSTAG', 'MITTWOCH', 'DONNERSTAG', 'FREITAG', 'SAMSTAG']

const MONTHS_DE = [
  'Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

export function formatFullDateDE(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const dayName = DAY_NAMES[d.getDay()]
  const capitalized = dayName.charAt(0) + dayName.slice(1).toLowerCase()
  return `${capitalized} – ${d.getDate()}. ${MONTHS_DE[d.getMonth()]} ${d.getFullYear()}`
}

export function getDayLabel(dateStr: string, today: string): string {
  const tomorrow = addDays(today, 1)
  if (dateStr === today) return 'HEUTE'
  if (dateStr === tomorrow) return 'MORGEN'
  const d = new Date(dateStr + 'T00:00:00')
  return DAY_NAMES[d.getDay()]
}

export function getWeekStartForDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return toLocalISO(d)
}

export function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  return day === 0 || day === 6
}
