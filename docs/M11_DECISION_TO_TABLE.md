# M11: From decision to table

Status: Active on `feature/m11-decision-to-table`

GitHub tracking: Epic #87, Issues #88-#94.

## Product contract

M11 turns a recommendation, culinary detail, or deterministic pairing into one local plan. A plan contains selected public culinary items, servings, a normalized shopping list, dependency-aware tasks, equipment resources, and local completion state.

- `/{locale}/plan` is `noindex`.
- The URL share contract contains only public slugs, servings, and an optional known template ID.
- A copied share URL reconstructs that shared plan exactly. Product entry links use a separate bounded `add` payload so they append without replacing local choices.
- Shopping checks, task completion, timers, and local changes never enter a share URL.
- Plans contain at most eight items. Local persistence uses versioned `localStorage`; malformed data fails closed, the pre-release selection-only V0 shape migrates through a current-data rebuild, and storage denial degrades to in-memory use with an explanation.
- No account, database, cloud sync, notification permission, analytics, or third-party planning service is introduced.

## Deterministic planning rules

- Ingredients merge only when their canonical ingredient IDs match and their units share a safe dimension.
- Servings scale from the declared preparation yield.
- Active, waiting, prepare-ahead, and serving tasks remain distinct. Authored metadata uses attention as the boundary: mixed steps stay active, while predominantly hands-off intervals can be marked waiting or prepare-ahead.
- Dependencies and shared equipment determine scheduling. The engine finds the earliest free resource interval and never infers duration from instruction prose.
- Procedural steps without authored durations receive a deterministic allocation of the remaining canonical active time, including partially-authored metadata.
- Finished products create purchase and serving tasks, never invented cooking steps.
- The page initially embeds planning data only for shared selections. Restored local selections request a validated, private, no-store catalog containing only those items; payload size therefore does not scale with the whole 500+ library.

## Content delivery status

The package/manifest foundation routes the current 50 public items through one module per item while preserving their previous order. A committed release manifest fails Production for stale identity, Story, Hero, reviewed locale, or M10 usage decisions. The legacy adapter is an explicit zero-content-change migration boundary; new batches can be standalone packages behind the same repository interface.

The Product Director approved the M10.1 risk-based governance migration in Issue #96. LOW AI-assisted content may publish only after deterministic gates, a genuinely independent all-dimension agent review and risk-equivalence-class sampling QA; MEDIUM requires separated reviewer contexts; HIGH remains blocked or enters the applicable human, expert or legal checkpoint. The implementation context cannot review its own output, and agent review is never labeled human review.

The additional 70 items remain outside the public manifest until Issue #96 is merged and active in CI. This is a fail-closed sequencing rule, not a licensing bypass. Current 50-item Production content is unchanged.

## Design contract

Design read: a bilingual culinary decision product for home cooks, using Fresh Editorial 70% and Modern Culinary Lab 30%.

- Redesign mode: Overhaul while preserving routes, navigation labels, canonical metadata, legal copy, and stable anchors.
- Dials: `DESIGN_VARIANCE 7 / MOTION_INTENSITY 3 / VISUAL_DENSITY 5`.
- Homepage and library emphasize real food and the route into tonight's decision.
- Detail pages provide a sticky, keyboard-accessible chapter index.
- Plan is a task surface. It inherits typography, color, focus, and spacing tokens without marketing-page decoration.
- Light and dark themes use semantic CSS variables and a local preference.
- Taste mechanical pre-flight uses commas or Chinese enumeration punctuation for multi-value metadata; a visible line contains at most one middle-dot separator.

## Definition of done

The engineering/design portion is complete when lint, typecheck, tests, production build, local bilingual smoke tests, responsive screenshots, independent code review, and independent visual review pass. The full 120-item M11 acceptance criterion additionally requires the risk-based review and sampling governance in `docs/PUBLISHING_GOVERNANCE.md`.

Latest local Production lab evidence at a 412 px viewport records English LCP 244 ms, CLS 0, and INP 152 ms; Chinese records LCP 216 ms, CLS 0, and INP 160 ms. Lighthouse accessibility is 1.00 after contrast and accessible-name fixes. These measurements are pre-merge lab evidence, not Production field data.
