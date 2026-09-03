import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";

export default function NotFound() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-4xl px-5 py-20 sm:py-28">
        <p className="text-sm font-semibold tracking-[.18em] text-emerald-700">NOT FOUND</p>
        <h1 className="mt-3 text-4xl font-bold text-stone-900 sm:text-5xl">这个菜谱不存在</h1>
        <p className="mt-4 max-w-2xl leading-7 text-stone-600">
          你访问的链接可能已经失效，或者这个 slug 并不在当前 30 道公开 Beta 菜谱中。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-5 font-semibold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            返回料理决策首页
          </Link>
          <Link
            href="/recipes"
            className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 px-5 font-semibold text-stone-800 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500"
          >
            浏览全部菜谱
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
