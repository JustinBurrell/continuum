import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cn, formatDate, formatRelative, truncate, getInitials, stripHtml } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('deduplicates conflicting Tailwind classes (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('handles conditional falsy values', () => {
    expect(cn('base', false && 'hidden', null, undefined, 'extra')).toBe('base extra');
  });

  it('returns empty string for no args', () => {
    expect(cn()).toBe('');
  });
});

describe('formatDate', () => {
  it('formats a valid ISO date string', () => {
    // Use noon UTC so the date is Jun 15 in all timezones
    const result = formatDate('2025-06-15T12:00:00.000Z');
    expect(result).toMatch(/Jun\s+15,\s+2025/);
  });

  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('');
  });

  it('formats a Date object', () => {
    const result = formatDate(new Date('2024-07-04T12:00:00.000Z'));
    expect(result).toMatch(/2024/);
  });
});

describe('formatRelative', () => {
  let now;

  beforeEach(() => {
    now = new Date('2025-06-15T12:00:00.000Z');
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for less than 1 minute ago', () => {
    const date = new Date(now.getTime() - 30_000).toISOString();
    expect(formatRelative(date)).toBe('just now');
  });

  it('returns minutes ago for < 60 minutes', () => {
    const date = new Date(now.getTime() - 5 * 60_000).toISOString();
    expect(formatRelative(date)).toBe('5m ago');
  });

  it('returns hours ago for < 24 hours', () => {
    const date = new Date(now.getTime() - 3 * 3600_000).toISOString();
    expect(formatRelative(date)).toBe('3h ago');
  });

  it('returns days ago for < 7 days', () => {
    const date = new Date(now.getTime() - 2 * 86400_000).toISOString();
    expect(formatRelative(date)).toBe('2d ago');
  });

  it('returns formatted date for >= 7 days ago', () => {
    const date = new Date(now.getTime() - 10 * 86400_000).toISOString();
    expect(formatRelative(date)).toMatch(/2025/);
  });

  it('returns formatted date for future dates', () => {
    const date = new Date(now.getTime() + 86400_000).toISOString();
    const result = formatRelative(date);
    expect(result).not.toBe('just now');
    expect(result).toMatch(/2025/);
  });

  it('returns empty string for null', () => {
    expect(formatRelative(null)).toBe('');
  });
});

describe('truncate', () => {
  it('returns full string when under limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates and appends ellipsis when over limit', () => {
    const result = truncate('hello world', 5);
    expect(result).toBe('hello…');
  });

  it('uses default limit of 100', () => {
    const long = 'a'.repeat(101);
    expect(truncate(long)).toBe('a'.repeat(100) + '…');
  });

  it('returns empty string for null/undefined', () => {
    expect(truncate(null)).toBe('');
    expect(truncate(undefined)).toBe('');
  });
});

describe('getInitials', () => {
  it('returns first letters of each word uppercased', () => {
    expect(getInitials('Justin Burrell')).toBe('JB');
  });

  it('returns one letter for single name', () => {
    expect(getInitials('Alice')).toBe('A');
  });

  it('limits to 2 characters', () => {
    expect(getInitials('Alice Bob Carol')).toBe('AB');
  });

  it('handles empty string', () => {
    expect(getInitials('')).toBe('');
  });

  it('handles default parameter', () => {
    expect(getInitials()).toBe('');
  });
});

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world');
  });

  it('trims whitespace', () => {
    expect(stripHtml('  <p>  content  </p>  ')).toBe('content');
  });

  it('returns empty string for empty input', () => {
    expect(stripHtml('')).toBe('');
  });

  it('leaves plain text unchanged', () => {
    expect(stripHtml('plain text')).toBe('plain text');
  });

  it('handles nested tags', () => {
    expect(stripHtml('<div><span>nested</span></div>')).toBe('nested');
  });
});
