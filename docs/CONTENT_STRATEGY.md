# Content Strategy

最近更新：2026-09-05

## M5 内容目标

当前数据集已从 30 道扩展到 100 道结构化菜谱，形成第一版可审计的料理世界地图。

M5 的内容目标不是“随便再加 70 道菜”，而是把数据集扩展成一个更像“小型世界料理地图”的结构化内容体系。

当前总量：100 道 structured recipes，其中 10 道 published recipes；另有 16 个 native CulinaryItem，与 adapted Recipe 组成 26 项统一公开料理库。Recipe coverage 见 `docs/RECIPE_COVERAGE.md`，新库组合见 `docs/CULINARY_PORTFOLIO.md`。

## Publishing Strategy

结构完整不等于内容已经适合公开。Recipe 使用 `draft / reviewed / published` 表达人工编辑状态，确定性 eligibility 另行检查 schema、计算、时间、hero、授权、alt、步骤完整性与 culture provenance。只有 `published` 且 eligibility 通过的 Recipe 才进入公开首页、目录、推荐和详情。

当前初始公开集只包含 10 道已有合法 hero 且完成逐道内容深化的 Recipe。其余 90 道继续保留，不为了公开数量降低图片或步骤质量。

## 当前内容缺口

当前数据已经覆盖多种核心技法，但整体仍明显偏向 MVP 验证用途：

- 菜系分布较粗
- 地域层次不足
- 国际覆盖面不足
- 料理故事、文化背景与图像系统尚未建立
- 目录和详情页仍主要靠结构字段，而不是内容世界感驱动

## 100 Recipe Coverage Direction

以下配比是 M5 的规划目标，不是一次性刚性约束：

- 中国地方 / 家常料理：约 40
- 欧洲料理：约 18
- 日本 / 韩国：约 12
- 东南亚：约 12
- 美洲 / 墨西哥等：约 8
- 印度 / 中东等：约 5
- 现代沙拉 / 早餐 / 跨文化：约 5

允许在数据整理阶段根据：

- ingredient coverage
- technique balance
- content quality
- cultural reliability

做小幅调整，但整体目标仍应保持“约 100 道，且具有世界料理覆盖感”。

## Recipe Time And Ingredient State

用户看到的 `totalTime` 必须可用于实际决策：在用户拥有 recipe 声明状态的食材后，它覆盖从开始准备到可食用的主动操作和必要等待。强制浸泡、预煮、腌制、解冻、冷却或静置不能藏在步骤之外，也不能依赖用户提前完成而仍显示为短时 recipe。

状态会显著改变营养、重量、时间或推荐匹配时，Ingredient ID 必须明确区分 `raw` / `dry` / `cooked` / `canned` / `frozen`。日常家庭 recipe 优先声明可直接使用的熟豆或罐装豆；保留干豆时，完整处理时间必须进入 recipe 时间。短时并行浸泡或静置应在步骤中写明分钟数，并计入 `prepTime` 或 `cookTime`。

## Technique Coverage

M5 数据扩充时，至少要保证以下核心技法有代表性覆盖：

- 煎
- 炒
- 蒸
- 煮
- 炖
- 焖
- 烤
- 汤
- 凉拌
- 烩
- rice cooker / 电饭锅
- 其他必要核心家庭技法

扩充 recipe 时，不应只按菜名数量堆叠，而要检查：

- technique coverage
- ingredient diversity
- meal type balance
- weeknight practicality
- discoverability in UI

## Recipe Taxonomy v2

M5 需要从当前粗粒度的 `cuisine` 升级到更可扩展的 taxonomy，但不能为了整齐而强行让每道菜都填满所有层级。当前 v2 已采用：

- `origin?: { countryId; regionId? }`
- `cuisine: { cuisineId; subCuisineId? }`
- `techniques: string[]`
- `mealType: { dishTypeId; mealOccasionIds? }`
- `dietaryTagIds?: string[]`
- `browseTagIds?: string[]`

这套结构的核心判断是：

- `country / region` 与 `cuisine / subCuisine` 分离建模
- `dishType` 与 `meal occasion` 分离建模
- `soup` 归入 dish type，不再把“汤”当 technique
- `rice-cooker` 归入 tool，`rice-cook` 才是 technique
- 只保留当前 100 recipes 真正使用的 taxonomy 项

- `country / region / cuisine / subCuisine` 只在有可靠依据时填写
- 不是每道菜都必须拥有四级完整地域链
- 避免把所有语义都塞进一个 `tags` 数组
- taxonomy 必须可校验、可迁移、可回退，并能通过 helper 继续兼容当前 filter / recommendation 语义

Flavor 不属于 taxonomy。当前以 `recipe.flavor` 单独描述具体配方的基础味强度、香气、口感和饮食感受，并通过集中 registry 生成面向用户的中文表达。迁移内容只标记能从配方和做法合理判断、且会影响选择的特征；不为覆盖率填满字段，也不把 Flavor、Cuisine、Technique、Dietary 或 Meal Occasion 混回通用 tags。

### Static vs derived attributes

以下标签适合作为静态 taxonomy 保存：

- `dietaryTagIds`：例如 `vegan`、`vegetarian`
- `browseTagIds`：例如 `one-pot`、`vegetable-rich`

以下语义更适合作为运行时派生值，不直接写死进 recipe 数据：

