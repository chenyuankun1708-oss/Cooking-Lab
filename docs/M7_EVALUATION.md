# M7 Canonical Evaluation

最近更新：2026-09-05

## Readiness verdict

**DECISION — ready for bounded external validation**

M7 的最小闭环已经成立：声明的 Decision Context 能跨 Discovery、Recipe、Pairing、详情返回与 locale switch 连续传递；Meal Composition 只执行已批准的 whole-meal hard constraints；不合规的完整 Meal 不会覆盖合规 partial 或 explicit empty；放宽条件只能由用户明确选择。

这里的 “ready” 只表示修复后的产品值得进入小范围真实使用验证，不表示已获得统计显著性、长期质量门槛或规模化发布结论。

## Evidence, assumptions, heuristics, and decisions

### EVIDENCE

- `lib/__tests__/m7-evaluation.test.ts` 固定了六类 canonical scenarios 的输入、Recipe/Meal 输出身份、query continuity、locale identity 与 empty/relaxation 行为。
- 英文 dogfood 完成 `Discovery -> Recipe -> Pairing -> Recipe/back`，随后切换到中文并再次进入 Pairing；`dcMaxTime=30` 与 `dcSource=discovery` 全程保留。关键 empty/partial 场景也在 fresh production build 上复核。
- 英文有效 partial、英文 time constraint empty/显式恢复、中文 tools constraint empty 均在浏览器中核对；开发浏览器日志没有 error。
- 当前 10 个 published Recipe、16 个 native CulinaryItem 与 26 个 published CulinaryItem 的既有回归基线没有改变。
- 六类场景均未出现条件静默丢失、违规完整 Meal 被标为合规、隐式放宽、unknown 被伪装成 zero，或把 estimated time 写成真实厨房保证。

### ASSUMPTION

- 当前继续采用 `maxTime` 约束页面展示的 whole-meal estimated elapsed time；它不是现实厨房完成时间保证。
- 非空 `availableTools` 继续代表用户声明的完整可用工具集合。
- 通过 deterministic scenarios 与双语 dogfood 后，小范围外部验证比继续扩大内部测试矩阵更能提供下一阶段证据。

### HEURISTIC

- 六类 scenario 是 M7 最小风险覆盖启发式，不是统计样本、永久质量门槛或成功率指标。
- 每类选一个可复现代表场景，目的是覆盖不同 contract 分支；不能据此推断全部料理、设备组合或用户行为。
- 既有 per-slot 最多 8 个候选的 bounded ranking 可能在未来更大内容库中形成保守 false-empty；本轮没有证据显示它会放行违反 hard constraint 的结果。

### DECISION

- M7 readiness verdict 为 **ready for bounded external validation**。
- 当前不补内容：没有 named scenario 在 context 与 engine logic 均通过后因为缺少 eligible candidate 而失败。
- 当前不引入新的 constraint framework、不扩大 whole-meal hard constraint 字段，也不设定外部用户数量或成功率门槛。

## Canonical scenario record

Failure class 只允许 `engine`、`context`、`presentation`、`missing content`；通过时记为 `none`。

