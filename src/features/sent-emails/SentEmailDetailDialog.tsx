import React from 'react';
import { ExternalLink, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDateTime } from '../../lib/format';
import type { SentEmail } from '../../types/email';

export interface SentEmailDetailDialogProps {
  email: SentEmail | null;
  onClose: () => void;
}

export function SentEmailDetailDialog({ email, onClose }: SentEmailDetailDialogProps) {
  const isEtherealUrl = email?.previewUrl && email.previewUrl.startsWith('http');
  const isRealDelivery = email?.previewUrl === 'REAL_DELIVERY';

  return (
    <Modal
      isOpen={Boolean(email)}
      onClose={onClose}
      title="Delivery details"
      size="md"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          {isEtherealUrl ? (
            <a
              href={email.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors"
            >
              <span>Open in Ethereal Inbox</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : <div />}

          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      }>
      {email && (
        <dl className="space-y-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-xs font-medium text-ink-secondary">Status</dt>
            <dd>
              <StatusBadge status={email.status} />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-ink-secondary">Recipient</dt>
            <dd className="mt-0.5 text-ink font-medium">
              {email.recipientName}
              <span className="block break-all text-xs text-ink-placeholder font-normal">{email.email}</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-ink-secondary">Subject</dt>
            <dd className="mt-0.5 text-ink">{email.subject}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-ink-secondary">Sent time</dt>
            <dd className="mt-0.5 text-ink-muted">{formatDateTime(email.sentAt)}</dd>
          </div>

          {isRealDelivery && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Delivered directly to real destination mailbox via Live SMTP.</span>
            </div>
          )}

          {isEtherealUrl && (
            <div className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2.5 text-xs">
              <div className="font-medium text-ink">Ethereal Test Sandbox Delivery</div>
              <p className="mt-1 text-ink-muted leading-relaxed">
                Sent to Ethereal developer sandbox. Click the button below to inspect the rendered HTML, headers, and attachments in your browser.
              </p>
            </div>
          )}

          {email.failureReason && (
            <div className="rounded-md border border-danger-border bg-danger-bg px-3 py-2.5">
              <dt className="text-xs font-medium text-danger">Failure reason</dt>
              <dd className="mt-0.5 text-xs text-danger/90">{email.failureReason}</dd>
            </div>
          )}
        </dl>
      )}
    </Modal>
  );
}