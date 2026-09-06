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
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold text-[var(--tomato)]">
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
    <article className="editorial-card group h-full pt-4">
      <Link className="focus-ring flex h-full flex-col" href={story.href}>
        <RecipeImage
          fallbackInitial={story.fallbackInitial}
          fallbackLabel={story.relatedItemName}
          image={story.image}
          variant="card"
          alt={story.relatedItemName}
        />
        <div className="flex flex-1 flex-col pb-6 pt-4">
          <p className="text-xs font-semibold text-[var(--tomato)]">{story.typeLabel} / {story.relatedItemName}</p>
          <h3 className="mt-2 text-xl font-bold leading-snug text-stone-950 group-hover:underline">{story.title}</h3>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">{story.dek}</p>
          <p className="mt-auto pt-5 text-sm font-semibold text-stone-800">{story.readingTimeLabel} / {messages.stories.openItem}</p>
        </div>
      </Link>
    </article>
  );
}
