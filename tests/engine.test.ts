import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadConfig, safePath } from "../src/config.js";
import { evaluateRepository } from "../src/engine.js";
import { InputError } from "../src/errors.js";
import { exampleRoot, temporaryRepository, writeJson } from "./helpers.js";

const context = {
  revision: "abc123",
  event: "pull_request",
  ref: "feature/example",
  summary: "Synthetic change",
};

describe("release policy engine", () => {
  it("returns a deterministic ready report for the synthetic example", () => {
    const report = evaluateRepository(
      exampleRoot,
      "releaseguard.config.json",
      context,
    );

    expect(report.ready).toBe(true);
    expect(report.totals).toEqual({ passed: 7, failed: 0 });
    expect(report.checks.map((check) => check.id)).toEqual([
      "required-files",
      "build",
      "coverage-lines",
      "coverage-branches",
      "tests",
      "dependencies",
      "changelog",
    ]);
    expect(report.context).toEqual(context);
  });

  it("reports every policy failure with concrete evidence", () => {
    const root = temporaryRepository();
    rmSync(join(root, "LICENSE"));
    writeJson(root, "artifacts/build-result.json", { status: "failed" });
    writeJson(root, "artifacts/coverage-summary.json", {
      total: { lines: { pct: 79 }, branches: { pct: 69 } },
    });
    writeFileSync(
      join(root, "artifacts/junit.xml"),
      '<testsuite tests="4" failures="1" errors="1" skipped="0" />',
      "utf8",
    );
    writeJson(root, "artifacts/npm-audit.json", {
      metadata: {
        vulnerabilities: {
          low: 0,
          moderate: 0,
          high: 1,
          critical: 1,
          total: 2,
        },
      },
    });
    writeFileSync(join(root, "CHANGELOG.md"), "# Changelog\n", "utf8");

    const report = evaluateRepository(
      root,
      "releaseguard.config.json",
      context,
    );

    expect(report.ready).toBe(false);
    expect(report.totals).toEqual({ passed: 0, failed: 7 });
    expect(report.checks.every((check) => check.status === "fail")).toBe(true);
    expect(report.checks[0]?.evidence).toEqual({ required: 3, missing: 1 });
    expect(report.checks[5]?.evidence).toMatchObject({
      high: 1,
      critical: 1,
      failOnSeverity: "high",
    });
  });

  it("validates unknown keys, percentages, uniqueness, and repository paths", () => {
    const root = temporaryRepository();
    const config = JSON.parse(
      readFileSync(join(root, "releaseguard.config.json"), "utf8"),
    ) as Record<string, unknown>;
    config.extra = true;
    writeJson(root, "releaseguard.config.json", config);
    expect(() => loadConfig(root, "releaseguard.config.json")).toThrow(
      /unknown key/u,
    );

    config.extra = undefined;
    config.requiredFiles = ["README.md", "README.md"];
    writeJson(root, "releaseguard.config.json", config);
    expect(() => loadConfig(root, "releaseguard.config.json")).toThrow(
      /unique/u,
    );

    expect(() => safePath(root, "../outside")).toThrow(InputError);
    expect(() => safePath(root, "")).toThrow(InputError);
    expect(safePath(root, "missing/nested/file.txt")).toContain(
      join("missing", "nested", "file.txt"),
    );
  });
});
