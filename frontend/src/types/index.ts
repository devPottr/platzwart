export interface User {
  id: number
  email: string
  displayName: string
  role: 'admin' | 'platzwart' | 'trainer' | 'member'
  isActive?: boolean
}

export interface Team {
  id: number
  name: string
  color: string
  sortOrder: number
  members: TeamMember[]
}

export interface TeamMember {
  userId: number
  displayName: string
  isLead: boolean
}

export interface Field {
  id: number
  name: string
  gridCols: number
  gridRows: number
  sortOrder: number
  sections: FieldSection[]
}

export interface FieldSection {
  id: number
  colIndex: number
  rowIndex: number
  label: string | null
}

export interface Booking {
  id: number
  title: string
  bookingType: string
  teamId: number | null
  teamName: string | null
  teamColor: string | null
  bookedById: number
  bookedByName: string
  startTime: string
  endTime: string
  notes: string | null
  recurrenceId: number | null
  sections: SectionRef[]
}

export interface SectionRef {
  id: number
  colIndex: number
  rowIndex: number
  label: string | null
}

export type UserRole = User['role']

export const ROLE_LEVELS: Record<UserRole, number> = {
  member: 0,
  trainer: 1,
  platzwart: 2,
  admin: 3,
}

export function hasMinRole(user: User | null, minRole: UserRole): boolean {
  if (!user) return false
  return ROLE_LEVELS[user.role] >= ROLE_LEVELS[minRole]
}
