import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { InputError } from "../src/errors.js";
import {
  parseBuildResult,
  parseCoverage,
  parseJUnit,
  parseNpmAudit,
} from "../src/parsers.js";

function fixture(name: string, content: string): string {
  const root = mkdtempSync(join(tmpdir(), "releaseguard-parser-"));
  const path = join(root, name);
  writeFileSync(path, content, "utf8");
  return path;
}

describe("artifact parsers", () => {
  it("normalizes supported build, coverage, JUnit, and audit artifacts", () => {
    const build = parseBuildResult(
      fixture(
        "build.json",
        JSON.stringify({ status: "passed", command: "npm test", durationMs: 42 }),
      ),
    );
    const coverage = parseCoverage(
      fixture(
        "coverage.json",
        JSON.stringify({
          total: { lines: { pct: 91.5 }, branches: { pct: 77.25 } },
        }),
      ),
    );
    const tests = parseJUnit(
      fixture(
        "junit.xml",
        '<testsuites tests="8" failures="0" errors="0" skipped="2"></testsuites>',
      ),
    );
    const audit = parseNpmAudit(
      fixture(
        "audit.json",
        JSON.stringify({
          metadata: {
            vulnerabilities: {
              low: 1,
              moderate: 2,
              high: 0,
              critical: 0,
              total: 3,
            },
          },
        }),
      ),
    );

    expect(build).toEqual({
      status: "passed",
      command: "npm test",
      durationMs: 42,
    });
    expect(coverage).toEqual({ lines: 91.5, branches: 77.25 });
    expect(tests).toEqual({ tests: 8, failures: 0, errors: 0, skipped: 2 });
    expect(audit).toEqual({
      info: 0,
      low: 1,
      moderate: 2,
      high: 0,
      critical: 0,
      total: 3,
    });
  });

  it.each([
    () => parseBuildResult(fixture("build.json", '{"status":"unknown"}')),
    () =>
      parseCoverage(
        fixture(
          "coverage.json",
          '{"total":{"lines":{"pct":101},"branches":{"pct":80}}}',
        ),
      ),
    () => parseJUnit(fixture("junit.xml", "<testsuites></testsuites>")),
    () =>
      parseNpmAudit(
        fixture(
          "audit.json",
          '{"metadata":{"vulnerabilities":{"low":1,"moderate":0,"high":0,"critical":0,"total":2}}}',
        ),
      ),
  ])("rejects malformed or inconsistent artifacts", (operation) => {
    expect(operation).toThrow(InputError);
  });

  it("reports unreadable and invalid JSON inputs as input errors", () => {
    expect(() => parseBuildResult("does-not-exist.json")).toThrow(
      /Cannot read build result/u,
    );
    expect(() => parseBuildResult(fixture("bad.json", "{"))).toThrow(
      /not valid JSON/u,
    );
    expect(() =>
      parseBuildResult(
        fixture("oversized.json", "x".repeat(10 * 1024 * 1024 + 1)),
      ),
    ).toThrow(/exceeds 10 MiB/u);
  });
});
