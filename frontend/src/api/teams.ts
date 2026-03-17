import type { Team } from '../types'
import { apiFetch } from './auth'

export async function getTeams(): Promise<Team[]> {
  return apiFetch('/api/teams')
}

export async function getTeam(id: number): Promise<Team> {
  return apiFetch(`/api/teams/${id}`)
}

export async function createTeam(name: string, color: string): Promise<Team> {
  return apiFetch('/api/teams', {
    method: 'POST',
    body: JSON.stringify({ name, color }),
  })
}

export async function updateTeam(id: number, name: string, color: string): Promise<Team> {
  return apiFetch(`/api/teams/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, color }),
  })
}

export async function deleteTeam(id: number): Promise<void> {
  await apiFetch(`/api/teams/${id}`, { method: 'DELETE' })
}

export async function addTeamMember(teamId: number, userId: number, isLead: boolean): Promise<void> {
  await apiFetch(`/api/teams/${teamId}/members`, {
    method: 'POST',
    body: JSON.stringify({ userId, isLead }),
  })
}

export async function removeTeamMember(teamId: number, userId: number): Promise<void> {
  await apiFetch(`/api/teams/${teamId}/members/${userId}`, { method: 'DELETE' })
}
