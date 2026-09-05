import Link from "next/link";
import { RecipeImage } from "./recipe-image";
import type { StoryPreview } from "@/lib/story-experience";
import type { SupportedLocale } from "@/types/localization";
import { getMessages } from "@/lib/messages";

export function StoryCard({ story, featured = false, locale }: { story: StoryPreview; featured?: boolean; locale: SupportedLocale }) {
  const messages = getMessages(locale);
  if (featured) {
    return (
      <article className="border-y border-stone-300 py-6 sm:py-8">
        <Link className="focus-ring group block" href={story.href}>
          <RecipeImage
            fallbackInitial={story.fallbackInitial}
            fallbackLabel={story.relatedItemName}
            image={story.image}
            variant="hero"
            showAttribution={false}
            alt={story.relatedItemName}
          />
          <div className="mx-auto max-w-4xl pt-6 sm:pt-8">
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold text-[#a64631]">
              <span>{story.typeLabel}</span>
              <span className="text-stone-500">{story.relatedItemName}</span>
              <span className="text-stone-500">{story.readingTimeLabel}</span>
            </div>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-stone-950 group-hover:underline sm:text-5xl">{story.title}</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-stone-600 sm:text-lg">{story.dek}</p>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group h-full overflow-hidden rounded-lg border border-stone-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_12px_30px_rgba(41,37,31,0.09)]">
      <Link className="focus-ring flex h-full flex-col rounded-lg" href={story.href}>
        <RecipeImage
          fallbackInitial={story.fallbackInitial}
          fallbackLabel={story.relatedItemName}
          image={story.image}
          variant="card"
          alt={story.relatedItemName}
        />
        <div className="flex flex-1 flex-col p-5">
          <p className="text-xs font-semibold text-[#a64631]">{story.typeLabel} · {story.relatedItemName}</p>
          <h3 className="mt-2 text-xl font-bold leading-snug text-stone-950 group-hover:underline">{story.title}</h3>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">{story.dek}</p>
          <p className="mt-auto pt-5 text-sm font-semibold text-[#235849]">{story.readingTimeLabel} · {messages.stories.openItem}</p>
        </div>
      </Link>
    </article>
  );
}
