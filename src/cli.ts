#!/usr/bin/env node

import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { CliError, InputError } from "./errors.js";
import { evaluateRepository } from "./engine.js";
import { safePath } from "./config.js";
import { formatHuman, formatJson } from "./report.js";
import type { ReportContext } from "./types.js";

interface CliOptions {
  root: string;
  config: string;
  format: "human" | "json";
  output: string | null;
  summary: string | null;
}

interface CliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

export function runCli(
  argv: string[],
  io: CliIo,
  environment: NodeJS.ProcessEnv,
  cwd: string,
): number {
  try {
    const options = parseArguments(argv, cwd);
    const context: ReportContext = {
      revision: bounded(environment.GITHUB_SHA, 80),
      event: bounded(environment.GITHUB_EVENT_NAME, 80),
      ref: bounded(environment.GITHUB_REF_NAME, 160),
      summary: options.summary,
    };
    const report = evaluateRepository(options.root, options.config, context);
    const output =
      options.format === "json" ? formatJson(report) : formatHuman(report);
    if (options.output === null) {
      io.stdout(output);
    } else {
      try {
        writeFileSync(safePath(options.root, options.output), output, "utf8");
      } catch (error) {
        if (error instanceof InputError) {
          throw error;
        }
        throw new InputError(
          `Cannot write report: ${error instanceof Error ? error.message : "unknown error"}`,
        );
      }
    }
    return report.ready ? 0 : 1;
  } catch (error) {
    if (error instanceof CliError || error instanceof InputError) {
      io.stderr(`ReleaseGuard input error: ${error.message}\n`);
      return 2;
    }
    throw error;
  }
}

export function parseArguments(argv: string[], cwd: string): CliOptions {
  const options: CliOptions = {
    root: cwd,
    config: "releaseguard.config.json",
    format: "human",
    output: null,
    summary: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const value = argv[index + 1];
    if (argument === "--root") {
      options.root = requiredValue(argument, value);
    } else if (argument === "--config") {
      options.config = requiredValue(argument, value);
    } else if (argument === "--format") {
      const format = requiredValue(argument, value);
      if (format !== "human" && format !== "json") {
        throw new CliError("--format must be 'human' or 'json'.");
      }
      options.format = format;
    } else if (argument === "--output") {
      options.output = requiredValue(argument, value);
    } else if (argument === "--summary") {
      options.summary = bounded(requiredValue(argument, value), 500);
    } else {
      throw new CliError(`Unknown argument: ${argument ?? ""}`);
    }
    index += 1;
  }
  return options;
}

function requiredValue(argument: string, value: string | undefined): string {
  if (value === undefined || value.startsWith("--") || value.trim() === "") {
    throw new CliError(`${argument} requires a value.`);
  }
  return value;
}

function bounded(value: string | undefined, maximum: number): string | null {
  if (value === undefined || value.trim() === "") {
    return null;
  }
  return value.replaceAll(/\s+/gu, " ").trim().slice(0, maximum);
}

const entry = process.argv[1];
if (entry !== undefined && import.meta.url === pathToFileURL(entry).href) {
  process.exitCode = runCli(
    process.argv.slice(2),
    {
      stdout: (value) => {
        process.stdout.write(value);
      },
      stderr: (value) => {
        process.stderr.write(value);
      },
    },
    process.env,
    process.cwd(),
  );
}
