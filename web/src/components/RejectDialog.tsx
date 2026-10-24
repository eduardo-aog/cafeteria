import { useState, type ReactNode } from 'react'
import { Dialog } from 'radix-ui'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { REJECT_REASON_LABELS, type RejectReason } from '@/lib/types'

interface RejectDialogProps {
  trigger: ReactNode
  onConfirm: (input: { reason: RejectReason; note?: string }) => void
}

// Rechazo de un pago (8.6): motivo y, si es «Otro», una nota obligatoria de hasta 200 caracteres.
export function RejectDialog({ trigger, onConfirm }: RejectDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<RejectReason>('REFERENCE_NOT_FOUND')
  const [note, setNote] = useState('')
  const needsNote = reason === 'OTHER'
  const noteMissing = needsNote && note.trim() === ''

  const submit = () => {
    onConfirm({ reason, note: note.trim() || undefined })
    setOpen(false)
    setNote('')
    setReason('REFERENCE_NOT_FOUND')
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-104 -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-lg border border-border bg-popover p-4 text-popover-foreground outline-none"
        >
          <Dialog.Title className="font-heading text-lg font-medium">Rechazar pago</Dialog.Title>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reject-reason">Motivo</Label>
            <NativeSelect
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as RejectReason)}
            >
              {(Object.keys(REJECT_REASON_LABELS) as RejectReason[]).map((r) => (
                <option key={r} value={r}>
                  {REJECT_REASON_LABELS[r]}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reject-note">
              {needsNote ? 'Nota (obligatoria)' : 'Nota (opcional)'}
            </Label>
            <Textarea
              id="reject-note"
              maxLength={200}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              aria-invalid={noteMissing}
            />
            <p className="text-sm text-muted-foreground">{note.length}/200</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="destructive" disabled={noteMissing} onClick={submit}>
              Rechazar pago
            </Button>
            <Dialog.Close asChild>
              <Button variant="secondary">Cancelar</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
