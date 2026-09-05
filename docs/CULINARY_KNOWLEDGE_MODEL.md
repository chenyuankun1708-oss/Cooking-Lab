# Culinary Knowledge Model

最近更新：2026-09-05

## Purpose

M6 把 Cooking Lab 的长期内容边界从单一 `Recipe` 扩展为 `CulinaryItem`，同时保持当前 100 道 structured Recipe、10 道 published Recipe 与所有 Web 行为不变。本文件区分两件事：

- **Implemented contract**：`types/culinary.ts`、translation fallback、Recipe adapter、validation 与 item-type publishing skeleton 已存在并有测试。
- **Migration architecture**：Repository、持久化和逐批内容迁移是后续工作；本 Issue 不引入数据库、CMS、双语 UI 或新公开内容。

## Domain Model

`CulinaryItem` 使用 shared base + discriminated union，不是把不同内容塞进一个 optional-field God Object。

```text
CulinaryItemBase
  identity: id + slug + itemType
  content: TranslationSet<CulinaryItemCopy>
  taxonomy + flavor + images
  storyIds
  pairing + publication
  nutrition + cost applicability
          |
          +-- DishItem
          +-- DessertItem
          +-- TeaItem
          +-- CoffeeItem
          +-- NonAlcoholicDrinkItem
          +-- AlcoholicDrinkItem
```

`id` 是 locale-independent canonical identity；`slug` 是当前 locale-neutral route key，不承载翻译。名称与描述只存在于 `TranslationSet`，不增加 `nameZh/nameEn`。

共享字段是所有可食用内容都需要的稳定能力；差异最大的 preparation 由每个 item type 限定自己的 union。空数据使用明确状态（例如 `images.availability = "none"`、`nutrition.applicability = "not-modeled"`），不靠大量含义不清的 optional 字段。

## CulinaryItem Types

| Type | Product reason | Allowed preparation |
| --- | --- | --- |
| `dish` | 可操作的日常料理主体 | cooking, baking, assembly |
| `dessert` | 独立浏览意图、meal role 与内容供给线 | cooking, baking, assembly |
| `tea` | 茶叶/茶饮知识与冲泡 | brewing, serving guidance, no consumer preparation |
| `coffee` | 冲煮、萃取或调制 | brewing, extraction, mixing, serving guidance, no consumer preparation |
| `non-alcoholic-drink` | 非酒精饮品与调饮 | brewing, extraction, mixing, assembly, serving guidance, no consumer preparation |
| `alcoholic-drink` | 酒类知识、饮用与调制 | mixing, serving guidance, no consumer preparation |

Dessert 是独立 item type，不是 `dishTypeId` 的一个值。原因是消费者浏览目的、整餐角色、内容研究来源与常见 preparation 都足够不同；它仍复用 taxonomy、Flavor、Story、Source 和 publication，不建立另一套平行系统。

## Preparation Model

Preparation 分为三种结构，而不是假设所有内容都有 Recipe steps：

1. `ProceduralPreparation`：`cooking / baking / brewing / extraction / mixing / assembly`。共享 inputs、yield、tools、time 与至少一个 step；step 可带 rationale、duration 和 state cue。
2. `ServingGuidancePreparation`：有少量服务动作或饮用建议，但不是制作流程；只包含估计时间、tools 与 localized guidance。
3. `NoConsumerPreparation`：内容在消费端无需制作，明确记录 `ready-to-serve / producer-prepared / reference-only` 和 localized serving note。

因此 wine、瓶装发酵饮品或仅供文化探索的内容不会因缺少虚假 cooking steps 而无法发布。发酵、陈年、烘焙等生产者过程属于 Story/technique knowledge；除非用户需要实际执行，否则不伪装成 consumer preparation。

## Story Model

Story 是独立、可复用实体，一个 CulinaryItem 可引用多个 Story。Story type 覆盖起源、历史发展、地方饮食文化、原料/农业/贸易、人物、技法、餐厅/流派、奖项、节庆日常与 legend/folklore。

事实语气由 `StoryClaim.kind` 强制区分：

- `documented-fact`
- `documented-tradition`
- `disputed-attribution`
- `legend-folklore`

