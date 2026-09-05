import Link from "next/link";
import { RecipeImage } from "./recipe-image";
import type { CulinaryItemSummary } from "@/lib/story-experience";

export function CulinarySummaryCard({ item }: { item: CulinaryItemSummary }) {
  return (
    <article className="group h-full overflow-hidden rounded-lg border border-stone-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_12px_30px_rgba(41,37,31,0.09)]">
      <Link className="focus-ring flex h-full flex-col rounded-lg" href={item.href}>
        <RecipeImage fallbackInitial={item.fallbackInitial} fallbackLabel={item.name} image={item.image} variant="card" />
        <div className="flex flex-1 flex-col p-5">
          <p className="text-xs font-semibold text-[#a64631]">{[item.itemTypeLabel, item.placeLabel].filter(Boolean).join(" · ")}</p>
          <h3 className="mt-2 text-xl font-bold leading-snug text-stone-950 group-hover:underline">{item.name}</h3>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-600">{item.description}</p>
          <p className="mt-auto pt-5 text-sm font-semibold text-[#235849]">走进这道料理</p>
        </div>
      </Link>
    </article>
  );
}
