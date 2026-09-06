import Link from "next/link";
import type { CulinaryCatalogEntry } from "@/lib/culinary-exploration";
import { appendQueryToHref } from "@/lib/decision-context-navigation";
import type { SupportedLocale } from "@/types/localization";
import { RecipeImage } from "./recipe-image";

export function CulinaryCard({
  entry,
  featured = false,
  locale,
  query,
}: {
  entry: CulinaryCatalogEntry;
  featured?: boolean;
  locale: SupportedLocale;
  query?: URLSearchParams;
}) {
  const href = query ? appendQueryToHref(entry.href, query) : entry.href;
  const facts = [entry.placeLabel, entry.techniqueLabel, entry.preparationLabel].filter((value): value is string => Boolean(value));
  return (
    <article className={`editorial-card group min-w-0 pt-4 ${featured ? "sm:col-span-2" : ""}`}>
      <Link
        aria-label={locale === "zh-CN" ? `查看${entry.name}` : `View ${entry.name}`}
        className="focus-ring block"
        href={href}
      >
        <div className="overflow-hidden rounded-[4px] bg-stone-200">
          <RecipeImage
            image={entry.image}
            fallbackInitial={entry.fallbackInitial}
            fallbackLabel={entry.name}
            alt={entry.name}
            variant="card"
          />
        </div>
        <div className="pb-6 pt-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[var(--muted)]">
            <span className="text-[var(--tomato)]">{entry.itemTypeLabel}</span>
            {entry.hasStory ? <span>{locale === "zh-CN" ? "含故事" : "Story included"}</span> : null}
          </div>
          <h3 className="mt-2 text-2xl leading-tight text-stone-950 group-hover:text-[var(--tomato)]">{entry.name}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">{entry.description}</p>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[var(--line)] pt-3 text-xs text-stone-600">
            {facts.slice(0, 2).map((fact) => <span key={fact}>{fact}</span>)}
            {entry.flavorLabel ? <span className="col-span-2 text-stone-800">{entry.flavorLabel}</span> : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
