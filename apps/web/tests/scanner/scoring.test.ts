import { describe, it, expect } from 'vitest';
import { calculateScore, getGrade } from '@repo/shared/scoring';
import type { Finding } from '@repo/shared/types';

function f(severity: Finding['severity']): Finding {
  return { checkName: 'test', severity, title: 'T', description: 'D', file: 'f.js' };
}

describe('calculateScore', () => {
  it('returns 100 for no findings', () => { expect(calculateScore([])).toBe(100); });
  it('deducts more for critical than low', () => { expect(calculateScore([f('critical')])).toBeLessThan(calculateScore([f('low')])); });
  it('never goes below 0', () => { expect(calculateScore(Array.from({ length: 50 }, () => f('critical')))).toBe(0); });
  it('deducts correct amounts', () => { expect(calculateScore([f('critical'), f('high'), f('medium'), f('low'), f('info')])).toBe(49); });
});

describe('getGrade', () => {
  it('A for 90-100', () => { expect(getGrade(90)).toBe('A'); expect(getGrade(100)).toBe('A'); });
  it('B for 80-89', () => { expect(getGrade(80)).toBe('B'); expect(getGrade(89)).toBe('B'); });
  it('C for 70-79', () => { expect(getGrade(70)).toBe('C'); });
  it('D for 50-69', () => { expect(getGrade(50)).toBe('D'); });
  it('F for 0-49', () => { expect(getGrade(49)).toBe('F'); expect(getGrade(0)).toBe('F'); });
});
