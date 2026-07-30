# Contributing to ReleaseGuard

ReleaseGuard is an independent portfolio CLI that evaluates repository
artifacts and produces release-readiness reports. It should remain transparent
about what it checks and what it cannot prove.

## Ground rules

- Do not describe ReleaseGuard as a security guarantee or as proof that a
  release is safe.
- Use synthetic fixtures and example repositories only.
- Do not commit tokens, private keys, real build logs with secrets, private
  repository metadata, generated package archives, `dist/`, `coverage/`, or
  `node_modules/`.
- Keep GitHub integration examples limited to documented workflows and local
  fixtures until a public repository and remote CI run exist.

## Local setup

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd audit --audit-level=high
npm.cmd pack --dry-run
```

Use `npm.cmd` on Windows because PowerShell may block the `npm.ps1` shim.

## Quality expectations

- Keep CLI exit codes suitable for CI.
- Preserve both machine-readable and human-readable outputs.
- Update the JSON schema when report output changes.
- Add tests for new policy checks, parser behavior, and failure modes.
- Keep example-repository fixtures small, synthetic, and easy to inspect.

## Documentation expectations

Update the relevant files when behavior changes:

- `README.md`
- `docs/INTERVIEW_GUIDE.md`
- `docs/LEARNING_PATH.md`
- `CHANGELOG.md`
- `SECURITY.md`
- `example-repository/README.md`, when fixture behavior changes

Separate verified behavior from future work, registry publication, and remote
CI checks that have not been executed.

## Pull request notes

Include:

- CLI behavior or policy checks changed.
- Local verification commands run and results.
- Any schema or example-repository updates.
- Remaining limitations or external blockers.
