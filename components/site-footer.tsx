import Link from "next/link";
import type { SupportedLocale } from "@/types/localization";
import { getLocalizedPath } from "@/lib/localization";
import { getMessages } from "@/lib/messages";
import { BETA_FEEDBACK_URL, REPOSITORY_URL } from "@/lib/site";

export function SiteFooter({ locale }: { locale: SupportedLocale }) {
  const messages = getMessages(locale);
  return (
    <footer className="border-t border-stone-300 bg-[#f2f0e8] px-5 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-base font-bold text-stone-950">Cooking Lab</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">{messages.footer.disclaimer}</p>
        </div>
        <nav aria-label={messages.footer.label} className="flex flex-col gap-3 text-sm font-semibold text-[#235849]">
          <Link className="focus-ring inline-flex min-h-11 items-center hover:underline" href={getLocalizedPath(locale, "/stories")}>
            {messages.footer.stories}
          </Link>
          <Link className="focus-ring inline-flex min-h-11 items-center hover:underline" href={getLocalizedPath(locale, "/recipes")}>
            {messages.footer.recipes}
          </Link>
          <a className="focus-ring inline-flex min-h-11 items-center hover:underline" href={BETA_FEEDBACK_URL} rel="noreferrer" target="_blank">
            {messages.footer.feedback}
          </a>
          <a className="focus-ring inline-flex min-h-11 items-center hover:underline" href={REPOSITORY_URL} rel="noreferrer" target="_blank">
            {messages.footer.repository}
          </a>
        </nav>
      </div>
    </footer>
  );
}
