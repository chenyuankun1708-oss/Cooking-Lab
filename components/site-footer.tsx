import Link from "next/link";
import { BETA_DISCLAIMER, BETA_FEEDBACK_URL, REPOSITORY_URL } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-300 bg-[#f2f0e8] px-5 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-base font-bold text-stone-950">Cooking Lab</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">{BETA_DISCLAIMER}</p>
        </div>
        <nav aria-label="页脚导航" className="flex flex-col gap-3 text-sm font-semibold text-[#235849]">
          <Link className="focus-ring inline-flex min-h-11 items-center hover:underline" href="/recipes">
            浏览 100 道料理
          </Link>
          <a className="focus-ring inline-flex min-h-11 items-center hover:underline" href={BETA_FEEDBACK_URL} rel="noreferrer" target="_blank">
            提交 Beta 反馈
          </a>
          <a className="focus-ring inline-flex min-h-11 items-center hover:underline" href={REPOSITORY_URL} rel="noreferrer" target="_blank">
            查看 GitHub 仓库
          </a>
        </nav>
      </div>
    </footer>
  );
}
