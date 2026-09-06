import Link from "next/link";
import type { CulinaryDetailModel } from "@/lib/culinary-detail";
import { getLocalizedPath } from "@/lib/localization";
import type { DecisionContext } from "@/types/decision-context";
import type { SupportedLocale } from "@/types/localization";
import { DecisionContextSummary } from "./decision-context-summary";
import { EmbeddedStories } from "./embedded-stories";
import { RecipeImage } from "./recipe-image";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function NativeCulinaryDetailPage({
  detail,
  locale,
  query,
  decisionContext,
  returnHref,
  returnLabel,
  anchorIsRecipe,
}: {
  detail: CulinaryDetailModel;
  locale: SupportedLocale;
  query: URLSearchParams;
  decisionContext?: DecisionContext;
  returnHref?: string;
  returnLabel?: string;
  anchorIsRecipe: boolean;
}) {
  const copy = detailCopy[locale];
  const identity = [detail.itemTypeLabel, detail.placeLabel, detail.flavorLabel].filter(Boolean);
  return (
    <main id="main-content">
      <SiteHeader active="recipes" locale={locale} currentPath={`/${locale}/recipes/${detail.slug}`} query={query.toString()} />
      <article>
        <header className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 pt-7 sm:px-6 sm:pt-10 lg:grid-cols-[minmax(20rem,0.82fr)_minmax(0,1.18fr)] lg:items-end lg:gap-14 lg:pb-16">
          <div className="lg:pb-3">
            <nav aria-label={copy.breadcrumb} className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
              <Link className="focus-ring inline-flex min-h-11 items-center font-semibold text-[var(--tomato)] hover:underline" href={getLocalizedPath(locale)}>{copy.home}</Link>
              <span aria-hidden="true">/</span>
              <Link className="focus-ring inline-flex min-h-11 items-center font-semibold text-[var(--tomato)] hover:underline" href={getLocalizedPath(locale, "/recipes")}>{copy.library}</Link>
            </nav>
            <p className="editorial-kicker mt-8">{identity.slice(0, 2).join(" / ")}</p>
            <h1 className="mt-3 max-w-[12ch] text-5xl leading-[0.98] text-stone-950 sm:text-7xl">{detail.name}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-stone-700 sm:text-lg">{detail.description}</p>
            {detail.flavorLabel ? (
              <p className="mt-7 border-t border-[var(--line)] pt-4 text-sm font-semibold leading-6 text-stone-700">
                <span className="mr-3 text-stone-500">{copy.flavor}</span>
                {detail.flavorLabel}
              </p>
            ) : null}
            {decisionContext ? <DecisionContextSummary context={decisionContext} locale={locale} anchorIsRecipe={anchorIsRecipe} /> : null}
            {returnHref && returnLabel ? <Link className="focus-ring mt-5 inline-flex min-h-11 items-center font-bold text-[var(--tomato)] hover:underline" href={returnHref}>{returnLabel}</Link> : null}
          </div>
          <div className="overflow-hidden rounded-[4px] bg-stone-200">
            <RecipeImage image={detail.image} fallbackInitial={detail.fallbackInitial} fallbackLabel={detail.name} alt={detail.image?.alt ?? detail.name} locale={locale} sourceLabel={copy.imageSource} variant="hero" preload />
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20" aria-labelledby="preparation-title">
          <p className="editorial-kicker">{copy.preparationEyebrow}</p>
          <h2 id="preparation-title" className="mt-3 max-w-2xl text-4xl leading-[1.06] text-stone-950 sm:text-6xl">{detail.preparation.label}</h2>
          {detail.preparation.kind === "procedural" ? (
            <div className="mt-10 grid gap-12 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-20">
              <div>
                <dl className="grid grid-cols-2 border-t border-[var(--line)] text-sm">
                  <Fact label={copy.totalTime} value={detail.preparation.totalTimeLabel} />
                  <Fact label={copy.yield} value={detail.preparation.yieldLabel} />
                </dl>
                <h3 className="mt-9 text-xl font-bold text-stone-950">{copy.ingredients}</h3>
                <ul className="mt-4 border-t border-[var(--line)]">
                  {detail.preparation.inputs.map((input) => (
                    <li key={input.id} className="grid grid-cols-[1fr_auto] gap-x-4 border-b border-[var(--line)] py-3 text-sm">
                      <span className="font-semibold text-stone-900">{input.name}{input.optional ? <span className="ml-2 font-normal text-stone-500">{copy.optional}</span> : null}</span>
                      <span className="text-stone-700">{input.amount}</span>
                      {input.note ? <p className="col-span-2 mt-1 leading-6 text-stone-500">{input.note}</p> : null}
                    </li>
                  ))}
                </ul>
                <h3 className="mt-9 text-xl font-bold text-stone-950">{copy.tools}</h3>
                <p className="mt-3 leading-7 text-stone-600">{detail.preparation.tools.join(locale === "zh-CN" ? "、" : ", ")}</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-stone-950">{copy.method}</h3>
                <ol className="mt-5 border-t border-[var(--line)]">
                  {detail.preparation.steps.map((step) => (
                    <li className="grid gap-3 border-b border-[var(--line)] py-7 sm:grid-cols-[3.5rem_1fr] sm:gap-6" key={step.order}>
                      <span className="font-display text-2xl text-[var(--tomato)]" aria-hidden="true">{String(step.order).padStart(2, "0")}</span>
                      <div>
                        {step.durationLabel ? <p className="text-xs font-semibold text-stone-500">{step.durationLabel}</p> : null}
                        <p className="mt-1 text-lg font-semibold leading-8 text-stone-950">{step.instruction}</p>
                        {step.stateCue ? <p className="mt-4 border-l-2 border-[var(--tomato)] pl-4 leading-7 text-stone-800"><strong>{copy.cue}:</strong> {step.stateCue}</p> : null}
                        {step.rationale ? <p className="mt-4 max-w-2xl leading-7 text-stone-600">{step.rationale}</p> : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : (
            <div className="mt-10 grid max-w-4xl gap-5 border-y border-[var(--line)] py-7 sm:grid-cols-[10rem_1fr] sm:gap-10">
              <p className="text-sm font-semibold text-stone-500">{detail.preparation.kind === "ready" ? copy.readyLabel : copy.guidanceLabel}</p>
              <div>
                <p className="text-lg leading-8 text-stone-800">{detail.preparation.guidance}</p>
                {detail.preparation.kind === "guidance" ? <p className="mt-5 text-sm font-semibold text-stone-700">{detail.preparation.estimatedTimeLabel}{detail.preparation.tools.length ? ` / ${detail.preparation.tools.join(locale === "zh-CN" ? "、" : ", ")}` : ""}</p> : null}
              </div>
            </div>
          )}
        </section>

        {detail.principles.length ? (
          <section className="border-y border-[var(--line)] py-12 sm:py-16" aria-labelledby="principles-title">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <h2 id="principles-title" className="max-w-2xl text-3xl leading-tight text-stone-950 sm:text-5xl">{copy.principles}</h2>
              <ol className="mt-8 grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
                {detail.principles.map((principle, index) => (
                  <li className="bg-[var(--background)] p-5" key={principle}>
                    <span className="font-display text-2xl text-[var(--tomato)]" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    <p className="mt-5 font-bold leading-7 text-stone-950">{principle}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ) : null}

        <EmbeddedStories stories={detail.embeddedStories} locale={locale} />

        <section className="border-t border-[var(--line)] py-12 sm:py-16" aria-labelledby="estimates-title">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="editorial-kicker">{copy.reference}</p>
            <h2 id="estimates-title" className="mt-3 text-3xl leading-tight text-stone-950 sm:text-5xl">{copy.estimates}</h2>
            <div className="mt-9 grid gap-10 md:grid-cols-2 md:gap-16">
              <EstimateBlock title={copy.nutrition} value={nutritionText(detail, locale)} note={copy.estimateNote} />
              <EstimateBlock title={copy.cost} value={costText(detail, locale)} note={copy.costNote} />
            </div>
          </div>
        </section>

          <section id="sources" className="scroll-mt-24 border-t border-[var(--line)] py-12 sm:py-16" aria-labelledby="sources-title">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <h2 id="sources-title" className="text-3xl leading-tight text-stone-950 sm:text-5xl">{copy.sources}</h2>
              <p className="mt-4 max-w-2xl leading-7 text-stone-600">{copy.sourcesIntro}</p>
              {detail.rights ? (
                <div className="mt-8 border-y border-[var(--line)] py-5">
                  <p className="font-bold text-stone-950">{detail.rights.identityLabel}</p>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{detail.rights.identityDescription}</p>
                </div>
              ) : null}
              {detail.sources.length ? (
                <ol className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2">
                  {detail.sources.map((source) => (
                    <li className="border-t border-[var(--line)] pt-4 text-sm leading-6" key={source.id}>
                      {source.href ? <a className="focus-ring inline-flex min-h-11 items-center font-bold text-[var(--tomato)] hover:underline" href={source.href} rel="noreferrer" target="_blank">{source.title}</a> : <p className="font-bold text-stone-950">{source.title}</p>}
                      <p className="mt-1 text-stone-600">{source.byline}</p>
                      <p className="mt-2 text-xs text-stone-500">{source.uses.join(locale === "zh-CN" ? "、" : ", ")}</p>
                    </li>
                  ))}
                </ol>
              ) : <p className="mt-7 text-sm leading-6 text-stone-600">{copy.noExternalSources}</p>}
              {detail.rights?.attributions.length ? (
                <div className="mt-10">
                  <h3 className="text-xl font-bold text-stone-950">{copy.attributions}</h3>
                  <ul className="mt-4 space-y-4 border-t border-[var(--line)] pt-4">
                    {detail.rights.attributions.map((attribution) => (
                      <li className="text-sm leading-6 text-stone-600" key={attribution.id}>
                        <p>{attribution.notice}</p>
                        {attribution.modificationNotice ? <p className="mt-1 text-xs text-stone-500">{attribution.modificationNotice}</p> : null}
                        <p className="mt-2 flex flex-wrap gap-4">
                          <a className="focus-ring inline-flex min-h-11 items-center font-bold text-[var(--tomato)] hover:underline" href={attribution.sourceUrl} rel="noreferrer" target="_blank">{copy.originalFile}</a>
                          {attribution.licenseUrl ? <a className="focus-ring inline-flex min-h-11 items-center font-bold text-[var(--tomato)] hover:underline" href={attribution.licenseUrl} rel="noreferrer" target="_blank">{attribution.licenseId}</a> : null}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <Link className="focus-ring mt-8 inline-flex min-h-11 items-center font-bold text-[var(--tomato)] hover:underline" href={getLocalizedPath(locale, "/content-rights")}>{copy.policy}</Link>
            </div>
          </section>

        <section className="border-t border-[var(--line)] py-12 sm:py-16" aria-labelledby="pairing-title">
          <div className="mx-auto grid max-w-6xl gap-7 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="editorial-kicker">{copy.next}</p>
              <h2 id="pairing-title" className="mt-3 max-w-3xl text-3xl leading-tight text-stone-950 sm:text-5xl">{copy.pairingTitle(detail.name)}</h2>
              <p className="mt-4 max-w-2xl leading-7 text-stone-600">{copy.pairingDescription}</p>
            </div>
            <Link className="focus-ring inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-[4px] bg-stone-950 px-5 py-2.5 font-bold text-white transition hover:bg-[var(--tomato)] active:translate-y-px" href={getLocalizedPath(locale, `/pairing/${detail.slug}`, query)}>{copy.pairing}</Link>
          </div>
        </section>
      </article>
      <SiteFooter locale={locale} />
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="border-r border-[var(--line)] py-4 pr-4 last:border-r-0 last:pl-4"><dt className="text-stone-500">{label}</dt><dd className="mt-1 font-bold text-stone-950">{value}</dd></div>;
}

function EstimateBlock({ title, value, note }: { title: string; value: string; note: string }) {
  return <div className="border-t border-[var(--line)] pt-5"><h3 className="font-bold text-stone-950">{title}</h3><p className="mt-3 text-xl text-stone-950">{value}</p><p className="mt-2 text-xs leading-5 text-stone-500">{note}</p></div>;
}

function nutritionText(detail: CulinaryDetailModel, locale: SupportedLocale): string {
  if (detail.nutrition.status === "not-modeled") return locale === "zh-CN" ? "暂未建模" : "Not modeled yet";
  const value = detail.nutrition.value;
  const basis = detail.nutrition.basis === "per-serving" ? (locale === "zh-CN" ? "每份" : "per serving") : detail.nutrition.basis;
  return locale === "zh-CN" ? `${basis}约 ${Math.round(value.calories)} 千卡，蛋白质 ${value.protein.toFixed(1)} 克` : `${basis}: about ${Math.round(value.calories)} kcal, ${value.protein.toFixed(1)} g protein`;
}

function costText(detail: CulinaryDetailModel, locale: SupportedLocale): string {
  if (detail.cost.status === "not-modeled") return locale === "zh-CN" ? "暂未建模" : "Not modeled yet";
  return detail.cost.perServing === undefined
    ? `${detail.cost.currency} ${detail.cost.whole.toFixed(1)}`
    : locale === "zh-CN" ? `整份约 ¥${detail.cost.whole.toFixed(1)}，每份约 ¥${detail.cost.perServing.toFixed(1)}` : `About ¥${detail.cost.whole.toFixed(1)} total, ¥${detail.cost.perServing.toFixed(1)} per serving`;
}

const detailCopy = {
  "zh-CN": { breadcrumb: "面包屑导航", home: "首页", library: "料理库", flavor: "风味", preparationEyebrow: "从成品到餐桌", principles: "把这道料理做好的关键", pairing: "搭配这一餐", pairingTitle: (name: string) => `围绕${name}完成一餐`, pairingDescription: "保留这道料理作为起点，再平衡餐桌角色、风味和真实的准备节奏。", next: "下一步", imageSource: "图片来源", totalTime: "总时间", yield: "产出", ingredients: "食材", optional: "可选", tools: "工具", method: "准备方法", cue: "状态提示", guidanceLabel: "服务方式", readyLabel: "无需制作", reference: "估算信息", estimates: "营养与成本", nutrition: "营养估算", cost: "成本估算", estimateNote: "营养值为估算，不构成医疗建议。", costNote: "成本按静态参考价格估算。", sources: "来源与权利", sourcesIntro: "以下资料用于核对料理身份、做法、安全边界或文化语境；页面文字为独立编辑，图片按逐文件许可展示。", noExternalSources: "该料理当前不依赖外部表达性内容；编辑估算的方法与限制仍受全站权利政策约束。", attributions: "图片与开放内容署名", originalFile: "查看原始文件", policy: "阅读全站内容来源与权利政策" },
  en: { breadcrumb: "Breadcrumb", home: "Home", library: "Culinary library", flavor: "Flavor", preparationEyebrow: "From item to table", principles: "What makes this item work", pairing: "Build a pairing", pairingTitle: (name: string) => `Complete a meal around ${name}`, pairingDescription: "Keep this item as the anchor, then balance table roles, flavor, and a preparation rhythm that works in a real kitchen.", next: "Next", imageSource: "Image source", totalTime: "Total time", yield: "Yield", ingredients: "Ingredients", optional: "optional", tools: "Tools", method: "Preparation", cue: "Look for", guidanceLabel: "How to serve", readyLabel: "No preparation needed", reference: "Estimated information", estimates: "Nutrition and cost", nutrition: "Nutrition estimate", cost: "Cost estimate", estimateNote: "Nutrition is estimated and is not medical advice.", costNote: "Cost uses static reference prices.", sources: "Sources and rights", sourcesIntro: "These references support identity, preparation, safety boundaries, or cultural context. Page copy is independently edited, and images are shown under file-specific licenses.", noExternalSources: "This item does not currently depend on third-party expressive content; editorial estimate methods and limits still follow the site-wide rights policy.", attributions: "Image and open-content attribution", originalFile: "View original file", policy: "Read the site-wide content sources and rights policy" },
} as const;
