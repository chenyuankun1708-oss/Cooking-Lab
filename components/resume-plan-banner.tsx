"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLocalizedPath } from "@/lib/localization";
import { parseMealPlanLocalState } from "@/lib/meal-plan-codec";
import type { SupportedLocale } from "@/types/localization";

export function ResumePlanBanner({ locale }: { locale: SupportedLocale }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const state = parseMealPlanLocalState(window.localStorage.getItem("cooking-lab:meal-plan:v1"));
    queueMicrotask(() => { if (!cancelled) setCount(state?.plan.selections.length ?? 0); });
    return () => { cancelled = true; };
  }, []);
  if (!count) return null;
  return (
    <aside className="border-b border-[var(--line)] bg-[var(--surface-story)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div><p className="font-bold text-stone-950">{locale === "zh-CN" ? "今晚的计划还在这里" : "Tonight's plan is still here"}</p><p className="mt-1 text-sm text-stone-600">{locale === "zh-CN" ? `已安排 ${count} 项料理，购物与步骤状态保存在当前浏览器。` : `${count} items planned. Shopping and cooking progress stay in this browser.`}</p></div>
        <Link className="focus-ring inline-flex min-h-11 shrink-0 items-center font-bold text-[var(--tomato)] hover:underline" href={getLocalizedPath(locale, "/plan")}>{locale === "zh-CN" ? "继续计划" : "Continue plan"}</Link>
      </div>
    </aside>
  );
}
