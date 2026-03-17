import type { ReactNode } from 'react'
import { AppShell } from '../shell/AppShell'

export function Layout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>
}
