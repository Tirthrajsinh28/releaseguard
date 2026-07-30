# ReleaseGuard Architecture

```mermaid
flowchart LR
    Config["releaseguard.config.json"] --> Engine["Policy engine"]
    Repo["Repository files"] --> Engine
    Build["Build result"] --> Engine
    Coverage["Istanbul summary"] --> Engine
    Tests["JUnit XML"] --> Engine
    Audit["npm audit JSON"] --> Engine
    Context["CI revision / event / ref"] --> Engine
    Engine --> Human["Human report"]
    Engine --> JSON["JSON report"]
    Engine --> Exit["Exit 0 / 1 / 2"]
```

The core has no runtime package dependency. Parsers convert external artifacts
into small normalized models. Checks consume only those models and return an
ordered result containing status, message, and bounded evidence. Reporters do
not re-evaluate policy.

The CLI never executes build or test commands. CI creates artifacts first, then
ReleaseGuard evaluates them. This keeps command execution and policy
interpretation separate.
