# ReleaseGuard

ReleaseGuard is an independent portfolio project that turns repository
artifacts into a transparent release-readiness report. It is a quality aid, not
a security guarantee.

Status: local vertical slice implemented and under release review.

The first slice evaluates:

- Required repository files.
- A normalized build-result artifact.
- Istanbul coverage thresholds.
- JUnit test totals and failures.
- npm-audit severity counts.
- A required changelog heading.
- Revision/event/ref context supplied by CI.

It produces human-readable or JSON output and reserves exit code `0` for a
ready result, `1` for policy failures, and `2` for configuration/input errors.

## Install and verify

ReleaseGuard requires Node.js 24.

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd audit --audit-level=high
```

The quality gate runs ESLint, strict TypeScript, unit/filesystem integration
tests with enforced coverage thresholds, and the production build.

## Use

Build, then evaluate the included synthetic repository:

```powershell
npm.cmd run build
node dist/cli.js --root example-repository
node dist/cli.js --root example-repository --format json
```

CI context can be supplied through `GITHUB_SHA`, `GITHUB_EVENT_NAME`, and
`GITHUB_REF_NAME`; `--summary` adds a bounded human description. Write a report
inside the evaluated repository with `--output`.

```text
ReleaseGuard 0.1.0
Result: READY
...
Summary: 7 passed, 0 failed.
ReleaseGuard is a release-readiness aid, not a security guarantee.
```

The failing example demonstrates exit `1` without changing artifacts:

```powershell
node dist/cli.js --root example-repository --config releaseguard.failing.config.json
```

## Configuration and artifacts

`releaseguard.config.json` is versioned and documented by
`releaseguard.schema.json`. Every configured path must remain inside the
repository, including through existing symbolic links. Configuration is capped
at 1 MiB and artifacts at 10 MiB.

- Build JSON: `status` is `passed` or `failed`; command/duration are optional.
- Coverage JSON: Istanbul `total.lines.pct` and `total.branches.pct`.
- Tests: a JUnit `testsuites` or `testsuite` aggregate.
- Dependencies: npm-audit v2 `metadata.vulnerabilities` counts.
- Changelog: configured heading in the configured file.

The CLI evaluates existing evidence and never executes a configured command.

## Current evidence and limits

The local gate currently has 13 passing tests with 89.61% line and 86.45%
branch coverage. The compiled CLI was executed against ready, failing-policy,
invalid-input, human, and JSON-output scenarios with observed exit codes
`0`, `1`, and `2`. The built package included only documented runtime files.

GitHub Actions and Dependabot are configured but have not run remotely. The
JUnit parser intentionally supports common aggregate attributes rather than
every XML dialect. ReleaseGuard does not verify artifact provenance, test
completeness, vulnerability-database freshness, release safety, or security.

See `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`,
`docs/DEMO_GUIDE.md`, and `docs/INTERVIEW_GUIDE.md`.
