import { useCallback, useMemo, useState } from 'react';
import { addMinutes, format } from 'date-fns';
import { scheduleEmails } from '../services/emailService';
import { ApiError } from '../types/api';
import type { ScheduleResponse } from '../types/email';
import { useRecipientFile, type RecipientFileState } from './useRecipientFile';

export interface ComposeValues {
  subject: string;
  body: string;
  startAt: string;
  delaySeconds: string;
  hourlyLimit: string;
}

export type ComposeField = keyof ComposeValues;
export type ComposeErrors = Partial<Record<ComposeField | 'recipients', string>>;

type SubmitResult =
{ok: true;data: ScheduleResponse;} |
{ok: false;message: string;};

function defaultStartAt(): string {
  // Default to 2 minutes in the future so test sends trigger quickly
  return format(addMinutes(new Date(), 2), "yyyy-MM-dd'T'HH:mm");
}

const DELAY_PRESETS = ['5', '10', '15', '30', '45', '60', '120', '300'];


export const delayOptions = DELAY_PRESETS.map((value) => ({
  value,
  label: `${value} seconds`
}));

export const hourlyLimitOptions = ['25', '50', '100', '250', '500'].map((value) => ({
  value,
  label: `${value} emails / hour`
}));

function validate(values: ComposeValues, recipientCount: number): ComposeErrors {
  const errors: ComposeErrors = {};

  if (!values.subject.trim()) errors.subject = 'A subject line is required.';else
  if (values.subject.trim().length < 3) errors.subject = 'Use at least 3 characters.';

  if (!values.body.trim()) errors.body = 'The email body is required.';

  if (recipientCount === 0) errors.recipients = 'Upload a CSV or TXT file with recipient addresses.';

  if (!values.startAt) {
    errors.startAt = 'Choose when the first email should send.';
  } else if (new Date(values.startAt).getTime() <= Date.now()) {
    errors.startAt = 'Pick a time in the future.';
  }

  const delay = Number(values.delaySeconds);
  if (!values.delaySeconds) errors.delaySeconds = 'Set a delay between emails.';else
  if (!Number.isFinite(delay) || delay < 1) errors.delaySeconds = 'Must be at least 1 second.';

  const limit = Number(values.hourlyLimit);
  if (!values.hourlyLimit) errors.hourlyLimit = 'Set an hourly sending limit.';else
  if (!Number.isFinite(limit) || limit < 1) errors.hourlyLimit = 'Must be at least 1 email.';

  return errors;
}

export interface ComposeFormState {
  values: ComposeValues;
  errors: ComposeErrors;
  setValue: (field: ComposeField, value: string) => void;
  touch: (field: ComposeField) => void;
  visibleError: (field: ComposeField | 'recipients') => string | undefined;
  recipientFile: RecipientFileState;
  recipientCount: number;
  canSubmit: boolean;
  isSubmitting: boolean;
  submit: () => Promise<SubmitResult>;
}

export function useComposeForm(): ComposeFormState {
  const [values, setValues] = useState<ComposeValues>({
    subject: '',
    body: '',
    startAt: defaultStartAt(),
    delaySeconds: '45',
    hourlyLimit: '50'
  });
  const [touched, setTouched] = useState<Partial<Record<ComposeField | 'recipients', boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recipientFile = useRecipientFile();
  const recipientCount = recipientFile.parsed?.validEmails.length ?? 0;

  const errors = useMemo(() => validate(values, recipientCount), [values, recipientCount]);

  const setValue = useCallback((field: ComposeField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  }, []);

  const touch = useCallback((field: ComposeField) => {
    setTouched((current) => ({ ...current, [field]: true }));
  }, []);

  const visibleError = useCallback(
    (field: ComposeField | 'recipients') =>
    submitAttempted || touched[field] ? errors[field] : undefined,
    [errors, touched, submitAttempted]
  );

  const canSubmit = Object.keys(errors).length === 0 && recipientFile.status === 'success';

  const submit = useCallback(async (): Promise<SubmitResult> => {
    setSubmitAttempted(true);
    if (Object.keys(errors).length > 0 || !recipientFile.parsed) {
      return { ok: false, message: 'Fix the highlighted fields before scheduling.' };
    }

    setIsSubmitting(true);
    try {
      const data = await scheduleEmails({
        subject: values.subject.trim(),
        body: values.body.trim(),
        recipients: recipientFile.parsed.validEmails,
        startAt: new Date(values.startAt).toISOString(),
        delaySeconds: Number(values.delaySeconds),
        hourlyLimit: Number(values.hourlyLimit)
      });
      return { ok: true, data };
    } catch (caught) {
      return {
        ok: false,
        message:
        caught instanceof ApiError ?
        caught.message :
        'We couldn’t schedule this campaign. Please try again.'
      };
    } finally {
      setIsSubmitting(false);
    }
  }, [errors, recipientFile.parsed, values]);

  return {
    values,
    errors,
    setValue,
    touch,
    visibleError,
    recipientFile,
    recipientCount,
    canSubmit,
    isSubmitting,
    submit
  };
}