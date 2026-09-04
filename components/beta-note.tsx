import { BETA_DISCLAIMER } from "@/lib/site";

export function BetaNote({ title = "Public Beta 说明" }: { title?: string }) {
  return (
    <section
      aria-labelledby="beta-note-title"
      className="border-l-4 border-[#e5bd53] bg-[#fff9e8] px-4 py-4 text-sm text-stone-700 sm:px-5"
    >
      <p className="text-xs font-semibold text-amber-900">PUBLIC BETA</p>
      <h2 id="beta-note-title" className="mt-1 text-lg font-semibold text-stone-900">
        {title}
      </h2>
      <p className="mt-2 leading-6">{BETA_DISCLAIMER}</p>
    </section>
  );
}
