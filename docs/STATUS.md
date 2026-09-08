# Status

最近更新：2026-09-08

## M12–M13 当前状态

- M12 游戏数据合同、操作 taxonomy、量化迁移、错误 mutation、独立游戏权利门禁和确定性 Godot/SQLite 导出器已在 `aa5e9c2` 完成并通过独立审查；G001 已收口，M13 正在执行。
- 当前 Web 的 50 项已迁移为独立 `GameRecipeV1` draft；它们保留原有演示营养并明确不能直接获得 `game-commercial-ready` 资格。
- 已从 USDA FoodData Central 的 Foundation Foods 2026-04 与 SR Legacy 2018-04 官方归档建立 81 条 record-level CC0 子集；每个上游 ZIP 的 SHA-256 进入数据合同，缺失核心营养素会 fail closed，完整上游数据库不进入 repo，build 不访问网络。
- canonical source 当前只包含 50 条 Web 迁移 draft；510 条公式组合已从逐料理 source 中移除，只保留为测试 fixture 生成器，不能代表真实料理或商业可发行内容。
- 50 条迁移数据对无法从 Web 展示模型可靠取得的食材绑定、数量、设备、参数、目标状态和 mutation 结果使用结构化 `unresolvedMappings`，当前没有任何条目可通过改动单一 eligibility 字段获得导出资格。
- Web 仍恰好公开中英文各 50 项；游戏数据没有进入页面查询、搜索、推荐、sitemap 或客户端 bundle。
- 首轮独立内容审查已冻结全部公式 family：通用来源不能证明具体配方、部分参数与 mutation 因果缺少逐项依据。M13 将改用逐项明确 Public Domain 的 Library of Congress 原始料理事实，并要求独立料理交叉核对；在真实来源、当前 fingerprint attestations 和 sampling QA 完成前 exportable 数量保持 0。
- M12 validator 与导出层已针对首轮独立审查完成 fail-closed hardening：精确 runtime schema、操作输入/输出/设备/参数/目标合同、actor/run/context 独立、LOW 单一 reviewer 全维度覆盖、真实 sampling digest、风险下限、USDA exact join、权利依据与实际 material source coverage、完整 content-addressing、安全 staging，以及 Godot JSON ↔ SQLite parity。
- 量化单位现在通过版本化 conversion record 做 ID、单位、食材作用域和因子的精确 join；Godot JSON 与 SQLite `unit_conversions` 同源。错误设备 mutation 只能引用操作目录中存在但与目标操作不兼容的设备。
- M13 已将逐项核验的 LOC 公有领域文献扩至 152 本（152 个唯一 item、152 个唯一 derivative、144 个保守作品族），内容寻址缓存保持在 `.local/`。修复保存/腌制词形与历史 preserve 类别漏检并禁止 fuzzy title match 获得规范化资格后，当前 importer 产生 1,850 个 cross-checked discovery draft、192 个严格 extraction-usable 候选并过滤 2,112 个高风险块；全部仍不是 canonical 或 commercial-ready。
- 已新增 `SourceFactBundleV1`、有理数量、逐行 SHA、原文位置顺序 method facts、版本化 normalization registry/trace 合同和 fail-closed validator。`game-data:loc-source-facts` 可从已核验缓存确定性生成 192 个本地 draft source-fact bundle；连续两次 manifest SHA-256 均为 `e7ebd2453107e564adb5d4c0767e5796f78efab106d5ca36b31d1d410671d4d6`。
- `GameRecipeV1` 的 source-normalized export 现在必须逐字段绑定当前 LOC registry、content-addressed cache、source-fact bundle、食材换算、操作/设备/时长/火力、目标状态及完整 mutation 输出。历史定性火力保持定性并强制 engine-v2；数值推断必须有独立 Evidence。所有支撑输入进入 artifact-set fingerprint 与 sampling novelty。下一步是建立实际 ingredient/operation/equipment/heat/target/mutation registries，将严格候选编译为 canonical draft，再完成逐项 rights、独立审查与 sampling。

## 当前阶段

Cooking Lab Public Beta v0.1 已上线，M5、M5.1、M6、M7、M9、M10 与修订范围后的 M11 已完成。M8 真人研究计划已取消且没有产生参与者数据。M11 以已上线的“从决定到上桌”闭环、Taste 视觉升级、本地内容供应链容量和 M10.1 治理收口；公开内容保持 50 项，不开展用户研究，也不启动新的产品 Goal。

## M11 收口状态

