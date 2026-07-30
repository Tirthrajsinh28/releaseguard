# ReleaseGuard demo guide

This guide helps demonstrate ReleaseGuard as an independent portfolio CLI for
transparent release-readiness checks. Keep the wording precise: ReleaseGuard is
a quality aid, not a security guarantee or proof that a release is safe.

## What to prove in a short demo

- The CLI reads explicit repository artifacts rather than running arbitrary
  project commands.
- A ready synthetic repository returns exit code `0`.
- A failing policy returns exit code `1` and explains the failed checks.
- Invalid configuration/input returns exit code `2`.
- JSON output supports CI parsing, and human output is readable for reviewers.
- The schema and example repository make the contract inspectable.

## Pre-demo verification

Run from `projects/releaseguard`:

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd audit --audit-level=high
npm.cmd pack --dry-run
```

Do not publish the package archive or claim npm registry provenance unless that
publication path is intentionally executed and recorded.

## CLI flow

1. Build the CLI:

   ```powershell
   npm.cmd run build
   ```

2. Run the ready synthetic repository:

   ```powershell
   node dist/cli.js --root example-repository
   $LASTEXITCODE
   ```

3. Run JSON mode:

   ```powershell
   node dist/cli.js --root example-repository --format json
   ```

4. Run the failing policy example:

   ```powershell
   node dist/cli.js --root example-repository --config releaseguard.failing.config.json
   $LASTEXITCODE
   ```

5. Demonstrate a configuration/input failure with a deliberately missing config
   path or malformed fixture, then show exit code `2`.
6. Open `releaseguard.schema.json` and explain the configured artifact
   contract.
7. Open `example-repository/` and show the synthetic build, coverage, test,
   dependency, changelog, and repository-file evidence.
8. Open `.github/workflows/ci.yml` to show how the CLI is intended to run in CI
   after the repository is published.

## Suggested two-minute narration

“ReleaseGuard is a TypeScript CLI that checks whether a repository has the
basic evidence I would want before a release: required files, build result,
test totals, coverage thresholds, dependency-risk summary, changelog heading,
and CI context. It does not run project commands or promise security. It reads
bounded artifacts, produces human or JSON output, and returns CI-friendly exit
codes. The example repository lets reviewers see exactly what evidence the
tool consumes.”

## Evidence to show during the demo

- `README.md` usage and limits.
- `releaseguard.schema.json` configuration contract.
- `example-repository/` synthetic fixtures.
- `docs/ARCHITECTURE.md` for parser/policy/report boundaries.
- `docs/INTERVIEW_GUIDE.md` for deeper explanation.

## Do not claim

- Security guarantees.
- Vulnerability-database freshness.
- Test completeness or artifact provenance.
- Public npm publication, remote CI, or GitHub integration execution before
  those checks are run and recorded.
