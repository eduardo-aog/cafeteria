import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CircleCheck } from 'lucide-react'
import { toast } from 'sonner'
import { LoadingBlock } from '@/components/QueryState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import type { ScanResult } from '@/lib/types'

// El lector (y su decodificador) pesa bastante: solo se descarga al abrir esta pantalla.
const Scanner = lazy(async () => {
  await import('@/lib/scanner')
  const { Scanner } = await import('@yudiel/react-qr-scanner')
  return { default: Scanner }
})

const NOTICE_MS = 10_000
// El mismo QR a la vista de la cámara no debe enviarse varias veces seguidas.
const REPEAT_GUARD_MS = 4_000

// Escáner del cajero (8.7): la cámara lee el QR o se escribe el código corto. Si es válido, el pedido pasa
// directo a la cola del barista, sin paso de confirmación; solo se muestra un aviso informativo.
export default function ScanPage() {
  const [notice, setNotice] = useState<ScanResult | null>(null)
  const [cameraError, setCameraError] = useState(false)
  const [manual, setManual] = useState('')
  const recent = useRef<{ code: string; at: number } | null>(null)

  const scan = useMutation({
    mutationFn: (code: string) =>
      api<ScanResult>('/cashier/scan', { method: 'POST', body: { code } }),
    onMutate: () => setNotice(null),
    onSuccess: (result) => {
      setNotice(result)
      setManual('')
    },
    onError: (err) => toast.error(err.message),
  })

  // El aviso desaparece solo (o al escanear el siguiente).
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), NOTICE_MS)
    return () => clearTimeout(timer)
  }, [notice])

  const send = (code: string) => {
    const now = Date.now()
    if (recent.current?.code === code && now - recent.current.at < REPEAT_GUARD_MS) return
    recent.current = { code, at: now }
    scan.mutate(code)
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const code = manual.trim()
    if (code) send(code)
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">Escanear pedido</h1>

      <div className="mx-auto aspect-square w-full max-w-80 overflow-hidden rounded-lg border border-border bg-muted">
        {cameraError ? (
          <p className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
            No se pudo abrir la cámara. Permite el acceso en tu navegador o escribe el código abajo.
          </p>
        ) : (
          <Suspense fallback={<LoadingBlock />}>
            <Scanner
              formats={['qr_code']}
              constraints={{ facingMode: 'environment' }}
              onScan={(codes) => {
                const value = codes[0]?.rawValue
                if (value) send(value)
              }}
              onError={() => setCameraError(true)}
            />
          </Suspense>
        )}
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        <Label htmlFor="code">O escribe el código</Label>
        <div className="flex gap-2">
          <Input
            id="code"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={36}
            placeholder="K7F2M9"
            className="font-semibold tracking-[0.2em] uppercase"
          />
          <Button type="submit" disabled={scan.isPending || manual.trim() === ''}>
            {scan.isPending ? 'Enviando…' : 'Enviar'}
          </Button>
        </div>
      </form>

      {notice && (
        <Card role="status" aria-live="polite">
          <CardContent className="flex flex-col gap-3">
            <p className="flex items-start gap-2 font-medium">
              <CircleCheck
                className="mt-0.5 size-5 shrink-0 text-success"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              Pedido {notice.pickupCode} de {notice.customerName} enviado a barra
            </p>
            <ul className="flex flex-col gap-1 border-t border-border pt-3 text-sm">
              {notice.items.map((item) => (
                <li key={item.id}>
                  <span className="font-semibold">{item.quantity} ×</span> {item.name}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
