# Localization

最近更新：2026-09-05

## Supported Locales

公开 Web 第一阶段支持 `zh-CN` 与 `en`。`SupportedLocale` 是唯一 locale identity；taxonomy、Flavor、Ingredient、CulinaryItem、Story、Source 和 Evidence 的稳定 ID 不随语言变化。

## Routing And Canonical URLs

所有可索引页面使用显式 locale 前缀：

- `/zh-CN/...`
- `/en/...`

当前 slug 保持 locale-neutral。同一内容在两种语言中使用同一 slug 和 domain ID；语言切换保留 route、slug 与 query。旧 `/`、`/recipes/...`、`/culinary/...`、`/stories/...` 路由只负责重定向到 `zh-CN`，不会形成第二个 canonical URL。

每个本地化页面输出当前 locale canonical 与 `zh-CN` / `en` alternate links。`app/[locale]/layout.tsx` 在服务器端设置 `<html lang>`，公开页面继续静态生成。

## Translation Boundaries

- UI chrome：`lib/messages.ts` 的 typed dictionary。
- Domain labels：taxonomy、Flavor、tool、time 和 unit registry/display helper。
- Editorial content：locale-keyed `TranslationSet<T>` 或独立 reviewed public translation registry。
- Generated explanations：Recommendation、Similarity 与 Pairing core 只返回结构化结果，各自 display adapter 负责自然语言。
- Metadata：每个 route 在服务器端使用当前 locale 的 title、description、canonical 和 alternates。

不增加 `nameZh/nameEn` 一类字段，也不把 React、Next.js 或浏览器 API 引入 domain。

## Public Coverage Policy

公开英文页面不回退到中文。内容只有在关键 editorial copy 完整且状态为 `reviewed` 时才进入英文 public output；未覆盖的 draft 不会伪装成双语内容。

| Surface | zh-CN | en |
| --- | --- | --- |
| Homepage / navigation / footer | complete | complete |
| Recipe catalog / filters | complete | complete |
| 10 published Recipe details | complete | complete |
| 16 native CulinaryItem details | complete | complete |
| Story catalog / 6 Story details | complete | complete |
| Recommendation / Similarity explanations | complete | complete |
| 26 Pairing pages / explanations | complete | complete |

其余 90 道 draft Recipe 保持原数据，不在本 Issue 批量翻译。未来新增公开 locale 时，应先通过对应内容 completeness gate。

## Editorial Rules

- 英文使用自然的料理动词、计量表达和 Story prose，不逐字翻译中文烹饪术语。
- Story translation 不得提升 claim certainty；documented tradition、disputed attribution 与 legend/folklore 在所有语言保持原证据边界。
- Source title 优先保留来源自己的正式题名；locator value 不翻译，只本地化 `page / section / timestamp` 等 UI label。
- 图片版权 metadata 保持 canonical；展示层只本地化标准处理说明，例如 `裁切处理` / `cropped`。
- 第一版只本地化 metric unit label，不引入 imperial preference engine。

## Performance And Validation

字典和 editorial translation 在 Server Component/data boundary 解析，浏览器不会收到另一语言的完整内容集合。唯一既有 client boundary 仍是首页 Hero carousel 与 Recommendation interaction；没有新增 i18n、动画或字体依赖。

测试覆盖 locale parsing、route generation、query-preserving switch、public translation completeness、taxonomy/Flavor/time/unit labels、Recommendation/Similarity/Pairing、Story certainty、Source locator、metadata、canonical/hreflang 和 `<html lang>`。Pairing route 只从当前 locale 的 26 个完整 published item 生成静态页面，view model 不包含另一语言的 consumer copy。
