# Game data publishing governance

Status: M12 policy v1

## Separate publication target

`game-commercial-ready` is a separate UsageDecision from the Web's `production-commercial-ready`. Web decisions, Story review and image review are not inherited or renamed. Every exportable game recipe must have exactly four current artifacts:

- identity
- preparation
- nutrition
- simulation

Each artifact must point to its own RightsAssessment and `game-commercial-ready` UsageDecision. The recipe fingerprint binds the structured payload, sources, Evidence, assessments and decisions. Any content or provenance change invalidates the old risk classification, ReviewAttestation and sampling result.

An assessment is complete only when its authority version, access date, reviewer, basis and all four permission scopes are present. License and terms authorities must use HTTPS. CC BY and OGL material require complete artifact-level attribution. Merely listing a second source is insufficient: identity and preparation artifacts must contain claim-level Evidence that materially covers two independent source institutions, or encode the approved public-domain-primary plus independent cross-check path.

## Hard blockers

Export fails when any input has unknown, NC, ND or changed rights; commercial use is unresolved; provenance or attribution is missing; an assessment is expired; ShareAlike content enters the core corpus; AI output is used as Evidence; generated expression is not covered by a complete approved service route; or a reference-only source is used to justify copied/adapted expression.

This corpus deliberately contains no video, transcript, screenshot, restaurant menu, brand image, creator prose, alcohol promotion, medical claim, high-risk fermentation or preservation process.

## Risk-based review

- LOW: deterministic gates plus one genuinely independent reviewer context across rights/license, provenance, factual/culinary, editorial and visual/image. Visual is explicitly not applicable only because the export has no visual asset.
- MEDIUM: at least two independent contexts; rights/provenance and culinary/editorial/visual must be separated. Unresolved disagreement becomes HIGH.
- HIGH: blocked from automated export. A new explicit human, domain-expert or lawyer checkpoint is required before reconsideration.

Agent review is never represented as human approval, culinary field testing or legal advice. A reviewer cannot modify the same artifact and then attest PASS in that review context.

## Sampling QA

Sampling covers risk-equivalence classes rather than a fixed percentage. Classes include content type, source recipe/formula variant, operation signature, mutation family, ingredient state, source institution/domain/rights route, nutrition dataset and transform, image applicability and authoring path. A major finding freezes the affected class and moves it to 100% re-review; two consecutive clean batches are required before returning to ordinary sampling.

Metrics retained per batch are escape count, reviewer disagreement, rework count and provenance/license novelty. These metrics determine future sampling strength.

## Nutrition source

The M13 corpus uses only the committed 81-record subset of USDA FoodData Central Foundation Foods 2026-04 and SR Legacy 2018-04. FoodData Central is recorded as CC0. Each ingredient retains fdcId, source description, data type, dataset version, access date and per-100g values. Recipe totals are deterministic ingredient sums and remain estimates because brand, edible yield, retention and preparation can change real values.

The full USDA database is not committed or redistributed and the build makes no network request.

## M13 source decision

The deterministic formula corpus is a draft-only stress fixture. It cannot be promoted by attaching generic safety and nutrition sources because those sources do not establish a particular recipe identity, ratio, time, temperature or mutation outcome.

The M13 release corpus must instead be reconstructed recipe by recipe from Library of Congress items whose own rights statements explicitly identify the scanned book as public domain and free to use/reuse. Structured facts retain the item URL, OCR locator and source hash; the full OCR is not committed. A second independently rights-cleared recipe source must cross-check the title, core ingredients and material method facts. USDA nutrition is not that second recipe source. Historical recipes with ambiguous quantities, unsafe preservation/fermentation, medical claims, brand dependence or non-deterministic heat/time are excluded rather than relaxed.
