# Content Rights Policy

最近更新：2026-09-07
适用阶段：M10 / Public Beta commercial-readiness gate
性质：工程与编辑风险控制，不是法律意见

## 发布原则

Cooking Lab 将每个公开料理拆成 `identity / preparation / story / nutrition / cost / image / product-profile` 内容块。每个块都必须登记为 `original / factual-synthesis / adaptation / licensed-copy / generated`，并在发布前完成：

- 来源与 Evidence 追溯；
- 中国、美国、欧盟、英国保守交集下的权利判断；
- `store / transform / publish / commercialize` 四项用途判断；
- copyright、database、contract/ToS、trademark、publicity/privacy 与 uncertainty 复核；
- 署名、改编声明、ShareAlike 隔离和复审日期；
- 最终 `UsageDecision`。

任何 `unknown`、NC、ND、rights-changed、缺失署名、过期复审、未解决风险、未完成 AI 审查或不兼容数据库条款都会阻止 Production。当前 50 项不享有 grandfathering；发布列表变化时，validator 自动要求新条目具备完整 artifact coverage。

## Reference-only 边界

商业菜谱、出版物、机构网页与视频可以作为事实核对来源，但公开可访问不等于允许复制：

- 可保存 URL、作者、发布日期、访问日期、Evidence locator 和独立编辑备注；
- 可以把配料、时间、温度、技术作用和窄事实用于原创综合；
- 不保存或发布第三方整页、菜谱文字、独特结构、字幕、转录、截图、视频文件或说明文字；
- factual synthesis 默认需要独立文字与结构；准备方法进入批量发布前需至少两个独立来源和料理复核；
- AI、搜索摘要、Pinterest、无作者汇总与营销转载不能成为 Evidence。

## 许可与署名

- `CC0 / public domain`：记录作品级依据；公开可访问本身不构成依据。
- `CC BY`：显示作者、作品/原文件、许可证链接和改编声明。
- `CC BY-SA`：除 CC BY 义务外，必须保存在独立 `asset-file` 或 `isolated-dataset` 边界，不能把专有核心内容库整体置于 ShareAlike 下。
- `NC / ND / unknown / prohibited`：禁止进入商业就绪公开路径。
- 图文分别审权；网页文字许可不自动覆盖网页中的图片。

## 餐厅、媒体与品牌

餐厅料理只允许三种身份：

1. `official-authorized-recipe`：书面许可必须覆盖商业使用、翻译、改编、署名、期限和撤回条件。
2. `cooking-lab-reconstruction`：至少两个在 closed ResearchRecord 中同时支持 `identity` 与 `preparation` 的事实来源、独立写作、料理复核，并明确非官方、无合作背书。权利记录只声明当前 policy 的 `factual-culinary` 审查要求；它不能自称已经审查通过，PASS 必须来自与当前 artifact version 对齐的独立 `ReviewAttestation`。需要餐厅身份判断的完整集合与实际身份记录一一覆盖，缺失或多出的记录都会 fail closed。
3. `dish-profile-only`：证据不足时只介绍料理，不提供推测步骤。

视频只允许人工观看后的 reference-only Evidence，记录 URL、作者/发布者、日期和 timestamp。不下载、不保存字幕/转录/截图、不自动抓取；嵌入播放器需要另行完成平台条款与隐私评估。

M11 采用更窄的项目边界：Batch A/B 不观看或总结视频，不创建 timestamp Evidence 或 `ExternalMediaReference`，也不保存字幕、转录、截图、帧或下载。每个新增料理仍需要至少两个可靠的非视频来源；这项范围收缩不改变上述 M10 通用媒体规则。

具体酒、咖啡和茶 SKU 必须使用版本化 `ProductProfile`，记录品牌、生产者、产区、年份/批次/型号和核验日期。只使用标签窄事实和独立编辑文字，不复制 tasting notes、营销文案或包装图，不暗示背书，也不做联盟销售。

## 营养、成本与数据库

当前 Public Beta 的营养与价格为 Cooking Lab 第一方演示估算，并明确显示限制；没有声称这些数值来自 USDA。每个食材记录独立 nutrition provenance ID，价格共用带地区、货币、日期和方法的第一方估算 provenance。

USDA FoodData Central 已登记为未来首选 CC0 数据源，但当前状态为 `not-yet-imported`。未来导入必须采用版本化本地下载，记录 dataset release、food code、basis、单位换算和访问日期；build 时不调用 API。禁止从权利不明的营养库、商业菜谱库或零售站点进行系统性抽取。

## 图片与 AI

图片必须逐文件检查原始文件页、作者、准确许可、允许的改编和构图身份。人物、品牌包装、餐厅标识和受保护场所需要额外复核。M10 审计发现旧 Fino、Junmai 与 Espresso 图片分别以品牌包装或商业小包装为显著构图元素，因此已替换为无标识的酒桶/酒花、清酒器具和白色咖啡杯图片；不能用“附带编辑语境”替代构图级商标与背书审查。任何酒类推广、导购、联盟用途或图片换版都必须重新审权。

AI 输出永远不能作为 Evidence，也不能修复输入权利缺陷。任何未来 AI artifact 必须记录 provider、不可变 model/version、生成日期、author actor/run/context、输出 artifact version、版本化 prompt ID/hash、只含结构化引用 ID/hash 的输入 artifact、closed ResearchRecord、输入 Source 权利、完整网关与上游服务条款链、risk-based `ReviewAttestation`、相似性检查和商标检查。缺少任一环节时必须标为 `generated` 并 BLOCK，不能改名为 `factual-synthesis`，也不能事后猜填运行或条款记录。LOW 可由真正独立的 agent context 完成全维度审查；MEDIUM 需要分离的双 reviewer context；HIGH 继续进入明确的人类、专家或法律 checkpoint。agent review 不得表示为 human review、料理实测或法律意见。完整路由见 `docs/PUBLISHING_GOVERNANCE.md`。

## 专业复核 checkpoint

正式收费、餐厅授权合作、酒类商业推广、品牌导购或大规模数据库导入前，必须由专业律师复核相关用途、地区和合同。内部合同、许可文件、个人联系方式和法律风险备注不进入公开页面或 repo；repo 只保存结构化结论和非敏感引用 ID。

## 官方依据

- [中国著作权法（WIPO Lex）](https://www.wipo.int/wipolex/en/legislation/details/21065)
- [U.S. Copyright Office Recipe FAQ](https://www.copyright.gov/help/faq/faq-protect.html)
- [EU Database Directive](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:31996L0009)
- [UK Database Regulations](https://www.legislation.gov.uk/uksi/1997/3032/contents)
- [Creative Commons licenses](https://creativecommons.org/share-your-work/cclicenses/)
- [Open Data Commons licenses](https://opendatacommons.org/licenses/)
- [UK Open Government Licence v3](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/)
- [USDA FoodData Central API Guide](https://fdc.nal.usda.gov/api-guide.html)
- [YouTube Terms](https://www.youtube.com/static?template=terms)