- 已实现 `MealPlanV1`、确定性购物清单、最早可用设备时间线、成品服务任务、追加/替换分离的安全 URL、V0 migration 和深层校验的版本化 localStorage；存储被禁用时安全降级为内存状态。
- 已增加双语 noindex Plan 路由，以及推荐、料理详情、Pairing 的加入入口；首页可继续本地计划。
- 详情页已有键盘可用的稳定章节导航、跨类型相似料理和保留在末章的 `#sources`。
- Taste Redesign - Overhaul 已覆盖首页、目录、详情、Pairing 和 Plan；主题选择跟随系统并在可用时本地保存。
- 最新 412 px local Production 实测：英文 LCP 244 ms / CLS 0 / INP 152 ms，中文 LCP 216 ms / CLS 0 / INP 160 ms；Lighthouse accessibility 为 1.00。该结果是可复现 lab evidence，不代替 merge 后的 Production field observation。
- 当前 50 项各自通过 content package module 进入 repository，独立提交的 deterministic manifest、`content:audit` 与 M10 gate 共同阻止过期 identity/Story/Hero/usage decisions。
- PR #95 已独立 merge 并交付 M11 工程、计划体验、内容包容量边界与 Taste 视觉升级；新增 70 项仍未发布。
- Product Director 已批准并上线 M10.1 risk-based governance：LOW 使用确定性门禁、独立 agent 全维度审查和 sampling QA；MEDIUM 使用分离 reviewer contexts；HIGH 保留人类、专家或法律 checkpoint。PR #97 已完成 schema、validator、fingerprint、sampling 与 fail-closed CI。
- M11 收口进一步强制逐项显式 `textArtifactDerivations`；AI input 使用 canonical hash；`AiGenerationRecord` 显式区分 direct/gateway 并要求服务链每层四项权限与 UsageDecision 闭合；AI-only Source 的 unknown/rights-changed 继续硬阻断。无法恢复真实上游、输入和条款链的历史生成式文字不能发布或事后补造 provenance。
- Product Director 已将 50 → 120、Batch A/B、12 个产品档案与剩余餐厅重构延期。PR #98 的 35 个候选保持未合并且不视为已审查内容；远端分支和 commit `b0832d629e48cf5be3a34fe6f3d9f43e308ee77c` 作为可恢复审计记录保留。
- M11 已完全取消视频路线：没有观看或总结视频，没有 timestamp、字幕、转录、截图、下载或 `ExternalMediaReference` 进入数据。
- 最终 QA 以当前双语各 50 项、候选 slug 不可公开、关键路由/`#sources`/canonical/重定向、双主题/键盘/响应式，以及 lint、typecheck、全量测试、`content:audit`、build、独立 review 和 Production smoke 为收口门禁。

