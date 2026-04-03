import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows the first request', () => {
    const result = rateLimit('test-first', 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('decrements remaining on each request', () => {
    const r1 = rateLimit('test-decrement', 3, 60_000);
    const r2 = rateLimit('test-decrement', 3, 60_000);
    const r3 = rateLimit('test-decrement', 3, 60_000);
    expect(r1.remaining).toBe(2);
    expect(r2.remaining).toBe(1);
    expect(r3.remaining).toBe(0);
  });

  it('blocks requests exceeding the limit', () => {
    for (let i = 0; i < 5; i++) {
      rateLimit('test-block', 5, 60_000);
    }
    const blocked = rateLimit('test-block', 5, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('resets after the time window expires', () => {
    for (let i = 0; i < 5; i++) {
      rateLimit('test-reset', 5, 60_000);
    }
    expect(rateLimit('test-reset', 5, 60_000).allowed).toBe(false);

    vi.advanceTimersByTime(60_001);
    const after = rateLimit('test-reset', 5, 60_000);
    expect(after.allowed).toBe(true);
    expect(after.remaining).toBe(4);
  });

  it('isolates different keys', () => {
    for (let i = 0; i < 3; i++) {
      rateLimit('key-a', 3, 60_000);
    }
    expect(rateLimit('key-a', 3, 60_000).allowed).toBe(false);

    const other = rateLimit('key-b', 3, 60_000);
    expect(other.allowed).toBe(true);
    expect(other.remaining).toBe(2);
  });
});
