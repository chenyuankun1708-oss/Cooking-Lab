# Content Research Workflow

最近更新：2026-09-05

## Purpose And Scope

Cooking Lab 的内容研究链路是：

`Research question -> candidate sources -> source evaluation -> rights evaluation -> evidence capture -> claim classification -> original editorial draft -> editorial review -> publication candidate -> publishing gate`

它用于稳定地产出可追溯、可重新定位、经过权利审核的 Culinary Knowledge。当前实现是人工/半自动工作流、类型 contract、确定性 validation 和三个 research exercises；没有 crawler、定时任务、AI 内容生成、CMS、数据库或新公开内容。

## Workflow

| Stage | Input | Output | Owner | Safe automation | Human judgment | Stop condition |
| --- | --- | --- | --- | --- | --- | --- |
| Research question | 内容缺口或编辑选题 | 一个可证伪、边界明确的问题与 template ID | Editor | 检查必填字段 | 判断问题是否值得研究、是否过宽 | 问题明确到可以描述所需证据 |
| Candidate sources | 问题、source catalog、检索词 | 候选来源清单 | Researcher | 候选发现、去重、locator 格式提示 | 判断覆盖是否充分 | 找到至少一个可重新定位的候选，或记录无法继续 |
| Source evaluation | 候选来源及 bibliographic metadata | accepted/rejected decision + rationale | Researcher | 缺字段与重复检查 | 作者身份、来源质量、语境与局限 | 每个被考虑来源都有明确决策 |
| Rights evaluation | 来源、许可页、用途 | `Source.rights` 与用途边界 | Rights reviewer | 提示已知 license metadata | 版权歧义、合理用途、可否复制/改编 | 权利状态已记录；`unknown` 不进入可复用素材 |
| Evidence capture | accepted Source | `Evidence` + relation + locator + note | Researcher | locator 格式和悬空引用检查 | 摘取哪一部分能支持、反驳或补充背景 | 每条待纳入 claim 都能回到来源内部位置 |
| Claim classification | 问题与 Evidence | considered claims + kind + disposition | Editor/researcher | ID、枚举、引用完整性 | 事实/传统/争议/传说分类与不确定性 | unsupported claim 被排除或延期 |
| Original draft | 已纳入 claims | 自主撰写的 Draft Story/CulinaryItem | Writer/editor | schema 和缺字段检查 | 组织叙事、避免复制原表达 | 事实与创意表达边界清楚 |
| Editorial review | draft、ResearchRecord、registries | 修订稿与 review decision | Fact, rights, culinary reviewers | broken refs、license 完整性 | 事实解释、文化措辞、料理合理性 | checklist 通过或退回研究 |
| Publication candidate | reviewed draft | `publication.status = reviewed` 的候选 | Managing editor | eligibility 预检 | 是否值得公开、是否达到产品标准 | 人工批准进入发布决策 |
| Publishing gate | candidate + reachable registries | deterministic issues / eligible result | Application | schema、translation、image 和 provenance traversal | validator 不能替代发布决定 | 只有人工设为 `published` 且 gate 通过才公开 |

在任何阶段，如果进一步检索不会改变 claim 分类、权利判断或编辑决策，应停止扩展搜索并记录 unresolved questions。资料多并不自动等于结论更可靠。

## Research Templates

每个模板的共同输出是 Source、Evidence、ResearchRecord；只有通过 structured draft boundary 后，内容才进入 Draft CulinaryItem 或 Draft Story。

### A. Dish / Dessert Research

- 寻找：身份、配方结构、关键状态、技法、常见变体与有依据的地域语境。
- 首选：地方文化机构、专业料理组织、可靠 cookbook、具署名的教育资料；次选编辑型媒体和 producer documentation。
- 交叉验证：唯一发明者、唯一正宗配方、传统/现代边界、食安与设备参数。
- 不确定措辞：地域归属或固定配方没有共识时使用“常见做法”“这一版本”。
- 只作事实参考：商业食谱的 introduction、instructions、chef notes 和描述性 prose。
- 落点：identity/taxonomy/preparation 进入 CulinaryItem；历史文化进入 Story；每个可核验 claim 经 Evidence 指向 Source。

### B. Tea Research

- 寻找：茶类身份、产地、加工、冲泡变量、饮用传统。
- 首选：原产地/地理标志机构、博物馆、学术资料、茶业专业组织；次选可靠生产者资料。
- 交叉验证：首次出现、药效、唯一冲泡标准和等级主张。
- 不确定措辞：历史传播与地方习惯使用有来源归属的表达。
- 只作事实参考：品牌 tasting copy 和商业冲泡文案。
- 落点：brewing/serving guidance 进入 CulinaryItem；历史与地方实践进入 Story；化学或历史陈述进入 Evidence 链。

### C. Coffee Research

