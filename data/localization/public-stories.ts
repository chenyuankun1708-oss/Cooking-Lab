import type { StoryCopy } from "@/types/culinary";
import type { SupportedLocale, TranslationSet } from "@/types/localization";
import { resolveReviewedTranslation } from "@/lib/localization";

interface StoryEditorialTranslation {
  story: StoryCopy;
  claims: Record<string, string>;
}

const en = (value: StoryEditorialTranslation): TranslationSet<StoryEditorialTranslation> => ({
  defaultLocale: "en",
  entries: [{ locale: "en", status: "reviewed", value }],
});

export const storyTranslations: Readonly<Record<string, TranslationSet<StoryEditorialTranslation>>> = Object.freeze({
  "dongpo-pork-name-and-attribution": en({
    story: {
      title: "The name is firmer than the inventor story",
      dek: "Dongpo pork has long been tied to Su Shi, but a personal association, the appearance of a dish name, and the form cooked today are not the same claim.",
      sections: [
        { heading: "One name, several timelines", paragraphs: [
          "Research on Dongpo pork separates questions that are often collapsed together: whether Su Shi wrote about, cooked, or promoted ways of preparing pork; when the name Dongpo pork appeared; and when the dish familiar today took shape.",
          "The available material points to a slower process. Pork preparations associated with Su Shi may have existed, but they did not use today's dish name at the time. The name and the story moved closer together through later retellings.",
        ] },
        { heading: "Why this is not framed as a single invention", paragraphs: [
          "Later restaurant promotion and storytelling made the attribution more complete and memorable. That helps explain why the link between Su Shi and Dongpo pork is so durable, but it cannot be used backward as proof that he personally invented the present dish.",
          "A more accurate statement is that the dish is closely connected to Su Shi's name and later cultural memory, while direct authorship remains disputed.",
        ] },
        { heading: "Keep the story, and keep the question mark", paragraphs: [
          "A cultural story does not need to disappear because part of it is disputed. Separating documented connections, later narrative, and what remains uncertain reveals how a dish is retold across generations.",
        ] },
      ],
    },
    claims: { "dongpo-pork-direct-invention-disputed": "Available material supports a long association between Dongpo pork and Su Shi, but does not establish that he directly invented the dish known by that name today." },
  }),
  "tomyum-kung-documented-practice": en({
    story: {
      title: "Riverside food knowledge, placed on record",
      dek: "The sour, hot, aromatic layers of tom yum kung are more than a formula; they connect to ingredient knowledge and everyday practices in riverside communities of Thailand's Central Plains.",
      sections: [
        { heading: "What the inscription records", paragraphs: [
          "In its 2024 intangible cultural heritage inscription, UNESCO describes tom yum kung as a traditional Thai prawn soup and situates its knowledge and practice in riverside communities of the Central Plains.",
          "That lens shifts attention from a single fixed formula to knowledge that is used, adjusted, and passed on: recognizing aromatics, balancing sourness, heat, and savoriness, and working with ingredients shaped by a local environment.",
        ] },
        { heading: "A record is not a certificate of sole origin", paragraphs: [
          "The inscription supports the statement that this is a documented traditional practice. It does not automatically establish one birthplace, a first inventor, or an exact date. Those are separate historical questions requiring earlier and more specific evidence.",
        ] },
        { heading: "Back to the bowl", paragraphs: [
          "For a cook today, this context does not demand copying one supposedly definitive version. It is a reminder that the relationship among lemongrass, galangal, makrut lime leaf, and prawn is itself central culinary knowledge.",
        ] },
      ],
    },
    claims: { "tomyum-kung-central-plains-tradition": "UNESCO's 2024 inscription describes tom yum kung as a traditional Thai prawn soup and documents related knowledge and practices in riverside communities of Thailand's Central Plains." },
  }),
  "espresso-developed-through-stages": en({
    story: {
      title: "A coffee shaped by machines and practice",
      dek: "Espresso did not begin as one fixed set of parameters. Equipment, pressure, and generations of coffee practice developed it together.",
      sections: [
        { heading: "More than one machine", paragraphs: [
          "Reducing espresso to one person and one year leaves out the essential development. Early machines, later engineering changes, and still later pressure-extraction methods addressed different problems and did not arrive all at once.",
          "The Smithsonian's account traces several stages and participants. Together, those changes reshaped how coffee could be made quickly and altered the texture and flavor in the cup.",
        ] },
        { heading: "Definitions move too", paragraphs: [
          "Even after modern machines arrived, espresso did not become an unchanging answer. Specialty Coffee Association discussion of professional practice shows that dose, beverage yield, time, and the understanding of the finished drink vary across periods and communities.",
          "Modern recipe parameters are therefore better treated as repeatable starting points than as the only standard across every era.",
        ] },
        { heading: "Technical history in a cup", paragraphs: [
          "A small espresso concentrates pressure, flow, grinding, and barista judgment into seconds. Its history belongs not only to a machine, but to repeated revisions of what a good espresso can be.",
        ] },
      ],
    },
    claims: { "espresso-multi-stage-development": "Espresso equipment and professional definitions developed through multiple stages and cannot be reduced to one person's single, permanently fixed invention." },
  }),
  "longjing-within-living-tea-practice": en({
    story: {
      title: "Local knowledge behind a cup of tea",
      dek: "Water temperature, leaf quantity, and the way leaves open make a cup of Longjing an entry into wider living knowledge of making, drinking, and sharing tea.",
      sections: [
        { heading: "Begin with leaf and water", paragraphs: [
          "With Longjing, water that is too hot or an infusion that runs too long can make young leaves distinctly bitter. Watching the leaves open and the liquor turn pale yellow-green gives a concrete way to judge the brew.",
          "These actions are more than a set of numbers. They depend on reading tea, water, and the flavor in the present cup.",
        ] },
        { heading: "A wider living practice", paragraphs: [
          "UNESCO's 2022 inscription concerns knowledge and practices of making, drinking, and sharing tea that have formed across China in relation to local environments and customs. It provides a cultural context broader than the history of one tea.",
          "The inscription does not itself prove one origin, an earliest date, or a single orthodox way to brew Longjing. Here, Longjing is one doorway into a larger network of tea knowledge.",
        ] },
      ],
    },
    claims: { "china-tea-processing-living-practice": "UNESCO's 2022 inscription documents knowledge and practices of making, drinking, and sharing tea that have developed across China in relation to local environments and customs." },
  }),
  "sake-making-with-koji": en({
    story: {
      title: "Brewing knowledge before the bottle",
      dek: "The critical work behind a bottle of sake happens before it reaches the table. Rice, koji, and water are handled through a documented body of living knowledge.",
      sections: [
        { heading: "Preparation happens before the table", paragraphs: [
          "For someone opening a finished bottle, sake may require only a choice of cup and serving temperature. That does not mean it has no preparation process. Production belongs to the maker and should not be rewritten as a few invented steps for the consumer.",
        ] },
        { heading: "Documented koji-based brewing practice", paragraphs: [
          "UNESCO's 2024 inscription records traditional knowledge and skills of sake-making with koji mold in Japan as a living cultural practice. It supports the existence and transmission of that knowledge, not a single rule for the flavor or service of every bottle.",
          "Cooking Lab therefore keeps brewing knowledge in the story and opening-and-serving actions in guidance. The two timescales have different boundaries.",
        ] },
      ],
    },
    claims: { "sake-koji-making-documented-tradition": "UNESCO's 2024 inscription records traditional knowledge and skills of sake-making with koji mold in Japan as a living cultural practice." },
  }),
  "fino-aged-under-flor": en({
    story: {
      title: "Biological ageing under flor",
      dek: "Fino's dry, light character is created during production. Official appellation material identifies the layer formed by flor yeast as a key to understanding the style.",
      sections: [
        { heading: "Change at the surface of the wine", paragraphs: [
          "Official material from the Jerez-Xeres-Sherry appellation explains that Fino undergoes biological ageing beneath a layer of flor yeast. This is a specific production claim and a foundation for recognizing the style.",
          "For the consumer, this is not a mixing step to reproduce at home. It belongs to the wine's production before it reaches the glass.",
        ] },
        { heading: "From production knowledge to serving boundaries", paragraphs: [
          "Cooking Lab offers restrained context for recognition and service. It does not turn production methods into a home recipe or infer health benefits or drinking advice from the ageing process.",
        ] },
      ],
    },
    claims: { "fino-biological-ageing-under-flor": "Official material from the Jerez-Xeres-Sherry appellation states that Fino undergoes biological ageing beneath a layer formed by flor yeast." },
  }),
});

export function getLocalizedStoryTranslation(id: string, locale: SupportedLocale): StoryEditorialTranslation | undefined {
  if (locale === "zh-CN") return undefined;
  const translations = storyTranslations[id];
  return translations ? resolveReviewedTranslation(translations, locale)?.value : undefined;
}

export function hasCompleteStoryTranslation(id: string, locale: SupportedLocale, claimIds: readonly string[]): boolean {
  if (locale === "zh-CN") return true;
  const copy = getLocalizedStoryTranslation(id, locale);
  return Boolean(copy && copy.story.sections.length >= 2 && claimIds.every((claimId) => copy.claims[claimId]));
}
