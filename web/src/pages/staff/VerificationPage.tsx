import { Check, X } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/QueryState'
import { RejectDialog } from '@/components/RejectDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useApprove, useReject, useVerificationQueue } from '@/hooks/useVerification'
import { formatBs, formatTime, formatUsd } from '@/lib/format'
import type { VerificationSubmission } from '@/lib/types'

// Cola de verificación (8.6, paso 4): se refresca sola cada 5 s.
export default function VerificationPage() {
  const queue = useVerificationQueue()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl">Cola de verificación</h1>
      {queue.isPending && <LoadingBlock />}
      {queue.isError && (
        <ErrorBlock message={queue.error.message} onRetry={() => void queue.refetch()} />
      )}
      {queue.data && queue.data.submissions.length === 0 && (
        <EmptyBlock>No hay pagos por verificar.</EmptyBlock>
      )}
      {queue.data?.submissions.map((submission) => (
        <SubmissionCard key={submission.id} submission={submission} />
      ))}
    </div>
  )
}

function SubmissionCard({ submission }: { submission: VerificationSubmission }) {
  const approve = useApprove()
  const reject = useReject()

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <p className="font-semibold">{submission.customerName}</p>
          <p className="text-sm text-muted-foreground">{formatTime(submission.submittedAt)}</p>
        </div>

        <ul className="flex flex-col gap-1 text-sm">
          {submission.items.map((item) => (
            <li key={item.id}>
              {item.quantity} × {item.name}
              {item.couponTitle && (
                <span className="text-muted-foreground"> · Cupón: {item.couponTitle}</span>
              )}
            </li>
          ))}
        </ul>

        <div className="flex items-end justify-between gap-3 border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">Total</span>
          <div className="flex flex-col items-end">
            <span className="text-lg font-semibold">{formatBs(submission.amountBsCents)}</span>
            <span className="text-sm text-muted-foreground">
              {formatUsd(submission.totalCents)}
            </span>
          </div>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Referencia</dt>
          <dd className="font-semibold tracking-wide break-all">{submission.reference}</dd>
          <dt className="text-muted-foreground">Banco</dt>
          <dd>
            {submission.bankCode} - {submission.bankName}
          </dd>
        </dl>

        <div className="flex flex-col gap-2">
          <ConfirmDialog
            trigger={
              <Button disabled={approve.isPending || reject.isPending}>
                <Check strokeWidth={1.5} aria-hidden="true" />
                Aprobar
              </Button>
            }
            title="¿Aprobar este pago?"
            description={`Confirma que recibiste ${formatBs(submission.amountBsCents)} con la referencia ${submission.reference}. Se acreditarán los puntos y no se puede deshacer.`}
            confirmLabel="Aprobar pago"
            onConfirm={() => approve.mutate({ id: submission.id })}
          />
          <RejectDialog
            trigger={
              <Button variant="outline" disabled={approve.isPending || reject.isPending}>
                <X strokeWidth={1.5} aria-hidden="true" />
                Rechazar
              </Button>
            }
            onConfirm={({ reason, note }) => reject.mutate({ id: submission.id, reason, note })}
          />
        </div>
      </CardContent>
    </Card>
  )
}
