# Risk-based publishing governance

最近更新：2026-09-06  
适用版本：`m10.1-risk-based-2026-09-06`

## 不变的安全底线

本政策改变审查路由，不改变 M10 的权利标准。`unknown rights`、NC、ND、商业使用权限不明、`rights-changed`、来源链不完整、AI 作为 Evidence、署名或 ShareAlike 义务缺失、复审过期、不兼容数据库提取与未解决 AI 输入权利仍由 content-rights gate 硬阻断。真人、专家或 Product Director 不能用主观批准覆盖这些失败。

正式收费、餐厅授权合作、酒类推广或导购、品牌合作及大规模第三方数据库导入继续使用 M10 的专业律师或人类 checkpoint。

## 六类审查

1. `rights-license`：保存、转换、发布与商业使用权，以及 copyright、database、contract、trademark、publicity/privacy 和义务。
2. `provenance`：Source、Evidence、Claim、ContentArtifact 与 UsageDecision 的可追溯关系。
3. `factual-culinary`：事实一致性、料理可行性、时间、状态提示与安全边界；agent PASS 不是料理实测。
4. `editorial`：原创表达、清晰度、结构、双语自然度与 certainty 保真。
5. `visual-image`：料理对应度、构图、裁切、品牌/人物信号与图片 fidelity；图片版权仍属于 `rights-license`。
6. `human-approval`：明确的人类、领域专家或法律 checkpoint。它不是前五类证据的替代品。

Translation 的 `reviewed` 与 publication 的 `published` 只表示工作流状态，不再暗示 reviewer 是人类。审查身份只能由 `ReviewAttestation.reviewer.actorType` 表达。

## ReviewAttestation

每条 attestation 记录 dimension、batch、覆盖 item、artifact-set version、作者与 reviewer 的 actor/run/context、reviewed commit、独立 review evidence reference、rubric/policy version、日期、verdict、findings、reviewer 是否修改内容，以及是否声称 human approval、culinary field test 或 legal opinion。

- author 与 reviewer 的 actor、run、context 必须不同。
- reviewer 在同一 attestation 流程中修改内容后不能直接签发 PASS。
- artifact version 或覆盖集合变化会使旧 PASS 失效。
- agent 不得声称 human approval、culinary field test 或 legal opinion。
- PASS 不能包含 unresolved finding。

## 风险路由

### LOW

权利与 provenance 明确、第三方表达未复制、结构化事实有可靠 Evidence、图片权利与主体明确、批准的数据方法和全部确定性门禁通过。一个独立 reviewer context 必须覆盖全部适用审查维度并 PASS；完成 sampling QA 后可发布。AI-assisted expression 可以走此路径，但必须保留 AI provenance、输入权利、相似性和商标检查。

### MEDIUM

包括单源深度改编、已解决但存在判断空间的来源冲突、`cooking-lab-reconstruction`、产品档案、AI 图片、较弱 image fidelity 或显著料理真实性判断。至少两个独立 reviewer context：一个共同覆盖 rights/provenance，另一个共同覆盖 factual/culinary、editorial 及适用的 visual/image。未解决分歧升级 HIGH。

### HIGH

包括权利或商业使用不明、可能大量复现受保护表达、官方授权或品牌关系、医疗健康主张、高风险食品工艺、重要事实冲突、未解决 reviewer disagreement、复杂 trademark/publicity/privacy 或 M10 专业法律 checkpoint。默认 BLOCK；只有对应类型的真人、领域专家或律师 checkpoint 可以解除可解除的风险。`unknown rights` 等 M10 硬阻断不能仅靠 human approval 解除。

## Sampling QA

Sampling 不使用固定百分比。每批必须覆盖新增或改变的风险等价类：风险等级与原因、artifact kind、来源域、许可证、内容类型、图片来源、derivation、模型/prompt、营养或成本数据转换、翻译路径、餐厅身份、产品档案，以及外部媒体的平台、使用方式与隐私审查路径。Evidence 引用的 Source 必须闭包进入 artifact provenance、Source RightsAssessment、UsageDecision、fingerprint 和 sampling domain，不能靠省略 `artifact.sourceIds` 绕开。翻译路径至少区分 adapted Recipe、native CulinaryItem 与 standalone package。系统从真实 classified item 中使用确定性的 greedy set cover 选择能覆盖全部等价类的最小候选集合；这不是统计代表性声明，而是风险路径覆盖。新增 license、来源域、模型/prompt、转换或翻译路径会自然增加样本，持续出现 escape、disagreement 或 rework 则通过冻结规则将对应类提升到 100% review。

每个等价类至少有一个真实 sampled item；每个 sampled item 必须留下逐项、全维度、带 verdict 与 findings 的 durable evidence，不能只用批次级 PASS 或虚假 item ID 满足覆盖。sampling auditor 必须与 author 及 primary reviewer 使用不同 actor/run/context。MEDIUM 的逐项双上下文审查不被 sampling 替代。

出现 major finding 时冻结对应风险类，并把该类扩展为 100% re-review。只有完整复审且连续两个批次没有 major finding 后才可解除冻结。每批持续记录 escape count、reviewer disagreement、rework item count 和 provenance/license novelty。Escape 与 disagreement count 必须逐条对应 durable finding；已解决的 sampled-item finding 必须登记 rework item ID；novelty count 必须逐项列出此前未出现的来源、许可证、模型、转换、媒体、餐厅、产品或翻译 class key。计数与明细不一致会 fail closed，避免用全零指标伪装低风险批次。

## Fail-closed enforcement

Artifact-set version 覆盖实际料理、Story、Source、Evidence、RightsAssessment、UsageDecision、Attribution、AI metadata、营养/成本 dataset 与转换、内容路径、图片 metadata 及本地图片文件 SHA-256。Committed attestation 保存对应 version；任一内容或依赖证据修改、scope 改变、policy 变化、缺少 risk classification、缺少适用 dimension、MEDIUM 独立性不足、HIGH 缺少 checkpoint 或 sampling coverage 不完整都会使 Production import、测试与 build 失败。历史 sampling record 可以保留其原始 artifact version，但不能为已经改变的当前 item 提供 publication coverage。

当前 M10 50 项的 migration 记录明确标为独立 agent review，不标为 human review、field test 或 legal opinion。旧 M10 review 不能被追溯包装成 sampling PASS，因此 registry 在新审计完成前不包含 sampling batch，Production import 会按设计 fail closed。M10.1 必须使用本次真实、逐项留痕的独立 sampling audit。未来批次使用新的 batch attestation，不修改旧 checkpoint 来“继承”PASS。