每个 claim 必须引用至少一个 Evidence。传说可以被记录，但必须作为传说呈现；有争议的发明者归属不能编码为确定事实。Story body 可以承载编辑叙事，但可核验主张必须拆成 claim。

## Source And Evidence Model

三个概念不混用：

- `Source`：书籍、期刊、档案馆、博物馆、政府/教育机构、专业组织、出版社、可靠媒体或生产者文档的 metadata 与可重新定位标识。
- `Source.rights`：public domain、open license、获得许可、仅作事实参考或 unknown；这是版权/使用边界，不代表事实强度。
- `Evidence`：把一个 Source 以 `supports / contradicts / context` 关系连接到 claim，并记录证据强度、细粒度 locator 与编辑判断。

Source 不绑定网页。`Source.locators` 是非空 discriminated list，可组合：

- HTTPS URL + accessed date
- DOI
- ISBN
- archive/catalog identifier + collection + holding institution
- physical citation + optional holding institution

题名、作者、出版/馆藏机构和可选 publication metadata 与 locator 一起形成 bibliographic identity。实体书、手稿、馆藏和印刷期刊不需要虚构 URL；但完全没有可重新定位 locator 的 Source 无效。URL 若存在，必须是无嵌入凭据的 HTTPS 地址。

`Evidence.locators` 只定位 Source 内支持 claim 的具体位置，支持 page、chapter、section、paragraph、timestamp、folio 与 other。它可以组合多个定位，例如 chapter + page；当整项 Source 都与 claim 有关时可以为空。Source locator 回答“如何找到这份来源”，Evidence locator 回答“依据在来源中的哪里”。

`Source.reliability` 是编辑评估，不是自动真值。AI 生成文字不能成为 Evidence。图片 provenance 继续由现有 image registry 管理，不用文本 Source 的 rights 替代图片授权。

发布校验只遍历当前 item 引用的 Story，再沿 Story Claim -> Evidence -> Source 验证；registry 中无关的草稿或待修来源不会阻止其他 item 发布。

Issue #38 review 后删除了 generic `CulinaryItem.evidenceIds`。当前没有 item-level assertion 的真实 use case，裸 evidence ID 无法表达它支持名称、来源、taxonomy 还是其他事实。暂时只保留语义明确的 Story Claim 链；若 #39 出现非 Story 的 provenance 需求，再以最小 `ItemClaim` contract 建模，而不是恢复无主语的 evidence list。

## Translation Model

第一阶段 locale registry 是 `zh-CN` 与 `en`。所有本地化内容使用：

```ts
TranslationSet<T> = {
  defaultLocale,
  entries: [{ locale, status, value }]
}
```

Fallback 顺序是：请求 locale -> item 的 `defaultLocale` -> 第一条可用 translation。发布时默认语言必须是 `reviewed`；缺少英文不会阻止当前中文 Recipe 的渐进迁移。未来新增 locale 只扩 registry 与 translation entry，不扩字段名。

Taxonomy/Flavor 保存 locale-independent canonical ID；label registry 和 client display adapter 负责翻译。当前 URL 继续使用稳定、locale-neutral slug；若未来需要本地化 URL，应建立 route alias/repository，不修改 canonical item ID，也不把 localized slug 塞进 domain base。

## Pairing-ready Signals

Pairing 现在只建数据 contract，不实现 #43 Meal Engine。Engine 将组合 `item.flavor` 与 `item.pairing`：

- meal roles：starter/main/side/staple/soup/dessert/drink
- serving contexts
- cuisine coherence IDs
- sparse facets：weight、temperature、texture

facet 使用 discriminated records，未审核的维度保持不存在，不为 coverage 强填。营养、成本、时间和工具继续来自各自 canonical 字段，不复制进 pairing。

## Publication Model

编辑状态继续统一为 `draft / reviewed / published`，与 deterministic technical eligibility 分离：

`status === "published" && type-specific eligibility passes`

当前 `Recipe` 仍由成熟的 `evaluateRecipePublishingEligibility` 管理。新增 CulinaryItem publishing skeleton 负责 translation review、primary image reference、domain schema、可达 provenance 和 type-specific nutrition/cost 规则：