- `high-protein`
- `high-fiber`
- `quick`
- `low-oil`
- `no-added-sugar`

原因是这类结论依赖营养计算或烹饪字段，一旦配方变动，硬编码 tag 很容易过期。

## Cultural Metadata

Recipe 当前使用轻量 optional 结构：

- `summary`
- `originNote`
- `traditionalContext`
- `modernContext`
- `sources?`

用途包括：

- 历史故事
- 菜名来源
- 地域背景
- 传统吃法
- 传统版本与现代家庭版本差异

要求：

- 全部为 optional
- 结构清晰
- 没有可靠依据就留空
- 不虚构历史
- 不为了内容丰富而制造“文化感”

### Provenance strategy

`sources` 使用轻量 reference 对象记录最少必要来源字段：

- `title`
- `url?`
- `publisher?`
- `accessedAt?`

目标不是建立 citation engine，而是避免未来在 recipe detail 上出现无法追溯的文化说明。当前 100 道菜只对少数低争议、容易确认语境的菜品给出 cultural metadata 示例，其余留空。

上面的 `Recipe.culture.sources` 是 legacy Recipe 的轻量兼容结构，不是 M6 的长期 provenance model。新的文化/历史内容必须先经过 `ResearchRecord`，再沿 `Story Claim -> Evidence -> Source` 保存；不得把未经研究的 legacy culture 自动升级为 Story。完整研究流程、八类问题模板与三个 mini exercises 见 `docs/CONTENT_RESEARCH.md`，来源和版权规则见 `docs/SOURCE_POLICY.md`。

## Recipe Detail v2 Content Surface

未来详情页内容面建议包含：

- hero image
- recipe name
- country / region / cuisine
- 一句话简介
- time / difficulty / nutrition / cost
- 这道菜
- story / origin
- 为什么这样做
- cooking science
- ingredients
- steps
- tools
- variations
- substitutions（future-ready）
- related recipes

当前 M5 只定义这些内容面，不在本轮全部开发。

Taxonomy 详细约定、label strategy 与示例见新增的 `docs/TAXONOMY.md`。

## Image System v1

M5 必须引入真实料理视觉系统，但本轮只定义 schema 和原则，不批量下载或生成图片。

最小目标：

- 每道菜未来可拥有 `heroImage`

未来扩展：

- `ingredientImages`
- `stepImages`
- `finishedDishImages`

当前实现使用 `Recipe.heroImageId?` 关联 `data/recipe-images.ts` 的 framework-independent metadata。图片 registry 集中保存 src、role、delivery、尺寸、焦点、source、license、author、source URL、license URL、attribution 与可选 AI provenance；完整契约与素材工作流见 `docs/IMAGE_SYSTEM.md`。

### 图片原则

- 新鲜
- 自然
- 明亮
- 有食欲
- 食材纹理清楚
- 自然光优先
- 少量摆盘
- 不油腻
- 不过度滤镜
- 不使用明显低质量 stock / watermark 图片

### 版权原则

不得：

- 直接从 Google 图片搜索结果复制进项目
- 直接从 Baidu Image、Pinterest、小红书、大众点评、未授权博客或社交媒体复制

允许来源：

- 自己拍摄
- 明确允许使用的开放授权图片
- 合法图库
- AI-generated
- 明确获得授权的图片

必须保留：

- source
- author
- license
- attribution（在适用时）

当前不加入未完成授权核验的 sample asset。100 道 hero 补齐作为后续独立 content batches 推进，不用数量目标降低版权或摄影质量要求。

## Data Expansion Quality Rules

当 M5 推进 30 -> 100 时，新增 recipe 必须继续满足：

- ingredient references valid
- nutrition / cost calculations valid
- slug unique
- taxonomy fields structurally valid
- cooking `why` explanations present
- story / origin 只有在可靠时出现
- no fake historical claims
- publication status 必须显式设置，不能由“字段看起来齐全”或“存在图片”自动推断
- 公开 Recipe 必须通过人工步骤、状态判断、图片准确性和来源复核

## 推荐的执行顺序

1. 先定义 taxonomy v2
2. 再制定 recipe coverage map
3. 再扩充 recipe dataset
4. 并行建立 image schema 和素材管线
5. 最后在消费者 Web 重设计中统一展示

这样可以避免先堆大量内容，再回头做 schema 返工。

## M6 Culinary Portfolio Strategy

Issue #40 不再按“再加多少道菜”衡量内容扩张，而是同时审计 item type、meal role、地理语境、Flavor、Story 价值、图片权利和 pairing usefulness。首批 16 个 native item 有意补入 3 个 dessert、4 个 tea、2 个 coffee、2 个 non-alcoholic drink 和 2 个 alcoholic drink；3 个 dish 只用于补 main、soup 与 starter/side 的组合能力。

生产 Story 只在 claim 能连接具体 Evidence/Source 时出现。Preparation 文案必须使用状态与完成信号，必要浸泡、冷藏或静置计入 total time；成品酒使用 serving guidance，不写假的 cooking steps。dish/dessert 保持 nutrition/cost 门禁，plain tea 与成品酒可使用明确的 `not-modeled` applicability。

统一 public boundary 由 `getPublishedCulinaryItems()` 提供，但当前 Web 仍使用原有 10 个 published Recipe。内容模型可以先丰富，UI 不必在 #40 展示所有字段或提前进入 #41/#42/#43。
