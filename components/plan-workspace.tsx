"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { MealPlanCatalog } from "@/data/published-meal-plans";
import { buildMealPlan, resolveIncomingMealPlanSelections } from "@/lib/meal-plan";
import { encodeMealPlanSharePayload, migrateMealPlanV0Selections, parseMealPlanLocalState } from "@/lib/meal-plan-codec";
import { getLocalizedPath } from "@/lib/localization";
import {
  mealPlanSchemaVersion,
  type MealPlanLocalStateV1,
  type MealPlanV1,
} from "@/types/meal-plan";
import type { SupportedLocale } from "@/types/localization";

const storageKey = "cooking-lab:meal-plan:v1";
type View = "shopping" | "timeline" | "cook";

export function PlanWorkspace({
  initialCatalog,
  initialMode,
  initialPlan,
  invalidShareLink = false,
  locale,
}: {
  initialCatalog: MealPlanCatalog;
  initialMode: "merge" | "replace";
  initialPlan?: MealPlanV1;
  invalidShareLink?: boolean;
  locale: SupportedLocale;
}) {
  const copy = planCopy[locale];
  const [catalog, setCatalog] = useState(initialCatalog);
  const [state, setState] = useState<MealPlanLocalStateV1>();
  const [view, setView] = useState<View>("shopping");
  const [storageWarning, setStorageWarning] = useState(false);
  const [planLimitWarning, setPlanLimitWarning] = useState(false);
  const [catalogError, setCatalogError] = useState(false);
  const [hydrationPending, setHydrationPending] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [shareStatus, setShareStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      const stored = readPersistedPlan();
      const { raw, parsed, migratedSelections } = stored;
      if ((stored.unavailable || (raw && !parsed && !migratedSelections)) && !cancelled) setStorageWarning(true);
      const resolved = resolveIncomingMealPlanSelections(
        parsed?.plan.selections ?? migratedSelections ?? [],
        initialPlan?.selections ?? [],
        initialMode,
      );
      const selections = resolved.selections;
      if (resolved.limitExceeded && !cancelled) setPlanLimitWarning(true);
      if (!selections.length) {
        if (!cancelled) {
          setState(undefined);
          setHydrationPending(false);
        }
        return;
      }

      try {
        const nextCatalog = catalogHasItems(initialCatalog, selections)
          ? initialCatalog
          : await fetchMealPlanCatalog(locale, selections.map((selection) => selection.itemId));
        if (!catalogHasItems(nextCatalog, selections)) throw new Error("Meal plan catalog is incomplete.");
        const nextPlan = buildMealPlan(nextCatalog.buildItems, selections, { stepMetadata: nextCatalog.stepMetadata });
        const next = parsed ? preserveProgress(parsed, nextPlan) : freshState(nextPlan);
        if (!cancelled) {
          setCatalog(nextCatalog);
          setState(next);
          persist(next, setStorageWarning);
          setCatalogError(false);
        }
      } catch {
        if (!cancelled) {
          setState(parsed ?? (initialPlan ? freshState(initialPlan) : undefined));
          setCatalogError(true);
        }
      } finally {
        if (!cancelled) setHydrationPending(false);
      }
    }
    void hydrate();
    return () => { cancelled = true; };
  }, [initialCatalog, initialMode, initialPlan, locale, retryCount]);

  const plan = state?.plan;
  const orderedTasks = useMemo(() => plan?.timeline.toSorted((a, b) => a.startOffsetMinutes - b.startOffsetMinutes) ?? [], [plan]);

  const updateState = (updater: (current: MealPlanLocalStateV1) => MealPlanLocalStateV1) => {
    setState((current) => {
      if (!current) return current;
      const next = { ...updater(current), updatedAt: new Date().toISOString() };
      persist(next, setStorageWarning);
      return next;
    });
  };

  const rebuild = (selections: MealPlanV1["selections"]) => {
    if (!selections.length) {
      removePersistedPlan(setStorageWarning);
      setState(undefined);
      return;
    }
    const nextPlan = buildMealPlan(catalog.buildItems, selections, { stepMetadata: catalog.stepMetadata });
    updateState((current) => ({
      ...current,
      plan: nextPlan,
      checkedShoppingLineIds: current.checkedShoppingLineIds.filter((id) => nextPlan.shopping.some((line) => line.id === id)),
      completedTaskIds: current.completedTaskIds.filter((id) => nextPlan.timeline.some((task) => task.id === id)),
      activeTimer: undefined,
    }));
  };

  const share = async () => {
    if (!plan) return;
    try {
      const items = plan.selections.map((selection) => ({
        slug: catalog.itemLabels[selection.itemId]?.slug ?? selection.itemId,
        servings: selection.servings,
      }));
      const query = encodeMealPlanSharePayload({ version: mealPlanSchemaVersion, items });
      const url = new URL(getLocalizedPath(locale, "/plan", query), window.location.origin).toString();
      await window.navigator.clipboard.writeText(url);
      setShareStatus(copy.copied);
    } catch {
      setShareStatus(copy.shareFailed);
    }
  };

  if (hydrationPending) {
    return (
      <section aria-busy="true" aria-label={copy.loading} className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="h-4 w-28 animate-pulse bg-[var(--surface-herb)] motion-reduce:animate-none" />
        <div className="mt-4 h-12 max-w-xl animate-pulse bg-[var(--surface-herb)] motion-reduce:animate-none" />
        <div className="mt-6 h-24 animate-pulse bg-[var(--surface-story)] motion-reduce:animate-none" />
      </section>
    );
  }

  if (plan && (catalogError || !catalogHasItems(catalog, plan.selections))) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <p className="editorial-kicker">{copy.eyebrow}</p>
        <h1 className="mt-3 text-4xl text-stone-950 sm:text-6xl">{copy.catalogErrorTitle}</h1>
        <p className="mx-auto mt-5 max-w-xl leading-7 text-stone-600">{copy.catalogErrorBody}</p>
        <button className="focus-ring mt-7 min-h-11 rounded-[4px] bg-stone-950 px-5 font-bold text-white hover:bg-[var(--tomato)]" onClick={() => { setCatalogError(false); setHydrationPending(true); setRetryCount((value) => value + 1); }} type="button">{copy.retry}</button>
      </section>
    );
  }

  if (!plan) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <p className="editorial-kicker">{copy.emptyEyebrow}</p>
        <h1 className="mt-3 text-4xl text-stone-950 sm:text-6xl">{copy.emptyTitle}</h1>
        <p className="mx-auto mt-5 max-w-xl leading-7 text-stone-600">{copy.emptyBody}</p>
        {invalidShareLink ? <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[var(--tomato)]" role="status">{copy.shareWarning}</p> : null}
        {storageWarning ? <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[var(--tomato)]" role="status">{copy.storageWarning}</p> : null}
        <Link className="focus-ring mt-7 inline-flex min-h-11 items-center justify-center rounded-[4px] bg-stone-950 px-5 font-bold text-white hover:bg-[var(--tomato)]" href={`${getLocalizedPath(locale)}#decide`}>{copy.decide}</Link>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <header className="grid gap-7 border-b border-[var(--line)] pb-9 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="editorial-kicker">{copy.eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-4xl leading-tight text-stone-950 sm:text-6xl">{copy.title}</h1>
          <p className="mt-4 max-w-2xl leading-7 text-stone-600">{copy.summary(plan.selections.length, plan.totalMinutes)}</p>
          {invalidShareLink ? <p className="mt-3 text-sm text-[var(--tomato)]" role="status">{copy.shareWarning}</p> : null}
          {storageWarning ? <p className="mt-3 text-sm text-[var(--tomato)]" role="status">{copy.storageWarning}</p> : null}
          {planLimitWarning ? <p className="mt-3 text-sm text-[var(--tomato)]" role="status">{copy.planLimitWarning}</p> : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="focus-ring min-h-11 rounded-[4px] border border-stone-950 px-4 font-bold text-stone-950 hover:border-[var(--tomato)] hover:text-[var(--tomato)]" onClick={share} type="button">{copy.share}</button>
          <button className="focus-ring min-h-11 px-3 font-bold text-[var(--tomato)] hover:underline" onClick={() => { removePersistedPlan(setStorageWarning); setState(undefined); }} type="button">{copy.clear}</button>
        </div>
        {shareStatus ? <p className="text-sm text-stone-600 lg:col-span-2" role="status">{shareStatus}</p> : null}
      </header>

      <section className="py-8" aria-labelledby="plan-items-title">
        <h2 className="text-2xl text-stone-950" id="plan-items-title">{copy.items}</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {plan.selections.map((selection) => {
            const item = catalog.itemLabels[selection.itemId];
            return (
              <article className="grid grid-cols-[1fr_auto] items-center gap-4 border-t border-[var(--line)] py-4" key={selection.itemId}>
                <div>
                  <Link className="focus-ring inline-flex min-h-11 items-center text-lg font-bold text-stone-950 hover:text-[var(--tomato)]" href={getLocalizedPath(locale, `/recipes/${item?.slug ?? selection.itemId}`)}>{item?.name ?? selection.itemId}</Link>
                  <ServingsInput
                    key={`${selection.itemId}:${selection.servings}`}
                    label={copy.servings}
                    onCommit={(servings) => rebuild(plan.selections.map((entry) => entry.itemId === selection.itemId ? { ...entry, servings } : entry))}
                    value={selection.servings}
                  />
                </div>
                <button className="focus-ring min-h-11 px-2 text-sm font-bold text-[var(--tomato)] hover:underline" onClick={() => rebuild(plan.selections.filter((entry) => entry.itemId !== selection.itemId))} type="button">{copy.remove}</button>
              </article>
            );
          })}
        </div>
      </section>

      <nav aria-label={copy.views} className="horizontal-rail flex gap-2 overflow-x-auto border-b border-[var(--line)] pb-3 pr-8">
        {(["shopping", "timeline", "cook"] as const).map((id) => <button aria-pressed={view === id} className={`focus-ring min-h-11 shrink-0 rounded-full px-4 text-sm font-bold ${view === id ? "bg-stone-950 text-white" : "border border-stone-400 text-stone-700"}`} key={id} onClick={() => setView(id)} type="button">{copy.viewLabels[id]}</button>)}
      </nav>

      {view === "shopping" ? <ShoppingView catalog={catalog} copy={copy} state={state} updateState={updateState} /> : null}
      {view === "timeline" ? <TimelineView catalog={catalog} copy={copy} tasks={orderedTasks} /> : null}
      {view === "cook" ? <CookingView catalog={catalog} copy={copy} state={state} tasks={orderedTasks} updateState={updateState} /> : null}
    </div>
  );
}

function ShoppingView({ catalog, copy, state, updateState }: WorkspaceViewProps) {
  return <section className="py-8" aria-labelledby="shopping-title"><h2 className="text-3xl text-stone-950" id="shopping-title">{copy.shopping}</h2><ul className="mt-6 grid gap-x-10 md:grid-cols-2">{state.plan.shopping.map((line) => <li className="border-t border-[var(--line)] py-3" key={line.id}><label className="flex min-h-11 cursor-pointer items-center gap-3"><input checked={state.checkedShoppingLineIds.includes(line.id)} className="h-5 w-5 accent-[var(--tomato)]" onChange={() => updateState((current) => ({ ...current, checkedShoppingLineIds: toggle(current.checkedShoppingLineIds, line.id) }))} type="checkbox" /><span className="flex-1 font-semibold text-stone-900">{line.kind === "ingredient" ? catalog.ingredientLabels[line.ingredientId!] ?? line.ingredientId : catalog.itemLabels[line.itemId!]?.name ?? line.itemId}</span><span className="text-sm text-stone-600">{formatAmount(line.amount)} {unitLabel(line.unit, copy.locale, line.amount)}</span></label></li>)}</ul></section>;
}

function TimelineView({ catalog, copy, tasks }: { catalog: MealPlanCatalog; copy: typeof planCopy[SupportedLocale]; tasks: MealPlanTask[] }) {
  return <section className="py-8" aria-labelledby="timeline-title"><h2 className="text-3xl text-stone-950" id="timeline-title">{copy.timeline}</h2><ol className="mt-6">{tasks.map((task) => <li className="grid gap-2 border-t border-[var(--line)] py-5 sm:grid-cols-[8rem_1fr]" key={task.id}><p className="font-display text-xl text-[var(--tomato)]">{copy.minute(task.startOffsetMinutes)}</p><div><p className="text-xs font-bold text-stone-500">{copy.taskKinds[task.kind]} / {catalog.itemLabels[task.itemId]?.name}</p><p className="mt-2 font-semibold leading-7 text-stone-950">{catalog.taskLabels[task.id]?.instruction ?? task.id}</p>{task.durationMinutes ? <p className="mt-2 text-sm text-stone-600">{copy.duration(task.durationMinutes)}</p> : null}</div></li>)}</ol></section>;
}

function CookingView({ catalog, copy, state, tasks, updateState }: WorkspaceViewProps & { tasks: MealPlanTask[] }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!state.activeTimer) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [state.activeTimer]);
  return <section className="py-8" aria-labelledby="cook-title"><h2 className="text-3xl text-stone-950" id="cook-title">{copy.cook}</h2><p className="mt-3 max-w-2xl leading-7 text-stone-600">{copy.cookNote}</p><ol className="mt-6 grid gap-4">{tasks.map((task) => { const done = state.completedTaskIds.includes(task.id); const label = catalog.taskLabels[task.id]; const timerActive = state.activeTimer?.taskId === task.id; return <li className={`border p-5 ${done ? "border-stone-300 bg-[var(--surface-story)]" : "border-stone-500 bg-[var(--surface-paper)]"}`} key={task.id}><label className="flex cursor-pointer items-start gap-4"><input checked={done} className="mt-1 h-5 w-5 accent-[var(--tomato)]" onChange={() => updateState((current) => ({ ...current, completedTaskIds: toggle(current.completedTaskIds, task.id), activeTimer: current.activeTimer?.taskId === task.id ? undefined : current.activeTimer }))} type="checkbox" /><span><span className="block text-xs font-bold text-stone-500">{catalog.itemLabels[task.itemId]?.name} / {copy.taskKinds[task.kind]}</span><span className="mt-2 block text-lg font-semibold leading-8 text-stone-950">{label?.instruction ?? task.id}</span>{label?.stateCue ? <span className="mt-3 block border-l-2 border-[var(--tomato)] pl-3 text-sm leading-6 text-stone-700">{copy.cue}: {label.stateCue}</span> : null}</span></label>{task.durationMinutes && !done ? <div className="mt-4 flex flex-wrap items-center gap-3"><button className="focus-ring min-h-11 rounded-[4px] border border-stone-950 px-4 text-sm font-bold text-stone-950 hover:text-[var(--tomato)]" onClick={() => { if (timerActive) { updateState((current) => ({ ...current, activeTimer: undefined })); return; } const startedAt = new Date().toISOString(); setNow(Date.parse(startedAt)); updateState((current) => ({ ...current, activeTimer: { taskId: task.id, startedAt } })); }} type="button">{timerActive ? copy.stopTimer : copy.startTimer(task.durationMinutes)}</button>{timerActive ? <output aria-live="off" className="font-display text-xl text-[var(--tomato)]">{formatTimerRemaining(task.durationMinutes, state.activeTimer!.startedAt, now)}</output> : null}</div> : null}</li>; })}</ol></section>;
}

