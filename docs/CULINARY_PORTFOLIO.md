# Culinary Portfolio

最近更新：2026-09-05

## Existing Library Audit

Issue #40 开始前，公开内容只有 10 个由 `Recipe` adapter 投影的 DishItem。它们覆盖 8 个国家或地区语境，但 meal role 仍集中在 main、staple、soup 与 starter；没有 dessert、tea、coffee、non-alcoholic drink 或 alcoholic drink，也没有 production Story。Flavor 以咸、鲜、家常热菜为主，无法为未来的完整餐桌组合提供足够候选。

100 个 structured Recipe 仍是编辑储备，不等于公开库。Issue #40 不把其中 90 个 draft 批量升级，也不通过降低图片、步骤或 provenance 门禁换取整数规模。

## Portfolio Strategy

本批次按 item type、meal role、地理语境、Flavor、正确 preparation semantics、图片权利和 Story 证据共同选择。最终新增 16 个 native CulinaryItem，使统一 public repository 达到 26 项。选择重点是补结构缺口：3 个甜品、10 个跨茶/咖啡/无酒精/酒精类别的饮品，以及 3 个能补 main、soup、starter/side 的料理。

Story 不是发布配额。只有 6 个条目拥有足以支撑窄主张的 Source/Evidence，其余 10 个只提供现代原创的料理描述与 preparation，不声称起源年代、唯一发明人或地方传统。

## Published Matrix

| Item | Type | Place / cuisine | Meal role | Preparation | Flavor signals | Story |
| --- | --- | --- | --- | --- | --- | --- |
| 东坡肉 | dish | China / Zhejiang | main | cooking | salty, sweet, umami, roasted, tender | disputed attribution |
| 冬阴功虾汤 | dish | Thailand / Thai | soup | cooking | sour, spicy, umami, citrusy, brothy | documented tradition |
| 希腊乡村沙拉 | dish | Greece / Greek | starter, side | assembly | sour, salty, herbal, crisp, fresh | none |
| 芒果糯米饭 | dessert | Thailand / Thai | dessert | cooking | sweet, fruity, floral, creamy | none |
| 提拉米苏 | dessert | Italy / Italian | dessert | assembly | sweet, bitter, roasted, creamy, rich | none |
| 苹果酥粒 | dessert | UK / British | dessert | baking | sweet, sour, fruity, crisp, comforting | none |
| 龙井绿茶 | tea | China / Zhejiang | drink | brewing | sweet, bitter, floral, fresh | documented tradition |
| 马萨拉奶茶 | tea | India / Indian | drink | brewing | sweet, bitter, spiced, creamy | none |
| 摩洛哥薄荷茶 | tea | Morocco / Moroccan | drink | brewing | sweet, bitter, herbal, floral | none |
| 正山小种 | tea | China / Chinese | drink | brewing | smoky, fruity, toasty, silky | none |
| Espresso 意式浓缩 | coffee | Italy / Italian | drink | extraction | sour, bitter, roasted, creamy | documented fact |
| 越南滴滤冰咖啡 | coffee | Vietnam / Vietnamese | drink | brewing | sweet, bitter, roasted, creamy | none |
| 洛神花 Agua Fresca | non-alcoholic drink | Mexico / Mexican | drink | brewing | sweet, sour, floral, fruity | none |
| 咸味拉西 | non-alcoholic drink | India / Indian | drink | mixing | salty, sour, spiced, creamy | none |
| Fino 雪莉酒 | alcoholic drink | Spain / Andalusia | drink | serving guidance | dry, light, fermented, toasty | documented fact |
| 纯米清酒 | alcoholic drink | Japan / Japanese | drink | serving guidance | subtle sweet/sour/umami, fermented, silky | documented tradition |

## Portfolio QA

### Published By Type

| Type | Adapted Recipe | Native | Unified total |
| --- | ---: | ---: | ---: |
| Dish | 10 | 3 | 13 |
| Dessert | 0 | 3 | 3 |
| Tea | 0 | 4 | 4 |
| Coffee | 0 | 2 | 2 |
| Non-alcoholic drink | 0 | 2 | 2 |
| Alcoholic drink | 0 | 2 | 2 |
| **Total** | **10** | **16** | **26** |

### Geography

