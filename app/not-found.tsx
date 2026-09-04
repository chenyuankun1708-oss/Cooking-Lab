import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <main id="main-content" className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-5 py-20 sm:py-28">
        <p className="text-sm font-semibold text-[#a64631]">没有找到这道料理</p>
        <h1 className="mt-3 text-4xl font-bold text-stone-900 sm:text-5xl">这个菜谱不存在</h1>
        <p className="mt-4 max-w-2xl leading-7 text-stone-600">
          你访问的链接可能已经失效，或者这道料理还不在当前已发布内容中。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="focus-ring inline-flex min-h-11 items-center rounded-md bg-[#235849] px-5 font-semibold text-white hover:bg-[#173f35]"
          >
            返回料理决策首页
          </Link>
          <Link
            href="/recipes"
            className="focus-ring inline-flex min-h-11 items-center rounded-md border border-stone-300 px-5 font-semibold text-stone-800 hover:bg-white"
          >
            浏览全部菜谱
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
