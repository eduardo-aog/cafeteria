import { useEffect, useState } from 'react'

// Hora actual que se actualiza sola, para cuentas regresivas en pantalla.
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
