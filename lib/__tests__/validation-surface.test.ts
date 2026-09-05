import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import ValidationPage, { generateMetadata } from "../../app/[locale]/validation/page";
import { BETA_FEEDBACK_URL, M8_VALIDATION_FEEDBACK_URL, SITE_URL } from "../site";
import { validationCopy } from "../validation-copy";

type IssueFormField = {
  type: string;
  id?: string;
  attributes?: {
    label?: string;
    description?: string;
    options?: Array<string | { label: string; required?: boolean }>;
  };
  validations?: { required?: boolean };
};

type IssueForm = {
  name: string;
  description: string;
  body: IssueFormField[];
};

const cjk = /[\u3400-\u9fff]/;
const english = /[A-Za-z]/;

describe("M8 validation surface", () => {
  it("renders localized study boundaries and both feedback destinations", async () => {
    for (const locale of ["zh-CN", "en"] as const) {
      const copy = validationCopy[locale];
      const markup = renderToStaticMarkup(await ValidationPage({ params: Promise.resolve({ locale }) }));
      const hrefs = [...markup.matchAll(/href="([^"]+)"/g)].map((match) => match[1].replaceAll("&amp;", "&"));

      expect(markup).toContain(copy.heading);
      expect(markup).toContain(copy.studyState);
      expect(markup).toContain(copy.publicNotice);
      expect(markup).toContain(copy.startCta);
      expect(markup).toContain(copy.supplementalCta);
      expect(hrefs).toContain(`/${locale}#decide`);
      expect(hrefs).toContain(M8_VALIDATION_FEEDBACK_URL);
      expect(hrefs).toContain(BETA_FEEDBACK_URL);
    }
  });

  it("publishes localized metadata, canonical URLs, and both hreflang alternates", async () => {
    for (const locale of ["zh-CN", "en"] as const) {
      const metadata = await generateMetadata({ params: Promise.resolve({ locale }) });
      const languages = metadata.alternates?.languages as Record<string, string>;

      expect(metadata.title).toBe(validationCopy[locale].metadataTitle);
      expect(metadata.description).toBe(validationCopy[locale].metadataDescription);
      expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/${locale}/validation`);
      expect(languages["zh-CN"]).toBe(`${SITE_URL}/zh-CN/validation`);
      expect(languages.en).toBe(`${SITE_URL}/en/validation`);
    }
  });

  it("keeps the invited study and public supplemental feedback distinct in both locales", () => {
    for (const copy of Object.values(validationCopy)) {
      expect(copy.studyState).toMatch(/moderated|主持式/);
      expect(copy.studyState).toMatch(/supplemental|补充/);
      expect(copy.publicNotice).toMatch(/public|公开/);
      expect(copy.publicNotice).toMatch(/sensitive|敏感/);
      expect(copy.sessionFacts).toHaveLength(4);
      expect(copy.privacy).toHaveLength(4);
    }
  });

  it("structurally requires bilingual informed consent before public feedback fields", () => {
    const form = parse(readFileSync(join(process.cwd(), ".github/ISSUE_TEMPLATE/m8-validation-feedback.yml"), "utf8")) as IssueForm;
    const agreementIndex = form.body.findIndex((field) => field.id === "agreement");
    const agreement = form.body[agreementIndex];
    const options = agreement.attributes?.options as Array<{ label: string; required: boolean }>;

    expect(agreementIndex).toBeGreaterThanOrEqual(1);
    expect(agreement.type).toBe("checkboxes");
    expect(options).toHaveLength(6);
    expect(options.every((option) => option.required && cjk.test(option.label) && english.test(option.label))).toBe(true);
    expect(options.map((option) => option.label).join(" ")).toMatch(/improve Cooking Lab/);
    expect(options.map((option) => option.label).join(" ")).toMatch(/GitHub username/);
    expect(options.map((option) => option.label).join(" ")).toMatch(/not be fully deletable or withdrawable/);
    expect(options.map((option) => option.label).join(" ")).toMatch(/不会填写个人、医疗或其他敏感资料/);

    const responseFields = form.body.filter((field) => field.id && field.id !== "agreement");
    expect(responseFields.map((field) => field.id)).toEqual([
      "locale",
      "device",
      "cooking-frequency",
      "situation",
      "final-url",
      "decision-outcome",
      "explanation-trust",
      "pairing",
      "reuse-trigger",
    ]);
    expect(responseFields.every((field) => field.attributes?.label && cjk.test(field.attributes.label) && english.test(field.attributes.label))).toBe(true);
    expect(responseFields.slice(0, 4).every((field) => field.validations?.required)).toBe(true);
    expect(responseFields.slice(5).every((field) => field.validations?.required)).toBe(true);
    expect(responseFields.find((field) => field.id === "final-url")?.validations?.required).not.toBe(true);
    expect(JSON.stringify(form)).not.toMatch(/"label":"(Name|Email|Location|Diagnosis)/);
  });
});
