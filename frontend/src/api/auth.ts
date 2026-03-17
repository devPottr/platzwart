import type { User } from '../types'

function getCsrfToken(): string {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/)
  return decodeURIComponent(match?.[1] ?? '')
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-XSRF-TOKEN': getCsrfToken(),
    ...(options?.headers as Record<string, string> ?? {}),
  }
  const res = await fetch(url, { ...options, headers, credentials: 'same-origin' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unbekannter Fehler' }))
    throw new ApiError(res.status, body.error ?? 'Unbekannter Fehler', body)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: Record<string, unknown>) {
    super(message)
    this.name = 'ApiError'
  }
}

export { apiFetch }

export async function login(email: string, password: string): Promise<User> {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function register(email: string, password: string, displayName: string): Promise<User> {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  })
}

export async function logout(): Promise<void> {
  await apiFetch('/api/auth/logout', { method: 'POST' })
}

export async function getMe(): Promise<User> {
  return apiFetch('/api/auth/me')
}
