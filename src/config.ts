import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { InputError } from "./errors.js";
import type { ReleaseGuardConfig, Severity } from "./types.js";

const ROOT_KEYS = new Set([
  "$schema",
  "version",
  "requiredFiles",
  "build",
  "coverage",
  "tests",
  "dependencies",
  "changelog",
]);
const SEVERITIES = new Set<Severity>(["low", "moderate", "high", "critical"]);
const MAX_CONFIG_BYTES = 1024 * 1024;

export function loadConfig(root: string, configPath: string): ReleaseGuardConfig {
  const path = safePath(root, configPath);
  let value: unknown;
  try {
    if (statSync(path).size > MAX_CONFIG_BYTES) {
      throw new InputError("Configuration exceeds 1 MiB.");
    }
    value = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new InputError(`Cannot read configuration: ${errorMessage(error)}`);
  }
  return validateConfig(value);
}

export function safePath(root: string, configuredPath: string): string {
  if (configuredPath.trim() === "" || isAbsolute(configuredPath)) {
    throw new InputError(`Path must be relative to the repository: ${configuredPath}`);
  }
  let normalizedRoot: string;
  try {
    normalizedRoot = realpathSync(resolve(root));
  } catch (error) {
    throw new InputError(`Repository root is unavailable: ${errorMessage(error)}`);
  }
  const target = resolve(normalizedRoot, configuredPath);
  assertInside(normalizedRoot, target, configuredPath);
  try {
    const existing = existsSync(target) ? target : nearestExistingParent(target);
    assertInside(normalizedRoot, realpathSync(existing), configuredPath);
  } catch (error) {
    if (error instanceof InputError) {
      throw error;
    }
    throw new InputError(`Path parent is unavailable: ${configuredPath}`);
  }
  return target;
}

function nearestExistingParent(target: string): string {
  let candidate = dirname(target);
  while (!existsSync(candidate)) {
    const parent = dirname(candidate);
    if (parent === candidate) {
      throw new InputError("No existing parent directory was found.");
    }
    candidate = parent;
  }
  return candidate;
}

function assertInside(root: string, target: string, configuredPath: string): void {
  const fromRoot = relative(root, target);
  if (
    fromRoot === ".." ||
    fromRoot.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) ||
    isAbsolute(fromRoot)
  ) {
    throw new InputError(`Path escapes the repository: ${configuredPath}`);
  }
}

function validateConfig(value: unknown): ReleaseGuardConfig {
  const root = object(value, "configuration");
  rejectUnknown(root, ROOT_KEYS, "configuration");
  if (root.version !== 1) {
    throw new InputError("Configuration version must be 1.");
  }
  const requiredFiles = stringArray(root.requiredFiles, "requiredFiles");
  if (requiredFiles.length === 0 || new Set(requiredFiles).size !== requiredFiles.length) {
    throw new InputError("requiredFiles must be a non-empty unique list.");
  }

  const build = object(root.build, "build");
  rejectUnknown(build, new Set(["resultFile"]), "build");
  const coverage = object(root.coverage, "coverage");
  rejectUnknown(
    coverage,
    new Set(["summaryFile", "minimumLines", "minimumBranches"]),
    "coverage",
  );
  const tests = object(root.tests, "tests");
  rejectUnknown(tests, new Set(["junitFile"]), "tests");
  const dependencies = object(root.dependencies, "dependencies");
  rejectUnknown(dependencies, new Set(["auditFile", "failOnSeverity"]), "dependencies");
  const changelog = object(root.changelog, "changelog");
  rejectUnknown(changelog, new Set(["path", "requiredHeading"]), "changelog");

  const severity = string(dependencies.failOnSeverity, "dependencies.failOnSeverity");
  if (!SEVERITIES.has(severity as Severity)) {
    throw new InputError("dependencies.failOnSeverity is invalid.");
  }

  return {
    version: 1,
    requiredFiles,
    build: { resultFile: pathString(build.resultFile, "build.resultFile") },
    coverage: {
      summaryFile: pathString(coverage.summaryFile, "coverage.summaryFile"),
      minimumLines: percentage(coverage.minimumLines, "coverage.minimumLines"),
      minimumBranches: percentage(
        coverage.minimumBranches,
        "coverage.minimumBranches",
      ),
    },
    tests: { junitFile: pathString(tests.junitFile, "tests.junitFile") },
    dependencies: {
      auditFile: pathString(dependencies.auditFile, "dependencies.auditFile"),
      failOnSeverity: severity as Severity,
    },
    changelog: {
      path: pathString(changelog.path, "changelog.path"),
      requiredHeading: string(changelog.requiredHeading, "changelog.requiredHeading"),
    },
  };
}

function object(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InputError(`${field} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function string(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new InputError(`${field} must be a non-empty string.`);
  }
  return value;
}

function pathString(value: unknown, field: string): string {
  const candidate = string(value, field);
  if (isAbsolute(candidate) || candidate.split(/[\\/]/u).includes("..")) {
    throw new InputError(`${field} must stay inside the repository.`);
  }
  return candidate;
}

function stringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new InputError(`${field} must be an array.`);
  }
  return value.map((entry, index) => pathString(entry, `${field}[${index}]`));
}

function percentage(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new InputError(`${field} must be a number from 0 through 100.`);
  }
  return value;
}

function rejectUnknown(
  value: Record<string, unknown>,
  allowed: Set<string>,
  field: string,
): void {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    throw new InputError(
      `${field} contains unknown key: ${unknown.sort().at(0) ?? "unknown"}`,
    );
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}
