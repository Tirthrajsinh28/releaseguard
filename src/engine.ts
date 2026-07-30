import { existsSync } from "node:fs";
import { loadConfig, safePath } from "./config.js";
import {
  parseBuildResult,
  parseCoverage,
  parseJUnit,
  parseNpmAudit,
  readText,
} from "./parsers.js";
import type {
  CheckResult,
  ReleaseReport,
  ReportContext,
  Severity,
} from "./types.js";

const VERSION = "0.1.0";
const SEVERITIES: Severity[] = ["low", "moderate", "high", "critical"];

export function evaluateRepository(
  root: string,
  configPath: string,
  context: ReportContext,
): ReleaseReport {
  const config = loadConfig(root, configPath);
  const checks: CheckResult[] = [];

  const missing = config.requiredFiles.filter(
    (path) => !existsSync(safePath(root, path)),
  );
  checks.push({
    id: "required-files",
    status: missing.length === 0 ? "pass" : "fail",
    message:
      missing.length === 0
        ? `${config.requiredFiles.length} required files are present.`
        : `Missing required files: ${missing.join(", ")}`,
    evidence: {
      required: config.requiredFiles.length,
      missing: missing.length,
    },
  });

  const build = parseBuildResult(safePath(root, config.build.resultFile));
  checks.push({
    id: "build",
    status: build.status === "passed" ? "pass" : "fail",
    message: `Recorded build status is ${build.status}.`,
    evidence: {
      status: build.status,
      command: build.command ?? "not recorded",
      durationMs: build.durationMs ?? "not recorded",
    },
  });

  const coverage = parseCoverage(safePath(root, config.coverage.summaryFile));
  checks.push(
    thresholdCheck(
      "coverage-lines",
      "Line coverage",
      coverage.lines,
      config.coverage.minimumLines,
    ),
    thresholdCheck(
      "coverage-branches",
      "Branch coverage",
      coverage.branches,
      config.coverage.minimumBranches,
    ),
  );

  const tests = parseJUnit(safePath(root, config.tests.junitFile));
  const failedTests = tests.failures + tests.errors;
  checks.push({
    id: "tests",
    status: tests.tests > 0 && failedTests === 0 ? "pass" : "fail",
    message:
      tests.tests === 0
        ? "No tests were recorded."
        : `${tests.tests} tests recorded with ${failedTests} failures/errors.`,
    evidence: { ...tests },
  });

  const vulnerabilities = parseNpmAudit(
    safePath(root, config.dependencies.auditFile),
  );
  const thresholdIndex = SEVERITIES.indexOf(config.dependencies.failOnSeverity);
  const blocking = SEVERITIES.slice(thresholdIndex).reduce(
    (total, severity) => total + vulnerabilities[severity],
    0,
  );
  checks.push({
    id: "dependencies",
    status: blocking === 0 ? "pass" : "fail",
    message: [
      `Recorded info=${vulnerabilities.info}, low=${vulnerabilities.low},`,
      `moderate=${vulnerabilities.moderate}, high=${vulnerabilities.high},`,
      `critical=${vulnerabilities.critical}; ${blocking} block at`,
      `${config.dependencies.failOnSeverity} or above.`,
    ].join(" "),
    evidence: { ...vulnerabilities, failOnSeverity: config.dependencies.failOnSeverity },
  });

  const changelogPath = safePath(root, config.changelog.path);
  const changelogExists = existsSync(changelogPath);
  const headingFound =
    changelogExists &&
    readText(changelogPath, "changelog").includes(config.changelog.requiredHeading);
  checks.push({
    id: "changelog",
    status: headingFound ? "pass" : "fail",
    message: headingFound
      ? `Changelog contains '${config.changelog.requiredHeading}'.`
      : `Changelog is missing '${config.changelog.requiredHeading}'.`,
    evidence: {
      path: config.changelog.path,
      exists: changelogExists,
      headingFound,
    },
  });

  const passed = checks.filter((check) => check.status === "pass").length;
  const failed = checks.length - passed;
  return {
    schemaVersion: 1,
    tool: { name: "ReleaseGuard", version: VERSION },
    ready: failed === 0,
    context,
    checks,
    totals: { passed, failed },
  };
}

function thresholdCheck(
  id: string,
  label: string,
  actual: number,
  minimum: number,
): CheckResult {
  const passed = actual >= minimum;
  return {
    id,
    status: passed ? "pass" : "fail",
    message: `${label} is ${actual}% (minimum ${minimum}%).`,
    evidence: { actual, minimum, met: passed },
  };
}
