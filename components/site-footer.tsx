import Link from "next/link";
import { BETA_DISCLAIMER, BETA_FEEDBACK_URL, REPOSITORY_URL } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 px-5 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-stone-900">Cooking Lab Public Beta</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">{BETA_DISCLAIMER}</p>
        </div>
        <nav aria-label="页脚导航" className="flex flex-col gap-2 text-sm font-semibold text-emerald-700">
          <Link className="underline-offset-4 hover:underline" href="/recipes">
            浏览全部菜谱
          </Link>
          <a className="underline-offset-4 hover:underline" href={BETA_FEEDBACK_URL} rel="noreferrer" target="_blank">
            提交 Beta 反馈
          </a>
          <a className="underline-offset-4 hover:underline" href={REPOSITORY_URL} rel="noreferrer" target="_blank">
            查看 GitHub 仓库
          </a>
        </nav>
      </div>
    </footer>
  );
}
