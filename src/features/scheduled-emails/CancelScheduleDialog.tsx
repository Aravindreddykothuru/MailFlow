import React from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { formatDateTime } from '../../lib/format';
import type { ScheduledEmail } from '../../types/email';

export interface CancelScheduleDialogProps {
  email: ScheduledEmail | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelScheduleDialog({
  email,
  isSubmitting,
  onClose,
  onConfirm
}: CancelScheduleDialogProps) {
  return (
    <Modal
      isOpen={Boolean(email)}
      onClose={onClose}
      title="Cancel scheduled email?"
      description="This send will be removed from the queue. You can schedule it again from Compose."
      footer={
      <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Keep scheduled
          </Button>
          <Button
          variant="danger"
          onClick={onConfirm}
          isLoading={isSubmitting}
          loadingText="Cancelling…">
          
            Cancel send
          </Button>
        </>
      }>
      
      {email &&
      <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium text-ink-secondary">Recipient</dt>
            <dd className="mt-0.5 break-all text-ink">{email.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-ink-secondary">Subject</dt>
            <dd className="mt-0.5 text-ink">{email.subject}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-ink-secondary">Scheduled time</dt>
            <dd className="mt-0.5 text-ink-muted">{formatDateTime(email.scheduledAt)}</dd>
          </div>
        </dl>
      }
    </Modal>);

}