# Story Experience

## Purpose

Issue #41 建立 Cooking Lab 的第二条消费路径：用户不准备立刻做饭时，也可以从一道料理进入有来源、可继续探索的文化与制作故事。

```text
做饭路径：Home -> Recipes -> Recipe detail
阅读路径：Home -> Stories -> Story detail -> related CulinaryItem / Story
```

当前信息架构只保留 `首页 / 料理 / 故事 / Beta 反馈`。`/stories` 是紧凑的编辑入口，不伪装成大型内容门户；首页只展示三篇代表内容，原有料理决策、菜系与技法区继续保留。

## Content Audit

当前六篇 production Story 全部具备经过审核的正文和完整 Claim -> Evidence -> Source 链，因此均可拥有独立页面：

| Story | Claim boundary | Reading shape |
| --- | --- | --- |
| 东坡肉与苏轼归属 | disputed attribution | 三段，拆分人物关联、菜名时间与后世叙事 |
| 冬阴功文化实践 | documented tradition | 三段，明确 UNESCO 记录不等于唯一起源证明 |
| Espresso 技术演进 | documented fact | 三段，呈现机器、压力与专业定义的阶段变化 |
| 龙井与制茶实践 | documented tradition | 两段，只提供可支持的活态实践语境 |
| 米曲清酒制作知识 | documented tradition | 两段，区分生产者酿造与消费者服务 |
| Fino 酒花膜熟成 | documented fact | 两段，只陈述官方资料支持的生产知识 |

没有为了统一长度补写历史，也没有新增 Story。现有六篇足够验证内容、路由、来源与关联体验；新增候选应继续走 #39 research pipeline，而不是为填满页面降低 provenance 标准。

## Consumer Model

Domain `Story` 使用 locale-based `dek + sections`，拥有独立 publication status。React 不读取 raw Story、Evidence 或 Source registry；`lib/story-experience.ts` 在服务器端构建可序列化 view model：

- preview：title、dek、type label、reading time、关联料理与 hero
- page：正文 sections、claim-aware context、context chips、相关料理、相关 Story 与 consumer sources
- source projection：只包含 title、author/institution/publication、必要 locator 和外部 link

`reliability`、rights/health、Evidence strength、internal IDs 与 editorial notes 不进入 consumer model。内部 provenance 保持完整，但阅读页不呈现成数据库后台。

## Claim-aware Language

- `documented-fact` 可以较确定表达，但不超出 Evidence 支持范围。
- `documented-tradition` 明确是被机构或文献记录的实践，不推导唯一起源、最早发明者或精确年代。
- `disputed-attribution` 保留争议与无法确认的部分，不把人物联系写成直接发明。
- `legend-folklore` 必须明确是传说或民间故事；当前 production set 没有此类 Story。

正文使用自然语言承担主要边界说明，页面只增加一段简短的“怎样理解这段故事”，不向读者展示机械的 Evidence 枚举。

## Routes And Canonical URLs

- Story：`/{locale}/stories/[slug]`
- adapted Recipe：继续以 `/{locale}/recipes/[slug]` 为唯一 canonical URL
- native CulinaryItem：使用 `/{locale}/culinary/[slug]`

`/{locale}/culinary/[slug]` 只生成 16 个 native item 的静态页面，不为 10 个 Recipe 创建重复页面。无 locale 的旧路径重定向到 `zh-CN`，不会成为第二个 canonical URL；当前仍不新增 `/culinary` catalog。

## Bilingual Story Policy

六篇公开 Story 都有 reviewed `zh-CN / en` title、dek、sections 与 claim statement。翻译必须保留 documented fact、documented tradition、disputed attribution 与 legend/folklore 的 certainty，不能把“被记录的传统”提升为唯一起源或把争议归属写成事实。Source title 优先保留正式题名，Evidence locator value 不翻译，只本地化 locator label。

## Related Exploration

关联计算完全 deterministic，并只接收 published items/stories：

- explicit CulinaryItem reference 与 item `storyIds`
- country / region / cuisine
- technique
- procedural ingredient overlap
- item type 与 Story type 只作弱信号
- explicit person/place/ingredient/technique entity

固定分数、阈值、ID tie-break 和数量上限保证相同输入得到相同结果。低于阈值时隐藏整段，不使用随机、LLM、embedding 或 vector database，也不实现 #43 Pairing/Meal Engine。

## Reading, Accessibility And Performance

- Story detail 使用 semantic `article`、顺序 heading、breadcrumb 与明确的外部来源 link label。
- 正文限制在窄阅读列；相关卡片在移动端单列，并在 375 / 390 / 768 / 1024 / 1440 px 检查。
- 卡片与导航可键盘访问，focus 可见；交互目标至少 44 px，不依赖 hover 才能发现内容。
- 页面没有动画库或新增 client component。view model 在 server/data boundary 构建，不把 26 项 raw data 或完整 provenance registry 发送到浏览器。
- Story hero 复用相关 CulinaryItem 图片，不建立第二套 image system。

## Scope

Issue #41/#42 仍不实现完整 Culinary catalog、People/Place/Ingredient encyclopedia、地图、数据库、CMS、抓取、个性化、社交、AI 故事或 Meal Engine。