统一库覆盖 13 个 country ID：China 6、Thailand 3、Italy 3、Japan 2、Vietnam 2、India 2，以及 France、South Korea、Lebanon、Greece、UK、Morocco、Mexico、Spain 各 1。计数可以重叠于 cuisine 分析，但不会把 fusion 或现代改良内容伪装成更具体的传统菜系。

### Meal Role

统一库共有 main 5、staple 3、soup 2、starter 3、side 1、dessert 3、drink 10 个 role assignment。希腊乡村沙拉同时是 starter 与 side，因此 role assignment 总数为 27，不等于 26 个 item。

### Flavor

新增条目让公开 Flavor 不再只集中于咸鲜：基础味覆盖 sweet、sour、spicy、bitter、salty、umami；aroma 覆盖 fruity、floral、roasted、smoky、fermented、toasty、herbal、citrusy 与 spiced；texture/character 覆盖 creamy、crisp、silky、brothy、tender、light、rich、refreshing 与 comforting。`fruity`、`floral` 是本批次唯一新增的 canonical Flavor IDs，显示 label 继续与 identity 分离。

### Preparation

统一库的 preparation 分布为 cooking 11、assembly 4、baking 1、brewing 6、extraction 1、mixing 1、serving guidance 2。Fino 与纯米清酒不包含虚构 cooking steps；它们以生产者已经完成的成品为前提，只给克制的服务提示。芒果糯米饭的浸泡、提拉米苏的冷藏和苹果酥粒的出炉静置均计入 total time。

### Story, Image, Nutrition And Cost

- Story：6 / 26；每条均经过 `Story Claim -> Evidence -> Source`，没有 generic item evidence list。
- Hero image：26 / 26；16 张新增图片逐项记录 Wikimedia Commons file page、作者、exact CC license、attribution、尺寸与焦点，并作为本地 1500 x 1000 WebP 交付。
- Nutrition：22 / 26 modeled；plain Longjing、Lapsang Souchong 与两个成品酒使用 `not-modeled`，不填假数据。
- Cost：24 / 26 modeled；两个成品酒使用 `not-modeled`，不把零售价伪装成 ingredient-derived cost。

## Pairing Readiness

本批次只提供 signals，不实现 Meal Engine。当前候选已经可以支持诸如：希腊乡村沙拉 + 主菜、主菜 + 咸味拉西、泰式主菜 + 芒果糯米饭、starter + main + drink，以及 starter + main + drink + dessert。组合能消费 meal role、serving context、cuisine、weight、temperature 与 texture；是否构成好搭配仍由 #43 的独立规则和编辑校准决定。

## Candidate Research And Deferral

以下候选曾用于组合审计，但本批次暂缓：

- 宫保鸡丁、红烧肉、清蒸鱼：现有和新增库已经偏 dish，优先补 dessert/drink；以后应结合图片与具体地方语境单独审核。
- Ramen、tempura、wagashi、matcha：同时加入会让日本内容在小批次中过密，且各自需要更细的 form、图片与来源核验。
- Kimchi、borscht：跨地域传播和身份叙述容易被简化成单一起源，需要比本批次更完整的 provenance research。
- Baklava、mezze：需要处理跨多个地区的归属与变体；现有公开 hummus 已提供一个 Middle East starter 候选。
- Cappuccino、Thai tea、cacao/chocolate drinks：与当前 coffee/tea 结构重复，且甜味、份量和 nutrition 口径需要另行校准。
- Cocktails 与更多 wine：酒精内容只保留两个文化/知识型成品条目，用于验证 serving guidance；不扩 commerce、购买链接或饮用量建议。

## Compatibility And Risks

`getPublishedCulinaryItems()` 是新的统一读取边界；它把 10 个 published Recipe 通过只读 adapter 投影后，与 16 个 native item 合并。Recipe 页面、homepage、catalog、recommendation、similarity 与 SSG 仍使用原有 `getPublishedRecipes()`，因此本 Issue 没有偷偷启动 #41/#42/#43 或 UI 迁移。

当前 TS 文件规模仍可审查，但内容继续增长后，人工检查跨文件 ID 与更新历史会变难。现阶段 validation 和分类型数据文件足够，不构成引入数据库、Prisma 或 CMS 的理由。图片来源链接与授权状态仍会随时间变化，需要后续 health review；营养、价格和部分 Flavor 强度仍是编辑性估算，不是医学、实时商业或实验测量数据。
