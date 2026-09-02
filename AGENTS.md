# Cooking Lab Agent Working Agreement

## Before every task

1. Read this file and `docs/STATUS.md`.
2. Read the documents relevant to the task, especially architecture and data model notes.
3. If a GitHub Issue exists, read it before changing code.
4. Inspect the current implementation and Git status before editing.

## While working

- Keep the dependency direction: UI → application logic → domain/engines → data.
- Keep nutrition, cost, filtering, and recommendation logic out of UI components.
- Preserve repository interfaces so local data can later be replaced by a database/API.
- Make only task-related changes. Do not broadly refactor without reading the architecture.
- Do not add dependencies without a concrete reason.
- Never commit secrets, `.env` files, or paid-service credentials.
- Do not delete existing data without explaining why. Avoid low-value documentation.
- Treat health, nutrition, and price values as estimates; do not make medical claims.

## Before completing every task

1. Run relevant tests, lint, typecheck, and build where appropriate.
2. Fix failures caused by the change.
3. Update relevant documentation and `docs/STATUS.md`.
4. Summarize changes, verification results, known issues, and the best next step.

## Execution Policy

For normal development tasks, do not stop after completing a single small subtask.

When a task or GitHub Issue contains multiple logically connected steps:

1. Read the full task and identify the complete acceptance criteria.
2. Create an internal execution plan.
3. Execute all non-blocked steps continuously.
4. Run tests, lint, typecheck, and build where relevant.
5. Fix failures that are directly caused by the current task.
6. Update documentation and STATUS.md.
7. Only stop when:
   - all acceptance criteria are completed, or
   - there is a genuine external blocker that cannot be resolved locally.

Do NOT pause merely to:

- ask whether to continue to the next obvious step;
- report completion of one file;
- ask permission to run normal tests;
- ask permission to fix errors introduced by the current work;
- ask permission to create ordinary files required by the task;
- ask whether to proceed with the remaining acceptance criteria.

Assume permission to continue within the scope of the current Issue.

For low-risk implementation decisions, make a reasonable engineering decision and continue.

Only ask the user before:

- destructive operations;
- force push;
- deleting remote branches or repositories;
- overwriting unrelated existing work;
- introducing paid services;
- exposing or modifying secrets;
- making a major architectural change outside the current Issue.

A task is not complete until its full acceptance criteria are satisfied.

At completion, report once with:

- completed work;
- important files changed;
- tests/build/lint/typecheck results;
- Git status;
- unresolved blockers;
- recommended next Issue.

## Git workflow

Use Issue → branch (`feature/`, `fix/`, `docs/`, `refactor/`) → logical commits → pull request → merge. Never force-push or delete remote resources without explicit confirmation.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
