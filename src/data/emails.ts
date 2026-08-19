import type { ScheduledEmail, SentEmail } from '../types/email';

/**
 * Prototype fixtures. Only consumed by the service layer while no API base URL
 * is configured — screens never import these directly.
 */
export const scheduledEmailFixtures: ScheduledEmail[] = [
{
  id: 'sch_1',
  email: 'alice@company.com',
  subject: 'Q3 Marketing Report Overview',
  scheduledAt: '2024-10-24T09:00:00.000Z',
  status: 'Scheduled'
},
{
  id: 'sch_2',
  email: 'bob.leads@startup.io',
  subject: 'Partnership Opportunity Inquiry',
  scheduledAt: '2024-10-24T09:15:00.000Z',
  status: 'Processing'
},
{
  id: 'sch_3',
  email: 'team@internal.org',
  subject: 'Weekly Standup Notes & Action Items',
  scheduledAt: '2024-10-25T10:00:00.000Z',
  status: 'Scheduled'
},
{
  id: 'sch_4',
  email: 'ceo@enterprise.co',
  subject: 'Q4 Budget Review Request',
  scheduledAt: '2024-10-26T08:30:00.000Z',
  status: 'Scheduled'
},
{
  id: 'sch_5',
  email: 'devs@techcorp.io',
  subject: 'API Integration Follow-up',
  scheduledAt: '2024-10-26T14:00:00.000Z',
  status: 'Processing'
},
{
  id: 'sch_6',
  email: 'no-reply@bouncedomain.xyz',
  subject: 'Product Launch Announcement',
  scheduledAt: '2024-10-27T11:45:00.000Z',
  status: 'Failed'
},
{
  id: 'sch_7',
  email: 'procurement@globex.com',
  subject: 'Vendor Onboarding Checklist',
  scheduledAt: '2024-10-28T07:30:00.000Z',
  status: 'Scheduled'
}];


export const sentEmailFixtures: SentEmail[] = [
{
  id: 'snt_1',
  recipientName: 'John Doe',
  email: 'john.doe@example.com',
  subject: 'Q3 Performance Review Schedule',
  sentAt: '2024-10-24T09:15:00.000Z',
  status: 'Sent'
},
{
  id: 'snt_2',
  recipientName: 'Sarah Adams',
  email: 'sarah.a@acmecorp.com',
  subject: 'Invoice #49281 – Overdue Notice',
  sentAt: '2024-10-23T14:45:00.000Z',
  status: 'Failed',
  failureReason: 'Mailbox full (552) — retry scheduled by the provider.'
},
{
  id: 'snt_3',
  recipientName: 'Marketing Team',
  email: 'marketing@internal.com',
  subject: 'Weekly Newsletter Draft – Final Review',
  sentAt: '2024-10-23T10:00:00.000Z',
  status: 'Sent'
},
{
  id: 'snt_4',
  recipientName: 'Elena Korsakova',
  email: 'elena.k@partner.io',
  subject: 'Contract Renewal Documents Attached',
  sentAt: '2024-10-22T16:30:00.000Z',
  status: 'Sent'
},
{
  id: 'snt_5',
  recipientName: 'DevOps Team',
  email: 'devops@infra.co',
  subject: 'Server Migration Notice – Action Required',
  sentAt: '2024-10-21T11:00:00.000Z',
  status: 'Sent'
},
{
  id: 'snt_6',
  recipientName: 'Priya Raman',
  email: 'priya.raman@northwind.dev',
  subject: 'Design Review Recap & Next Steps',
  sentAt: '2024-10-20T08:20:00.000Z',
  status: 'Sent'
}];