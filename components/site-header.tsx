import Link from "next/link";
import type { SupportedLocale } from "@/types/localization";
import { getAlternateLocale, getLocalizedPath, replacePathLocale } from "@/lib/localization";
import { getMessages } from "@/lib/messages";

export function SiteHeader({ active, inverse = false, locale, currentPath, query }: { active?: "home" | "recipes" | "stories"; inverse?: boolean; locale: SupportedLocale; currentPath: string; query?: string }) {
  const textClass = inverse ? "text-white" : "text-stone-950";
  const mutedClass = inverse ? "text-white/82 hover:text-white" : "text-stone-600 hover:text-stone-950";
  const messages = getMessages(locale);
  const alternate = getAlternateLocale(locale);

  return (
    <header className={`relative z-20 border-b ${inverse ? "border-white/25" : "border-[var(--line)] bg-[var(--surface-paper)]"}`}>
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6">
        <Link className={`focus-ring inline-flex min-h-11 shrink-0 items-center text-base font-bold ${textClass}`} href={getLocalizedPath(locale)}>
          Cooking Lab
        </Link>
        <nav aria-label={messages.nav.label} className={`flex min-w-0 items-center gap-2 text-sm font-semibold sm:gap-4 ${mutedClass}`}>
          <span className="sr-only">{messages.locale.current}</span>
          <Link aria-current={active === "home" ? "page" : undefined} className="focus-ring hidden min-h-11 items-center hover:underline sm:inline-flex" href={getLocalizedPath(locale)}>
            {messages.nav.home}
          </Link>
          <Link aria-current={active === "recipes" ? "page" : undefined} className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center hover:underline" href={getLocalizedPath(locale, "/recipes")}>
            {messages.nav.recipes}
          </Link>
          <Link className="focus-ring hidden min-h-11 items-center hover:underline md:inline-flex" href={`${getLocalizedPath(locale)}#decide`}>
            {messages.nav.decide}
          </Link>
          <Link
            aria-label={messages.locale.switchLabel}
            className={`focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-[4px] border px-2 ${inverse ? "border-white/55 text-white" : "border-stone-300 text-stone-800"}`}
            href={replacePathLocale(currentPath, alternate, query)}
            hrefLang={alternate}
            lang={alternate}
          >
            {alternate === "en" ? "EN" : "中"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
