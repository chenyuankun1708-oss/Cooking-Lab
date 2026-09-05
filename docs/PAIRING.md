# Pairing And Meal Composition

最近更新：2026-09-05

## Purpose

Pairing 回答“已选料理与什么同桌更协调”，Similarity 回答“哪些料理与它相似”。两者都可读取 canonical Flavor、taxonomy 与 preparation，但不复用分数、排序或阈值。Pairing core 固定 anchor，只消费 locale-complete published CulinaryItem，并返回稳定排序、结构化理由、结构化注意项和内部 breakdown；自然语言由 Web display adapter 生成。

## Readiness Audit

当前公开库为 26 项：5 个 main、3 个 staple、2 个 soup、3 个 starter assignment、1 个 side assignment、3 个 dessert 与 10 个 drink。希腊乡村沙拉同时承担 starter/side，因此 role assignment 会重叠。饮品占 38.5%，是当前最明显的结构偏斜。

每个 item 的 readiness 输出包括 type、meal role、serving context、cuisine、country/region、Flavor、weight、temperature、texture、nutrition/cost availability、active/total time 与可兼容 role。完整矩阵由 `auditPairingReadiness()` 确定性生成；当前 26 项均有 role、context、weight 与 temperature，个别饮品没有 texture，plain tea 与成品酒保留真实的 nutrition/cost applicability。

## Pairing Model

`scorePairing(anchor, candidate, context)` 先检查 identity、published status 与 role compatibility，再计算：

| Dimension | Weight | Reason |
| --- | ---: | --- |
| Flavor complement | 0.24 | acid/richness、cooling/spicy、sweet/bitter-roasted、fresh/umami 是第一版核心 |
| Weight balance | 0.16 | 避免 rich + rich 持续堆叠 |
| Flavor continuity | 0.12 | 共享强 taste 或 aroma 提供连接线索 |
| Texture contrast | 0.12 | 避免连续重复主要口感 |
| Meal role | 0.10 | 先保证餐桌角色可共存，不支持 main + main |
| Cuisine coherence | 0.10 | 同 cuisine/country 加分；跨 cuisine 为中性 0.5，不处罚 |
| Serving context | 0.10 | 共享场景加分，缺少共享场景只形成 caution |
| Temperature | 0.06 | 冷热关系提供较小的节奏信号 |

权重来自当前 schema 能表达的证据与 26 项内容 audit，不是实验测量。Nutrition 和 cost 不进入 pair score；数据缺失时不应借由“零值”改变风味排序。

## Meal Templates

当前启用：

- `main-drink`
- `starter-main-drink`
- `main-drink-dessert`
- `drink-dessert`

四道式 `starter + main + drink + dessert` 与独立 `main + side + drink` 暂不启用。当前 starter/side 覆盖太浅，强行开放只会重复少量候选或降低质量门槛。完整模板无法达到门槛时，engine 可以返回一个 `partial-pair`；没有合格 pair 时返回空结果。

## Meal-level Score

Meal score 不只是 anchor pair 之和。它检查全部 item pair，并独立计算 role completeness、whole-meal Flavor balance、texture variety、weight progression、preparation practicality 与 repetition penalty。相同强味、主要 texture 或 rich character 反复出现会扣分。消费者只看到排序、理由与 trade-off，不显示 raw score 或百分比。

## Preparation Burden

`PreparationTime.activeMinutes` 是显式 domain contract。Recipe adapter 使用 `prep + cook`；native item 逐项审核。整餐负担输出：

- active minutes：各项主动操作相加
- sequential elapsed：各项 total time 相加
- coordinated elapsed：`max(total active, longest individual total)` 的第一版保守估算
- parallelizable minutes：sequential 与 coordinated 的差
- procedural / serving-only 数量
- 重复使用的工具

这不是复杂 scheduler。未来如需步骤依赖、炉口资源或精确并行排程，应单独建模，不能把当前估算解释为厨房保证。

## M7 Whole-meal Constraints And Recovery

Public Pairing 只执行两个 whole-meal hard constraints：`maxTime` 约束当前页面展示的 coordinated elapsed estimate，非空 `availableTools` 是用户声明的完整可用工具集合。每个候选返回结构化 `satisfied / exceeded` outcome；工具失败保留 exact missing tool IDs。预算、calories、protein、added sugar、oil 与 salt 继续只约束 anchor Recipe，不进入 Meal engine。

候选选择顺序为：合格 complete → 合格 partial → explicit empty。Complete 不会越过 hard constraint；partial 从所有达到 pairing 门槛且满足条件的 candidate 中选择。空结果区分 quality threshold 与 constraint exceeded，并只提供“移除整餐预计时间条件”或“移除整餐可用工具条件”这两种 allowlisted recovery。放宽不会静默发生；用户选择后 URL 保留原 `dc*` context，并额外记录稳定排序的 `relaxMeal` 值。

## Nutrition, Cost And Alcohol

Nutrition/cost 仅汇总具备可比较数据的 item，coverage 为 `complete / partial / unavailable`。unknown、not applicable 与 zero 保持不同；plain tea 或 finished alcohol 缺失数据时绝不按零计算。

默认 composition 排除 alcoholic drink。酒精只作为中性的可选料理组合，不承担“完整一餐必需项”，不包含健康、饮用量、挑战、购买或优化文案。酒精 anchor 或含酒组合可从真实发布库寻找 non-alcoholic drink replacement；没有候选时不伪造。

## Consumer And Localization

`/{locale}/pairing/[slug]` 的内容身份仍限制为 26 项 × 2 locales；因为 M7 在 Server Page 读取 request-time query，页面按已知 locale + slug 动态渲染，而 query 不创建额外内容身份。Recipe 与 native CulinaryItem 详情页使用“搭配这一餐 / Build a meal around this”进入；Similarity 区域继续独立存在。页面展示 anchor、作用域明确的 Decision Context、首选组合、理由、注意项、准备/营养/成本摘要、确定性 alternatives，以及存在时的中性酒精或无酒精替代。整餐 elapsed 文案始终明确为 estimate。

Engine 不 import locale 字典、React、Next、DOM、CSS、filesystem 或 database。`lib/meal-composition-display.ts` 才将 reason/caution/template/coverage/tool ID 转为 `zh-CN / en` 文案，公开读取由 locale-complete published repository 控制。

## Determinism And Scaling

候选按 score 降序、ID 升序稳定打破平局；禁止 random、LLM、embedding 或 vector search。当前每个 slot 先截取最多 8 个候选，再枚举少量、最多三 slot 的模板，26 项规模足够直接计算。到 500–1000 项时，优先按 role/context 建索引并使用 bounded beam search 或缓存 pair score；当前不为未来规模引入数据库或索引服务。