- 寻找：饮品身份、加工与萃取语义、设备发展、专业定义。
- 首选：专利/档案、博物馆、学术资料、专业咖啡组织；次选 producer manuals 与可靠编辑来源。
- 交叉验证：发明者归属、专利与实际普及的关系、现代参数是否跨时期成立。
- 不确定措辞：把早期专利、后续机器改进与今日定义分开表述。
- 只作事实参考：商业器具说明、媒体叙事和品牌 copy。
- 落点：extraction/brewing 进入 CulinaryItem；发展史进入 Story；专利号、页码和专业标准进入 Source/Evidence。

### D. Drink Research

- 寻找：饮品类别、成分、制作或 serving semantics、酒精状态与文化语境。
- 首选：政府/标准机构、专业组织、可靠 producer documentation；次选博物馆和编辑来源。
- 交叉验证：法定名称、酒精度、健康说法、传统服务方式。
- 不确定措辞：地区习惯不用“所有人都”“必须”等绝对词。
- 只作事实参考：品牌配方和营销叙事。
- 落点：mixing/serving/no-consumer-preparation 进入 CulinaryItem；文化语境进入 Story。

### E. Story / Culture Research

- 寻找：可核验事件、地方实践、日常生活语境和多方观点。
- 首选：primary records、文化机构、博物馆、学术研究；次选可靠编辑来源。
- 交叉验证：起源、年代、群体代表性和因果解释。
- 不确定措辞：来源只记录某机构/社区观点时明确归属；传说必须写成传说。
- 只作事实参考：原站创意叙事，不复制正文结构和句子。
- 落点：Story body 使用原创表达；claims 分类并逐条绑定 Evidence。

### F. Historical Person Attribution

- 寻找：同时代记录、最早可定位记载、后世传播和反证。
- 首选：primary documents、档案、历史研究；次选博物馆和具署名编辑来源。
- 交叉验证：某人“发明”“首次”“亲自创制”等排他主张。
- 不确定措辞：证据不足时使用 `disputed-attribution`，同时陈述流行说法与限制。
- 只作事实参考：旅游页、品牌故事和无来源人物轶事。
- 落点：人物/时间线进入 Story；支持和反驳材料分别成为 Evidence。

### G. Award / Recognition

- 寻找：授予机构、正式名称、年份、对象与 recognition scope。
- 首选：颁发机构、政府或国际组织记录；次选可靠新闻报道。
- 交叉验证：奖项状态、年份、是否属于菜品/实践/地区而非所有版本。
- 不确定措辞：nomination、inscription、award 不互换；不把认可解释为独占起源。
- 只作事实参考：新闻稿 prose 和第三方宣传文案。
- 落点：award-recognition Story + documented-fact claim + official Evidence。

### H. Image Research

- 寻找：准确匹配 item 的可用原图、作者、原始 file page、exact license 与人物/商标风险。
- 首选：self-created、明确 public domain、逐文件开放授权、合法图库；次选明确 partner permission。
- 交叉验证：画面身份、作者、授权版本、商业使用、裁切/改编与 attribution。
- 不确定措辞：无法确认主体或授权时不用该图，不以 disclaimer 补救。
- 只作事实参考：Google/Baidu/Pinterest/社交媒体搜索结果不能作为素材来源。
- 落点：图片进入独立 image registry；文字 Source rights 不代替 image provenance。

## ResearchRecord

`types/research.ts` 的轻量 `ResearchRecord` 保存：research question、template、accepted/rejected candidates、claims considered、unresolved questions、editorial decision、reviewer、date 和状态。Rejected candidate 使用少量稳定原因：

- `unclear-authorship`
- `weak-provenance`
- `rights-unclear`
- `source-inaccessible`
- `duplicate`
- `unreliable-claim`
- `unsuitable-creative-prose`
- `image-mismatch`
- `outdated-superseded`

它是编辑决策记录，不是新的 knowledge graph。`accepted` 必须引用 Source Registry；included claim 必须引用 Evidence，且这些 Evidence 的 Source 必须在同一记录中被接受。

## Structured Draft Boundary

研究结果进入 Draft CulinaryItem 或 Draft Story 前必须满足：

- identity clear；canonical ID 不依赖显示语言
- accepted Source 已登记且可以重新定位
- rights 已评估；可访问不等于可复制
- factual claims 已分类，unsupported claims 已排除或延期
- Evidence 能定位到 Source 内的具体依据
- 图片存在时，其独立 provenance 已确认
- draft 使用 Cooking Lab 原创措辞，不复制商业 prose
- ResearchRecord 保留 rejected alternatives、未决问题和编辑理由

一个搜索链接、AI 摘要、无作者文章或只通过 schema 的对象都不能跨过此边界。

## Editorial Review Checklist

