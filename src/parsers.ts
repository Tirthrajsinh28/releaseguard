import { readFileSync, statSync } from "node:fs";
import { InputError } from "./errors.js";
import type {
  BuildResult,
  CoverageResult,
  Severity,
  TestResult,
  VulnerabilityCounts,
} from "./types.js";

const SEVERITIES: Severity[] = ["low", "moderate", "high", "critical"];
const MAX_ARTIFACT_BYTES = 10 * 1024 * 1024;

export function parseBuildResult(path: string): BuildResult {
  const root = jsonObject(path, "build result");
  if (root.status !== "passed" && root.status !== "failed") {
    throw new InputError("Build result status must be 'passed' or 'failed'.");
  }
  return {
    status: root.status,
    command: optionalString(root.command, "build command"),
    durationMs: optionalNonNegativeNumber(root.durationMs, "build durationMs"),
  };
}

export function parseCoverage(path: string): CoverageResult {
  const root = jsonObject(path, "coverage summary");
  const total = object(root.total, "coverage total");
  return {
    lines: percentage(object(total.lines, "coverage lines").pct, "line coverage"),
    branches: percentage(
      object(total.branches, "coverage branches").pct,
      "branch coverage",
    ),
  };
}

export function parseJUnit(path: string): TestResult {
  const xml = text(path, "JUnit report");
  const match = /<(?:testsuites|testsuite)\b([^>]*)>/u.exec(xml);
  if (match?.[1] === undefined) {
    throw new InputError("JUnit report has no testsuite aggregate.");
  }
  const attributes = match[1];
  return {
    tests: requiredIntegerAttribute(attributes, "tests"),
    failures: optionalIntegerAttribute(attributes, "failures"),
    errors: optionalIntegerAttribute(attributes, "errors"),
    skipped: optionalIntegerAttribute(attributes, "skipped"),
  };
}

export function parseNpmAudit(path: string): VulnerabilityCounts {
  const root = jsonObject(path, "npm audit report");
  const metadata = object(root.metadata, "npm audit metadata");
  const vulnerabilities = object(metadata.vulnerabilities, "npm audit vulnerabilities");
  const counts = Object.fromEntries(
    SEVERITIES.map((severity) => [
      severity,
      nonNegativeInteger(vulnerabilities[severity], `npm audit ${severity}`),
    ]),
  ) as Record<Severity, number>;
  const info =
    vulnerabilities.info === undefined
      ? 0
      : nonNegativeInteger(vulnerabilities.info, "npm audit info");
  const calculated =
    info + SEVERITIES.reduce((total, severity) => total + counts[severity], 0);
  const reportedTotal = vulnerabilities.total;
  if (
    reportedTotal !== undefined &&
    nonNegativeInteger(reportedTotal, "npm audit total") !== calculated
  ) {
    throw new InputError("npm audit total does not match severity counts.");
  }
  return { info, ...counts, total: calculated };
}

export function readText(path: string, label: string): string {
  return text(path, label);
}

function jsonObject(path: string, label: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text(path, label));
  } catch (error) {
    if (error instanceof InputError) {
      throw error;
    }
    throw new InputError(`${label} is not valid JSON: ${errorMessage(error)}`);
  }
  return object(parsed, label);
}

function text(path: string, label: string): string {
  try {
    if (statSync(path).size > MAX_ARTIFACT_BYTES) {
      throw new InputError(`${label} exceeds 10 MiB.`);
    }
    return readFileSync(path, "utf8");
  } catch (error) {
    throw new InputError(`Cannot read ${label}: ${errorMessage(error)}`);
  }
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InputError(`${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function optionalString(value: unknown, label: string): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "string" || value.trim() === "") {
    throw new InputError(`${label} must be a non-empty string when present.`);
  }
  return value.slice(0, 240);
}

function optionalNonNegativeNumber(value: unknown, label: string): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new InputError(`${label} must be a non-negative number when present.`);
  }
  return value;
}

function percentage(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new InputError(`${label} must be from 0 through 100.`);
  }
  return value;
}

function requiredIntegerAttribute(attributes: string, name: string): number {
  const value = attribute(attributes, name);
  if (value === null) {
    throw new InputError(`JUnit aggregate is missing '${name}'.`);
  }
  return nonNegativeInteger(Number(value), `JUnit ${name}`);
}

function optionalIntegerAttribute(attributes: string, name: string): number {
  const value = attribute(attributes, name);
  return value === null ? 0 : nonNegativeInteger(Number(value), `JUnit ${name}`);
}

function attribute(attributes: string, name: string): string | null {
  const match = new RegExp(`\\b${name}=["'](\\d+)["']`, "u").exec(attributes);
  return match?.[1] ?? null;
}

function nonNegativeInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new InputError(`${label} must be a non-negative integer.`);
  }
  return value;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}
