import type { EmbeddedStoryModel } from "@/lib/story-experience";
import type { SupportedLocale } from "@/types/localization";

export function EmbeddedStories({ stories, locale }: { stories: EmbeddedStoryModel[]; locale: SupportedLocale }) {
  if (!stories.length) return null;
  const copy = locale === "zh-CN" ? zhCopy : enCopy;
  return (
    <section id="stories" className="scroll-mt-24 border-y border-[var(--line)] bg-[var(--surface-story)] py-14 sm:py-20" aria-labelledby="stories-heading">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 id="stories-heading" className="max-w-2xl text-3xl leading-tight text-stone-950 sm:text-5xl">{copy.heading}</h2>
        <div className="mt-10 space-y-16">
          {stories.map((story) => (
            <article id={story.anchorId} key={story.id} className="scroll-mt-24 border-t border-[var(--line)] pt-8">
              <p className="text-sm font-semibold text-[var(--tomato)]">{story.typeLabel}</p>
              <h3 className="mt-2 max-w-3xl text-3xl leading-tight text-stone-950 sm:text-4xl">{story.title}</h3>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-700">{story.dek}</p>
              <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
                <div className="space-y-8">
                  {story.sections.map((section) => (
                    <section key={section.heading}>
                      <h4 className="text-xl font-bold text-stone-950">{section.heading}</h4>
                      <div className="mt-3 space-y-4 leading-8 text-stone-700">
                        {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                      </div>
                    </section>
                  ))}
                </div>
                <aside className="h-fit border-l-2 border-[var(--tomato)] pl-5 text-sm leading-6 text-stone-700">
                  <h4 className="font-bold text-stone-950">{copy.evidence}</h4>
                  <p className="mt-2">{story.evidenceContext}</p>
                </aside>
              </div>
              {story.sources.length ? (
                <details className="mt-8 border-t border-[var(--line)] pt-3">
                  <summary className="focus-ring flex min-h-11 cursor-pointer items-center font-bold text-stone-950">{copy.sources(story.sources.length)}</summary>
                  <ol className="grid gap-5 pb-2 pt-4 sm:grid-cols-2">
                    {story.sources.map((source) => (
                      <li key={`${source.title}:${source.byline}`} className="text-sm leading-6 text-stone-600">
                        {source.href ? <a className="focus-ring inline-flex min-h-11 items-center font-bold text-[var(--tomato)] hover:underline" href={source.href} rel="noreferrer" target="_blank">{source.title}</a> : <p className="font-bold text-stone-950">{source.title}</p>}
                        <p className="mt-1">{source.byline}</p>
                        {source.locatorLabel ? <p className="mt-1 text-stone-500">{source.locatorLabel}</p> : null}
                      </li>
                    ))}
                  </ol>
                </details>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const zhCopy = { heading: "这道料理背后的故事", evidence: "证据边界", sources: (count: number) => `查看 ${count} 项来源` };
const enCopy = { heading: "The story within this item", evidence: "Evidence boundary", sources: (count: number) => `View ${count} sources` };
