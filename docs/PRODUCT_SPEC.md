# ReleaseGuard Product Specification

Status: First local vertical slice implemented and verified.

## Problem and users

Developers and reviewers need one explainable release summary instead of
manually reconciling build, test, coverage, dependency, changelog, and
repository evidence. The tool must show why a policy passed or failed and emit
CI-safe exit codes without claiming to guarantee quality or security.

## Acceptance criteria

- Versioned repository configuration with strict validation.
- Required-file and changelog checks.
- Build-result, Istanbul coverage, JUnit, and npm-audit parsing.
- Severity and coverage policies with concrete evidence.
- Human and JSON reports with deterministic check ordering.
- Commit/pull-request context without invoking untrusted shell text.
- Exit `0` ready, `1` policy failure, `2` invalid inputs/configuration.
- Unit and filesystem integration tests.
- Example repository and GitHub Actions workflow.
