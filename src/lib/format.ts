import { format, isValid, parseISO } from 'date-fns';

/** "Oct 24, 2024 · 09:15 AM" — the timestamp format used across the design. */
export function formatDateTime(iso: string): string {
  const date = parseISO(iso);
  if (!isValid(date)) return '—';
  return format(date, "MMM d, yyyy · hh:mm a");
}

export function initials(value: string): string {
  const source = value.includes('@') ? value.split('@')[0].replace(/[._-]+/g, ' ') : value;
  return source.
  trim().
  split(/\s+/).
  map((part) => part[0] ?? '').
  join('').
  toUpperCase().
  slice(0, 2);
}

const AVATAR_COLORS = [
'#004ac6',
'#7c3aed',
'#0891b2',
'#059669',
'#d97706',
'#dc2626',
'#9333ea'];


/** Deterministic avatar colour so a recipient keeps the same swatch everywhere. */
export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}