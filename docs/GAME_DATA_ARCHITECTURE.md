# Game recipe data architecture

Status: M12 contract v1

## Boundary

Cooking Lab is the canonical authoring repository for game recipe facts, nutrition provenance, operation graphs, simulations and rights decisions. The Web product continues to read only the existing published culinary repositories. Nothing under `game-data/` may be imported by `app/`, `components/` or Web-facing `data/` modules.

Canonical source lives in:

- `game-data/source/recipes/*.json`: one versioned `GameRecipeV1` per recipe.
- `game-data/source/ingredients.json`: normalized ingredients and nutrition provenance.
- `game-data/source/rights-registry.json`: isolated game rights, evidence, research and review state.
- `game-data/operations.json`: versioned semantic operation catalog.
- `game-data/nutrition/usda-fooddata-central-subset.json`: record-level USDA subset actually used by the corpus.

The generated Godot JSON, SQLite, attribution report, rights summary, manifest and audit report live under gitignored `.local/game-data/`. They are build products, never source of truth and never part of the Next.js deployment.

## Versioned contracts

- `GameRecipeV1` records stable IDs, quantified portions, a dependency graph, USDA-derived nutrition, simulation scenarios and export eligibility.
- `GameOperationDefinitionV1` distinguishes `supported-now`, `macro-supported`, `requires-engine-v2` and `presentation-only`.
- `GameRecipeScenarioV1` mutates a baseline without modifying it and records directional sensory changes, fault causes, recoverability and nutrition impact.
- `GameDataManifestV1` hashes every exported recipe and every supporting catalog, rights, attribution and nutrition artifact, including upstream USDA archive identifiers and SHA-256 values.

All masses use grams. Liquids may additionally expose milliliters only when the ingredient catalog contains a density conversion. Piece, teaspoon and tablespoon values cannot enter the game export without a recorded conversion.

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
