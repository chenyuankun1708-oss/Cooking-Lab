import Link from "next/link";
import type { MealCompositionDisplay } from "@/lib/meal-composition-display";
import type { SupportedLocale } from "@/types/localization";
import { getMessages } from "@/lib/messages";
import { RecipeImage } from "./recipe-image";
import { appendQueryToHref } from "@/lib/decision-context-navigation";
import { encodeMealPlanAddPayload } from "@/lib/meal-plan-codec";
import { getLocalizedPath } from "@/lib/localization";
import { mealPlanSchemaVersion } from "@/types/meal-plan";

export function MealCompositionView({ meal, locale, query }: { meal: MealCompositionDisplay; locale: SupportedLocale; query?: URLSearchParams }) {
  const messages = getMessages(locale);
  const c = mealViewCopy[locale];
  const planHref = getLocalizedPath(locale, "/plan", encodeMealPlanAddPayload({
    version: mealPlanSchemaVersion,
    items: meal.items.map((item) => ({ slug: item.href.split("/").filter(Boolean).at(-1) ?? item.id, servings: 2 })),
    template: meal.templateId,
  }));
  return (
    <div>
      <div className="grid gap-5 border-b border-[var(--line)] pb-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <p className="text-sm font-semibold text-stone-500">{meal.completenessLabel}</p>
          <h2 className="mt-2 max-w-3xl text-3xl leading-tight text-stone-950 sm:text-5xl">{meal.templateLabel}</h2>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <p className="text-sm font-semibold text-stone-600">{meal.preparation.levelLabel}</p>
          <Link className="focus-ring inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-[4px] bg-stone-950 px-5 font-bold text-white hover:bg-[var(--tomato)]" href={planHref}>{c.addMealToPlan}</Link>
        </div>
      </div>

      <div className="mt-8 grid gap-x-6 gap-y-10 md:grid-cols-[1.2fr_0.9fr] lg:grid-cols-[1.25fr_1fr_1fr]">
        {meal.items.map((item, index) => (
          <article className={`editorial-card pt-4 ${index === 0 ? "md:row-span-2 lg:row-span-1" : ""}`} key={`${item.slotLabel}:${item.id}`}>
            <Link className="focus-ring group block" href={appendQueryToHref(item.href, query ?? new URLSearchParams())}>
              <RecipeImage image={item.image} fallbackInitial={item.fallbackInitial} fallbackLabel={item.name} alt={item.name} locale={locale} variant="card" showAttribution={false} />
              <div className="pb-6 pt-4">
                <div>
                  <p className="text-xs font-semibold text-[var(--tomato)]">{item.slotLabel}</p>
                </div>
                <h3 className="mt-2 text-xl font-bold leading-snug text-stone-950 group-hover:underline">{item.name}</h3>
                <p className="mt-2 text-sm text-stone-500">{[item.itemTypeLabel, item.placeLabel].filter(Boolean).join(" / ")}</p>
                {item.pairingReason ? <p className="mt-4 text-sm leading-6 text-stone-700">{item.pairingReason}</p> : null}
                <span className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--tomato)]">{messages.stories.openItem}</span>
              </div>
            </Link>
          </article>
        ))}
      </div>

      <section className="mt-9 grid gap-6 border-y border-[var(--line)] py-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12" aria-labelledby="pairing-reasons-title">
        <h3 id="pairing-reasons-title" className="text-xl font-bold text-stone-950">{c.why}</h3>
        <div>
          <ul className="grid gap-x-10 gap-y-5 text-sm leading-6 text-stone-700 sm:grid-cols-2">
            {meal.reasons.map((reason) => <li className="border-l-2 border-[var(--tomato)] pl-4" key={reason}>{reason}</li>)}
          </ul>
          {meal.cautions.length ? (
            <div className="mt-7 border-t border-[var(--line)] pt-5">
              <p className="font-semibold text-stone-900">{c.tradeoffs}</p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-stone-700">
                {meal.cautions.map((caution) => <li key={caution}>{caution}</li>)}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid border-b border-[var(--line)] md:grid-cols-3">
        <section className="py-7 md:pr-7" aria-labelledby="pairing-preparation-title">
          <p className="text-sm font-semibold text-stone-500">{c.practicality}</p>
          <h3 id="pairing-preparation-title" className="mt-2 text-xl font-bold text-stone-950">{c.preparation}</h3>
          <p className="mt-4 text-sm leading-6 text-stone-700">{meal.preparation.activeTimeLabel}</p>
          <p className="mt-1 text-sm leading-6 text-stone-700">{meal.preparation.elapsedTimeLabel}</p>
          {meal.preparation.parallelLabel ? <p className="mt-1 text-sm leading-6 text-stone-500">{meal.preparation.parallelLabel}</p> : null}
          {meal.preparation.toolOverlapLabel ? <p className="mt-3 text-xs leading-5 text-stone-500">{meal.preparation.toolOverlapLabel}</p> : null}
        </section>
        <section className="border-t border-[var(--line)] py-7 md:border-l md:border-t-0 md:px-7" aria-labelledby="pairing-nutrition-title">
          <p className="text-sm font-semibold text-stone-500">{meal.nutrition.coverageLabel}</p>
          <h3 id="pairing-nutrition-title" className="mt-2 text-xl font-bold text-stone-950">{c.nutrition}</h3>
          {meal.nutrition.metrics.length ? (
            <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
              {meal.nutrition.metrics.map((metric) => <div key={metric.label}><dt className="text-stone-500">{metric.label}</dt><dd className="mt-1 font-semibold text-stone-900">{metric.value}</dd></div>)}
            </dl>
          ) : <p className="mt-4 text-sm leading-6 text-stone-500">{c.noEstimate}</p>}
        </section>
        <section className="border-t border-[var(--line)] py-7 md:border-l md:border-t-0 md:pl-7" aria-labelledby="pairing-cost-title">
          <p className="text-sm font-semibold text-stone-500">{meal.cost.coverageLabel}</p>
          <h3 id="pairing-cost-title" className="mt-2 text-xl font-bold text-stone-950">{c.cost}</h3>
          {meal.cost.valueLabel ? <p className="mt-4 text-lg font-bold text-stone-900">{meal.cost.valueLabel}</p> : <p className="mt-4 text-sm leading-6 text-stone-500">{c.noEstimate}</p>}
        </section>
      </div>
    </div>
  );
}

