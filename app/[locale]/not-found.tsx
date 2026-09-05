import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="min-h-screen bg-[#fbfaf6]">
      <header className="border-b border-stone-200 px-5 py-4">
        <Link className="focus-ring inline-flex min-h-11 items-center font-bold text-stone-950" href="/zh-CN">Cooking Lab</Link>
      </header>
      <section className="mx-auto max-w-4xl px-5 py-20 sm:py-28">
        <p className="text-sm font-semibold text-[#a64631]">页面未找到 · Page not found</p>
        <h1 className="mt-3 text-4xl font-bold text-stone-900 sm:text-5xl">这份内容暂时不在这里</h1>
        <p className="mt-4 max-w-2xl leading-7 text-stone-600">The link may have changed, or this content is not currently published.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/zh-CN" className="focus-ring inline-flex min-h-11 items-center rounded-md bg-[#235849] px-5 font-semibold text-white">返回中文首页</Link>
          <Link href="/en" className="focus-ring inline-flex min-h-11 items-center rounded-md border border-stone-300 px-5 font-semibold text-stone-800">English home</Link>
        </div>
      </section>
    </main>
  );
}
