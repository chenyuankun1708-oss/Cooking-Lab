# Game recipe data architecture

Status: M13 revised scope — recipe database first

## Recipe database extension

M13 (revised 2026-09-11) redefines the corpus as a recipe database first. `GameRecipeV1` carries an optional `database` block (`RecipeDatabaseExtensionV1`, `types/game-recipe-database.ts`):

- **Eligibility layers**: `database-entry` (structural checks only) and `game-exportable` (full fail-closed gate). Legacy `draft` / `exportable` values remain valid as their respective layer aliases.
- **Tags**: category tags (`baking`, `bartending`, `dessert`) plus Web taxonomy machine values (cuisines, techniques, dietary tags, meal roles, serving contexts). Inapplicable fields stay empty by design.
- **Flavor**: reuses the Web `FlavorProfile` (tastes / aroma / texture / character).
- **Images**: graded `published` (Web hero with rights chain) / `internal` (database-only, requires license note) / `missing` (empty is legal).
- **Source classification**: `web-migrated`, `loc-public-domain`, `web-curated`, `ai-assisted`, `original`. Web/game publishing gates apply on top; `web-curated` and `ai-assisted` entries must carry usage-limitation notes and never auto-promote to exportable.
- **Portion roles**: `main` / `seasoning` / `garnish` / `optional` on each ingredient portion; the ingredient catalog carries role hints.
- **Missing fields are legal** in database entries: absent heat control, flavor or images never become blockers. The fail-closed export gate is unchanged for `game-exportable`.
- **New operation**: `remove` (family `separation`) models taking food out of the pot/container.

Commands: `game-data:audit` reports database entries and enforces `--minimum-database=N` (the M13 capacity gate); `--minimum-exportable=` remains the game export gate. `scripts/migrate-database-extension.ts` backfills the extension block from Web-side data.

## Boundary

Cooking Lab is the canonical authoring repository for game recipe facts, nutrition provenance, operation graphs, simulations and rights decisions. The Web product continues to read only the existing published culinary repositories. Nothing under `game-data/` may be imported by `app/`, `components/` or Web-facing `data/` modules.

Canonical source lives in:

- `game-data/source/recipes/*.json`: one versioned `GameRecipeV1` per recipe.
- `game-data/source/ingredients.json`: normalized ingredients and nutrition provenance.
- `game-data/source/rights-registry.json`: isolated game rights, evidence, research and review state.
- `game-data/operations.json`: versioned semantic operation catalog.
- `game-data/nutrition/usda-fooddata-central-subset.json`: record-level USDA subset actually used by the corpus.

LOC discovery material uses a separate, narrower compilation boundary:

- `game-data/source-research/loc-sources.json`: item-level verified source registry; no OCR body is committed.
- `.local/game-data/source-cache/loc/`: content-addressed item metadata and OCR derivatives.
- `.local/game-data/source-facts/loc/`: deterministic draft `SourceFactBundleV1` output.
- future `game-data/normalization/`: versioned ingredient, operation, equipment, qualitative heat, target-state and mutation rules.

The required path is `verified cache → discovery candidate → SourceFactBundleV1 → normalization trace → GameRecipeV1`. Fuzzy title matching may retain a discovery candidate, but it cannot establish recipe identity or normalization readiness.

The generated Godot JSON, SQLite, attribution report, rights summary, manifest and audit report live under gitignored `.local/game-data/`. They are build products, never source of truth and never part of the Next.js deployment.

## Versioned contracts

