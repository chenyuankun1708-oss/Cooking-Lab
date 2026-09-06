# M10 Current Public Library Rights Audit

审计日期：2026-09-06  
范围：34 个 adapted Recipe + 16 个 native CulinaryItem，合计 50 个双语公开料理

## 结论

M10 gate 对每个 published item 遍历 identity、preparation、nutrition、cost、primary image 与关联 Story。当前注册表覆盖 50 个 item、50 张本地 Hero、6 个 Story、当前公开料理使用的 89 种食材 nutrition provenance，以及 1 个第一方价格估算方法。所有公开 artifact 均有 `UsageDecision`；CI 和 production build 会在任一必需块缺失或出现 blocked reason 时失败。

当前结果为 `PASS`，但这是工程与编辑风险控制结论，不是法律意见，也不替代收费、餐厅合作、酒类推广或大规模数据库导入前的专业律师复核。

## Production 收口验证

- PR #84 于 2026-09-06 merge，merge commit 为 `de4ea4164d89c6cf2665b0769ab00b94d89bb808`；main GitHub Quality workflow 与 Vercel Production deployment 均成功。
- `zh-CN` 与 `en` 的“内容来源与权利”页面、Fino、Junmai、Espresso 详情及稳定 `#sources` 在 390 / 1440 px Production 浏览器烟测通过，无横向溢出或 console error。
- 两种语言料理库各返回 50 项；100 个 Production 详情 URL 全部为 200，均包含 `#sources`、准确 canonical 与安全来源链接。
- `/content-rights` 在 Production 永久导向 `/zh-CN/content-rights`。Production 成功构建同一 merge commit，证明统一 gate 已处于真实发布流程，而非仅存在于本地测试。

## 迁移矩阵

| 内容块 | 当前分类 | 权利依据与限制 | Production 结论 |
| --- | --- | --- | --- |
| 34 个 Recipe identity / preparation | 10 个第一方原创；24 个多来源 factual synthesis | M9 24 项保留 closed ResearchRecord 与至少两个独立 reference-only 来源；来源表达不复用 | allowed |
| 16 个 native CulinaryItem identity / preparation | Cooking Lab original editorial | 当前不声称餐厅官方配方或品牌合作；命名、说明和步骤为第一方编辑文字 | allowed |
| 6 个 Story | factual synthesis | 每个 claim 保持 Story → Evidence → Source 连接；争议、传说和事实分类不压平 | allowed |
| 50 张 Hero | open-license / CC0 / public domain adaptation | 逐文件许可；CC BY 显示署名；CC BY-SA 以 asset-file 隔离并显示改编声明 | allowed-with-obligations |
| 营养 | first-party editorial estimate | 89 种实际使用食材均有 provenance ID；不声称来自 USDA；显示演示估算限制 | allowed |
| 成本 | first-party estimate | 中国大陆参考市场、CNY、2026-09 方法版本；未抽取零售数据库 | allowed |
| USDA FDC | future dataset only | CC0 / public domain；登记为 `not-yet-imported`，当前数值未使用 | not in current values |
| 餐厅官方配方 | none | 没有书面授权记录，不使用 `official-authorized-recipe` | not published |
| 外部视频/字幕/下载 | none | 当前 registry 不保存视频、字幕、转录、截图或自动抓取结果 | not published |
| 具体品牌 SKU / affiliate | none | Fino 与 Junmai 为通用品类，不是产品档案或导购 | not published |
| AI 内容 | none | 当前公开 artifact 没有 `generated` 分类 | not published |

## 特别复核

- 旧 Fino、Junmai 与 Espresso Hero 分别以品牌酒瓶、多件品牌包装或商业咖啡/糖包为显著构图元素。开放图片许可不自动清除包装美术、商标或背书风险；M10 已将其替换为无品牌酒桶/酒花、无标识清酒器具和纯白咖啡杯，并重新登记逐文件许可与构图风险。
- Lapsang Souchong Hero 的玻璃罐仅带通用植物/内容标签，无品牌标识；Mango Sticky Rice Hero 背景人物被裁切、虚化且不可识别。两项均已记录逐图商标与隐私复核，不再依赖全库统一的“无人/无标识”模板。
- `reference-only` Source 的 publish/commercialize 权限对“来源表达本身”保持 prohibited；只有 Cooking Lab 独立写作的 artifact 能取得商业发布 allow decision。
- CC BY-SA 图片的 ShareAlike 只适用于隔离图片资产及其改编，不扩展到专有料理数据或页面代码。
- 公开页面只展示消费者需要的内容身份、来源、图片署名、许可证和改编声明；内部风险备注、合同和个人信息不公开。

## 自动阻止项

稳定 reason code 覆盖：权限禁止/待审、引用缺失、署名缺失、ShareAlike 未隔离、reference-only 表达复用、来源权利未知或变化、复审过期、AI 审查缺失、数据库系统抽取、餐厅身份虚假、外部媒体复制、产品档案风险、营养或成本 provenance 缺失。

审计报告由 `evaluateContentRightsRegistry` 确定性生成；测试固定要求两种语言各 50 个公开料理且全部具有非 blocked commercial decision。
