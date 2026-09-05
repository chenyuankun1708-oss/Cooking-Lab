# Recipe Publishing

最近更新：2026-09-05

## Purpose

Cooking Lab 明确区分“已经存在的结构化 Recipe 数据”和“适合公开给用户的 Recipe”。当前保留 100 道 structured recipes，其中 10 道通过人工内容审校并进入公开集合；其余 90 道继续用于数据校验、coverage 分析和后续编辑，不会被删除或伪装成已发布内容。

## Publication Model

`recipe.publication.status` 是明确的编辑状态：

- `draft`：仍需内容、图片或人工复核
- `reviewed`：已经过一轮人工审阅，但尚未决定公开
- `published`：编辑已明确决定公开

状态和技术资格彼此独立。技术字段完整不会自动把 Recipe 变成 `published`；编辑把状态设为 `published`，也不能绕过 eligibility。公开条件始终是：

`status === "published" && eligibility passes`

## Eligibility

`lib/recipe-publishing.ts` 提供 framework-independent 的确定性检查，覆盖：

- Recipe schema、taxonomy 与 Flavor 合法
- 营养和成本可完整计算
- 时间合同与 Ingredient state 合法
- hero 引用存在且 role、路径、license、attribution 合法
- 本地 hero 文件存在
- hero alt 描述具体画面
- ingredients、tools、steps 与 principles 完整
- step instruction 与 `why` 具备最低可执行信息量
- `originNote` / `traditionalContext` 有完整 culture provenance

它不会用正则表达式假装判断“菜谱是否好吃”“状态判断是否专业”或“图片是否真的像这道菜”。这些属于人工 editorial review；`published` 状态是人工判断完成后的明确记录。

## Quality Audit

Issue #30 对 100 道 Recipe 的基线审计结论：

| 维度 | 结果 | 处理 |
| --- | --- | --- |
| Schema / taxonomy / Flavor | 100 / 100 可通过现有结构校验 | 保持全量数据 |
| Nutrition / cost | 100 / 100 可完整计算 | 进入自动 eligibility |
| Hero | 10 / 100 有本地、合法且可追溯 hero | 仅这 10 道进入初始候选集 |
| Step shape | 审计前 100 道都恰好为 3 步，存在明显模板化信号 | 10 道 published recipe 改为按真实流程拆分的 4–6 步 |
| Sensory / doneness cues | 多数 recipe 至少有一个状态词，但只有少数做到逐步可观察 | 对 published set 逐道人工深化；不把文本启发式做成脆弱 gate |
| Hidden prep | 全量关键词复扫未发现 #19 之后新增的未计时强制前置 | published set 的浸泡、盐渍、煮饭与等待均在 totalTime 内 |
| Cultural claims | 当前事实性 `originNote` / `traditionalContext` 没有无来源实例 | 新增发布规则阻止无完整来源的事实性文化内容上线 |

## Initial Published Set

初始 10 道均已有经过来源、授权和食物准确性复核的 hero，并覆盖中国、日韩、东南亚、欧洲和黎巴嫩：

- `tomato-scrambled-eggs`
- `home-mapo-tofu`
- `sichuan-smashed-cucumber`
- `japanese-miso-tofu-soup`
- `korean-bibimbap-home`
- `thai-basil-chicken`
- `vietnamese-beef-noodle-soup-home`
- `french-ratatouille`
- `italian-tomato-basil-pasta`
- `lebanese-hummus-plate`

本轮没有为了数量增加图片或扩大 published set。

## Editorial Review

人工审校逐道检查 servings、ingredient state、tools、时间、步骤顺序、调味时机、图片内容、授权以及营养/成本计算。步骤数量由实际流程决定，每一步尽量包含：

1. 可执行动作
2. 可观察的颜色、气味、质地、声音、汁水或锅内变化
3. 对下一步真正有帮助的原因或失败预防

肉类以最厚部位不再呈生红、鱼肉由半透明转为不透明并可分片、蛋液凝固状态、蔬菜颜色与软化程度等作为家庭厨房判断，不伪装成项目没有维护的精确核心温度标准。

## Time And Hidden Prep

`cooking.totalTime` 继续表示：用户已经拥有 `recipe.ingredients` 声明状态的食材后，从开始准备到可以食用所需的主动操作与必要等待时间。强制浸泡、腌制、解冻、预煮、冷却、静置或设备预热必须计入时间，或由 Ingredient ID 明确说明已完成状态。

## Sources

Cooking Lab 的内容是根据可靠资料、料理常识和实际可执行性进行结构化整理与独立改写，不复制来源网页的创作性菜谱文字，也不把单一来源宣称为唯一权威。

- 图片 provenance 继续由 `data/recipe-images.ts` 记录 source URL、author、license、license URL 与 attribution。
- 起源、历史或传统吃法等事实性文化主张必须在 `culture.sources` 中提供 title、publisher、HTTPS URL 和 `YYYY-MM-DD` 访问日期。
- 没有可靠来源时，删除事实性主张，只保留明确的现代 recipe description，或留空。

## Public Data Access

`data/published-recipes.ts` 是当前 Web 唯一公开 Recipe adapter：

- `getPublishedRecipes()`
- `getPublishedRecipeBySlug()`
- `getPublishedRecipesBySlugs()`
- `listPublishedRecipesByTechnique()`
- `getPublishedRecipeStaticParams()`

它在建立公开集合前断言所有 `published` Recipe 都通过 eligibility。Homepage、catalog、recommendation input、cuisine/technique counts、detail lookup 和 SSG params 均消费这一入口。未发布 slug 返回 `notFound()`，也不会生成静态详情页。

完整 `recipes` 仍是内容库 source，用于 validation、coverage 和编辑工作；公开 UI 不直接 import 它。

## Future Workflow

后续每次发布 Recipe 的顺序是：完成结构字段与时间合同，补齐并核验 hero，完成逐道人工烹饪审校，运行 eligibility，再明确把状态从 `draft` 或 `reviewed` 改为 `published`。增加公开数量必须来自真实完成的内容批次，不建立 CMS，也不以自动分数替代编辑判断。

## CulinaryItem Boundary

Issue #40 没有把 Recipe gate 改造成所有料理类型共用的一张 required-field 清单。Recipe 继续使用本文件的发布规则；native content 由 `evaluateCulinaryItemPublishingEligibility()` 按 item type 验证 preparation、image、Story provenance 与 nutrition/cost applicability。统一 repository 只 adapter 投影已发布 Recipe，不复制或改写 `recipe.publication`。
