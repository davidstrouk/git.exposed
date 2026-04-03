export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Finding {
  checkName: string;
  severity: Severity;
  title: string;
  description: string;
  file: string;
  line?: number;
}

export interface Check {
  name: string;
  run: (directory: string) => Promise<Finding[]>;
}

export interface ScanResult {
  findings: Finding[];
  checksRun: string[];
}