- dish/dessert 必须具备可用 nutrition 与 cost model，并满足 procedural preparation。
- tea/coffee/drinks 按各自 preparation union 校验；`no-consumer-preparation` 不要求 steps。
- 所有公开 item 仍需 primary image。图片 license/asset 深度校验继续由现有 image gate 承担，待 image contract 泛化后再组合，不复制实现。

## Recipe Migration Matrix

| Current capability | Decision | Migration path |
| --- | --- | --- |
| Recipe id / slug | unchanged | 作为 CulinaryItem canonical identity 与 route key |
| name / description | adapted | 投影为 locale-based content；当前仅 `zh-CN` |
| Recipe | wrapped/adapted | `adaptRecipeToCulinaryItem()` 投影为 `DishItem`，不双写 100 条数据 |
| Recipe ingredients / servings | generalized | 投影为 procedural inputs / yield |
| cooking times / tools / steps / why | generalized | 投影为 preparation time / tools / localized steps / rationale |
| difficulty / oil / salt / addedSugar / principles | unchanged for now | 继续留在 Recipe；出现跨类型需求后再定义窄 contract |
| taxonomy | adapted | origin/cuisine 保留；techniques -> techniqueIds；dish type -> formIds；不复制 label |
| Flavor | unchanged | 继续是 canonical `FlavorProfile`，由 CulinaryItem 直接引用 |
| nutrition / cost engines | unchanged | Recipe 继续 ingredient-derived；CulinaryItem 只声明 applicability/source |
| image provenance | unchanged | 继续使用现有 registry；Recipe hero 投影为 Culinary image reference |
| culture | deprecated later | 不自动升级为 Story；只有经过 claim/evidence 审核后才迁移 |
| Recipe publication | adapted | 状态共享；现有 Recipe gate 保持 public source，新 gate 按 item type 扩展 |
| recommendation | unchanged | 仍只接受 published Recipe，未来另做 CulinaryItem capability adapter |
| similarity | unchanged | 仍只比较 published Recipe，不复用 pairing signals |
| homepage/catalog/detail/SSG | unchanged | 继续消费 `data/published-recipes.ts`，本 Issue 不改 UI 路由 |

## Persistence Boundary

Domain types、adapter、validator 和 eligibility 只处理可序列化对象，不 import React、Next.js、DOM、filesystem、Prisma、SQL 或数据库 SDK。当前 TS/JSON data module 是 persistence adapter，不是 domain 本身。

未来 repository 边界应围绕领域对象，而不是 ORM record：

```text
TS/JSON adapter ----\
                     -> Culinary repositories -> application use cases
Database adapter ---/
```

建议的后续 ports 是 `CulinaryItemRepository`、`StoryRepository`、`SourceRepository`、`EvidenceRepository` 和 image provider。数据库 row、join table、locale table 与 ORM types 留在 adapter 内，通过 mapper 还原 domain contract。此次不创建空 repository interface，也不选择数据库，因为在真实 ingestion/read use case 出现前，这些接口的方法形状仍不稳定。

## Progressive Migration

1. 当前阶段：Recipe 是生产 source of truth；CulinaryItem contract 与只读 adapter 用测试证明可迁移。
2. Content Engine 阶段：先创建独立 Source/Evidence/Story registries 和少量新 item，不触碰旧 Recipe public adapter。
3. 双读验证阶段：按内容批次比较 Recipe view 与 CulinaryItem view，禁止手工双写同一 canonical 字段。
4. 消费切换阶段：application repositories 稳定后，逐个切换 catalog/detail/discovery；每次保持 published count 与 SSG contract 可验证。
5. 最后才 deprecate Recipe-only culture 与命名字段。100 条数据不会一次性重写。

## Explicit Non-goals

- 不实现 Pairing/Meal Engine
- 不新增 dish、dessert 或 drink 内容
- 不做 Story UI、双语切换或视觉改版
- 不引入数据库、Prisma、CMS、抓取或 AI 内容生成
- 不改变当前 published count、recommendation、similarity、homepage、catalog、detail 或 SSG
