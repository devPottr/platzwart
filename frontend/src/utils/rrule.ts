const WEEKDAY_MAP: Record<string, number> = {
  MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 0,
}

function parseRRuleParts(rRule: string): Map<string, string> {
  const parts = new Map<string, string>()
  for (const part of rRule.split(';')) {
    const [k, v] = part.split('=')
    if (k && v) parts.set(k, v)
  }
  return parts
}

export function expandOccurrences(
  startTime: string,
  endTime: string,
  rRule: string,
): Array<{ start: string; end: string }> {
  if (!rRule) {
    return [{ start: startTime, end: endTime }]
  }

  const parts = parseRRuleParts(rRule)
  const freq = parts.get('FREQ') ?? 'WEEKLY'
  const interval = parts.has('INTERVAL') ? parseInt(parts.get('INTERVAL')!) : 1
  const count = parts.has('COUNT') ? parseInt(parts.get('COUNT')!) : null
  const untilRaw = parts.get('UNTIL')
  const byDay = parts.has('BYDAY') ? parts.get('BYDAY')!.split(',') : []
  const byMonthDay = parts.has('BYMONTHDAY') ? parseInt(parts.get('BYMONTHDAY')!) : null

  let untilDate: Date | null = null
  if (untilRaw) {
    const y = untilRaw.slice(0, 4)
    const m = untilRaw.slice(4, 6)
    const d = untilRaw.slice(6, 8)
    untilDate = new Date(`${y}-${m}-${d}T23:59:59`)
  }

  const maxOccurrences = count ?? 52 // safety limit
  const base = new Date(startTime)
  const timeStr = startTime.slice(11) // "HH:MM:SS" or "HH:MM"
  const endTimeStr = endTime.slice(11)

  const results: Array<{ start: string; end: string }> = []

  if (freq === 'WEEKLY' && byDay.length > 0) {
    // Expand to specific weekdays
    const targetDays = byDay.map((d) => WEEKDAY_MAP[d]).filter((d) => d !== undefined)
    const cursor = new Date(base)
    // Align cursor to start of the week (Monday)
    const dow = cursor.getDay()
    const diffToMon = dow === 0 ? -6 : 1 - dow
    cursor.setDate(cursor.getDate() + diffToMon)

    let weekCount = 0
    while (results.length < maxOccurrences) {
      for (const targetDay of targetDays.sort((a, b) => a - b)) {
        const occ = new Date(cursor)
        const monDay = occ.getDay() === 0 ? 7 : occ.getDay() // Monday=1
        const targetAdj = targetDay === 0 ? 7 : targetDay // Sunday=7
        occ.setDate(occ.getDate() + (targetAdj - monDay))

        if (occ < base) continue
        if (untilDate && occ > untilDate) return results
        if (results.length >= maxOccurrences) return results

        const dateStr = formatDate(occ)
        results.push({
          start: `${dateStr}T${timeStr}`,
          end: `${dateStr}T${endTimeStr}`,
        })
      }
      weekCount++
      cursor.setDate(cursor.getDate() + 7 * interval)
      if (untilDate && cursor > untilDate) break
    }
  } else {
    // DAILY, WEEKLY (no BYDAY), MONTHLY, YEARLY
    const cursor = new Date(base)
    for (let i = 0; i < maxOccurrences; i++) {
      if (untilDate && cursor > untilDate) break

      if (freq === 'MONTHLY' && byMonthDay !== null) {
        // Set to specific day of month
        cursor.setDate(byMonthDay)
      }

      const dateStr = formatDate(cursor)
      results.push({
        start: `${dateStr}T${timeStr}`,
        end: `${dateStr}T${endTimeStr}`,
      })

      // Advance cursor
      switch (freq) {
        case 'DAILY':
          cursor.setDate(cursor.getDate() + interval)
          break
        case 'WEEKLY':
          cursor.setDate(cursor.getDate() + 7 * interval)
          break
        case 'MONTHLY':
          cursor.setMonth(cursor.getMonth() + interval)
          break
        case 'YEARLY':
          cursor.setFullYear(cursor.getFullYear() + interval)
          break
      }
    }
  }

  return results
}

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
