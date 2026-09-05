import type { DecisionContext } from "@/types/decision-context";
import type { SupportedLocale } from "@/types/localization";
import type { RecipeCatalogFilters } from "./recipe-exploration";
import type { DecisionContextValueAllowlist } from "./decision-context";
import { parseDecisionContext, serializeDecisionContext } from "./decision-context";
import { getLocalizedPath } from "./localization";
import { serializeRecipeCatalogFilters } from "./recipe-exploration";

export type DecisionJourneySource = "discovery" | "catalog";

export interface DecisionRouteState {
  context: DecisionContext;
  source?: DecisionJourneySource;
}

export interface DecisionRouteQueryOptions {
  source?: DecisionJourneySource;
  catalogFilters?: RecipeCatalogFilters;
}

export const decisionJourneySourceQueryKey = "dcSource";

export function parseDecisionRouteState(
  params: URLSearchParams,
  allowlist: DecisionContextValueAllowlist,
): DecisionRouteState {
  const source = params.getAll(decisionJourneySourceQueryKey)
    .find((value): value is DecisionJourneySource => value === "discovery" || value === "catalog");
  return {
    context: parseDecisionContext(params, allowlist),
    ...(source ? { source } : {}),
  };
}

export function serializeDecisionRouteQuery(
  context: DecisionContext,
  allowlist: DecisionContextValueAllowlist,
  options: DecisionRouteQueryOptions = {},
): URLSearchParams {
  const params = serializeDecisionContext(context, allowlist);
  if (options.source) params.set(decisionJourneySourceQueryKey, options.source);
  if (options.catalogFilters) {
    for (const [key, value] of serializeRecipeCatalogFilters(options.catalogFilters)) {
      params.append(key, value);
    }
  }
  return params;
}

export function hasDecisionContext(context: DecisionContext): boolean {
  return Object.values(context).some((value) => Array.isArray(value) ? value.length > 0 : value !== undefined);
}

export function buildDecisionReturnHref(
  locale: SupportedLocale,
  state: DecisionRouteState,
  allowlist: DecisionContextValueAllowlist,
  catalogFilters: RecipeCatalogFilters = {},
): string {
  if (state.source === "catalog") {
    return getLocalizedPath(locale, "/recipes", serializeDecisionRouteQuery(
      state.context,
      allowlist,
      { catalogFilters },
    ));
  }
  const href = getLocalizedPath(locale, "/", serializeDecisionRouteQuery(state.context, allowlist));
  return `${href}#decide`;
}

export function appendQueryToHref(href: string, params: URLSearchParams): string {
  const query = params.toString();
  if (!query) return href;
  const [path, hash] = href.split("#", 2);
  return `${path}${path.includes("?") ? "&" : "?"}${query}${hash ? `#${hash}` : ""}`;
}
