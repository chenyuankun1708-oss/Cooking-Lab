import type { DecisionContext } from "@/types/decision-context";
import type { SupportedLocale } from "@/types/localization";
import { describeDecisionContext } from "@/lib/decision-context-display";

export function DecisionContextSummary({
  context,
  locale,
  surface = "recipe",
  anchorIsRecipe = true,
}: {
  context: DecisionContext;
  locale: SupportedLocale;
  surface?: "recipe" | "pairing";
  anchorIsRecipe?: boolean;
}) {
  const entries = describeDecisionContext(context, locale, { surface, anchorIsRecipe });
  if (!entries.length) return null;

  return (
    <aside className="mx-auto mt-7 max-w-4xl border-y border-stone-300 py-5 text-left" aria-labelledby="decision-context-title">
      <h2 id="decision-context-title" className="text-sm font-bold text-stone-950">
        {locale === "zh-CN" ? "这次决定中保留的条件" : "Conditions kept for this decision"}
      </h2>
      <p className="mt-1 text-xs leading-5 text-stone-500">
        {locale === "zh-CN"
          ? surface === "pairing" && !anchorIsRecipe
            ? "整餐只执行明确支持的条件；菜谱专属条件在这个原生料理起点上仅保留、不执行。"
            : `整餐只执行明确支持的条件；每份营养、预算与用量仍只描述${surface === "pairing" ? "起点菜谱" : "当前菜谱"}。`
          : surface === "pairing" && !anchorIsRecipe
            ? "Only supported constraints apply to the whole meal; Recipe-only conditions are carried but not applied to this native culinary anchor."
            : `Only supported constraints apply to the whole meal; per-serving nutrition, budget, and amounts still describe ${surface === "pairing" ? "the anchor recipe" : "this recipe"} only.`}
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {entries.map((entry) => (
          <li className="rounded-full border border-stone-300 bg-white px-3 py-2 text-xs leading-5 text-stone-700" key={entry.field}>
            <span className="font-bold text-[#235849]">{entry.scopeLabel}</span>
            <span aria-hidden="true"> · </span>
            {entry.text}
          </li>
        ))}
      </ul>
    </aside>
  );
}