- `GameRecipeV1` records stable IDs, quantified portions, a dependency graph, USDA-derived nutrition, simulation scenarios and export eligibility.
- `SourceFactBundleV1` preserves reduced rational quantities, narrow ingredient facts, source-position-ordered method facts, exact LOC page/line locators, source-line hashes and the content-addressed source registry/cache/compiler versions. Cross-check assertions additionally retain the bounded public-domain OCR excerpt as absolute line number, normalized text and SHA-256. Canonical validation re-parses title, ingredient and operation facts from that excerpt instead of trusting compiler claims. A committed source-fact set must carry the exact parsed LOC cache manifest; canonical validation joins each used derivative to that manifest.
- `GameNormalizationTraceV1` is a field-level proof graph: every source ingredient maps to one portion and conversion record; every method fact maps to one operation, equipment, duration/heat basis and target-state rules; every scenario maps to a provenance-backed mutation rule whose complete deterministic output equals the canonical scenario.
- `GameOperationDefinitionV1` distinguishes `supported-now`, `macro-supported`, `requires-engine-v2` and `presentation-only`.
- `GameRecipeScenarioV1` mutates a baseline without modifying it and records directional sensory changes, fault causes, recoverability and nutrition impact.
- `GameDataManifestV1` hashes every exported recipe and every supporting catalog, rights, attribution and nutrition artifact, including upstream USDA archive identifiers and SHA-256 values.

All masses use grams. Every source quantity must join an immutable conversion record by ID, unit and factor. The catalog carries exact global SI records for grams and kilograms; milliliters, pieces, teaspoons and tablespoons require an ingredient-specific record whose factor matches the versioned density or unit weight. A fabricated, missing or mismatched record blocks export. The same conversion records are emitted to Godot JSON and the SQLite `unit_conversions` table.

Source-normalized publication also exact-joins every primary and cross-check locator to the committed LOC registry, its work family, item URL and derivative hash. Historical `cup/lb/oz/pint/quart/gallon` quantities retain their reduced rational source values and require a versioned mass conversion that reproduces canonical grams. Historical qualitative heat is never converted into a fabricated numeric temperature: it remains a source-bound qualitative control and requires the Cat Kitchen v2 profile. A source method without heat may carry exactly one independently calibrated numeric heat parameter (`temperatureC` or `heatLevel`), backed by current, recipe-scoped Evidence in a closed ResearchRecord; a second numeric heat parameter is rejected. Independently calibrated duration or non-heat operation parameters have the same evidence requirement; ingredient-derived `quantityG` must equal the bound portion masses. Mutation rules bind the complete selector and result, not only a mutation type.

Migration from the Web model is deliberately lossy and draft-only. When the source does not explicitly establish ingredient identity, quantity, operation parameter, target state or scenario outcome, the deterministic migration may preserve a placeholder solely to exercise the schema, but must add a stable `unresolvedMappings` blocker. Such a record cannot become exportable until a rights-cleared source-backed replacement is authored and independently reviewed.

## Cat Kitchen compatibility

The existing serialized command IDs `CUT`, `ADD`, `SET_HEAT`, `WAIT`, `STIR`, `SEASON` and `PLATE` are not changed or renumbered.

- `cat-kitchen-goal1-v1`: operations can compile to the current command set.
- `requires-cat-kitchen-v2`: preparation state or cooking environment support is required.
- `data-only`: presentation-only content with no physical simulation.

The repository includes a minimal, read-only `cat-kitchen-goal1-v1` compiler contract for the seven frozen commands. Export validation must actually compile every recipe that claims this profile; missing mappings, parameters, ingredient calibration or unsupported operations fail closed. This is an exchange-format proof, not a Cat Kitchen integration. Cooking Lab does not modify the active Cat Kitchen Goal 8 worktree.

## Commands

- `npm run game-data:audit`: validate every canonical file; drafts are valid data but do not count as exportable.
- `npm run game-data:build`: require at least one fully eligible recipe, then generate Godot JSON, SQLite, manifest, attribution and audit output.
- `npx tsx scripts/audit-game-data.ts --minimum-exportable=500`: final M13 release gate.

The build uses `node:sqlite` already provided by the supported Node runtime and adds no runtime database dependency. It writes through a validated staging directory and only replaces an output located below the repository `.local/` directory or a dedicated Cooking Lab temporary container. Godot JSON and SQLite are round-tripped against the same canonical records before completion.