type MealPlanTask = MealPlanV1["timeline"][number];
type WorkspaceViewProps = { catalog: MealPlanCatalog; copy: typeof planCopy[SupportedLocale]; state: MealPlanLocalStateV1; updateState: (updater: (current: MealPlanLocalStateV1) => MealPlanLocalStateV1) => void };
function freshState(plan: MealPlanV1): MealPlanLocalStateV1 { return { schemaVersion: mealPlanSchemaVersion, plan, checkedShoppingLineIds: [], completedTaskIds: [], updatedAt: new Date().toISOString() }; }
function preserveProgress(current: MealPlanLocalStateV1, plan: MealPlanV1): MealPlanLocalStateV1 {
  return {
    ...current,
    plan,
    checkedShoppingLineIds: current.checkedShoppingLineIds.filter((id) => plan.shopping.some((line) => line.id === id)),
    completedTaskIds: current.completedTaskIds.filter((id) => plan.timeline.some((task) => task.id === id)),
    activeTimer: plan.timeline.some((task) => task.id === current.activeTimer?.taskId) ? current.activeTimer : undefined,
    updatedAt: new Date().toISOString(),
  };
}
function catalogHasItems(catalog: MealPlanCatalog, selections: readonly MealPlanV1["selections"][number][]): boolean {
  const itemIds = new Set(catalog.buildItems.map((item) => item.id));
  return selections.every((selection) => itemIds.has(selection.itemId));
}
async function fetchMealPlanCatalog(locale: SupportedLocale, itemIds: string[]): Promise<MealPlanCatalog> {
  const response = await fetch("/api/meal-plan-catalog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locale, itemIds }),
  });
  if (!response.ok) throw new Error("Meal plan catalog request failed.");
  return await response.json() as MealPlanCatalog;
}
function persist(state: MealPlanLocalStateV1, onFailure: (value: boolean) => void) { try { window.localStorage.setItem(storageKey, JSON.stringify(state)); onFailure(false); } catch { onFailure(true); } }
function readPersistedPlan(): { raw: string | null; parsed?: MealPlanLocalStateV1; migratedSelections?: MealPlanV1["selections"]; unavailable: boolean } {
  try {
    const raw = window.localStorage.getItem(storageKey);
    return { raw, parsed: parseMealPlanLocalState(raw), migratedSelections: migrateMealPlanV0Selections(raw), unavailable: false };
  } catch {
    return { raw: null, unavailable: true };
  }
}
function removePersistedPlan(onFailure: (value: boolean) => void): void {
  try {
    window.localStorage.removeItem(storageKey);
    onFailure(false);
  } catch {
    onFailure(true);
  }
}
function toggle(values: string[], value: string): string[] { return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value]; }
function formatAmount(value: number): string { return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, ""); }
function unitLabel(unit: MealPlanV1["shopping"][number]["unit"], locale: SupportedLocale, amount: number): string { const labels = { g: { "zh-CN": "克", en: "g" }, kg: { "zh-CN": "千克", en: "kg" }, ml: { "zh-CN": "毫升", en: "ml" }, piece: { "zh-CN": "个", en: "pc" }, tbsp: { "zh-CN": "大勺", en: "tbsp" }, tsp: { "zh-CN": "小勺", en: "tsp" } } as const; if (unit === "item") return locale === "zh-CN" ? "份" : amount === 1 ? "serving" : "servings"; return labels[unit][locale]; }
function formatTimerRemaining(durationMinutes: number, startedAt: string, now: number): string { const remaining = Math.max(0, durationMinutes * 60 - Math.floor((now - Date.parse(startedAt)) / 1000)); const minutes = Math.floor(remaining / 60); const seconds = remaining % 60; return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`; }

function ServingsInput({ label, onCommit, value }: { label: string; onCommit: (value: number) => void; value: number }) {
  const [draft, setDraft] = useState(String(value));
  const commit = () => {
    const next = Number(draft);
    if (!Number.isFinite(next) || next < 0.5 || next > 50) {
      setDraft(String(value));
      return;
    }
    onCommit(next);
  };
  return (
    <label className="mt-1 flex items-center gap-3 text-sm text-stone-600">
      {label}
      <input className="focus-ring h-11 w-20 rounded-[4px] border border-stone-400 bg-[var(--surface-paper)] px-3" inputMode="decimal" max="50" min="0.5" onBlur={commit} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} step="0.5" type="number" value={draft} />
    </label>
  );
}

const planCopy = {
  "zh-CN": { locale: "zh-CN", loading: "正在恢复今晚计划", eyebrow: "从决定到上桌", title: "把今晚这餐安排清楚", summary: (items: number, minutes: number) => `${items} 项料理，预计协调 ${formatDuration(minutes, "zh-CN")}。计划只保存在这台设备的浏览器中。`, items: "今晚的料理", servings: "份数", remove: "移除", share: "复制分享链接", copied: "分享链接已复制。链接只包含公开料理和份数。", shareFailed: "无法复制分享链接，请稍后重试。", clear: "清空计划", views: "计划视图", viewLabels: { shopping: "购物清单", timeline: "准备时间线", cook: "烹饪模式" }, shopping: "需要准备什么", timeline: "什么时候做什么", cook: "一步一步完成", cookNote: "勾选状态和计时仅保存在当前浏览器。关闭页面后可以继续。", cue: "完成信号", startTimer: (minutes: number) => `开始 ${minutes} 分钟计时`, stopTimer: "停止计时", minute: (value: number) => value === 0 ? "现在" : `${value} 分钟后`, duration: (value: number) => `约 ${formatDuration(value, "zh-CN")}`, taskKinds: { active: "主动操作", wait: "等待", "prepare-ahead": "提前准备", serve: "上桌" }, emptyEyebrow: "今晚计划", emptyTitle: "还没有安排这顿饭", emptyBody: "先从今晚的推荐、任意料理详情或一份搭配开始。", decide: "决定今晚吃什么", shareWarning: "分享链接无效或包含未发布料理，已安全忽略。", storageWarning: "旧计划或本地数据无法安全读取，已忽略；没有上传任何内容。", planLimitWarning: "今晚计划最多包含 8 项料理。新料理尚未加入。", catalogErrorTitle: "暂时无法恢复计划", catalogErrorBody: "料理仍保存在这个浏览器中，但当前无法载入所需资料。请重试。", retry: "重试" },
  en: { locale: "en", loading: "Restoring tonight's plan", eyebrow: "From decision to table", title: "Make tonight's meal manageable", summary: (items: number, minutes: number) => `${items} ${items === 1 ? "item" : "items"}, about ${formatDuration(minutes, "en")} to coordinate. This plan stays in this browser on this device.`, items: "Tonight's items", servings: "Servings", remove: "Remove", share: "Copy share link", copied: "Share link copied. It contains only public items and servings.", shareFailed: "The share link could not be copied. Please try again.", clear: "Clear plan", views: "Plan views", viewLabels: { shopping: "Shopping list", timeline: "Preparation timeline", cook: "Cooking mode" }, shopping: "What to get ready", timeline: "What happens when", cook: "Cook step by step", cookNote: "Checks and timers stay in this browser. You can continue after closing the page.", cue: "Done when", startTimer: (minutes: number) => `Start ${minutes} min timer`, stopTimer: "Stop timer", minute: (value: number) => value === 0 ? "Now" : `In ${value} min`, duration: (value: number) => `About ${formatDuration(value, "en")}`, taskKinds: { active: "Active", wait: "Wait", "prepare-ahead": "Prepare ahead", serve: "Serve" }, emptyEyebrow: "Tonight's plan", emptyTitle: "Nothing is planned yet", emptyBody: "Start from tonight's recommendations, any culinary detail, or a meal pairing.", decide: "Decide tonight", shareWarning: "This share link is invalid or contains an unpublished item, so it was safely ignored.", storageWarning: "An older or invalid local plan could not be read safely and was ignored. Nothing was uploaded.", planLimitWarning: "Tonight's plan supports up to 8 items. The new item was not added.", catalogErrorTitle: "The plan could not be restored", catalogErrorBody: "Your items are still in this browser, but their planning details could not be loaded. Please try again.", retry: "Try again" },
} as const;

function formatDuration(minutes: number, locale: SupportedLocale): string {
  if (minutes < 60) return locale === "zh-CN" ? `${minutes} 分钟` : `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (locale === "zh-CN") return remainder ? `${hours} 小时 ${remainder} 分钟` : `${hours} 小时`;
  const hourLabel = `${hours} ${hours === 1 ? "hour" : "hours"}`;
  return remainder ? `${hourLabel} ${remainder} minutes` : hourLabel;
}
