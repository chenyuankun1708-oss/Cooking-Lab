import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buildLocaleAlternates } from "@/lib/locale-metadata";
import { getLocalizedPath, isSupportedLocale } from "@/lib/localization";
import { BETA_FEEDBACK_URL, M8_VALIDATION_FEEDBACK_URL } from "@/lib/site";
import { validationCopy } from "@/lib/validation-copy";
import type { SupportedLocale } from "@/types/localization";

export default async function ValidationPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = getLocale((await params).locale);
  const copy = validationCopy[locale];

  return (
    <main id="main-content">
      <SiteHeader locale={locale} currentPath={`/${locale}/validation`} />
      <header className="border-b border-stone-200 bg-[var(--surface-herb)] py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-sm font-semibold text-[#a64631]">{copy.eyebrow}</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-bold leading-tight text-stone-950 sm:text-6xl">
            {copy.heading}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-700">{copy.intro}</p>
          <p className="mt-6 max-w-3xl border-l-4 border-[#235849] pl-4 text-sm font-semibold leading-6 text-[#173f35]">
            {copy.studyState}
          </p>
        </div>
      </header>

      <section className="bg-[var(--surface-paper)] py-12 sm:py-16" aria-labelledby="invited-title">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold text-[#a64631]">01</p>
            <h2 id="invited-title" className="mt-2 text-3xl font-bold text-stone-950">{copy.invitedHeading}</h2>
            <p className="mt-4 max-w-2xl leading-7 text-stone-600">{copy.invitedBody}</p>
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {copy.sessionFacts.map((fact) => (
                <li key={fact} className="border-t border-stone-300 pt-3 leading-6 text-stone-700">{fact}</li>
              ))}
            </ul>
          </div>

          <aside className="border border-stone-300 bg-[var(--surface-canvas)] p-6 sm:p-8" aria-labelledby="eligibility-title">
            <h2 id="eligibility-title" className="text-xl font-bold text-stone-950">{copy.eligibilityHeading}</h2>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-stone-700">
              {copy.eligibility.map((item) => <li key={item}>— {item}</li>)}
            </ul>
          </aside>
        </div>
      </section>

      <section className="border-y border-stone-200 bg-[var(--surface-story)] py-12 sm:py-16" aria-labelledby="privacy-title">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-sm font-semibold text-[#a64631]">02</p>
          <h2 id="privacy-title" className="mt-2 text-3xl font-bold text-stone-950">{copy.privacyHeading}</h2>
          <ul className="mt-7 grid gap-5 md:grid-cols-2">
            {copy.privacy.map((item) => (
              <li key={item} className="border-t border-stone-400/70 pt-4 leading-7 text-stone-700">{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-[#173f35] py-12 text-white sm:py-16" aria-labelledby="start-title">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-sm font-semibold text-[#f4d98b]">03</p>
          <h2 id="start-title" className="mt-2 text-3xl font-bold sm:text-4xl">{copy.startHeading}</h2>
          <p className="mt-4 max-w-2xl leading-7 text-white/78">{copy.startBody}</p>
          <Link
            className="focus-ring mt-7 inline-flex min-h-11 items-center bg-[#f4d98b] px-5 py-3 text-sm font-bold text-[#173f35] hover:bg-white"
            href={`${getLocalizedPath(locale)}#decide`}
          >
            {copy.startCta}
          </Link>
        </div>
      </section>

      <section className="bg-[var(--surface-paper)] py-12 sm:py-16" aria-labelledby="supplemental-title">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-sm font-semibold text-[#a64631]">04</p>
          <h2 id="supplemental-title" className="mt-2 text-3xl font-bold text-stone-950">{copy.supplementalHeading}</h2>
          <p className="mt-4 max-w-3xl leading-7 text-stone-600">{copy.supplementalBody}</p>
          <div className="mt-7 border-l-4 border-[#b94e35] bg-[#fbf3ea] p-5 text-sm leading-6 text-stone-700">
            {copy.publicNotice}
          </div>
          <div className="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <a
              className="focus-ring inline-flex min-h-11 items-center bg-[#235849] px-5 py-3 text-sm font-bold text-white hover:bg-[#173f35]"
              href={M8_VALIDATION_FEEDBACK_URL}
              rel="noreferrer"
              target="_blank"
            >
              {copy.supplementalCta}
            </a>
            <a className="focus-ring inline-flex min-h-11 items-center py-3 text-sm font-semibold text-[#235849] hover:underline" href={BETA_FEEDBACK_URL} rel="noreferrer" target="_blank">
              {copy.generalFeedback}
            </a>
          </div>
        </div>
      </section>

      <SiteFooter locale={locale} />
    </main>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = getLocale((await params).locale);
  const copy = validationCopy[locale];
  return {
    title: copy.metadataTitle,
    description: copy.metadataDescription,
    alternates: buildLocaleAlternates(locale, "/validation"),
  };
}

function getLocale(value: string): SupportedLocale {
  if (!isSupportedLocale(value)) notFound();
  return value;
}
