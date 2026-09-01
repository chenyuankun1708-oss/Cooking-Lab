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

## Git workflow

Use Issue → branch (`feature/`, `fix/`, `docs/`, `refactor/`) → logical commits → pull request → merge. Never force-push or delete remote resources without explicit confirmation.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
