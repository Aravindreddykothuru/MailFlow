import { isPrototypeMode } from '../lib/config';
import { prototypeDelay, request } from './apiClient';
import { ApiError } from '../types/api';
import type {
  ScheduleRequest,
  ScheduleResponse,
  ScheduledEmail,
  SentEmail } from
'../types/email';
import { scheduledEmailFixtures, sentEmailFixtures } from '../data/emails';

/**
 * ─── Email API boundary ──────────────────────────────────────────────────────
 * Each function maps 1:1 to a backend endpoint. While no API base URL is set,
 * fixtures resolve through the same promise contract the real endpoints use.
 */

const SCHEDULED_STORAGE_KEY = 'mailflow.scheduled_emails';
const SENT_STORAGE_KEY = 'mailflow.sent_emails';

function recipientNameFromEmail(email: string): string {

  const local = email.split('@')[0] ?? email;
  return local
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function syncPendingAndSentEmails(): { scheduled: ScheduledEmail[]; sent: SentEmail[] } {
  let scheduled: ScheduledEmail[] = [];
  let sent: SentEmail[] = [];

  try {
    const rawSched = window.localStorage.getItem(SCHEDULED_STORAGE_KEY);
    scheduled = rawSched ? JSON.parse(rawSched) : scheduledEmailFixtures;
  } catch {
    scheduled = scheduledEmailFixtures;
  }

  try {
    const rawSent = window.localStorage.getItem(SENT_STORAGE_KEY);
    sent = rawSent ? JSON.parse(rawSent) : sentEmailFixtures;
  } catch {
    sent = sentEmailFixtures;
  }

  const now = Date.now();
  const stillPending: ScheduledEmail[] = [];
  const newlySent: SentEmail[] = [];

  for (const item of scheduled) {
    const scheduledTime = new Date(item.scheduledAt).getTime();
    if (scheduledTime <= now) {
      newlySent.push({
        id: `snt_${item.id}`,
        recipientName: recipientNameFromEmail(item.email),
        email: item.email,
        subject: item.subject,
        sentAt: item.scheduledAt,
        status: 'Sent',
      });
    } else {
      stillPending.push(item);
    }
  }

  if (newlySent.length > 0) {
    const updatedSent = [...newlySent, ...sent];
    saveLocalScheduledEmails(stillPending);
    saveLocalSentEmails(updatedSent);
    return { scheduled: stillPending, sent: updatedSent };
  }

  return { scheduled, sent };
}

function getLocalScheduledEmails(): ScheduledEmail[] {
  return syncPendingAndSentEmails().scheduled;
}

function saveLocalScheduledEmails(emails: ScheduledEmail[]): void {
  try {
    window.localStorage.setItem(SCHEDULED_STORAGE_KEY, JSON.stringify(emails));
  } catch {
    /* ignore storage errors */
  }
}

function getLocalSentEmails(): SentEmail[] {
  return syncPendingAndSentEmails().sent;
}

function saveLocalSentEmails(emails: SentEmail[]): void {
  try {
    window.localStorage.setItem(SENT_STORAGE_KEY, JSON.stringify(emails));
  } catch {
    /* ignore storage errors */
  }
}


export async function fetchScheduledEmails(signal?: AbortSignal): Promise<ScheduledEmail[]> {
  if (!isPrototypeMode) {
    try {
      const res = await request<{ ok: true; data: ScheduledEmail[] }>('/emails/scheduled', { signal });
      return res.data;
    } catch (err) {
      if (err instanceof ApiError && err.status && err.status < 500) throw err;
      console.warn('Backend unavailable, loading local scheduled emails:', err);
    }
  }
  await prototypeDelay(300);
  assertNoSimulatedFailure('scheduled emails');
  if (simulateEmpty()) return [];
  return getLocalScheduledEmails();
}

export async function fetchSentEmails(signal?: AbortSignal): Promise<SentEmail[]> {
  if (!isPrototypeMode) {
    try {
      const res = await request<{ ok: true; data: SentEmail[] }>('/emails/sent', { signal });
      return res.data;
    } catch (err) {
      if (err instanceof ApiError && err.status && err.status < 500) throw err;
      console.warn('Backend unavailable, loading local sent emails:', err);
    }
  }
  await prototypeDelay(300);
  assertNoSimulatedFailure('sent emails');
  if (simulateEmpty()) return [];
  return getLocalSentEmails();
}

export async function scheduleEmails(payload: ScheduleRequest): Promise<ScheduleResponse> {
  if (!isPrototypeMode) {
    try {
      const res = await request<{ ok: true; data: ScheduleResponse }>('/campaigns/schedule', {
        method: 'POST',
        body: payload
      });
      return res.data;
    } catch (err) {
      if (err instanceof ApiError && err.status && err.status < 500) throw err;
      console.warn('Backend unreachable, saving scheduled emails to local storage:', err);
    }
  }

  await prototypeDelay(500);
  assertNoSimulatedFailure('the campaign');

  const start = new Date(payload.startAt).getTime();
  const spanMs = payload.recipients.length * payload.delaySeconds * 1000;

  // Create scheduled email records for every recipient in the batch
  const newScheduledList: ScheduledEmail[] = payload.recipients.map((email, idx) => ({
    id: `sch_${Date.now()}_${idx}`,
    email,
    subject: payload.subject,
    scheduledAt: new Date(start + idx * payload.delaySeconds * 1000).toISOString(),
    status: 'Scheduled',
  }));

  // Prepend to locally saved scheduled emails so newest shows up first
  const existing = getLocalScheduledEmails();
  saveLocalScheduledEmails([...newScheduledList, ...existing]);

  return {
    batchId: `batch_${Date.now()}`,
    scheduledCount: payload.recipients.length,
    firstSendAt: new Date(start).toISOString(),
    estimatedCompletionAt: new Date(start + spanMs).toISOString()
  };
}

export async function cancelScheduledEmail(id: string): Promise<void> {
  if (!isPrototypeMode) {
    try {
      await request<{ ok: true; data: null }>(`/emails/scheduled/${id}`, { method: 'DELETE' });
      return;
    } catch (err) {
      if (err instanceof ApiError && err.status && err.status < 500) throw err;
      console.warn('Backend unreachable, cancelling locally:', err);
    }
  }
  await prototypeDelay(200);
  assertNoSimulatedFailure('the scheduled email');
  const remaining = getLocalScheduledEmails().filter((item) => item.id !== id);
  saveLocalScheduledEmails(remaining);
}



/**
 * Prototype-only switches for reviewing non-happy-path states:
 * `?dataError=1` forces request failures, `?dataEmpty=1` forces empty results.
 */
function readFlag(flag: string): boolean {
  try {
    return new URLSearchParams(window.location.search).get(flag) === '1';
  } catch {
    return false;
  }
}

function simulateEmpty(): boolean {
  return readFlag('dataEmpty');
}

function assertNoSimulatedFailure(subject: string): void {
  if (readFlag('dataError')) {
    throw new ApiError({
      code: 'REQUEST_FAILED',
      message: `We couldn't reach the scheduling service while loading ${subject}.`
    });
  }
}