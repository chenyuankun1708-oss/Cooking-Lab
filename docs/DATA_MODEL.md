# Data Model

## M6 Model Boundary

现有 100 道配方仍以 `Recipe` 为 source of truth。Issue #38 新增 `CulinaryItem` shared base + discriminated union、locale-based Translation、Story/Claim、Source/Evidence 与 Pairing signals contract，并提供 Recipe -> DishItem 的只读 adapter；它没有建立第二份 100 条静态数据。Issue #40 在 `data/culinary/` 增加 16 个原生内容条目，并由 `data/published-culinary-items.ts` 把 10 个 published Recipe 的 adapter 投影与原生条目组合成 26 项统一 public boundary。

`RecipePublicationStatus` 现在复用共享 `PublicationStatus`，`SupportedLocale / LocalizedLabel` 也从共享 localization contract re-export，因此现有 imports 与行为不变。完整 schema、类型限制、迁移矩阵和 persistence boundary 见 `docs/CULINARY_KNOWLEDGE_MODEL.md`。

M6 provenance contract 不要求 Source 拥有 URL。每个 Source 必须至少包含一种可重新定位的 locator：HTTPS URL、DOI、ISBN、archive/catalog identity 或 physical citation；书籍、手稿、印刷期刊和馆藏可以完全离线。Evidence 的 page/chapter/section/paragraph/timestamp/folio locator 只负责 Source 内部的精确位置。

Issue #39 增加 `Source.health` 观察状态与轻量 `ResearchRecord`。health 记录可达性/迁移/取代/权利变化，不是可信度；ResearchRecord 保存 accepted/rejected source decisions、considered claims、unresolved questions、reviewer/date 和 editorial decision。Open-license rights 必须显式记录 exact license、attribution、adaptation status 与 share-alike requirement。`data/research/*` 是流程验证与 evaluated catalog，不进入当前 production Recipe/Story 数据源。

`CulinaryItem` 不保存无语义的 generic evidence ID 列表。当前 factual provenance 只通过 `Story Claim -> Evidence -> Source` 表达；未来只有在出现明确的 item field assertion 用例后才增加窄 `ItemClaim`。

Issue #41 将 `StoryCopy` 明确为 `title + dek + non-empty sections`，并为 Story 增加独立 `publication.status`。Domain Story 仍保存 claim、Evidence 与 related entity ID；消费者页面不直接读取这些 registry，而由 application helper 投影为 title、正文、claim-aware explanation、context labels、相关公开内容与克制的 source citation。该 view model 不包含内部 reliability、rights、health、Evidence strength、ID 或 editorial note。

路由身份不写回 domain object：10 个 adapted Recipe 仍使用 `/recipes/[slug]`，16 个 native item 使用 `/culinary/[slug]`，6 篇 Story 使用 `/stories/[slug]`。这避免同一个 Recipe 出现两个 canonical URL，也不创建新的持久化字段。

Issue #42 不改变这些 domain identities，只在 Web route 外层增加 `/zh-CN` 与 `/en`。UI chrome 使用 typed message dictionary；公开 editorial translation 使用 locale-keyed reviewed entries。通用 `resolveTranslation` 可以服务编辑/迁移场景，但 consumer publication 使用 strict reviewed lookup，英文缺失时不回退中文。`RecommendationResult` 不再保存展示句子或本地化名称，只保存 criterion、reason、IDs、metrics 与 score breakdown；Web display adapter 按 locale 生成解释。

## Ingredient

当前包含 102 种 Ingredient，使用稳定 `id`、名称/别名、类别、每 100g 营养、默认单位、非重量单位近似克重、每 100g 静态参考价和标签。价格是 demo 估算，不代表城市或实时市场价格。其中原有 73 项继续覆盖 Recipe 数据集，Issue #40 的 29 项增量只补足新料理所需的茶叶、咖啡、香料、饮品与甜品食材。

