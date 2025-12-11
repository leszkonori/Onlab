import { RoundType } from '../types';

export function parseLocalDate(d: string): Date {
  const [y, m, day] = (d || '').slice(0, 10).split('-').map(Number);
  return new Date(y || 1970, (m || 1) - 1, day || 1);
}

export function formatDateOnly(localDateString: string): string {
  const d = parseLocalDate(localDateString);
  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function formatDate(isoString: string | number | Date): string {
  const d = new Date(isoString);
  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function getNextUpcomingDeadline(rs: RoundType[]): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = (rs || [])
    .filter((r) => !!r?.deadline)
    .map((r) => ({ raw: (r.deadline).slice(0, 10), parsed: parseLocalDate(r.deadline) }))
    .filter((r) => r.parsed.getTime() >= today.getTime())
    .sort((a, b) => a.parsed.getTime() - b.parsed.getTime());

  return upcoming.length > 0 ? upcoming[0].raw : null;
}

export function isBeforeToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate()); // 00:00 helyi idő
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return dd.getTime() < today.getTime();
}