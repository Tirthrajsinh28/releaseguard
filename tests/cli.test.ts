import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseArguments, runCli } from "../src/cli.js";
import { exampleRoot, temporaryRepository } from "./helpers.js";

function capture() {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return {
    stdout,
    stderr,
    io: {
      stdout: (value: string) => stdout.push(value),
      stderr: (value: string) => stderr.push(value),
    },
  };
}

describe("CLI", () => {
  it("returns zero and a transparent human report for a ready repository", () => {
    const output = capture();
    const exit = runCli(
      ["--root", exampleRoot, "--summary", "PR 42 synthetic change"],
      output.io,
      {
        GITHUB_SHA: "abc123",
        GITHUB_EVENT_NAME: "pull_request",
        GITHUB_REF_NAME: "feature/example",
      },
      process.cwd(),
    );

    expect(exit).toBe(0);
    expect(output.stderr).toEqual([]);
    expect(output.stdout.join("")).toContain("Result: READY");
    expect(output.stdout.join("")).toContain("7 passed, 0 failed");
    expect(output.stdout.join("")).toContain("not a security guarantee");
    expect(output.stdout.join("")).toContain("summary=PR 42 synthetic change");
  });

  it("returns one for policy failure and two for bad inputs", () => {
    const failingRoot = temporaryRepository();
    rmSync(join(failingRoot, "LICENSE"));
    const policyOutput = capture();
    const inputOutput = capture();

    expect(
      runCli(["--root", failingRoot], policyOutput.io, {}, process.cwd()),
    ).toBe(1);
    expect(policyOutput.stdout.join("")).toContain("Result: NOT READY");
    expect(
      runCli(
        ["--root", exampleRoot, "--config", "../outside.json"],
        inputOutput.io,
        {},
        process.cwd(),
      ),
    ).toBe(2);
    expect(inputOutput.stderr.join("")).toContain("input error");
  });

  it("writes a machine-readable report inside the repository", () => {
    const root = temporaryRepository();
    const output = capture();
    const exit = runCli(
      [
        "--root",
        root,
        "--format",
        "json",
        "--output",
        "artifacts/releaseguard-report.json",
      ],
      output.io,
      {},
      process.cwd(),
    );
    const reportPath = join(root, "artifacts/releaseguard-report.json");

    expect(exit).toBe(0);
    expect(output.stdout).toEqual([]);
    expect(existsSync(reportPath)).toBe(true);
    expect(JSON.parse(readFileSync(reportPath, "utf8"))).toMatchObject({
      schemaVersion: 1,
      ready: true,
      totals: { passed: 7, failed: 0 },
    });
  });

  it("rejects unknown, missing, invalid-format, and escaping output arguments", () => {
    expect(() => parseArguments(["--unknown", "value"], process.cwd())).toThrow(
      /Unknown argument/u,
    );
    expect(() => parseArguments(["--root"], process.cwd())).toThrow(
      /requires a value/u,
    );
    expect(() => parseArguments(["--format", "xml"], process.cwd())).toThrow(
      /human.*json/u,
    );

    const output = capture();
    expect(
      runCli(
        ["--root", exampleRoot, "--output", "../outside.json"],
        output.io,
        {},
        process.cwd(),
      ),
    ).toBe(2);
    expect(
      runCli(
        ["--root", exampleRoot, "--output", "missing/report.json"],
        output.io,
        {},
        process.cwd(),
      ),
    ).toBe(2);
  });
});
