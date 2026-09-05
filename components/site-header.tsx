import Link from "next/link";
import { BETA_FEEDBACK_URL } from "@/lib/site";

export function SiteHeader({ active, inverse = false }: { active?: "home" | "recipes" | "stories"; inverse?: boolean }) {
  const textClass = inverse ? "text-white" : "text-stone-950";
  const mutedClass = inverse ? "text-white/82 hover:text-white" : "text-stone-600 hover:text-stone-950";

  return (
    <header className={`relative z-20 border-b ${inverse ? "border-white/25" : "border-stone-200 bg-[#fbfaf6]"}`}>
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6">
        <Link className={`focus-ring inline-flex min-h-11 items-center text-base font-bold ${textClass}`} href="/">
          Cooking Lab
        </Link>
        <nav aria-label="主导航" className={`flex items-center gap-5 text-sm font-semibold ${mutedClass}`}>
          <Link aria-current={active === "home" ? "page" : undefined} className="focus-ring inline-flex min-h-11 items-center hover:underline" href="/">
            首页
          </Link>
          <Link aria-current={active === "recipes" ? "page" : undefined} className="focus-ring inline-flex min-h-11 items-center hover:underline" href="/recipes">
            料理
          </Link>
          <Link aria-current={active === "stories" ? "page" : undefined} className="focus-ring inline-flex min-h-11 items-center hover:underline" href="/stories">
            故事
          </Link>
          <a className="focus-ring min-h-11 items-center hover:underline md:inline-flex" href={BETA_FEEDBACK_URL} rel="noreferrer" target="_blank">
            Beta 反馈
          </a>
        </nav>
      </div>
    </header>
  );
}
