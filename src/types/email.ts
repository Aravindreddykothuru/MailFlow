export type ScheduledEmailStatus = 'Scheduled' | 'Processing' | 'Failed';
export type SentEmailStatus = 'Sent' | 'Failed';
export type EmailStatus = ScheduledEmailStatus | SentEmailStatus;

export interface EmailRecord {
  id: string;
  /** Recipient email address. */
  email: string;
  subject: string;
}

export interface ScheduledEmail extends EmailRecord {
  /** ISO 8601 timestamp. */
  scheduledAt: string;
  status: ScheduledEmailStatus;
}

export interface SentEmail extends EmailRecord {
  recipientName: string;
  /** ISO 8601 timestamp. */
  sentAt: string;
  status: SentEmailStatus;
  /** Present only when status is "Failed". */
  failureReason?: string;
}

export interface ScheduleRequest {
  subject: string;
  body: string;
  recipients: string[];
  /** ISO 8601 timestamp for the first send. */
  startAt: string;
  delaySeconds: number;
  hourlyLimit: number;
}

export interface ScheduleResponse {
  batchId: string;
  scheduledCount: number;
  firstSendAt: string;
  estimatedCompletionAt: string;
}

export interface ParsedRecipientFile {
  fileName: string;
  fileSize: number;
  /** Unique, syntactically valid addresses. */
  validEmails: string[];
  /** Rows that contained no valid address. */
  invalidRows: number;
  duplicatesRemoved: number;
}