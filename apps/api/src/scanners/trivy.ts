import type { Finding } from './types';
import { runCliScanner } from './run-cli';

interface TrivyVuln {
  VulnerabilityID: string;
  PkgName: string;
  InstalledVersion: string;
  FixedVersion?: string;
  Severity: string;
  Title: string;
  Description: string;
}

function mapSeverity(sev: string): Finding['severity'] {
  switch (sev.toUpperCase()) {
    case 'CRITICAL': return 'critical';
    case 'HIGH': return 'high';
    case 'MEDIUM': return 'medium';
    case 'LOW': return 'low';
    default: return 'info';
  }
}

export function parseTrivyOutput(output: string): Finding[] {
  try {
    const parsed = JSON.parse(output);
    const results = parsed.Results || [];
    const findings: Finding[] = [];
    for (const result of results) {
      for (const vuln of result.Vulnerabilities || []) {
        const fix = vuln.FixedVersion ? ` Upgrade to ${vuln.FixedVersion}.` : '';
        findings.push({
          checkName: 'trivy',
          severity: mapSeverity(vuln.Severity),
          title: `${vuln.PkgName} — ${vuln.VulnerabilityID}`,
          description: `${vuln.Title}.${fix}`,
          file: result.Target,
          line: undefined,
        });
      }
    }
    return findings;
  } catch {
    return [];
  }
}

export function runTrivy(directory: string): Promise<Finding[]> {
  return runCliScanner({
    command: `trivy fs --format json --scanners vuln,secret "${directory}"`,
    parser: parseTrivyOutput,
  });
}
