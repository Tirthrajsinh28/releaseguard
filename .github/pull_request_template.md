## Summary

- What policy or parser changed?
- How does the report remain transparent?

## Verification

- [ ] `npm ci` succeeds.
- [ ] `npm run check` succeeds.
- [ ] Ready and failing fixtures have expected exit codes.
- [ ] JSON and human reports were reviewed.
- [ ] `npm audit --audit-level=high` was reviewed.

## Safety

- [ ] No repository configuration text is executed as a command.
- [ ] Fixtures contain only synthetic data.
- [ ] No guarantee of security or release safety is implied.