export function MealCompositionAlternative({ meal, locale, query }: { meal: MealCompositionDisplay; locale: SupportedLocale; query?: URLSearchParams }) {
  const c = mealViewCopy[locale];
  return (
    <article className="border-t border-[var(--line)] pt-6">
      <p className="text-sm font-semibold text-stone-500">{meal.completenessLabel}</p>
      <h3 className="mt-2 text-2xl leading-tight text-stone-950">{meal.templateLabel}</h3>
      <ul className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">
        {meal.items.map((item) => (
          <li className="py-3" key={`${item.slotLabel}:${item.id}`}>
            <Link className="focus-ring inline-flex min-h-11 items-center font-semibold text-[var(--tomato)] hover:underline" href={appendQueryToHref(item.href, query ?? new URLSearchParams())}>{item.slotLabel} / {item.name}</Link>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-6 text-stone-600">{meal.reasons[0] ?? c.roleFallback}</p>
    </article>
  );
}

const mealViewCopy = {
  "zh-CN": { addMealToPlan: "把这餐加入今晚计划", why: "为什么这样搭", tradeoffs: "需要留意", practicality: "现实厨房", preparation: "准备负担", nutrition: "整餐营养估算", cost: "整餐成本估算", noEstimate: "缺失数据不会按零计入。", roleFallback: "这些项目承担不同餐桌角色。" },
  en: { addMealToPlan: "Add this meal to tonight's plan", why: "Why it works", tradeoffs: "Trade-offs", practicality: "In a real kitchen", preparation: "Preparation burden", nutrition: "Meal nutrition estimate", cost: "Meal cost estimate", noEstimate: "Missing data is never counted as zero.", roleFallback: "These items fill distinct roles at the table." },
} as const;
