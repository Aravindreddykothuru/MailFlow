export interface FeaturePill {
  label: string;
  icon: 'calendar' | 'chart' | 'bolt' | 'list';
}

export const featurePills: FeaturePill[] = [
{ icon: 'calendar', label: 'Smart Scheduling' },
{ icon: 'chart', label: 'Delivery Analytics' },
{ icon: 'bolt', label: 'Rate Throttling' },
{ icon: 'list', label: 'CSV Import' }];


export const brandStats = [
{ value: '2.4M+', label: 'Emails sent' },
{ value: '99.2%', label: 'Delivery rate' },
{ value: '4,000+', label: 'Teams trust us' }];


export interface Testimonial {
  name: string;
  role: string;
  text: string;
}

export const testimonials: Testimonial[] = [
{
  name: 'Sarah Chen',
  role: 'Head of Growth · Acme Corp',
  text: 'MailFlow cut our outreach setup time by 80%. The scheduling precision is unmatched.'
},
{
  name: 'Marcus Webb',
  role: 'VP Sales · TechScale',
  text: 'Finally a tool that respects sending limits. No more bounces, no more spam flags.'
}];


export interface TrustBadge {
  label: string;
  icon: 'lock' | 'shield' | 'check';
}

export const trustBadges: TrustBadge[] = [
{ icon: 'lock', label: 'SOC 2 compliant' },
{ icon: 'shield', label: 'GDPR ready' },
{ icon: 'check', label: '99.9% uptime' }];