- `id` 使用稳定的英文 kebab-case，名称和别名仅用于展示与搜索。
- `nutritionPer100g` 所有字段均为非负有限数；当前值是用于产品验证的公开常识级估算，不代表特定品牌、产地、烹饪状态或医学建议。
- `estimatedPricePer100g` 是静态人民币参考值，用于验证成本计算；不代表实时行情或特定地区售价。
- `dataQuality` 当前固定为 `demo-estimated`，让上层明确这些数据只用于产品与计算逻辑验证，不能按生产级精度解释。未来可通过 repository/provider 换成经过溯源和审核的数据集，而不改变上层计算接口。
- `piece`、`ml`、`tsp`、`tbsp` 通过 `approximateUnitWeight` 换算为克。同一种食材的大小、密度和量具会产生偏差，因此只展示适度精度。
- `g` 直接按克计算，`kg` 乘以 1000。`ml` 不做通用 1:1 假设；它与 `piece`、`tsp`、`tbsp` 一样，必须使用当前食材自己的正有限近似克重。缺失或非法换算数据会产生领域错误，不会返回 0 或猜测密度。
- 使用非重量默认单位的食材必须提供对应近似克重。数据校验同时检查重复 ID/名称、非法营养值、非法价格和无效换算重量。
- 当前类别是面向 MVP 筛选的粗粒度烹饪分类；例如豆类归入 `protein`、块茎归入 `vegetable` 并使用 `staple` 标签。若后续需要食品学分类或多维筛选，应另行升级 schema，而不是改变现有类别含义。
- 当 raw / dry / cooked / canned / frozen 状态会显著改变营养、重量、时间或推荐匹配时，状态必须体现在稳定 ID 和显示名称中，不能由 recipe 文案隐含。当前使用 `dry-lentil`、`cooked-chickpea`、`cooked-black-bean`、`cooked-rice`；日常熟豆 recipe 不再引用含义模糊的干豆 ID。
- 当前 73 种 Recipe 食材覆盖 100 道菜谱的主要类别；新增 29 种 CulinaryItem 食材均被 native item 引用。自动化校验继续阻止两套内容的悬空 Ingredient ID。

## Recipe

当前包含 100 道 Recipe；每道包含标识、描述、publication、taxonomy、可选文化内容、份数、结构化食材用量、烹饪时间/油盐糖/难度、厨具、成本元数据、步骤和原理。每一步有 `instruction` 与关键差异字段 `why`。

M6 期间这些字段继续 canonical；不得同时手工维护 Recipe 与 CulinaryItem 两份内容。迁移只通过 adapter 或后续 repository mapper 完成。`culture` 将来会由 source-backed Story/Claim/Evidence 取代，但未经 provenance 审核的旧文本不会自动升级为事实性 Story。

- 当前静态数据要求 `id` 与唯一 kebab-case `slug` 一致；Ingredient 引用必须存在，且用量必须能通过现有单位系统换算为克。
- `publication.status` 是 `draft / reviewed / published` 三态编辑决定。它不代表技术校验结果；只有 `published` 且通过 publishing eligibility 的 Recipe 才可公开。
- Canonical source of truth 是 `recipe.taxonomy`。新 recipe 不再维护独立的 `cuisine / category / method / tags` 静态字段。
- `taxonomy` 是新的 source of truth，字段为：
  - `origin?: { countryId; regionId? }`
  - `cuisine: { cuisineId; subCuisineId? }`
  - `techniques: string[]`
  - `mealType: { dishTypeId; mealOccasionIds? }`
  - `dietaryTagIds?: string[]`
  - `browseTagIds?: string[]`
