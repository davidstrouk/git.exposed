import { describe, it, expect } from 'vitest';
import { parseTrivyOutput } from '../../src/scanners/trivy';

const SAMPLE_OUTPUT = JSON.stringify({
  Results: [
    {
      Target: "package-lock.json",
      Vulnerabilities: [
        {
          VulnerabilityID: "CVE-2021-44228",
          PkgName: "lodash",
          InstalledVersion: "4.17.20",
          FixedVersion: "4.17.21",
          Severity: "CRITICAL",
          Title: "Prototype Pollution in lodash",
          Description: "Lodash versions prior to 4.17.21 are vulnerable."
        }
      ]
    }
  ]
});

describe('parseTrivyOutput', () => {
  it('converts trivy JSON to Finding[]', () => {
    const findings = parseTrivyOutput(SAMPLE_OUTPUT);
    expect(findings).toHaveLength(1);
    expect(findings[0].checkName).toBe('trivy');
    expect(findings[0].severity).toBe('critical');
    expect(findings[0].title).toContain('lodash');
    expect(findings[0].title).toContain('CVE-2021-44228');
  });

  it('maps LOW severity correctly', () => {
    const low = JSON.stringify({ Results: [{ Target: "a", Vulnerabilities: [{ VulnerabilityID: "X", PkgName: "a", InstalledVersion: "1", Severity: "LOW", Title: "t", Description: "d" }] }] });
    expect(parseTrivyOutput(low)[0].severity).toBe('low');
  });

  it('handles no vulnerabilities', () => {
    expect(parseTrivyOutput(JSON.stringify({ Results: [] }))).toHaveLength(0);
  });

  it('handles null Vulnerabilities', () => {
    expect(parseTrivyOutput(JSON.stringify({ Results: [{ Target: "a", Vulnerabilities: null }] }))).toHaveLength(0);
  });
});
