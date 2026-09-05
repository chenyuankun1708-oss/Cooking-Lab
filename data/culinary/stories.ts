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
      dek: "东坡肉与苏轼的名字长期相连，但人物关联、菜名出现和今天的做法，并不是同一件事。",
      sections: [
        {
          heading: "一道名字，几层时间",
          paragraphs: [
            "关于东坡肉的研究把几个常被叠在一起的问题拆开：苏轼是否写过、做过或推广过猪肉做法，“东坡肉”这个名字何时出现，以及今天人们熟悉的菜品何时定型。",
            "现有材料指向一个更缓慢的过程：与苏轼有关的猪肉做法可能存在，但当时并不使用今天的菜名。名字与故事是在后来的传播中逐渐靠拢的。",
          ],
        },
        {
          heading: "为什么不写成一次发明",
          paragraphs: [
            "后来的餐馆推广和叙事让人物归属变得更完整、也更好记。这能解释为什么苏轼与东坡肉的联系如此牢固，却不能反向证明他亲手发明了今天的菜。",
            "更准确的说法是：这道菜与苏轼的名字和后世记忆紧密相连，但直接发明归属仍然存在争议。",
          ],
        },
        {
          heading: "留住故事，也留住问号",
          paragraphs: [
            "文化故事不必因为有争议就被删除。把可以确认的联系、后来形成的叙事和尚未确定的部分分开，反而能看见一道菜如何被一代代人重新讲述。",
          ],
        },
      ],
    }),
    claims: [{
      id: "dongpo-pork-direct-invention-disputed",
      kind: "disputed-attribution",
      content: reviewed({ statement: "现有材料支持东坡肉与苏轼的长期关联，但不足以确认他直接发明了今天所称的东坡肉。" }),
      evidenceIds: ["dongpo-naming-chronology", "dongpo-later-narratives"],
    }],
    relatedEntities: [{ type: "culinary-item", id: "dongpo-pork" }, { type: "person", id: "su-shi" }],
    publication: { status: "published" },
  },
  {
    id: "tomyum-kung-documented-practice",
    type: "place-food-culture",
    content: reviewed({
      title: "被记录下来的河畔饮食知识",
      dek: "冬阴功的酸、辣与香草层次不只是一张配方表，也连接着泰国中部平原河畔社区的食材知识与日常实践。",
      sections: [
        {
          heading: "名录真正记录的东西",
          paragraphs: [
            "UNESCO 在 2024 年的非物质文化遗产名录中，把冬阴功记录为泰国的传统虾汤，并将其置于泰国中部平原河畔社区的知识与实践中理解。",
            "这个视角把注意力从一个固定配方移向一组会被使用、调整和传递的饮食知识：如何识别香料，如何让汤的酸、辣和鲜保持层次，以及食材与地方环境如何相遇。",
          ],
        },
        {
          heading: "一项记录，不是唯一起源证书",
          paragraphs: [
            "名录能够支持“这是一项被记录的传统实践”，却不会自动证明唯一发源地、最早发明者或精确年代。这些是不同的历史问题，需要更早、更具体的文献。",
          ],
        },
        {
          heading: "回到一碗汤里",
          paragraphs: [
            "对今天的做饭者来说，这段语境并不要求复制一个所谓唯一版本。它更像一个提醒：香茅、南姜、青柠叶和虾的关系，本身就是这道汤的知识核心。",
          ],
        },
      ],
    }),
    claims: [{
      id: "tomyum-kung-central-plains-tradition",
      kind: "documented-tradition",
      content: reviewed({ statement: "UNESCO 的 2024 年名录记录将冬阴功描述为泰国传统虾汤，并记载泰国中部平原河畔社区的相关知识与实践。" }),
      evidenceIds: ["tomyum-unesco-tradition"],
    }],
    relatedEntities: [{ type: "culinary-item", id: "tomyum-kung" }, { type: "place", id: "thailand-central-plains" }],
    publication: { status: "published" },
  },
  {
    id: "espresso-developed-through-stages",
    type: "historical-development",
    content: reviewed({
      title: "一杯由机器与实践共同演进的咖啡",
      dek: "Espresso 不是一套从诞生起就固定不变的参数，它是设备、压力与一代代咖啡实践共同推进的结果。",
      sections: [
        {
          heading: "不止一台机器",
          paragraphs: [
            "把 espresso 缩成“某人在某年发明”会遗漏关键部分。早期机器、之后的设备改进以及更晚的压力萃取方式，解决的问题不完全相同，也不是一次完成的。",
            "Smithsonian 的机器史梳理了多个发展阶段和不同参与者。这些变化逐步改写了咖啡如何被快速制作，也改变了杯中饮品的质地与风味。",
          ],
        },
        {
          heading: "定义也会移动",
          paragraphs: [
            "即使机器已经进入现代，espresso 也没有成为一个永不变的答案。Specialty Coffee Association 对专业实践的讨论显示，粉量、杯中液量、时间和对成品的理解会随专业群体与时期变化。",
            "因此，今天的配方参数更适合被理解为可重复的起点，而不是跨越所有时期的唯一标准。",
          ],
        },
        {
          heading: "杯中的技术史",
          paragraphs: [
            "一杯小小的 espresso 会把压力、流速、研磨和吧台判断集中在几十秒里。它的历史不只属于一台机器，也属于人们如何反复修正“一杯好的浓缩咖啡”。",
          ],
        },
      ],
    }),
    claims: [{
      id: "espresso-multi-stage-development",
      kind: "documented-fact",
      content: reviewed({ statement: "Espresso 的设备发展与专业定义经历了多个阶段，不能简化为一个人完成且从未变化的单次发明。" }),
      evidenceIds: ["espresso-machine-chronology", "espresso-definition-change"],
    }],
    relatedEntities: [{ type: "culinary-item", id: "espresso" }, { type: "technique", id: "pressure-extraction" }],
    publication: { status: "published" },
  },
  {
    id: "longjing-within-living-tea-practice",
    type: "technique",
    content: reviewed({
      title: "一杯茶背后的地方知识",
      dek: "从水温、投茶量到叶片舒展，一杯龙井可以通向更广阔的制茶、饮茶与分享茶的活态知识。",
      sections: [
        {
          heading: "从叶片和水开始",
          paragraphs: [
            "冲泡龙井时，水温过高或浸泡过久都会让嫩叶的苦涩更显眼。观察叶片展开、茶汤转为浅黄绿色，是一种很具体的判断。",
            "这些动作不只是一组数字，它们依赖对茶叶、水和当下口感的识别。",
          ],
        },
        {
          heading: "一项更广的活态实践",
          paragraphs: [
            "UNESCO 在 2022 年记录的对象，是中国多地因环境与习俗形成的制茶、饮茶和分享茶的相关知识与实践。它提供的是一个比单品历史更宽的文化背景。",
            "这项名录并不直接证明龙井的唯一起源、最早年代或唯一正统冲泡法。在这里，龙井是进入更大茶知识网络的一个入口。",
          ],
        },
      ],
    }),
    claims: [{
      id: "china-tea-processing-living-practice",
      kind: "documented-tradition",
      content: reviewed({ statement: "UNESCO 的 2022 年名录记录了中国各地因环境与习俗形成的制茶、饮茶和分享茶的相关知识与实践。" }),
      evidenceIds: ["china-tea-processing-tradition"],
    }],
    relatedEntities: [{ type: "culinary-item", id: "longjing-green-tea" }, { type: "technique", id: "tea-processing" }],
    publication: { status: "published" },
  },
  {
    id: "sake-making-with-koji",
    type: "technique",
    content: reviewed({
      title: "成品之外的制酒知识",
      dek: "一瓶清酒到达餐桌前，关键工作已经在生产者端完成。米、米曲与水的处理，背后是一套被记录的活态知识。",
      sections: [
        {
          heading: "制作发生在餐桌之前",
          paragraphs: [
            "对喝到成品的人来说，清酒也许只需要选择杯子与饮用温度。但这不意味着它“没有制作过程”；真正的制作属于生产者，不应被改写成消费者可以完成的几个假步骤。",
          ],
        },
        {
          heading: "被记录的米曲酿造实践",
          paragraphs: [
            "UNESCO 的 2024 年名录把使用米曲的传统清酒酿造知识与技能，记录为日本的活态文化实践。这支持的是知识与技能的存在和传承，而不是对每一瓶清酒风味或服务方式的统一规定。",
            "因此，这里把酿造知识放在故事中，把开瓶后的操作留在服务建议里。两种时间尺度各有边界。",
          ],
        },
      ],
    }),
    claims: [{
      id: "sake-koji-making-documented-tradition",
      kind: "documented-tradition",
      content: reviewed({ statement: "UNESCO 的 2024 年名录记录将使用米曲的传统清酒酿造知识与技能列为日本的活态文化实践。" }),
      evidenceIds: ["japan-sake-koji-tradition"],
    }],
    relatedEntities: [{ type: "culinary-item", id: "junmai-sake" }, { type: "technique", id: "koji-fermentation" }],
    publication: { status: "published" },
  },
  {
    id: "fino-aged-under-flor",
    type: "technique",
    content: reviewed({
      title: "酒花膜下的生物熟成",
      dek: "Fino 的干爽与轻盈来自生产阶段。在官方产区资料中，酒花酵母形成的表层是理解这一风格的关键线索。",
      sections: [
        {
          heading: "一层发生在酒液上方的变化",
          paragraphs: [
            "Jerez-Xeres-Sherry 法定产区的官方资料说明，Fino 会在酒花酵母形成的表层之下进行生物熟成。这是一条具体的生产信息，也是识别 Fino 风格的基础。",
            "对消费者而言，这个过程并不是需要在家完成的调制步骤。它属于酒在到达杯中之前的生产历程。",
          ],
        },
        {
          heading: "从制作知识回到服务边界",
          paragraphs: [
            "Cooking Lab 在这里只提供克制的识别与服务语境，不把生产方法写成家庭菜谱，也不从一种熟成工艺推导任何健康收益或饮用建议。",
          ],
        },
      ],
    }),
    claims: [{
      id: "fino-biological-ageing-under-flor",
      kind: "documented-fact",
      content: reviewed({ statement: "Jerez-Xeres-Sherry 产区的官方资料说明，Fino 在酒花酵母形成的表层之下进行生物熟成。" }),
      evidenceIds: ["fino-flor-biological-ageing"],
    }],
    relatedEntities: [{ type: "culinary-item", id: "fino-sherry" }, { type: "technique", id: "biological-ageing" }],
    publication: { status: "published" },
  },
] as const satisfies readonly Story[];
