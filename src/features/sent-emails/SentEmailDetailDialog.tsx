import React from 'react';
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
  return (
    <Modal
      isOpen={Boolean(email)}
      onClose={onClose}
      title="Delivery details"
      size="md"
      footer={
      <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }>
      
      {email &&
      <dl className="space-y-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-xs font-medium text-ink-secondary">Status</dt>
            <dd>
              <StatusBadge status={email.status} />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-ink-secondary">Recipient</dt>
            <dd className="mt-0.5 text-ink">
              {email.recipientName}
              <span className="block break-all text-xs text-ink-placeholder">{email.email}</span>
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
          {email.failureReason &&
        <div className="rounded-md border border-danger-border bg-danger-bg px-3 py-2.5">
              <dt className="text-xs font-medium text-danger">Failure reason</dt>
              <dd className="mt-0.5 text-xs text-danger/90">{email.failureReason}</dd>
            </div>
        }
        </dl>
      }
    </Modal>);

}