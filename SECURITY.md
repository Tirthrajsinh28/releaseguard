# Security Policy

ReleaseGuard is a release-readiness aid and does not guarantee security.

Do not include credentials, private repository content, or confidential build
artifacts in example reports. The CLI does not execute configuration values,
rejects paths outside the evaluated repository, bounds input sizes, and keeps
reports limited to normalized evidence.

No public vulnerability-reporting address is published yet. Before public
release, configure a repository security advisory workflow.

## Current limitations

- ReleaseGuard evaluates caller-provided artifacts; it does not prove artifact
  provenance, test completeness, vulnerability-database freshness, release
  safety, or repository security.
- Remote GitHub Actions, dependency review, npm publication, provenance
  attestation, and public installation remain unverified until the repository
  is published.
