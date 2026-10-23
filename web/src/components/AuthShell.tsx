import type { ReactNode } from 'react'
import { APP_NAME } from '@/config'

export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-svh max-w-120 flex-col gap-6 px-4 py-4">
      <header>
        <p className="font-heading text-xl font-semibold">{APP_NAME}</p>
      </header>
      <h1 className="text-2xl">{title}</h1>
      {children}
    </div>
  )
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  )
}