- Fact accuracy：claim 与 Evidence 是否相符，有无遗漏反证
- Claim classification：事实、传统、争议、传说是否分层正确
- Uncertainty wording：语言是否匹配证据强度并标明来源归属
- Source quality：来源身份、语境和局限是否已评估
- Rights/license：事实参考、复制、改编、署名和 share-alike 边界是否明确
- Image match：图片是否真的是目标料理/对象且授权独立完整
- Culinary plausibility：食材状态、时间、步骤、器具和服务方式是否成立
- Cultural context：不把现代版本伪装成传统，不把一个机构说法写成普遍事实
- Translation readiness：canonical ID 与显示语言分离，译文不会扩大原 claim
- Publication eligibility：人工审校与 deterministic gate 都通过

Validator 只证明 contract 与引用完整，不证明历史判断、版权结论或料理解释正确。

## Real Research Exercise A: Dongpo Pork Attribution

- Research question：苏轼是否真的“发明”东坡肉？
- Sources considered：Wu Jen-Shu 的专题研究；无来源旅游/食谱 origin retellings。
- Accepted：[Food Culture of Taiwan research summary](https://www.fcdc.org.tw/en-us/summary-detail/%E2%80%9CWith-No-Meat,-One-Becomes-Thin%E2%80%9D:--The-Invention-and-Spread-of-Dongpo-Pork-i.43)。后者被拒绝为 `weak-provenance`。
- Claims/Evidence：研究指出苏轼可能发展过猪肉做法，但当时并不称“东坡肉”，名称后见于明代，后来的餐馆叙事又强化了人物归属。记录一个 `contradicts` 与一个 `context` Evidence。
- Claim kind：`disputed-attribution`。
- Rights：reference-only；仅独立总结事实与论证，不复制摘要/正文。
- Safe to publish：东坡肉以苏轼之号命名并长期与他相关，但直接发明归属并未确立。
- Uncertain：最早使用准确菜名的现存明代文献仍需 primary-source 定位。

## Real Research Exercise B: Tomyum Kung

- Research question：冬阴功的历史/地区饮食背景可以可靠写到什么程度？
- Sources considered：[UNESCO ICH official record](https://ich.unesco.org/en/RL/tomyum-kung-01879)；无引文的唯一发源地/发明者页面。
- Accepted：UNESCO 记录；排他性 origin 页面被拒绝为 `unreliable-claim`。
- Claims/Evidence：官方名录将其描述为泰国传统虾汤，并记录泰国中部平原河畔社区相关知识与实践；Evidence 定位到 Description。
- Claim kind：`documented-tradition`，且语言归属于该机构记录。
- Rights：reference-only；不复制 UNESCO prose 或媒体。
- Safe to publish：2024 inscription 与官方记录中的传统/社区语境。
- Uncertain：更长时段的历史需要早期泰文文献，不能由 inscription 反推唯一 origin。

## Real Research Exercise C: Espresso

- Research question：Espresso 是一次发明，还是持续演进的设备与冲煮体系？
- Sources considered：[Smithsonian machine history](https://www.smithsonianmag.com/arts-culture/the-long-history-of-the-espresso-machine-126012814/)、[Specialty Coffee Association discussion](https://sca.coffee/sca-news/25-magazine/issue-3/defining-ever-changing-espresso-25-magazine-issue-3-zyx36)、无上下文的单一发明者摘要。
- Accepted：前两项；单一发明者摘要因 `weak-provenance` 被拒绝。
- Claims/Evidence：一个 Evidence 支持多阶段机器发展，一个 `context` Evidence 记录专业定义与参数持续变化。
- Claim kind：`documented-fact`，但未来 Story 应拆开早期专利、后续压力机器和现代专业实践。
- Rights：两项均 reference-only；自行重构时间线和措辞。
- Safe to publish：espresso 技术与定义经历多个阶段，不简化为一个人完成且从未变化的发明。
- Uncertain：未来正式发布前仍需以专利局记录固定最早机器 claim。

三个 exercise 的 typed records 位于 `data/research/research-exercises.ts`，只验证流程，不进入公开 CulinaryItem、Story 或页面。

## Automation Boundary

后续可自动化：候选发现、URL health/redirect、重复检测、缺失 metadata、license hint、locator 格式、draft validation、broken reference。自动结果只能产生提示或候选状态。

必须由编辑判断：来源可信度、历史解释、claim classification、版权歧义、文化措辞、料理合理性、是否公开。当前不创建 cron、GitHub Action、n8n、background worker、crawler 或 AI writer。

## Database Boundary

目前 3 个 exercises 与小型 registry 使用 TS data modules，domain 与 validator 不依赖 filesystem 或数据库。当出现 hundreds/thousands CulinaryItems、密集 many-to-many Story/Evidence/Source、多人编辑审批、更新历史、大量翻译或持续 source health tracking 时，TS/JSON 将不再适合。

届时通过 repository adapter 持久化 Source、Evidence、ResearchRecord 和 catalog；本 Issue 不提前选择 Postgres、Supabase、Prisma 或 CMS。
