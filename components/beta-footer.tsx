import Link from "next/link";
import { BETA_DISCLAIMER, BETA_FEEDBACK_URL } from "@/lib/site";

export function BetaFooter({ showCatalogLink = false }: { showCatalogLink?: boolean }) {
  return (
    <footer className="border-t border-stone-200 px-5 py-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5">
        <p className="max-w-3xl text-sm leading-6 text-stone-600">{BETA_DISCLAIMER}</p>
        <nav aria-label="Beta 相关链接" className="flex flex-wrap gap-3">
          {showCatalogLink && <Link className="inline-flex min-h-11 items-center rounded-xl border border-emerald-700 px-4 font-semibold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" href="/recipes">浏览全部菜谱</Link>}
          <a className="inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-4 font-semibold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" href={BETA_FEEDBACK_URL} target="_blank" rel="noreferrer">提交 Beta 反馈<span className="sr-only">（在新窗口打开 GitHub）</span></a>
        </nav>
      </div>
    </footer>
  );
}
