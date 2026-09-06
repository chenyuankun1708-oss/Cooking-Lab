import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buildLocaleAlternates } from "@/lib/locale-metadata";
import { getLocalizedPath, isSupportedLocale } from "@/lib/localization";
import type { SupportedLocale } from "@/types/localization";

export function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return params.then(({ locale }) => {
    if (!isSupportedLocale(locale)) return {};
    const copy = pageCopy[locale];
    return { title: copy.title, description: copy.intro, alternates: buildLocaleAlternates(locale, "/content-rights") };
  });
}

export default async function ContentRightsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: value } = await params;
  if (!isSupportedLocale(value)) notFound();
  const locale: SupportedLocale = value;
  const copy = pageCopy[locale];
  return (
    <main id="main-content">
      <SiteHeader active="recipes" currentPath={`/${locale}/content-rights`} locale={locale} query="" />
      <article className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 sm:pt-16">
        <p className="editorial-kicker">{copy.eyebrow}</p>
        <h1 className="mt-3 max-w-[14ch] text-5xl leading-[1.02] text-stone-950 sm:text-7xl">{copy.title}</h1>
        <p className="mt-7 max-w-3xl text-lg leading-8 text-stone-700">{copy.intro}</p>

        <div className="mt-14 grid gap-px bg-[var(--line)] sm:grid-cols-2">
          {copy.sections.map((section) => (
            <section className="bg-[var(--background)] p-6 sm:p-8" key={section.title}>
              <h2 className="text-2xl text-stone-950">{section.title}</h2>
              <p className="mt-4 leading-7 text-stone-600">{section.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-16 border-t border-[var(--line)] pt-8" aria-labelledby="rights-reference-title">
          <h2 id="rights-reference-title" className="text-3xl text-stone-950">{copy.referencesTitle}</h2>
          <p className="mt-4 max-w-3xl leading-7 text-stone-600">{copy.referencesIntro}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {officialReferences.map((reference) => (
              <li key={reference.url}>
                <a className="focus-ring inline-flex min-h-11 items-center font-bold text-[var(--tomato)] hover:underline" href={reference.url} rel="noreferrer" target="_blank">{reference.label}</a>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-14 border-y border-[var(--line)] py-6 text-sm leading-6 text-stone-600">{copy.legalNote}</p>
        <Link className="focus-ring mt-8 inline-flex min-h-11 items-center font-bold text-[var(--tomato)] hover:underline" href={getLocalizedPath(locale, "/recipes")}>{copy.back}</Link>
      </article>
      <SiteFooter locale={locale} />
    </main>
  );
}

const officialReferences = [
  { label: "U.S. Copyright Office — recipes and factual material", url: "https://www.copyright.gov/help/faq/faq-protect.html" },
  { label: "WIPO Lex — Copyright Law of the People's Republic of China", url: "https://www.wipo.int/wipolex/en/legislation/details/21065" },
  { label: "European Union — Database Directive", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:31996L0009" },
  { label: "United Kingdom — Database Regulations", url: "https://www.legislation.gov.uk/uksi/1997/3032/contents" },
  { label: "Creative Commons — license conditions", url: "https://creativecommons.org/share-your-work/cclicenses/" },
  { label: "USDA FoodData Central — API and data guide", url: "https://fdc.nal.usda.gov/api-guide.html" },
] as const;

const pageCopy = {
  "zh-CN": {
    eyebrow: "公开编辑政策",
    title: "内容来源与权利",
    intro: "Cooking Lab 把料理身份、做法、故事、营养、成本、图片与产品资料拆成可审计的内容块。每个公开块都必须具有明确来源边界、商业使用结论和必要署名。",
    sections: [
      { title: "事实与表达分开", body: "配料、时间、温度和历史事实可以用于独立综合；第三方菜谱文字、独特编排、故事叙述、字幕、图片和视频片段不会因为“可访问”就被复制。" },
      { title: "来源不等于复制许可", body: "标记为 reference-only 的网页或视频只用于事实核对。Cooking Lab 保存引用信息和可重新定位的证据，不保存整页、字幕、转录或候选图片。" },
      { title: "图片逐文件授权", body: "每张图片按原始文件页检查。CC BY 会展示作者与许可证；CC BY-SA 图片保持在独立资产文件边界并说明改动。含品牌、人物或场所的图片还需额外复核。" },
      { title: "估算保持诚实", body: "当前营养和成本是 Cooking Lab 的演示性编辑估算，不冒充 USDA 或零售数据库数据。未来导入外部数据时会记录数据集版本、记录 ID、换算方法和访问日期。" },
      { title: "餐厅、品牌与媒体", body: "没有书面许可时，不把内容称为官方餐厅配方，不使用 Logo、菜单图或营销文案，也不暗示品牌背书。视频默认只提供外部来源引用。" },
      { title: "AI 不能成为证据", body: "AI 输出不能证明历史事实或修复输入权利缺陷。任何未来 AI 内容都必须记录模型与条款版本、输入权利、人工审核、相似性和商标检查。" },
    ],
    referencesTitle: "采用的公开依据",
    referencesIntro: "工程门禁采用中国、美国、欧盟和英国的保守交集，并按许可证官方文本执行。",
    legalNote: "这是 Cooking Lab 的工程与编辑风险控制系统，不构成法律意见。正式收费、餐厅授权合作、酒类商业推广或大规模数据库导入前，仍需专业律师复核。",
    back: "返回料理库",
  },
  en: {
    eyebrow: "Public editorial policy",
    title: "Content sources and rights",
    intro: "Cooking Lab treats identity, preparation, stories, nutrition, cost, images, and product information as separately auditable artifacts. Every published artifact needs a clear source boundary, a commercial-use decision, and any required attribution.",
    sections: [
      { title: "Facts are not expression", body: "Ingredients, time, temperature, and historical facts can inform independent synthesis. Third-party recipe prose, distinctive arrangement, narrative, subtitles, images, and video clips are not copied simply because they are accessible." },
      { title: "A source is not a reuse license", body: "Reference-only pages and videos support factual cross-checking only. Cooking Lab stores citation data and retrievable Evidence, not full pages, subtitles, transcripts, or candidate images." },
      { title: "Images are cleared file by file", body: "Each image is checked at its original file page. CC BY credits creator and license; CC BY-SA images stay in an isolated asset-file boundary with modifications disclosed. Brands, people, and protected places need extra review." },
      { title: "Estimates remain honest", body: "Current nutrition and cost values are Cooking Lab demonstration editorial estimates; they are not represented as USDA or retailer-database data. Future imports must retain dataset version, record ID, conversion, and access date." },
      { title: "Restaurants, brands, and media", body: "Without written permission, Cooking Lab does not call content an official restaurant recipe, use logos or menu art, copy marketing prose, or imply endorsement. Video remains an external reference by default." },
      { title: "AI is never Evidence", body: "AI output cannot prove historical facts or repair an input-rights defect. Any future AI artifact needs recorded model and terms versions, input-rights review, human review, similarity review, and trademark review." },
    ],
    referencesTitle: "Public policy references",
    referencesIntro: "The engineering gate applies a conservative intersection of China, the United States, the European Union, and the United Kingdom and follows official license text.",
    legalNote: "This is an engineering and editorial risk-control system, not legal advice. Professional legal review remains required before charging users, restaurant partnerships, alcohol promotion, or large database imports.",
    back: "Back to the culinary library",
  },
} as const;
