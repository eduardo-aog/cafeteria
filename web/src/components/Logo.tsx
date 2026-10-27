import { cn } from '@/lib/utils'

// Decorativo: el nombre del local ya va escrito al lado, así que no necesita texto alternativo.
export function Logo({ className }: { className?: string }) {
  return <img src="/logo.svg" alt="" aria-hidden="true" className={cn('shrink-0', className)} />
}
