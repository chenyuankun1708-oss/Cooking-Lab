import type { Recipe } from "@/types/recipe";
import type { ResearchRegistry } from "./research-validation";
import { validateResearchRegistry } from "./research-validation";

export interface M9RecipePublicationReadinessInput {
  recipes: readonly Recipe[];
  slugs: readonly string[];
  researchRegistry: ResearchRegistry;
  hasCompleteEnglishTranslation: (recipe: Recipe) => boolean;
}

export function listM9RecipePublicationReadinessIssues({
  recipes,
  slugs,
  researchRegistry,
  hasCompleteEnglishTranslation,
}: M9RecipePublicationReadinessInput): string[] {
  const issues = validateResearchRegistry(researchRegistry).map(
    (issue) => `${issue.entityId}.${issue.field}: ${issue.message}`,
  );
  const recipeBySlug = new Map(recipes.map((recipe) => [recipe.slug, recipe]));
  const recordBySubject = new Map(
    researchRegistry.records
      .filter((record) => record.subject.type === "culinary-item")
      .map((record) => [record.subject.id, record]),
  );

  if (new Set(slugs).size !== slugs.length) issues.push("M9 promoted recipe slugs must be unique");

  for (const slug of slugs) {
    const recipe = recipeBySlug.get(slug);
    if (!recipe) {
      issues.push(`${slug}: promoted Recipe is missing`);
      continue;
    }
    if (recipe.publication.status !== "published") issues.push(`${slug}: publication status must be published`);
    if (recipe.steps.length < 4 || recipe.steps.length > 6) issues.push(`${slug}: must provide 4-6 preparation steps`);
    if (!recipe.heroImageId) issues.push(`${slug}: must provide a reviewed local Hero reference`);
    if (!hasCompleteEnglishTranslation(recipe)) issues.push(`${slug}: reviewed English copy is incomplete`);

    const record = recordBySubject.get(slug);
    if (!record) {
      issues.push(`${slug}: closed ResearchRecord is missing`);
      continue;
    }
    if (record.status !== "closed") issues.push(`${slug}: ResearchRecord must be closed`);
    const acceptedSources = new Set(
      record.sourceDecisions.flatMap((decision) => decision.disposition === "accepted" ? [decision.sourceId] : []),
    );
    if (acceptedSources.size < 2) issues.push(`${slug}: ResearchRecord must accept two independent sources`);
    const acceptedPublishers = new Set(
      researchRegistry.sources
        .filter((source) => acceptedSources.has(source.id))
        .map((source) => source.publisherOrInstitution.trim().toLocaleLowerCase("en")),
    );
    if (acceptedPublishers.size < 2) {
      issues.push(`${slug}: accepted sources must represent two independent publishers or institutions`);
    }
  }

  return issues;
}

export function assertM9RecipesPublicationReady(input: M9RecipePublicationReadinessInput): void {
  const issues = listM9RecipePublicationReadinessIssues(input);
  if (issues.length) throw new Error(`M9 recipes failed publication readiness: ${issues.join("; ")}`);
}
