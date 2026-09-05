# Flavor Model

最近更新：2026-09-05

## Purpose

Flavor Profile 让用户可以用“清淡、鲜辣、酸爽、浓郁、焦香、暖乎乎”等日常语言发现料理，同时让底层推荐继续使用可验证、可序列化的确定性数据。

Canonical source of truth：`recipe.flavor`。

Flavor 不再放在 `recipe.taxonomy`。Cuisine 描述料理传统，technique 描述做法，dietary 描述饮食限制，meal occasion 描述用餐场景；Flavor 描述这份具体配方呈现出的味觉、香气、口感和饮食感受。

## Subjective editorial data

Flavor intensity 是编辑与料理判断形成的结构化近似，用于浏览、排序和解释，不是化学检测、感官实验或健康结论。

基础味强度使用 `0–4`：

- `0`：不是这道菜的特征，通常直接省略
- `1`：轻微
- `2`：可以明显感知
- `3`：强烈
- `4`：定义性特征

数据迁移只记录能从食材、调味量、做法和描述合理判断的特征。没有区分度的值可以省略，不为覆盖率填满所有维度。

## Schema

```ts
interface FlavorProfile {
  tastes: Partial<Record<TasteId, 0 | 1 | 2 | 3 | 4>>;
  aromaIds?: AromaId[];
  textureIds?: TextureId[];
  characterIds?: FlavorCharacterId[];
}
```

- Taste：`salty / sweet / sour / bitter / umami / spicy`
- Aroma：13 个稳定值，包括 `garlicky / herbal / peppery / smoky / roasted / toasty / tomato-rich / gingery / citrusy / fermented / spiced / fruity / floral`
- Texture：`crisp / tender / juicy / silky / creamy / chewy / soft / brothy / saucy`
- Character：`light / refreshing / comforting / warming / hearty / appetizing / rice-friendly / clean-tasting`

`brothy` 和 `saucy` 表示入口时的液体质感，归入 texture；`light`、`warming` 与 `hearty` 表示整顿饭的体验，归入 character。中文 label 与说明集中在 `data/flavor.ts`，recipe 数据只保存稳定 ID。

## Recommendation use

用户层提供六个简单偏好：清淡、鲜辣、酸爽、浓郁、焦香、暖乎乎。每个偏好由基础味目标强度与 aroma / texture / character signals 组合定义。

`lib/flavor.ts` 比较目标强度的距离，并计算结构化 signals 是否重合；结果作为 recommendation 的 soft preference。Flavor 不会排除 recipe，也不会越过时间、厨具、营养等 hard constraints。权重与其他 soft dimensions 一起集中在 `RECOMMENDATION_WEIGHTS`。

解释文本来自 recipe 的结构化 profile，例如“味道偏辣味、椒香”，不为单道 recipe 写死推荐话术。

## Human time mapping

精确的 `prepTime / cookTime / totalTime` 保持不变。UI 通过 `lib/cooking-time.ts` 生成自然时间层：

- `≤20` 分钟：轻松快手（31 道）
- `21–40` 分钟：日常料理（39 道）
- `41–60` 分钟：慢慢做（27 道）
- `>60` 分钟：值得等待（3 道）

Card 和首页优先显示自然分组；详情页显示“自然分组 · 约 N 分钟”，因此执行信息没有丢失。

## Validation

Validation 检查 intensity 是否为 `0–4` 整数、所有 ID 是否已注册、列表是否重复、明显冲突的 character 是否并存、profile 是否可 JSON 序列化，以及 100 道 recipe 是否都有唯一 canonical profile。

Issue #40 为 dessert、tea、coffee 和 drink 内容增加 `fruity` 与 `floral` 两个 aroma ID。它们描述可感知香气，不作为 taste，也不引入新的 texture/aroma profile 层级；现有 100 道 Recipe profile 与 recommendation preference contract 保持不变。
