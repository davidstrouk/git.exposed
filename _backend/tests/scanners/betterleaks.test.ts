import { describe, it, expect } from 'vitest';
import { parseBetterleaksOutput } from '../../src/scanners/betterleaks';

const SAMPLE_OUTPUT = JSON.stringify({
  results: [
    {
      Description: "AWS Access Key",
      File: "config.js",
      StartLine: 3,
      Secret: "AKIAIOSFODNN7EXAMPLE",
      Match: "AKIAIOSFODNN7EXAMPLE",
      RuleID: "aws-access-key"
    }
  ]
});

describe('parseBetterleaksOutput', () => {
  it('converts betterleaks JSON to Finding[]', () => {
    const findings = parseBetterleaksOutput(SAMPLE_OUTPUT);
    expect(findings).toHaveLength(1);
    expect(findings[0].checkName).toBe('betterleaks');
    expect(findings[0].severity).toBe('critical');
    expect(findings[0].title).toContain('AWS Access Key');
    expect(findings[0].file).toBe('config.js');
    expect(findings[0].line).toBe(3);
  });

  it('returns empty array for no results', () => {
    expect(parseBetterleaksOutput(JSON.stringify({ results: [] }))).toHaveLength(0);
  });

  it('handles malformed output gracefully', () => {
    expect(parseBetterleaksOutput('not json')).toHaveLength(0);
  });
});
