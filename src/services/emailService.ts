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

export async function fetchScheduledEmails(signal?: AbortSignal): Promise<ScheduledEmail[]> {
  if (!isPrototypeMode) {
    return request<ScheduledEmail[]>('/emails/scheduled', { signal });
  }
  await prototypeDelay(850);
  assertNoSimulatedFailure('scheduled emails');
  return simulateEmpty() ? [] : scheduledEmailFixtures;
}

export async function fetchSentEmails(signal?: AbortSignal): Promise<SentEmail[]> {
  if (!isPrototypeMode) {
    return request<SentEmail[]>('/emails/sent', { signal });
  }
  await prototypeDelay(850);
  assertNoSimulatedFailure('sent emails');
  return simulateEmpty() ? [] : sentEmailFixtures;
}

export async function scheduleEmails(payload: ScheduleRequest): Promise<ScheduleResponse> {
  if (!isPrototypeMode) {
    return request<ScheduleResponse>('/emails/schedule', { method: 'POST', body: payload });
  }

  await prototypeDelay(1400);
  assertNoSimulatedFailure('the campaign');

  const start = new Date(payload.startAt).getTime();
  const spanMs = payload.recipients.length * payload.delaySeconds * 1000;
  return {
    batchId: `batch_${Date.now()}`,
    scheduledCount: payload.recipients.length,
    firstSendAt: new Date(start).toISOString(),
    estimatedCompletionAt: new Date(start + spanMs).toISOString()
  };
}

export async function cancelScheduledEmail(id: string): Promise<void> {
  if (!isPrototypeMode) {
    await request<void>(`/emails/scheduled/${id}`, { method: 'DELETE' });
    return;
  }
  await prototypeDelay(600);
  assertNoSimulatedFailure('the scheduled email');
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