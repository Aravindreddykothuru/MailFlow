import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SendIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { MessageContentSection } from './MessageContentSection';
import { RecipientUploadSection } from './RecipientUploadSection';
import { SchedulingSection } from './SchedulingSection';
import { useComposeForm } from '../../hooks/useComposeForm';
import { useToast } from '../../contexts/ToastContext';
import { formatDateTime, pluralize } from '../../lib/format';

export function ComposeScreen() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const form = useComposeForm();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = await form.submit();

    if (result.ok) {
      showToast({
        tone: 'success',
        title: 'Campaign scheduled',
        description: `${result.data.scheduledCount} ${pluralize(
          result.data.scheduledCount,
          'email'
        )} queued, starting ${formatDateTime(result.data.firstSendAt)}.`
      });
      navigate('/scheduled');
      return;
    }

    showToast({ tone: 'error', title: 'Scheduling failed', description: result.message });
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Compose New Email"
        description="Configure your email content, lead list, and scheduling parameters." />
      

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <MessageContentSection
          values={form.values}
          onChange={form.setValue}
          onBlur={form.touch}
          visibleError={form.visibleError} />
        

        <RecipientUploadSection file={form.recipientFile} error={form.visibleError('recipients')} />

        <SchedulingSection
          values={form.values}
          senders={form.senders}
          onChange={form.setValue}
          onBlur={form.touch}
          visibleError={form.visibleError}
          errors={form.errors} />
        

        <div className="flex flex-col gap-3 pb-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-muted" aria-live="polite">
            {form.recipientCount > 0 ?
            `${form.recipientCount} ${pluralize(
              form.recipientCount,
              'recipient'
            )} · one email every ${form.values.delaySeconds}s, capped at ${
            form.values.hourlyLimit}/hour` :

            'Upload a recipient list to enable scheduling.'}
          </p>

          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.canSubmit}
              isLoading={form.isSubmitting}
              loadingText="Scheduling…"
              leadingIcon={<SendIcon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}>
              
              Schedule Campaign
            </Button>
          </div>
        </div>
      </form>
    </div>);

}