| Scenario | Input | Expected contract | Actual Recipe result | Actual Meal result | Query continuity | Locale behavior | Verdict | Failure class |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Time-estimate continuity | `dcMaxTime=30&dcSource=discovery`，选择 `tomato-scrambled-eggs` | Recipe 与 Meal 都执行 30 分钟上限；Meal 时间明确为 estimate | 7 个 published Recipe 合规，包含 `tomato-scrambled-eggs` | complete `main-drink`：Tomato and Scrambled Eggs + Salted Lassi；estimated elapsed 22 min | Discovery、Recipe、Pairing 与 anchor 返回链接均保留 normalized query | 英文实际 journey 通过；身份与规则由双语 deterministic test 固定 | PASS | none |
| Tool continuity | 完整工具集合 `cutting-board, frying-pan, gaiwan, kettle, knife, mixing-bowl, scale` | 非空 tools 是 closed-world 集合；排序、去重稳定 | 4 个 published Recipe 合规，包含 `tomato-scrambled-eggs` | complete `main-drink`：Tomato and Scrambled Eggs + Longjing Green Tea；无 relaxation | 反序与重复输入归一化为稳定 `dcTool` 顺序 | 双语 Meal 身份一致；中文另核对单一 `kettle` 的 exact missing-tool empty | PASS | none |
| Constraint-eligible complete | 上述工具集合 + `dcMaxTime=30` | 只有 time 与 tools 同时通过才可返回 complete | `tomato-scrambled-eggs` 合规 | complete `main-drink`：Tomato and Scrambled Eggs + Longjing Green Tea；estimated elapsed 21 min | 两类 whole-meal 条件共同保留 | 双语输出保持同一 template 与 item IDs | PASS | none |
| Valid partial | `greek-village-salad` + `dcMaxTime=30` | 合规 partial 可替代无法可靠成立的完整模板 | native CulinaryItem anchor，不适用 Recipe result | `partial-pair`：Greek Village Salad + Tomato and Scrambled Eggs；estimated elapsed 30 min；无伪造 alternative | Pairing URL 保留 time 与 source | 英文浏览器输出与双语 engine contract 一致 | PASS | none |
| Explicit empty | `tiramisu` + `dcMaxTime=30&dcMaxCalories=1&dcSource=discovery` | time 超限时 explicit empty；calorie 保持 Recipe-only；只能显式放宽 time | native dessert anchor，不适用 Recipe result | empty 明示 nearest candidate 为 405 min、超过 30 min；点击后 URL 新增 `relaxMeal=estimated-elapsed-time` 并恢复 complete Meal | 原 `dcMaxTime`、`dcMaxCalories`、source 在 relaxation 后仍保留 | 英文 empty/restore 实测；中文规则由 locale test 覆盖 | PASS | none |
| Locale/back recovery | `tomato-scrambled-eggs` + tools + `dcMaxTime=30&dcMaxCalories=600&dcSource=discovery` | 切换 locale 与返回 Discovery 时保留仍适用条件；Recipe-only calorie 不升级 | 中英文 eligible Recipe identities 相同 | 中英文 template 与 item IDs 相同；elapsed 分别明确为 “Estimated” / “预计” | locale URL 保留完整 stable query；返回 URL 重建到 `/{locale}#decide`，不接受 free-form return target | 英文 `Discovery -> Recipe -> Pairing -> Recipe` 后切中文并再次 Pairing，实际通过 | PASS | none |

## Dogfood notes

- English: `/en?dcMaxTime=30` 展示 7 个 eligible Recipe；选择 Tomato and Scrambled Eggs 后 Recipe 显示 whole-meal estimated-time scope，Pairing 返回 complete meal 与 `Estimated coordinated time: about 22 min`。
- Back/recovery: Pairing anchor link返回 Recipe 时 query 未丢失；Recipe locale switch 指向 `/zh-CN/recipes/tomato-scrambled-eggs?dcMaxTime=30&dcSource=discovery`。
- 中文：Recipe 显示“整餐展示的预计用时不超过 30 分钟”，Pairing 显示“组成完整”与“预计协调用时约 22 分钟”。
- Partial: Greek Village Salad 在 30 分钟条件下显示“当前内容库只支持部分组合”，并返回两项而非填充完整模板。
- Empty/relaxation: Tiramisu 在 30 分钟条件下显示 405 分钟的明确超限；`dcMaxCalories=1` 标为“不在本次整餐执行”；只有点击移除时间条件后才恢复 Meal。
- Tools: Longjing Green Tea 仅声明 `kettle` 时，中文 empty state 明示缺少盖碗、耐热碗、冰箱、汤锅、电子秤、方形盛皿和打蛋器，并只提供显式移除 tools 条件的入口。
- Browser console: development journey 与 production-build smoke 均为 0 errors；开发环境仅观察到 React DevTools info 日志。

## Independent review

**PASS.** Reviewer did not participate in #54 implementation and independently checked the product contract, deterministic coverage, locale behavior, failure classification, content-gap conclusion, readiness verdict, and representative culinary outputs on a fresh production build.

- Tomato and Scrambled Eggs + Salted Lassi is plausible as a cool, light, tangy counterpoint to a hot savory egg dish. It remains a cross-cuisine hypothesis for bounded validation and is not presented as a traditional or externally validated pairing.
- Tomato and Scrambled Eggs + Longjing Green Tea is a plausible light table pairing and satisfies the declared tool set.
- Greek Village Salad + Tomato and Scrambled Eggs has a real tomato/acidity repetition risk, but crisp/cool vegetables and feta contrast with the tender hot egg dish. The product correctly labels it partial rather than a complete meal.
- Explicit time and tools empties, opt-in relaxation, Recipe-only scope, exact missing tools, and estimated-time language match the approved contract.
- No unresolved major or blocking finding remains.

## Known limits

- 本轮没有真实用户证据，外部验证的招募方式、人数与成功阈值未定义。
- Canonical scenarios 锁定关键 contract，不替代跨全部 26 个 published CulinaryItem 的组合审查。
- Browser dogfood 使用当前 Chromium-based local surface；Safari/Firefox 目视检查仍沿用既有 Beta QA 的未验证状态。
- Cross-cuisine acceptance for Tomato and Scrambled Eggs + Salted Lassi, and perceived repetition in Greek Village Salad + Tomato and Scrambled Eggs, should be observed during bounded external validation.
