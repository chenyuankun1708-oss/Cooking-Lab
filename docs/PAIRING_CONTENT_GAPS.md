# Pairing Content Gaps

最近更新：2026-09-05

## Current Shape

Pairing readiness audit 覆盖全部 26 个 locale-complete published CulinaryItem，没有从 90 个 draft Recipe 借内容。当前结构为 13 dish、3 dessert、4 tea、2 coffee、2 non-alcoholic drink、2 alcoholic drink；10 个 drink 占全库 38.5%。

| Gap | Evidence | Product response |
| --- | --- | --- |
| Starter 太少 | 只有 3 个 assignment | 保留 `starter-main-drink`，不开放四道式模板 |
| Side 不足 | 唯一 side 与 starter 共用希腊乡村沙拉 identity | 不开放独立 `main-side-drink` |
| Dessert 太少 | 只有 3 项，且 2 项准备等待很长 | alternatives 不承诺 lighter/simpler 等伪 objective |
| 无酒精晚餐饮品不足 | 只有咸味拉西明确覆盖 dinner；Agua Fresca 覆盖 lunch/social | 酒精默认排除，但跨 cuisine drink 会较常出现 |
| 轻脆前菜不足 | 主要集中在拍黄瓜、希腊沙拉与鹰嘴豆泥 | 不降低 pair threshold 来填满组合 |
| Cuisine coverage 不均 | 14 个 country ID，但同 cuisine 的完整 starter/main/drink 链很少 | 跨 cuisine 为中性，依靠 Flavor/role/context 排序 |
| Texture signals 不齐 | 部分 clear drink 没有 texture；creamy drink 偏多 | 缺失维度使用中性值，不推断不存在的 texture |
| Weight zones 不平衡 | drink 覆盖轻/中/浓，但 starter 主要偏轻 | whole-meal repetition/weight score 继续保守处理 |

## Representative Anchor QA

人工抽查覆盖 Dongpo Pork、Tom Yum、Greek Village Salad、Tiramisu、Longjing Tea、Espresso、Miso Tofu Soup、Bibimbap、Tomato Basil Pasta 与 Hummus。所有结果固定 anchor、只使用 published items、默认不含酒精并保持稳定顺序；dish、starter/soup、dessert、tea 与 coffee anchor 均能生成现有模板或 partial pair。

审查也确认内容限制会影响组合风格：Greek Salad、Espresso 与 Hummus 等 anchor 容易出现跨 cuisine 结果；这不是 cuisine bonus 的误用，而是当前同地域 role 链稀疏。结果必须仍通过 Flavor、role、context 与 meal-level 门槛，并显示 trade-off。后续内容建设应优先补真实缺口，不为当前 UI 临时造 filler。

## M7 Editorial Priorities

1. 增加可在 lunch/dinner 使用的无酒精饮品，覆盖 clean、herbal、citrusy 与 lightly bitter zones。
2. 增加有 crisp/light 信号、准备负担低的 starter 与真正独立的 side。
3. 在现有主要 cuisine 中补至少一条可连贯组合的 role 链，而不是继续增加孤立 drink。
4. 增加 preparation 较轻、texture 不重复的 dessert，再评估四道式模板。
5. 继续人工审核 Flavor、serving context 与 portion semantics；不要让算法反向制造文化归属或感官事实。

## Deferred Templates

四道式与独立 side 模板只有在候选数量、地域/风味分布和实际 QA 足以稳定生成多组结果后才启用。内容增长前继续返回较短 complete meal、partial pair 或诚实空状态。Issue #43 不新增 CulinaryItem 来掩盖这些缺口。
