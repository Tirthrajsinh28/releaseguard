export type Severity = "low" | "moderate" | "high" | "critical";
export type CheckStatus = "pass" | "fail";

export interface ReleaseGuardConfig {
  version: 1;
  requiredFiles: string[];
  build: { resultFile: string };
  coverage: {
    summaryFile: string;
    minimumLines: number;
    minimumBranches: number;
  };
  tests: { junitFile: string };
  dependencies: {
    auditFile: string;
    failOnSeverity: Severity;
  };
  changelog: {
    path: string;
    requiredHeading: string;
  };
}

export interface CheckResult {
  id: string;
  status: CheckStatus;
  message: string;
  evidence: Record<string, boolean | number | string>;
}

export interface ReportContext {
  revision: string | null;
  event: string | null;
  ref: string | null;
  summary: string | null;
}

export interface ReleaseReport {
  schemaVersion: 1;
  tool: { name: "ReleaseGuard"; version: string };
  ready: boolean;
  context: ReportContext;
  checks: CheckResult[];
  totals: { passed: number; failed: number };
}

export interface BuildResult {
  status: "passed" | "failed";
  command: string | null;
  durationMs: number | null;
}

export interface CoverageResult {
  lines: number;
  branches: number;
}

export interface TestResult {
  tests: number;
  failures: number;
  errors: number;
  skipped: number;
}

export type VulnerabilityCounts = Record<Severity, number> & {
  info: number;
  total: number;
};
