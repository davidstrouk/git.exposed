import { describe, it, expect } from 'vitest';
import { parseOpengrepOutput } from '../../src/scanners/opengrep';

const SAMPLE_OUTPUT = JSON.stringify({
  results: [
    {
      check_id: "javascript.lang.security.detect-eval-with-expression",
      path: "app.js",
      start: { line: 5, col: 1 },
      extra: { message: "Detected eval() with a non-literal argument.", severity: "ERROR", metadata: { confidence: "HIGH" } }
    }
  ]
});

describe('parseOpengrepOutput', () => {
  it('converts opengrep JSON to Finding[]', () => {
    const findings = parseOpengrepOutput(SAMPLE_OUTPUT);
    expect(findings).toHaveLength(1);
    expect(findings[0].checkName).toBe('opengrep');
    expect(findings[0].severity).toBe('critical');
    expect(findings[0].file).toBe('app.js');
    expect(findings[0].line).toBe(5);
  });

  it('maps WARNING to medium', () => {
    const warn = JSON.stringify({ results: [{ check_id: "test", path: "a.js", start: { line: 1 }, extra: { message: "test", severity: "WARNING", metadata: {} } }] });
    expect(parseOpengrepOutput(warn)[0].severity).toBe('medium');
  });

  it('handles empty results', () => {
    expect(parseOpengrepOutput(JSON.stringify({ results: [] }))).toHaveLength(0);
  });
});