- `recipe.flavor` 是 Flavor Profile 的唯一 canonical source。它与 taxonomy 分离，包含 `tastes` 基础味强度，以及可选 `aromaIds / textureIds / characterIds`；稳定 ID 与中文展示 label 分离，完整定义见 `docs/FLAVOR_MODEL.md`。
- geography 与 cuisine tradition 明确分离：`country / region` 不等于 `cuisine / subCuisine`。不是每道菜都需要填满四层。
- taxonomy machine value 统一使用稳定英文 ID；中文和英文展示文案由 taxonomy registry 提供，不在 UI 中散落硬编码 label。
- `techniques` 表示烹饪动作或加热方式，例如 `pan-fry`、`stir-fry`、`steam`、`boil`、`simmer`、`stew`、`braise`、`roast`、`dress`、`rice-cook`。旧模型里的“汤”不再作为 technique，而是 `dishTypeId = "soup"`；“电饭锅”拆为 `tool = "rice-cooker"` 与 `technique = "rice-cook"`。
- `mealType` 把“料理类型”和“用餐场景”拆开：`dishTypeId` 表示主菜、主食、汤、凉菜、配菜；`mealOccasionIds` 表示早餐、午餐、晚餐等场景。
- Flavor 强度是用于浏览和推荐的编辑性主观近似，不是化学或感官实验测量。旧 `taxonomy.flavorProfile` 已移除，不保留兼容双写。
- `dietaryTagIds` 只保存静态事实标签，例如 `vegan`、`vegetarian`；`high-protein`、`high-fiber`、`quick`、`low-oil`、`no-added-sugar` 等通过 helper 从营养或烹饪字段派生，不把易过期的计算结果硬编码回 recipe 数据。
- `culture?` 是可选的结构化内容块：`summary`、`originNote`、`traditionalContext`、`modernContext`、`sources?`。没有可靠依据时留空，不为了“文化感”编造背景。
- `culture.sources` 使用轻量 reference 对象（`title`、可选 `url / publisher / accessedAt`），只解决“能追溯到哪里”这一需求，不引入 CMS 或 citation engine。
- `heroImageId?` 是 Recipe 对集中图片 registry 的可选稳定引用。图片来源、授权、alt、焦点和交付 metadata 不复制进 Recipe；`data/recipe-images.ts` 是 image metadata 的 canonical source of truth。
- Legacy compatibility strategy：现有 filters / recommendation / detail UI 继续通过 `lib/taxonomy.ts` 派生 cuisine、technique 和 tag 语义，但这些都是 adapter，不再是 recipe data 的第二套 source of truth。
- `cooking.oil`、`salt`、`addedSugar` 是配方级显式用量，并由校验器与食材明细或营养估算核对；含韩式辣酱、泡菜或面包的 recipe 会保留相应 added-sugar estimate。
- Recipe time contract：`cooking.totalTime` 表示用户已经拥有 `recipe.ingredients` 所声明状态的食材后，从开始准备到可以食用所需的主动操作与必要等待时间；它必须等于 `prepTime + cookTime`。核心流程不能依赖未计时的浸泡、解冻、腌制、预煮或冷却。
- `nutrition` 不存储在静态 Recipe 中，营养和成本分别由 Nutrition Engine 与 Cost Engine 根据食材用量计算。
- Recipe 数据仍标记为 `demo-estimated`。步骤和 `why` 已完成人工可读性检查，但时间、营养和成本仍用于产品验证，不是专业餐饮、医学或实时价格数据。
- V1 optional 语义：只要 optional 食材已出现在传给 engine 的列表中且带有用量，就计入营养和成本；若用户未选择它，调用方应在计算前从输入列表移除。

## Nutrition

字段为 calories、protein、fat、saturatedFat、carbs、sugar、addedSugar、fiber、sodium，其中 sodium 单位为 mg，其余宏量营养素单位为 g，calories 单位为 kcal。基础算法为 `Σ(食材克重 / 100 × 每100g营养)`。领域层保留 JavaScript number 计算精度并返回 `estimated: true`；不为 UI 提前舍入。首期不模拟烹饪损耗、实际吸油率、汤汁残留、品牌差异和个体可食部，结果不是医学级精度。

Nutrition Engine 对缺失食材、非法营养数据或单位转换失败返回结构化 warning，并以 `complete: false` 标记部分结果。空输入是有效的完整零估算。任何会产生 NaN/Infinity 的单项都被拒绝，不会污染累计值。

## Cost

按食材克重与静态每 100g 参考价相乘并汇总。领域层保留未舍入的 CNY 数值并返回 `estimated`、`complete` 与结构化 warnings；缺失食材、非法价格、转换失败或非有限结果不会被静默计为成功。未来价格来源应通过独立 provider/repository 注入。

展示层建议独立格式化：calories 显示整数（如“约 520 kcal”），蛋白质等宏量营养素保留 1 位小数，sodium 以 mg 显示，成本按界面密度显示整数或 1 位小数并明确“预计”。这些展示规则不写入 engine。

## Validation