Production URL：
[https://cooking-lab-pied.vercel.app](https://cooking-lab-pied.vercel.app)

## 已确认的真实状态

- GitHub PR #14 已于 2026-09-03 merge 到 `main`
- GitHub Issue #7 已于 2026-09-03 自动关闭
- GitHub PR #22 已于 2026-09-03 merge 到 `main`
- GitHub Issue #16 已于 2026-09-03 closed
- GitHub PR #26 已于 2026-09-05 merge 到 `main`
- GitHub Issue #20 已关闭
- GitHub PR #27 已于 2026-09-05 merge 到 `main`
- GitHub Issue #21 已关闭
- GitHub PR #33 已于 2026-09-05 merge 到 `main`
- GitHub Issue #29 已关闭
- GitHub PR #34 已于 2026-09-05 merge 到 `main`
- GitHub Issue #30 已关闭
- GitHub PR #35 已于 2026-09-05 merge 到 `main`
- GitHub Issue #31 已关闭
- GitHub PR #36 已于 2026-09-05 merge 到 `main`
- GitHub Issue #32 与 Epic #28 已关闭
- GitHub PR #44 已于 2026-09-05 merge 到 `main`
- GitHub Issue #38–#43 已关闭，PR #49 已于 2026-09-05 merge 到 `main`；M6 Epic #37 已完成
- GitHub PR #47 已于 2026-09-05 merge 到 `main`
- M7 Epic #50 与 Issues #51–#54 已完成并关闭；执行顺序为 `#51 -> (#52 core || #53 core) -> Pairing integration -> #54`
- M8 Epic #60 与 Issues #61–#64 曾用于规划有界外部验证；Product Director 在招募前取消该阶段，#63、#64 与 Epic #60 以 `cancelled / superseded` 收口
- PR #66 曾上线双语 validation 页面、legacy redirect、公开补充反馈表单与 Footer 入口。由于这些内容只服务已取消的真人研究，Issue #67 已将其安全撤下；PR #66 中与研究无关的 Header 44px 触控目标改进保留
- M8 最终真实状态为 0 人联系、0 场 scheduled、0 场 session、0 条参与者数据、无产品方向结论；没有开展招募、moderated session 或异步测试
- Issue #51 已通过两轮 independent review（首轮 REVISE finding 已修复，第二轮 PASS）；PR #55 已于 2026-09-05 merge，Issue #51 已关闭
- Issue #52 已通过两轮 independent review（首轮 REVISE、第二轮 PASS）；PR #56 已于 2026-09-05 merge，Issue #52 已关闭
- Issue #53 已通过 independent review；PR #57 已于 2026-09-05 在 2/2 checks 通过后 merge，Issue #53 已关闭
- Issue #54 已通过 independent culinary/product review；PR #58 已于 2026-09-05 在 2/2 checks 通过后 merge，Issue #54 已关闭
- `origin/main` 已包含完整 M6 与最新 Public Beta 代码
- Production 已通过 Vercel 部署并可访问
- 当前 M0-M4 已完成
- M5 Epic #15 已按实际完成状态关闭
- M9 Epic #69 与 Issues #70–#75 已完成；PR #76 已合并
- M9 PR #76 已合并；PR #77 仅记录 Production closeout，仍独立等待 merge 确认
- M10 PR #84 已于 2026-09-06 merge；Epic #78 与 Issues #79–#83 已关闭
- M10 Production closeout 由 Issue #85 记录

## M10 完成状态

- 已新增统一 `ContentArtifact / RightsAssessment / AttributionRequirement / UsageDecision` 及 dataset、nutrition、cost、AI、external media、restaurant 与 product-profile contract
- Recipe 公开边界和完整 CulinaryItem 公开边界均接入确定性 content-rights gate；任一 unknown、NC/ND、rights-changed、署名缺失、复审过期、AI/数据库/媒体规则失败会阻止测试和 production build
- 当前 50 项无 grandfathering：34 个 adapted Recipe、16 个 native CulinaryItem、50 张 Hero、6 个 Story 和实际使用的 93 种食材均进入 audit coverage
- 当前营养继续明确为 Cooking Lab 演示性编辑估算；USDA FoodData Central 只登记为未来 CC0 versioned-download dataset，未伪称为现有数值来源
- 料理详情已增加稳定 `#sources`、内容身份、消费级来源、图片许可与改编声明；新增双语 `/content-rights` 与 legacy 永久重定向
- 独立图片权利复核发现旧 Fino、Junmai 与 Espresso Hero 的品牌包装/商业小包装风险，已替换为无品牌酒桶与酒花、无标识清酒器具和公有领域白色咖啡杯，并登记逐图构图、商标与隐私判断
- 最终 M10 audit 为 50 个 published item、256 个 artifact、256 个 UsageDecision、0 个 blocked issue；独立代码/内容权利复审结论为 PASS
- merge commit `de4ea4164d89c6cf2665b0769ab00b94d89bb808` 的 main CI 与 Vercel Production deployment 均通过；Production 在 390/1440 px 完成双语权利页及 Fino/Junmai/Espresso 详情烟测，无横向溢出或 console error
- Production 两种语言目录各返回 50 项；100 个双语详情 URL 全部为 200，均有稳定 `#sources`、正确 canonical 和安全来源链接；legacy `/content-rights` 永久导向 `/zh-CN/content-rights`
- M10 收口当时未启动 500+ 扩充、批量 Story、详情章节导航、Taste UI 大升级或 M11；此后 Product Director 已明确启动 M11 Epic #87

## M9 当前实现状态

- `duckduckgo-search` 已从用户 Skill 目录移至废纸篓；后续不调用
- `design-taste-frontend` v2 已从 `Leonxlnx/taste-skill` 固定 commit `ccbc15639c97057cbfcf32ecebc38ef716e4bb37` 安装，仅作为 UI 审计规范
- 24 道 draft Recipe 已完成 4–6 个步骤、状态提示、失败预防、英文审校、closed ResearchRecord、每项至少两个独立来源和合法本地 Hero
- 公开边界现为 34 个 adapted Recipe + 16 个 native CulinaryItem，`zh-CN` 与 `en` 各恰好 50 项，覆盖六种料理类型
- `/recipes` 已成为统一料理库，`/recipes/[slug]` 是所有类型的 canonical 详情；旧 `/culinary` 与 `/stories` 路由使用永久重定向
- Story、获奖记录和消费级来源嵌入对应料理页；成品饮品不生成虚假步骤，未建模营养与成本不按零显示
- 首页、目录、详情与 Pairing 已改为米白、墨黑、单一辣椒红的编辑式视觉；首页取消自动轮播，只预加载首个 Hero
- 推荐引擎仍只处理 published Recipe；全部料理可浏览并参与确定性 Pairing
- 本地最新验证：typecheck、lint、260 项测试、production build、五档响应式 QA、独立 code review 与独立 visual review 已通过
- PR #76 已合并并部署；PR #77 仅负责把 M9 Production closeout 记录带回 `main`

## 已完成能力

- Next.js / TypeScript / Tailwind Web 应用骨架
- Ingredient、Recipe、Nutrition、Recommendation 类型系统
- 106 种 `demo-estimated` 食材、100 道结构化 Recipe 与 16 个 native CulinaryItem
- Unit Conversion、Nutrition Engine、Cost Engine 与 Dataset Validation
- 硬限制 + 软偏好的确定性 Recommendation Engine
- 首页即时料理决策、已发布目录、稳定 slug 详情页
- Public Beta disclaimer、404、反馈入口和基础 metadata
- 已上线的 Public Beta 生产环境

## 当前架构审计结论

Issue #18 shared core audit 已完成代码侧最小调整：

- `lib/recipe-detail.ts` 现在只返回原始数值、machine values 与可序列化 application data
- `lib/recipe-detail-display.ts` 承担当前 Web 的中文 label、单位与估算文案
- 新增 guard tests，防止候选 shared core 引入 React、Next.js、DOM 或样式依赖
- 新增 serialization tests，覆盖 recipe detail 与 recommendation 公开结果
- 保留当前单仓库结构；完整审计见 `docs/SHARED_CORE.md`

### 当前优势

- 大多数领域逻辑仍是框架无关的 TypeScript 模块
- Recommendation、Nutrition、Cost、Validation 与 Repository 没有依赖 React 或 Next.js
- 当前静态数据和 repository 结构仍允许后续更换数据来源

### 当前耦合点

- `app/` 与 `components/` 是纯 Web 展示层；首页推荐已经改为 progressive disclosure，不再使用固定 dashboard sidebar
- `components/recipe-discovery.tsx` 只负责 criteria state 与展示，继续消费原有 deterministic recommendation helper
- recipe detail 已拆为 framework-independent application model 与 Web display adapter
- image asset schema、license registry 与 Web adapter 已建立，当前已有 10 张逐张核验的 seed hero assets
- cultural metadata 目前只在少量 recipe 上示例性使用

### M5 约束

- 新增 taxonomy、image schema、content metadata、future household extension points 时，优先放入 framework-independent 的 types / lib 层
- 不为“未来 Mobile”立刻做大规模目录迁移或 monorepo 重构
- 只有在第二客户端或明显的共享包维护痛点出现后，再评估 `apps/ + packages/` 迁移

## 本轮 M5 规划产物

- 更新 `docs/PRODUCT.md`
- 更新 `docs/ROADMAP.md`
- 更新 `docs/STATUS.md`
- 更新 `docs/ARCHITECTURE.md`
- 新增 `docs/BRAND_BRIEF.md`
- 新增 `docs/CONTENT_STRATEGY.md`
- 新增 `docs/TAXONOMY.md`
- 已建立 M5 Epic 与分拆 Issues：`#15` - `#21`

## Issue #16 当前产物

Issue #16 `[M5] Define brand and visual design system` 当前已在品牌规划分支中形成以下文档产物：

- 新增 `docs/BRAND_DIRECTIONS.md`
  - 当前 Production 视觉审计
  - A / B / C 三套品牌与视觉方向
  - Naming exploration
  - Design token proposal v0.1
  - Homepage wireframes
  - Recipe Card v2 / Recipe Detail v2 方向
  - Photography direction
  - IP / character direction
- 更新 `docs/BRAND_BRIEF.md`
- 新增 repo-level `DESIGN.md` 作为后续 UI / UX 实现的设计基线

当前方向已确认，不再停留在“待用户从 A / B / C 中选择”的状态。

### 已确认方向

- Visual direction：`Fresh Editorial 70% + Modern Culinary Lab 30%`
- Working brand：`Cooking Lab`
- Naming status：deferred until after M5 visual prototype / redesign
- Photography：editorial food-first 为主，modern culinary studio 为辅
- Character / mascot：长期可能性保留，但 M5 当前不做 visual mascot implementation

这意味着 Issue #16 已从“提出可选方案”进入“方向已确认并可供后续重设计引用”的收口状态，但尚未进入最终 UI 实装。

## Issue #17 当前产物

当前分支 `feature/issue-17-recipe-taxonomy-v2` 已完成 taxonomy v2 的核心实现与 30 道现有 recipe 迁移，主要包括：

- 新增 `types/taxonomy.ts`
  - origin / cuisine / subCuisine
  - techniques
  - dish type / meal occasion
  - flavor profile
  - dietary / browse tags
  - optional cultural metadata
  - lightweight provenance references
- 新增 `data/taxonomy.ts`
  - stable machine values
  - `zh-CN` / `en` labels
  - registry-based lookup
- 新增 `lib/taxonomy.ts`
  - label resolution
  - compatibility helpers for filters and recommendation
  - derived tag strategy for `high-protein` / `low-oil` 等运行时标签
- 全量迁移当前 30 道 recipe 到 `taxonomy` source of truth
- 更新 recipe detail / card 展示以消费新 taxonomy
- 新增 `docs/TAXONOMY.md`
- 新增 taxonomy / validation / compatibility tests

这意味着 M5 的 taxonomy、label strategy 和 cultural metadata contract 已经有了独立 schema，但 image system 与 30 -> 100 数据扩充仍是后续工作。

### Hardening update

在当前 PR review / hardening 阶段，已进一步确认并收紧：

- `recipe.taxonomy` 是唯一 canonical source of truth
- `quick` 改为由 `totalTime` 派生，不再静态维护
- `high-protein / high-fiber / low-oil / no-added-sugar` 继续保持 derived attributes
- 对无 provenance 的文化性断言做了删除或降级为现代 recipe context
- 详情页只保留最小 taxonomy 适配，不把所有新字段直接铺成 sidebar 信息卡

## Issue #19 当前产物

PR #25 已将数据集扩展到 100 道 recipe，并完成时间与家庭可执行性 hardening：

- `totalTime` 现在明确覆盖食材声明状态之后的主动操作与必要等待
- 干扁豆、熟鹰嘴豆、熟黑豆、熟米饭使用不同稳定 ID，避免营养、重量和时间语义混用
- 清除了 10 道 recipe 的隐藏干豆/冷饭前置步骤，并补齐相关 tools 与步骤顺序
- 30 / 45 / 60 分钟 recommendation 场景均只返回可在声明时间内完成的 recipe

## Issue #20 当前产物

PR #26 已建立 Recipe Image System 基础并 merge 到 `main`：

- `types/image.ts` 定义 framework-independent image、source、license、focal point 与 AI provenance
- `data/recipe-images.ts` 集中维护可用图片与版权 metadata，Recipe 只保存可选 `heroImageId`
- validation 拒绝悬空引用、非法路径、空 hero alt、缺失 CC attribution 及 NC / ND / unknown / prohibited 授权
- Web 使用 Next/Image adapter，detail hero preload、card lazy loading，并在无图或加载失败时保持稳定 fallback
- 当前不加入来源未经核验的 sample asset；100 张 hero images 作为后续独立 content batches
- 完整策略与逐张素材工作流见 `docs/IMAGE_SYSTEM.md`

## Issue #21 当前产物

PR #27 已合并并完成：

- Food-first 首页与真实料理 hero
- 今晚灵感、菜系探索和技法探索内容层级
- Primary / Secondary / Advanced 渐进式推荐条件
- 以菜名、描述和推荐理由为主的 Recipe Card v2
- URL 驱动、服务器端执行的 taxonomy 目录筛选
- 取消 sticky metric sidebar 的 Recipe Detail v2
- 10 张来自 Wikimedia Commons、授权和 attribution 完整的 seed images
- 保持 recommendation、nutrition、cost、taxonomy 与 shared-core 边界不变

## Issue #29 当前产物

PR #33 已合并并建立 M5.1 Flavor 与自然语言基线：

- `recipe.flavor` 取代旧 `taxonomy.flavorProfile`，成为唯一 canonical Flavor source
- 100 道 recipe 完成保守 Flavor Profile 迁移
- 基础味使用 `0–4` 编辑强度，香气、口感与饮食感受使用克制的稳定词汇
- 清淡、鲜辣、酸爽、浓郁、焦香、暖乎乎作为 deterministic soft preferences 进入推荐
- 时间按照真实 100 道分布映射为轻松快手、日常料理、慢慢做、值得等待，精确分钟继续保留
- 首页、目录、卡片和详情页移除匹配百分比、数据库计数 CTA、重复“为什么这样做？”与主要区域 Beta 说明框

## Issue #30 当前产物

PR #34 已合并并建立 Recipe publishing 与 quality gate：

- 100 道 structured recipes 全部保留，publication status 明确区分 `draft / reviewed / published`
- 技术 eligibility 与编辑发布状态分离，只有 `published` 且通过校验的 Recipe 可公开
- 初始 published set 为 10 道已有合法 hero 的 Recipe；静态详情页参数同为 10
- 10 道公开 Recipe 已逐道深化为 4–6 个真实步骤，补齐 sensory cues、doneness、调味时机和失败预防
- Homepage、catalog、recommendation、taxonomy options、detail lookup 与 SSG 统一消费 `data/published-recipes.ts`
- 未发布 slug 不生成静态详情，直接进入公开路由时返回 404

## Issue #31 当前产物

PR #35 已合并并建立 deterministic similar-recipe discovery：

- `lib/recipe-similarity.ts` 与 Recommendation Engine 完全分离，返回可序列化 score、五维 breakdown 与 signals
- Flavor / Ingredient 权重合计 0.75；cuisine、technique 与 dish type 只作辅助，时间不参与
- salt / oil / seasoning 与常见 aromatic ingredient 不计入主食材 overlap；只保留六个有实际用途的 ingredient family
- 默认 `0.28` threshold 来自当前 10 道 published Recipe 的 pairwise editorial calibration
- Recipe Detail 末尾只展示达到阈值的 1–4 道 published Recipe；结果不足时不填充低质量卡片
- Similar Recipe card 只展示图片、料理名、Flavor、自然理由和人类时间，不暴露 similarity score

## Issue #32 当前产物

PR #36 已合并 Living Editorial Hero：

- `data/homepage.ts` 集中维护五道 published Hero recipe 与短 editorial line，顺序固定且不伪装个性化
- Server homepage 构建只含展示字段的 Hero view model，小型 client carousel 不读取 raw recipes 或 filesystem
- 自动轮换为 7 秒，图片使用 700 ms crossfade；previous、next 与五个 indicator 均为 44 px button
- hover、focus 与 document hidden 暂停 timer，手动操作后重新计时；reduced motion 禁用自动轮换并移除视觉 transition
- 只有首张 LCP 图片 preload，初始仅准备当前和下一张图片，后续随轮换逐张挂载
- active recipe link、alt、Flavor、human time、source、author、license 与 attribution 随 slide 一致更新
- 375 / 390 / 768 / 1024 / 1440 五个断点已逐张检查 crop、对比度、稳定高度与控制位置

## Issue #38 当前产物

当前分支已建立 M6 Culinary Knowledge Model 的可执行架构基线：

- `CulinaryItem` 使用 shared base + dish/dessert/tea/coffee/non-alcoholic drink/alcoholic drink discriminated union
- cooking、baking、brewing、extraction、mixing、assembly、serving guidance 与 no consumer preparation 使用不同 contract
- Story/Claim、Source/Evidence、Translation 与 Pairing signals 是独立、可序列化 domain concepts
- documented fact、documented tradition、disputed attribution 与 legend/folklore 在 claim 层明确区分并要求 Evidence reference
- Source locator 支持 HTTPS URL、DOI、ISBN、archive/catalog identity 与 physical citation，离线来源不再被迫提供 URL
- Evidence locator 独立表达 page/chapter/section/paragraph/timestamp/folio 等来源内部位置
- 删除无明确 assertion 语义的 `CulinaryItem.evidenceIds`，当前 provenance 只走 Story Claim -> Evidence -> Source
- Recipe -> DishItem adapter 可投影现有 100 条数据；没有建立第二份静态 source，也没有自动把 legacy culture 升级为 Story
- item-type publishing skeleton 允许无 cooking steps 的酒/饮品发布，同时保持 dish/dessert nutrition/cost gate
- Domain guard 覆盖新增 types/lib，继续禁止 React、Next、DOM、filesystem 与数据库依赖
- 当前 homepage、catalog、detail、recommendation、similarity、published adapter 与 SSG 均不切换数据源

## Issue #39 当前产物

当前分支建立 M6 Content Research / Source & Provenance 基础：

- `SourceType` 仅按真实 audit 扩展 library、official cultural institution、open educational resource、open media 与 patent
- Source health 记录 active/unreachable/moved/superseded/rights-changed；它与 editorial reliability 分离
- Open-license rights 明确 exact license、attribution、adaptation status 与 share-alike obligation
- `ResearchRecord` 保存 candidate source 接受/拒绝、claim disposition、未决问题、reviewer/date 与编辑决定
- evaluated catalog 审计 11 个真实 provider/resource；可访问、事实参考、文字复用与图片授权明确分离
- 东坡肉人物归属、冬阴功文化语境和 espresso 发展史三个 typed exercises 验证 supports/contradicts/context 与 claim language
- research validator 覆盖 locator、rights、重复引用、缺失 Evidence、断裂 Source 和 accepted-source boundary
- 当前没有新 CulinaryItem/Story 发布，没有网络任务、crawler、scheduler、database、CMS 或 UI 改动

## 当前产品缺口

- 100 道菜已形成第一版料理世界地图，但文化 provenance 与更深 region coverage 仍需持续审核
- 当前只有 10 / 100 道 recipe 有已审核 hero image；其余 90 道保留为 draft，不进入公开 UI
- 更深的文化 provenance 和地域覆盖仍需作为内容审核持续推进
- Household、个人口味和长期陪伴能力仍只有方向，没有 schema

## Issue #40 当前产物

- 新增 16 个 native CulinaryItem，与 10 个 adapted published Recipe 组成 26 项统一公开 repository
- 六种 item type 均有真实 production data；preparation 覆盖 cooking、assembly、baking、brewing、extraction、mixing 与 serving guidance
- 新增 29 种食材和 16 张 1500 x 1000 本地 WebP，逐项保存 Wikimedia file page、作者、CC license 与 attribution
- 6 个 Story 通过 Claim -> Evidence -> Source 发布，东坡肉保留争议归属，其余无可靠文化主张的条目不创建 Story
- dish/dessert 保持 nutrition/cost gate；plain tea 与成品酒明确使用 applicability，酒类没有虚构 cooking steps、购买链接或健康收益
- `getPublishedCulinaryItems()` 提供统一 public boundary；现有 homepage、catalog、detail、recommendation、similarity 与 SSG 仍使用原 Recipe source
- 新增跨类型 validation、publishing、identity、draft exclusion、provenance、image、ingredient、pairing、translation 和 adapter compatibility tests

## Issue #41 当前产物

- 新增紧凑 `/stories` 入口、六篇 Story 阅读页与首页三篇代表内容，不把当前小规模内容包装成大型门户
- `StoryCopy` 使用 `dek + sections` 并拥有独立 publication；Story publishing gate 检查 reviewed translation、公开 CulinaryItem、Evidence 与 Source 链
- claim-aware 文案分别保留 disputed attribution、documented tradition 与 documented fact 的证据边界
- consumer source 只展示题名、作者/机构/出版信息、必要 locator 与 link，不暴露 reliability、rights、health、strength、ID 或 editorial notes
- related items/stories 使用 geography、cuisine、technique、ingredient、type 和 explicit entity 的 deterministic published-only 信号，低相关时隐藏
- 16 个 native item 获得最小 `/culinary/[slug]` 页面；10 个 Recipe 继续以 `/recipes/[slug]` 为唯一 canonical URL
- 没有新增 Story、图片系统、client payload、数据库、CMS、双语 UI 或 Meal Engine

## Issue #42 当前产物

- 所有公开页面使用 `/zh-CN` 与 `/en` locale route；旧 URL 服务器重定向到默认中文，canonical/hreflang 和 `<html lang>` 按 locale 输出
- UI message、domain label、editorial translation 与 generated explanation 明确分层，没有新增 `nameZh/nameEn` 或 i18n dependency
- 10 道 published Recipe、16 个 native CulinaryItem 与 6 篇 Story 均有 reviewed English consumer copy；90 道 draft Recipe 保持不变
- Recommendation/Similarity core 只输出结构化 reason data，中文和英文解释由 display adapter 生成
- Story 英文版保留 documented tradition、disputed attribution 与 evidence boundary；Source title/locator value 不被随意翻译
- Hero 更亮；canvas/paper/herb/story/cocoa 语义 surface、首页节奏、目录密度和 Story/饮品详情层级完成克制演进
- 浏览器 QA 覆盖 16 个中英文页面在 375、390、768、1024、1440 px 的 80 个视口，无横向溢出、裁切或 console error
- 未开始 Pairing/Meal Engine、数据库、CMS、AI 翻译、imperial units、账号或 Mobile

## Issue #43 当前产物

- 新增独立 Pairing 与 Meal Composition core，不复用 Recommendation/Similarity score；固定 anchor 并只消费 locale-complete published items
- 当前启用 main+drink、starter+main+drink、main+drink+dessert、drink+dessert；内容不足时返回 partial 或空结果，不读取 90 个 draft
- pair score 输出 Flavor complement/continuity、weight、texture、temperature、cuisine、role、context 的 structured reasons/cautions；meal score 另行处理全部 pair、角色完整度、重复、进程与准备现实性
- preparation 显式记录 active minutes，并汇总 coordinated/sequential elapsed、parallelizable time、procedural/serving-only 数量与 tool overlap
- nutrition/cost 使用 complete/partial/unavailable，unknown 与 not-applicable 不按零计算；默认 composition 排除酒精，并在真实候选存在时提供中性酒精或无酒精替代
- 新增 52 个 `/{locale}/pairing/[slug]` SSG 页面，Recipe/native detail CTA 与 Similarity 文案保持明确分离；消费者不显示 raw score
- readiness audit 确认 10/26 为 drink、只有 3 个 dessert、3 个 starter assignment 和 1 个共享 side；四道式与独立 side template 暂不开放

## Issue #51 当前产物

- 新增 `DecisionContext` 字段契约，穷举全部 `RecommendationCriteria` 的稳定 `dc*` query key、value kind 与 Recipe/Meal scope
- 新增 framework-independent allowlisted URL codec：scalar/list round-trip、稳定字段/值排序、未知值过滤与 malformed number 归一化
- 重复 max limit 采用更小合法值，重复 `minProtein` 采用更大合法值，避免畸形 query 意外放宽 hard constraint
- vocabulary builder 汇总 published Recipe 与 CulinaryItem 的工具 ID，覆盖 native item 独有工具；非空 tools 维持 closed-world 语义
- Meal adapter 只映射 `maxTime -> maxTotalTimeMinutes` 与 `availableTools -> availableToolIds`；营养、成本、油盐糖与 soft preferences 不进入整餐 options
- context-free URL 继续解析为空 context；本 Issue 未修改 Discovery、Recipe、Pairing navigation 或 Meal selection/presentation
- 全量 225 项测试、lint、typecheck、production build 与 Vercel preview/checks 已通过；PR #55 已 merge

## Issue #52 当前产物

- Discovery 从 allowlisted URL 恢复 criteria，并在不整页刷新的同路由 replace 中持续写回归一化 context
- Recommendation card、Discover more、Recipe catalog card、Recipe detail、Pairing、返回链接与 locale switch 保留仍适用的 Decision Context
- Recipe detail 以整餐约束、仅当前 Recipe 与携带偏好三种 scope 展示条件，不把 Recipe 营养/预算/油盐糖升级为 Meal constraint
- catalog filter 与 Decision Context 保持两套明确 query contract；目录明确说明携带条件不等于目录结果已满足条件
- 返回来源只允许 `discovery / catalog`，catalog filters 经过 allowlist/normalization 重建；不接受外部或 free-form return URL，不依赖 history state
- context-free route 继续有效，canonical/hreflang 继续忽略 query；Recipe/Pairing 因 request-time query 改为 dynamic rendering，但不新增 content identity 或 query SSG path
- 相关纯函数与 journey regression tests、lint、typecheck 和 production build 已通过；真实浏览器已覆盖 Discovery URL hydration、Recipe/Pairing/back、catalog carry-through、locale link 与 console error
- independent review 首轮发现 Discovery locale switch 会静默丢失当前 context；修复后 locale href 复用既有 codec 的 allowlist、normalization 与稳定序列化，第二轮结论为 PASS

## Issue #53 当前产物

- public Pairing adapter 消费归一化 Decision Context，并且仍只把 `maxTime / availableTools` 映射为 whole-meal options
- Meal candidates 返回 `estimated-elapsed-time / available-tools` 的结构化 satisfied/exceeded outcomes；工具失败包含 exact missing IDs
- complete 与 partial 共用 hard-constraint gate；partial 从 constraint-eligible candidates 中选择，可取代违规 complete
- 没有合格 complete/partial 时区分 constraint empty 与 quality empty，不再用完整形式覆盖真实失败
- `relaxMeal` 只允许显式移除 time 或 tools 条件，稳定排序并保留原 `dc*` context；无用户选择时不放宽
- Pairing 页面显示条件 scope、具体空结果原因与已选择的 relaxation；elapsed 始终标为 estimate
- 全量 239 项测试、lint、typecheck、production build 与 `git diff --check` 已通过；英文时间空结果/显式恢复、中文工具空结果与 locale continuity 已完成浏览器验证
- independent review 结论为 PASS；已知 residual risk 是既有每 slot 8 个候选的 bounded ranking 在未来大内容库可能产生保守 false-empty，但不会放行违反 hard constraint 的结果

## Issue #54 当前产物

- 新增六类 canonical scenarios：time-estimate continuity、tool continuity、constraint-eligible complete、valid partial、explicit empty、locale/back recovery
- 每类场景记录 input、expected contract、actual Recipe/Meal result、query continuity、locale behavior、verdict 与 failure class；当前全部 PASS，failure class 为 none
- 英文完整 journey、中文 locale continuation、英文 partial、英文 explicit empty/relaxation 与中文 missing-tools empty 已完成浏览器 dogfood；console 0 errors
- 当前 readiness decision 为 `ready for bounded external validation`；六类覆盖是 heuristic，不是统计样本或永久质量门槛
- evaluation 没有证明任何 named scenario 因 missing content 失败，因此不建议在 M7 内补内容
- 全量 245 项测试、lint、typecheck、production build 与 production-build 双语 smoke 已通过
- independent culinary/product review 结论为 PASS，无 unresolved major finding；跨菜系接受度与番茄重复感列为外部 dogfood residual risks
- 详细证据见 `docs/M7_EVALUATION.md`

## M8 已取消阶段的历史产物

- Issue #61 曾冻结 6–8 名目标用户的形成性研究协议、证据边界与隐私门禁；协议通过独立 product/research review，但从未执行
- Issue #62 曾提供研究专用公开入口，后因 Product Director 取消 M8 而由 Issue #67 撤下；通用 Beta feedback 保留
- 取消发生在任何联系或数据产生之前，因此不存在 participant roster 映射、consent、raw notes 或去标识化研究结果
- `docs/M8_EXTERNAL_VALIDATION.md` 仅作为未执行方案与隐私设计的历史记录，不是当前操作流程

## 下一步

- M8 已停止：不招募参与者、不继续研究准备，也不从 M7 readiness 自动推导研究工作。
- M10 与 M10.1 已完成并继续作为所有公开内容的强制发布门禁。
- M11 以当前 50 项产品闭环、内容包容量、视觉升级和治理能力收口；#91/#92 的内容扩充由 Product Director 延期，不是进行中任务。
- 当前执行 M12：完成新 fail-closed 门禁的独立复核，并将 50 条迁移 draft 与 Web 隔离合同收口。
- 随后执行 M13：从逐项明确 Public Domain 的原始资料确定性抽取、标准化和审查，按 120 → 250 → 500+ 里程碑构建 `game-commercial-ready` 数据，不降低 M10/M10.1 权利标准。
