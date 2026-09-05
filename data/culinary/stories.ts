import type { Story } from "@/types/culinary";
import type { TranslationSet } from "@/types/localization";

const reviewed = <T>(value: T): TranslationSet<T> => ({
  defaultLocale: "zh-CN",
  entries: [{ locale: "zh-CN", status: "reviewed", value }],
});

export const culinaryStories = [
  {
    id: "dongpo-pork-name-and-attribution",
    type: "people",
    content: reviewed({
      title: "名字比“发明者”更确定",
      body: "东坡肉与苏轼的名字长期相连，但研究材料提醒我们：人物关联、菜名出现与今天的做法并不是同一件事。把它写成一位名人瞬间发明的故事，会抹掉后来的传播与再叙述。",
    }),
    claims: [{
      id: "dongpo-pork-direct-invention-disputed",
      kind: "disputed-attribution",
      content: reviewed({ statement: "现有材料支持东坡肉与苏轼的长期关联，但不足以确认他直接发明了今天所称的东坡肉。" }),
      evidenceIds: ["dongpo-naming-chronology", "dongpo-later-narratives"],
    }],
    relatedEntities: [{ type: "culinary-item", id: "dongpo-pork" }, { type: "person", id: "su-shi" }],
  },
  {
    id: "tomyum-kung-documented-practice",
    type: "place-food-culture",
    content: reviewed({
      title: "被记录下来的河畔饮食知识",
      body: "冬阴功的酸、辣与香草层次不仅是一张配方表，也连接着食材辨识、家庭传承与地方水域环境。这里采用 UNESCO 名录所记录的社区语境，不把它扩大成唯一发源地或精确发明年代。",
    }),
    claims: [{
      id: "tomyum-kung-central-plains-tradition",
      kind: "documented-tradition",
      content: reviewed({ statement: "UNESCO 的 2024 年名录记录将冬阴功描述为泰国传统虾汤，并记载泰国中部平原河畔社区的相关知识与实践。" }),
      evidenceIds: ["tomyum-unesco-tradition"],
    }],
    relatedEntities: [{ type: "culinary-item", id: "tomyum-kung" }, { type: "place", id: "thailand-central-plains" }],
  },
  {
    id: "espresso-developed-through-stages",
    type: "historical-development",
    content: reviewed({
      title: "一杯由机器与实践共同演进的咖啡",
      body: "Espresso 不是一套从诞生起就固定不变的参数。早期机器、后续压力系统与今天的专业实践分属不同阶段；把它理解为持续演进的制作体系，比寻找一个唯一发明时刻更准确。",
    }),
    claims: [{
      id: "espresso-multi-stage-development",
      kind: "documented-fact",
      content: reviewed({ statement: "Espresso 的设备发展与专业定义经历了多个阶段，不能简化为一个人完成且从未变化的单次发明。" }),
      evidenceIds: ["espresso-machine-chronology", "espresso-definition-change"],
    }],
    relatedEntities: [{ type: "culinary-item", id: "espresso" }, { type: "technique", id: "pressure-extraction" }],
  },
  {
    id: "longjing-within-living-tea-practice",
    type: "technique",
    content: reviewed({
      title: "一杯茶背后的地方知识",
      body: "龙井的冲泡从水温、投茶量到叶片舒展都能被观察，而茶叶本身又属于更广阔的中国地方性制茶与饮茶知识。这里记录的是仍在传承的实践，不把名录认定误写成某种唯一正统。",
    }),
    claims: [{
      id: "china-tea-processing-living-practice",
      kind: "documented-tradition",
      content: reviewed({ statement: "UNESCO 的 2022 年名录记录了中国各地因环境与习俗形成的制茶、饮茶和分享茶的相关知识与实践。" }),
      evidenceIds: ["china-tea-processing-tradition"],
    }],
    relatedEntities: [{ type: "culinary-item", id: "longjing-green-tea" }, { type: "technique", id: "tea-processing" }],
  },
  {
    id: "sake-making-with-koji",
    type: "technique",
    content: reviewed({
      title: "成品之外的制酒知识",
      body: "一瓶清酒到达餐桌前，关键工作发生在生产者端。米、米曲与水的处理依靠长期积累的判断与协作，因此这个条目只给饮用提示，不伪造消费者“烹饪步骤”。",
    }),
    claims: [{
      id: "sake-koji-making-documented-tradition",
      kind: "documented-tradition",
      content: reviewed({ statement: "UNESCO 的 2024 年名录记录将使用米曲的传统清酒酿造知识与技能列为日本的活态文化实践。" }),
      evidenceIds: ["japan-sake-koji-tradition"],
    }],
    relatedEntities: [{ type: "culinary-item", id: "junmai-sake" }, { type: "technique", id: "koji-fermentation" }],
  },
  {
    id: "fino-aged-under-flor",
    type: "technique",
    content: reviewed({
      title: "酒花膜下的生物熟成",
      body: "Fino 的干爽与轻盈来自生产阶段，而不是家庭调配。官方产区资料把酒花膜下熟成作为这一风格的关键线索；公开条目因此聚焦识别和服务方式，不把酒类包装成健康建议。",
    }),
    claims: [{
      id: "fino-biological-ageing-under-flor",
      kind: "documented-fact",
      content: reviewed({ statement: "Jerez-Xeres-Sherry 产区的官方资料说明，Fino 在酒花酵母形成的表层之下进行生物熟成。" }),
      evidenceIds: ["fino-flor-biological-ageing"],
    }],
    relatedEntities: [{ type: "culinary-item", id: "fino-sherry" }, { type: "technique", id: "biological-ageing" }],
  },
] as const satisfies readonly Story[];