`validateIngredients`、`validateRecipes` 与 `validateImageAssets` 分别负责静态实体规则；`validateDataset` 组合三者并检查完整 Ingredient/Recipe/Image 集合。当前只在自动化测试或显式 build-time 检查中运行，不在 production 页面每次 render 时重复执行。TypeScript 负责结构约束，validator 负责重复值、引用、数值范围、单位可换算性、图片授权 metadata 及跨字段规则。已知需要长时间浸泡与煮制的 `dry-chickpea` / `dry-black-bean` 若总时间短于 120 分钟，会被直接拒绝。

`evaluateRecipePublishingEligibility` 是更窄的发布 gate：在 Recipe validation 之外验证 nutrition/cost completeness、hero/license/local asset/alt、公开步骤信息量和事实性 culture provenance。更深的 sensory cue、doneness、失败预防与 food accuracy 仍由人工 editorial review 决定，不使用脆弱 NLP 规则自动盖章。当前 public adapter 暴露 10 道 published Recipe，静态详情参数也只有 10 个。

`evaluateCulinaryItemPublishingEligibility` 按 item type 执行统一门禁：所有公开条目需要已审核默认语言、可解析 taxonomy/pairing、合法 primary image 和可达 Story provenance；procedural item 还需完整 ingredient 引用、类型对应的最少步骤和料理 rationale。dish/dessert 必须具备 nutrition 与 cost model；plain tea 和成品酒可以诚实使用 `not-modeled`，成品酒以 serving guidance 发布，不编造 cooking steps。`getPublishedCulinaryItems()` 是 26 项统一读取边界，但当前 Recipe 页面、推荐、相近料理与 SSG 仍继续读取原有 10-item Recipe public source。

## Recommendation

输入 `RecommendationCriteria`，输出带 `eligible`、`score`、结构化 breakdown、硬失败、缺失食材/厨具与匹配信号的 `RecommendationResult`。时间、每份热量/蛋白质/油盐糖/成本及已声明厨具是硬限制；食材匹配、菜系、标签、技法与 Flavor 是归一化加权软偏好。Flavor 只改变合格料理的顺序，不会成为硬排除条件。core 不保存中文/英文 explanation；当前 Web 通过 `lib/recommendation-display.ts` 按 locale 生成自然理由。详细口径与权重见 `docs/RECOMMENDATION.md`。

## Decision Context

M7 Issue #51 将 `RecommendationCriteria` 明确为可跨页面携带的 `DecisionContext`，但不建立第二套条件数据模型。`types/decision-context.ts` 穷举每个字段的稳定 `dc*` query key、值类型与作用域；`lib/decision-context.ts` 负责 allowlisted parse/serialize、确定性归一化、稳定排序与 Meal adapter。未知 key/ID 被丢弃；重复列表值去重；重复 hard limit 采用更严格的合法值，避免畸形 URL 静默放宽条件。无 `dc*` 参数的旧 URL 继续解析为空 context。

整餐语义当前只包括：`maxTime` 约束页面展示的 deterministic elapsed estimate，而不是现实厨房完成时间保证；非空 `availableTools` 表示用户声明的完整可用工具集合。budget、calories、protein、added sugar、oil 与 salt 仍是 Recipe-only，ingredient/cuisine/tag/method/Flavor 仅携带。Meal adapter 只允许输出 `maxTotalTimeMinutes` 与 `availableToolIds`；在建立 portion、sharing 与 per-diner allocation contract 前，不把 Recipe 的每份营养或成本直接相加解释为整餐 hard constraint。

## Pairing And Meal Composition

`PairingScoreResult` 保存 score、dimension breakdown、structured reasons/cautions 和选中的 role pair；不保存消费者文案。`MealComposition` 固定 `anchorId`，保存 template/slots、全部 pairings、meal-level breakdown、缺失 slot、准备负担以及 nutrition/cost coverage。`partial-pair` 明确表示当前库不能支撑完整模板，不与 complete 混淆。

`PreparationTime.activeMinutes` 表示主动操作时间，必须介于 prep 与 total contract 允许的范围内。整餐 nutrition/cost 使用 `complete / partial / unavailable`，unknown/not-applicable 不等于 zero。Pairing identity、Flavor/taxonomy ID、meal role 与 serving context 均保持 locale-independent；显示标签由 adapter 解析。完整 contract 见 `types/pairing.ts` 与 `docs/PAIRING.md`。
