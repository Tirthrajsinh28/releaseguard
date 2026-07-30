# ReleaseGuard Interview Guide

Status: Local vertical slice implemented; remote CI/publication remain pending.

## Problem and users

ReleaseGuard helps developers and reviewers understand whether recorded
repository evidence meets explicit release policy.

## Architecture, entities, and API

Explain configuration, normalized artifacts, policy checks, report context,
human/JSON serializers, and exit-code mapping. This is a CLI, not an HTTP API.

## Authentication and authorization

The local CLI has no identity system. GitHub Actions permissions and untrusted
pull-request boundaries matter; the workflow must stay read-only and avoid
executing configuration text as shell commands.

## Error handling and testing

Policy failures are expected results (exit 1). Invalid config, missing/malformed
artifacts, or CLI misuse are input errors (exit 2). Unit tests cover parsers and
thresholds; integration tests run the engine against synthetic repositories.

## CI/CD, deployment, and monitoring

The distributed artifact is an npm package/CLI. CI runs its own quality gate
and an example workflow demonstrates report generation. There is no service
deployment or production monitoring claim.

## Security, trade-offs, and limits

ReleaseGuard evaluates supplied evidence; it does not prove that artifacts are
authentic, tests are complete, dependencies are safe, or a release is secure.
JSON configuration avoids a YAML parser/runtime dependency. The first JUnit
parser targets common aggregate attributes rather than every XML dialect.

## Two-minute explanation

ReleaseGuard is a TypeScript CLI that converts build, test, coverage,
dependency, changelog, and required-file artifacts into one deterministic
release-readiness report. Each result explains its evidence, JSON supports CI
automation, and distinct exit codes separate policy failures from bad inputs.
It is deliberately described as an aid, never a security guarantee.

## Demonstration script

Run the ready example in human and JSON modes, lower its coverage artifact to
force exit 1, then point to malformed configuration to demonstrate exit 2.

## Likely questions and honest answer framework

- Why not execute build commands directly?
- How do you distinguish policy failure from tool failure?
- What JUnit/npm-audit shapes are supported?
- Why can this not guarantee security?
- How would you verify artifact provenance later?

Answer with implemented behavior, exact tests, parser limits, and the next
improvement rather than broad assurance.
