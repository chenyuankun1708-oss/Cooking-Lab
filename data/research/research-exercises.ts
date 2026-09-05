import type { ResearchRecord } from "@/types/research";
import { culinaryEvidence } from "@/data/culinary/evidence";
import { culinarySources } from "@/data/culinary/sources";

const exerciseSourceIds = new Set([
  "wu-dongpo-pork-study",
  "unesco-tomyum-kung",
  "smithsonian-espresso-machine-history",
  "sca-changing-espresso-definition",
]);
const exerciseEvidenceIds = new Set([
  "dongpo-naming-chronology",
  "dongpo-later-narratives",
  "tomyum-unesco-tradition",
  "espresso-machine-chronology",
  "espresso-definition-change",
]);

export const researchExerciseSources = culinarySources.filter(({ id }) => exerciseSourceIds.has(id));
export const researchExerciseEvidence = culinaryEvidence.filter(({ id }) => exerciseEvidenceIds.has(id));

export const researchExercises = [
  {
    id: "dongpo-pork-attribution-exercise",
    templateId: "historical-person-attribution",
    question: "苏轼是否真的发明了东坡肉？",
    sourceDecisions: [
      {
        id: "accept-wu-study",
        disposition: "accepted",
        sourceId: "wu-dongpo-pork-study",
        rationale: "The historical study directly examines naming, chronology, and the later spread of the attribution.",
      },
      {
        id: "reject-unsourced-origin-retelling",
        disposition: "rejected",
        candidateName: "Unsourced travel and recipe-site origin retellings",
        reason: "weak-provenance",
        rationale: "They repeat a clean inventor story without identifying primary or scholarly support.",
      },
    ],
    claims: [{
      id: "dongpo-invention-attribution",
      statement: "东坡肉以苏轼之号命名并长期与他相关，但现有证据不足以确认他直接发明了今天所称的东坡肉。",
      kind: "disputed-attribution",
      disposition: "include",
      evidenceIds: ["dongpo-naming-chronology", "dongpo-later-narratives"],
      rationale: "The source supports association while challenging a simple direct-invention narrative.",
    }],
    unresolvedQuestions: ["Which extant Ming sources contain the earliest exact dish name?"],
    editorialDecision: "Safe wording must present the Su Shi connection as an attribution with contested direct invention, not as settled fact.",
    reviewer: "Cooking Lab editorial",
    reviewedAt: "2026-09-05",
    status: "closed",
  },
  {
    id: "tomyum-kung-culture-exercise",
    templateId: "story-culture",
    question: "冬阴功的历史与地区饮食背景可以可靠写到什么程度？",
    sourceDecisions: [
      {
        id: "accept-unesco-tomyum",
        disposition: "accepted",
        sourceId: "unesco-tomyum-kung",
        rationale: "The official inscription record identifies the recognized practice and its submitted community context.",
      },
      {
        id: "reject-exclusive-origin-claim",
        disposition: "rejected",
        candidateName: "Pages claiming one exact inventor or exclusive birthplace without citations",
        reason: "unreliable-claim",
        rationale: "The stronger source documents a tradition but does not establish those exclusive historical claims.",
      },
    ],
    claims: [{
      id: "tomyum-documented-tradition",
      statement: "UNESCO 的 2024 年名录记录将冬阴功描述为泰国传统虾汤，并记载了泰国中部平原河畔社区的相关知识与实践。",
      kind: "documented-tradition",
      disposition: "include",
      evidenceIds: ["tomyum-unesco-tradition"],
      rationale: "The wording attributes the geographic and cultural description to the institutional record.",
    }],
    unresolvedQuestions: ["What earlier Thai-language documentary sources establish the longer chronology?"],
    editorialDecision: "Publishable context may describe the documented tradition and inscription, but should not claim an exclusive origin or exact invention date.",
    reviewer: "Cooking Lab editorial",
    reviewedAt: "2026-09-05",
    status: "closed",
  },
  {
    id: "espresso-development-exercise",
    templateId: "coffee",
    question: "Espresso 应被描述为一次发明，还是持续演进的设备与冲煮体系？",
    sourceDecisions: [
      {
        id: "accept-smithsonian-espresso",
        disposition: "accepted",
        sourceId: "smithsonian-espresso-machine-history",
        rationale: "The edited historical overview identifies multiple technical contributors and stages.",
      },
      {
        id: "accept-sca-espresso",
        disposition: "accepted",
        sourceId: "sca-changing-espresso-definition",
        rationale: "The professional organization documents variation in present-day definitions and parameters.",
      },
      {
        id: "reject-single-inventor-summary",
        disposition: "rejected",
        candidateName: "Single-sentence inventor summaries without patent or historical context",
        reason: "weak-provenance",
        rationale: "They collapse machine patents, later pressure systems, and modern beverage practice into one claim.",
      },
    ],
    claims: [{
      id: "espresso-developed-in-stages",
      statement: "Espresso 的设备与冲煮定义经历了多个阶段的技术和专业实践演变，不能简化为一个人完成的、从未变化的单次发明。",
      kind: "documented-fact",
      disposition: "include",
      evidenceIds: ["espresso-machine-chronology", "espresso-definition-change"],
      rationale: "The sources independently address historical equipment development and changing professional definitions.",
    }],
    unresolvedQuestions: ["Which patent-office record should anchor the earliest machine claim in a future publishable Story?"],
    editorialDecision: "A future Story should separate early patents, later pressure-machine development, and current preparation norms.",
    reviewer: "Cooking Lab editorial",
    reviewedAt: "2026-09-05",
    status: "closed",
  },
] as const satisfies readonly ResearchRecord[];
