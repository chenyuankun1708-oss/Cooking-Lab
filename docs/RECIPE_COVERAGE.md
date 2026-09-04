# Recipe Coverage

最近更新：2026-09-05

## Purpose

这份基线记录 Cooking Lab 从 30 道扩展到 100 道后的料理覆盖，用于以后 100 → 300 → 1000 的增量审计。它不是机械配额表；地域、菜系和 culture 只在可靠时填写。

## Existing 30 Audit

原有数据包含 23 道中国料理与 7 道来源未指定的 western/fusion 家庭料理。主要缺口是没有 region 覆盖，只有 3 个 cuisine ID，30 道全部是 easy；stir-fry 明显最多，且缺少 sear、bake、blanch、poach、grill、cold-mix。

## Final Composition

- 中国：40（原有 23 + 新增 17）
- 日本 6、韩国 6
- France 4、Italy 5、Spain 4、Greece 3、Portugal 1
- Thailand 4、Vietnam 3、Malaysia / Singapore / Indonesia / Philippines 各 1
- Mexico 4、United States 2、Peru 1
- India 3、Lebanon 2
- 来源主动留空：8，主要为现代 fusion / broad western recipe

中国 region 只标注 10 道可靠、明确的料理语境：Guangdong 3、Sichuan 2，Hunan、Yunnan、Northeast China、Northwest China、Chaoshan 各 1。其余中国家常菜不强行归地方。

## Coverage Matrix

- Cuisine：共 28 个 ID；Chinese 30、Fusion 7、Japanese 6、Korean 6、Italian 5，French / Spanish / Thai / Mexican 各 4
- Technique：simmer 18、stir-fry 17、stew 13、pan-fry 10、boil / cold-mix 各 9、rice-cook 8、sear 7、steam / braise 各 6、roast 4、poach / bake 各 3、dress 2、blanch / grill 各 1
- Dish type：main dish 51、staple 27、soup 10、cold dish 7、side dish 5
- Meal occasion：breakfast 4，其余不强行指定
- Dietary：vegan 38、vegetarian 12
- Difficulty：easy 76、medium 22、hard 2
- Total time：≤20 分钟 31、21–40 分钟 39、>40 分钟 30

Soup 继续是 dish type，不是 technique；rice-cooker 继续是 tool，不是 technique。

## Ingredient Coverage

Ingredient dataset 从 30 扩展到 73。新增 43 项均被至少一道新增 recipe 使用，补足白肉鱼、猪肩、羊肉、熟鹰嘴豆、熟黑豆、熟米饭、金枪鱼、意面、米粉、粉丝、面粉、面包、玉米饼、藜麦、常用蔬果、香草、奶酪与跨菜系常用调味。

状态会影响时间与营养时使用明确 ID：`dry-lentil`、`cooked-chickpea`、`cooked-black-bean`、`cooked-rice`。当前日常鹰嘴豆和黑豆 recipe 均从已熟、沥干状态开始；干扁豆 recipe 则在显示时间内完成煮制。

营养和价格继续标记为 demo-estimated。现有 milk 在原始 30 项中暂未被 recipe 使用，本 Issue 没有为提高使用率强行添加重复菜谱。

## Quality And Culture

100 道 structured recipe 全部保留并通过 schema、taxonomy、Flavor、Ingredient 引用与营养/成本计算校验。Issue #30 审计发现原数据 100 道都恰好为三步，这是覆盖扩张阶段的模板化信号，不再作为公开质量标准。

当前 10 道 published recipe 已按真实流程重写为 4–6 步，逐道补充锅温、颜色、气味、质地、汁水、最厚肉片熟度、调味时机和必要失败预防。其余 90 道继续为 draft，后续必须逐道深化，而不是批量把三步模板视为已发布内容。

所有新增 recipe 的 culture 留空。名称与 taxonomy 使用常见、低争议的国家或地方身份；简化或替代关键食材的 recipe 明确标记“家庭版”或“风味”，不写无来源的历史、起源或传统习惯。

自动化抽查固定覆盖 15 道新增 recipe，横跨中国、欧洲、日韩、东南亚、美洲、印度与黎巴嫩。全量校验覆盖 100 道的唯一 ID/slug、引用、单位、步骤及营养成本完整性。

## Publishing Coverage

- Structured recipes：100
- Published recipes：10
- Static recipe detail params：10
- Draft / unpublished recipes：90
- Published hero coverage：10 / 10

公开集覆盖中国、日本、韩国、泰国、越南、法国、意大利和黎巴嫩，以及 stir-fry、braise、cold-mix、stew、boil、simmer、poach 与主食料理。更完整的全量 coverage 仍描述 100 道内容储备，不能被解释成公开目录数量。

## Time And Practicality Hardening

全量扫描发现 10 道存在未计时的强制前置：9 道使用干鹰嘴豆或干黑豆却只显示 30–60 分钟，1 道泡菜炒饭声明生米却要求冷却熟饭。它们已改用明确的熟豆/熟饭状态；另将一处可选“提前煮蛋”改为本流程内处理。所有短时浸泡、盐渍和静置均已确认计入时间，并为原本不明确的等待补充分钟数。

家庭实践抽查覆盖 20 道新增 recipe，核对 servings、食材数量、时间、tools 与步骤顺序。补齐了两道意面、两道日韩主食和三道米粉/粉丝 recipe 的煮锅、滤篮、煎锅或电饭锅声明；越式牛肉米粉汤改为先煮米粉再复用同一口锅。30 / 45 / 60 分钟过滤分别返回 60 / 75 / 97 道，最大返回时间严格等于对应阈值。

## Next Expansion Risks

- 营养与价格仍是 demo estimate，不适合无审核扩展到更高精度。
- region coverage 有意保守；扩展到 300 道前需要更系统的文化审校与 provenance 工作流。
- easy 难度仍占多数，后续可补真正有差异的 medium recipes。
- Recommendation 数据量增长后需观察筛选信息密度，但本 Issue 不改 scoring architecture。
