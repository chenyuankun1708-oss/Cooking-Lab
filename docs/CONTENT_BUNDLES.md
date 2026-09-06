# Local content bundles

## Purpose

M11 adds a deterministic manifest boundary so Cooking Lab can grow beyond 500 local culinary items without changing the public repository API or weakening M10 rights checks.

The current implementation commits a stable, slug-sorted `ContentBundleManifestV1` independently from the published repository. Each entry records:

- item ID, slug, and culinary type
- reviewed locale coverage
- Story IDs
- primary local Hero image ID
- M10 usage decision IDs

`npm run content:audit` compares that checkpoint with the live repository and content-rights registry. Production import also asserts the manifest, so stale identity, Story, Hero, locale coverage, or usage decisions fail closed.

## Package direction

Every current public item now enters the repository through one module under `data/content-packages/`. `LocalContentPackageV1` carries the complete `CulinaryItem`, its committed manifest entry, and an explicit source kind. The first 50 modules use a legacy adapter to preserve their reviewed data and public order without copying it; future batches can replace those modules or add `standalone` packages without changing repository consumers.

A package may reference shared ingredient, Source, Evidence, image, and rights registries, but it must not hide provenance in free-form copy or an unindexed bulk file.

```text
item package
  -> CulinaryItem or Recipe adapter input
  -> localized reviewed copy
  -> Story claims -> Evidence -> Source
  -> local Hero -> file-level license and attribution
  -> nutrition/cost provenance
  -> ContentArtifact -> RightsAssessment -> UsageDecision
  -> published manifest
```

The manifest is a release index, not an alternative content database. Existing repository functions remain the only consumer boundary. CI locks the current migration order as recipes followed by native culinary items, so package migration cannot silently reorder the public catalog.

## Editorial and AI gate

- AI output is never Evidence.
- AI-assisted expression requires an `AiGenerationRecord`, reviewed inputs, similarity/trademark review where applicable, and current risk-based `ReviewAttestation` coverage before publication.
- LOW content may use one genuinely independent agent context across all applicable dimensions. MEDIUM requires separate rights/provenance and content/visual reviewer contexts. HIGH remains blocked without the applicable human, expert, or legal checkpoint.
- The implementation context cannot mark its own copy reviewed. Agent review is recorded as `actorType: agent` and never represented as human review, culinary field testing, legal opinion, or human approval.
- Unreviewed packages stay draft and do not enter `getPublishedCulinaryItems()` or the public manifest.
- Reference-only video may support manual fact checking by URL and timestamp; no video, subtitle, transcript, or frame is stored.

## Scale limits

The manifest and validators are linear in item/artifact count and introduce no network access at build time. Capacity beyond 500 items does not require a CMS or database. Operationally, CI duration, independent review throughput, sampling escape rate, disagreement and rework should be measured before choosing a later storage migration.
