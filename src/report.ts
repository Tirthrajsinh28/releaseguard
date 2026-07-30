import type { ReleaseReport } from "./types.js";

export function formatJson(report: ReleaseReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function formatHuman(report: ReleaseReport): string {
  const lines = [
    `ReleaseGuard ${report.tool.version}`,
    `Result: ${report.ready ? "READY" : "NOT READY"}`,
    contextLine(report),
    "",
    ...report.checks.map(
      (check) =>
        `${check.status === "pass" ? "PASS" : "FAIL"}  ${check.id}  ${check.message}`,
    ),
    "",
    `Summary: ${report.totals.passed} passed, ${report.totals.failed} failed.`,
    "ReleaseGuard is a release-readiness aid, not a security guarantee.",
  ];
  return `${lines.join("\n")}\n`;
}

function contextLine(report: ReleaseReport): string {
  const values = [
    report.context.event ? `event=${report.context.event}` : null,
    report.context.ref ? `ref=${report.context.ref}` : null,
    report.context.revision ? `revision=${report.context.revision}` : null,
    report.context.summary ? `summary=${report.context.summary}` : null,
  ].filter((value): value is string => value !== null);
  return values.length === 0 ? "Context: not supplied" : `Context: ${values.join(" ")}`;
}
