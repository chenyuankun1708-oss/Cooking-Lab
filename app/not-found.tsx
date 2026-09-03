import Link from "next/link";
import { BetaFooter } from "@/components/beta-footer";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col">
      <section className="flex flex-1 items-center px-5 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-[.18em] text-emerald-700">404 · RECIPE NOT FOUND</p>
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">这个菜谱不存在</h1>
          <p className="mt-4 leading-7 text-stone-600">链接可能已经失效，或者这道料理尚未进入 Cooking Lab。</p>
          <nav aria-label="未找到页面导航" className="mt-8 flex flex-wrap justify-center gap-3">
            <Link className="inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-5 font-semibold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" href="/recipes">浏览全部菜谱</Link>
            <Link className="inline-flex min-h-11 items-center rounded-xl border border-emerald-700 px-5 font-semibold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" href="/">返回料理决策首页</Link>
          </nav>
        </div>
      </section>
      <BetaFooter />
    </main>
  );
}
