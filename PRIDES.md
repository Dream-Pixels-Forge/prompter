# PRIDES Methodology

PromptForge follows the **PRIDES** software development methodology:

## Phases

### P — Prototype
Generate ideas, analyze requirements, create specifications, plan implementations, and build prototypes.

**Subagents:** `@prototype-idea`, `@prototype-analyst`, `@prototype-prd`, `@prototype-plan`, `@prototype-agent`

### R — Review
Critical analysis, code inspection, documentation review, and git expertise.

**Subagents:** `@review-critic`, `@review-inspector`, `@review-git-expert`

### I — Implement
Feature integration, UI/UX implementation, coding, debugging, linting, and testing.

**Subagents:** `@implement-features`, `@implement-uiux`, `@implement-coder`, `@implement-debugger`, `@implement-linter`, `@implement-tasks`

### D — Deploy
Deployment, performance optimization, and infrastructure management.

**Subagents:** `@deploy-agent`, `@deploy-performance`

### E — Extend
Architectural planning and scalability considerations.

**Subagents:** `@extend-architect`

### S — Secure
Security audits and secure architecture implementation.

**Subagents:** `@secure-agent`, `@secure-architect`

## Workflow

```
Coordinator → Subagent → Skills → MCP → Subagent → Coordinator
```

Each phase must pass through a review gate before proceeding to the next phase. Documentation is updated after every completed task.
