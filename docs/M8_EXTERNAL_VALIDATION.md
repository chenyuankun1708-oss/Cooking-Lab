# M8 Bounded External Validation

最近更新：2026-09-06

## 当前决定

Cooking Lab Public Beta 已进入一次有界、形成性的外部验证。M7 证明了产品的内部行为与约束契约，M8 只回答一个更小但尚未被证明的问题：真实目标用户是否能用当前产品完成一次有意义的料理决策，并感到它比原有做法多提供了足够价值。

本轮不是统计研究，不证明市场规模、长期留存、产品市场契合或不同语言用户之间的差异。至少 6 个有效 session 完成前，不作产品方向结论。

## 已知证据与待验证假设

### 已知证据

- M7 的六类 deterministic scenario、双语浏览器 dogfood 与 independent review 均通过；详细证据见 `docs/M7_EVALUATION.md`。
- 当前 Production 提供 URL-backed Decision Context、公开 Recipe、Pairing、显式 partial/empty 与中英文入口。
- 现有 Beta feedback 仅指向公开 GitHub Issue，当前没有收到 Beta feedback。
- 内部测试只能证明产品按设计工作，不能证明用户需要它、信任它或愿意再次使用。

### 待验证假设

1. 经常为家庭餐食做决定的人，确实会把时间、现有食材、厨具、预算或非医疗性的饮食偏好作为同一次决策的约束。
2. 用户能理解推荐为何适合自己，而不是把 Cooking Lab 当作另一份静态菜谱目录。
3. 清楚标注为估算的时间、营养与成本信息仍足以支持决定，不会造成不合理的精确感。
4. 从 Recipe 继续查看 Pairing 对一部分用户有增量价值；它也可能因为跨菜系搭配或食材重复降低信任。
5. 用户能描述一个具体、近期的再次使用场景，而不只是礼貌地说“不错”。

## 目标用户与样本边界

有效参与者必须同时满足：

- 18 岁以上；
- 每周至少两次需要决定并准备自己或家庭的餐食；
- 最近一个月遇到过时间、现有食材、厨具、预算或饮食偏好造成的做饭取舍；
- 是当前服务的真实或潜在用户，不属于 Cooking Lab 项目团队；
- 能使用自己的手机或电脑访问公开站点。

本轮招募 6–8 名参与者。尽量覆盖中英文入口、移动和桌面情境，以及不同数字熟练度；这些是覆盖属性，不构成可比较的独立群组。不能只招募 UX、产品或软件工程从业者，也不能把代理、自动化、内部 dogfood、AI 生成回复、转述意见或没有亲自使用产品的评论计入样本。

以下情况不进入本轮：未成年人、需要披露医疗诊断才能参与的人、无法提供知情同意的人，以及仅为测试而假设自己会做饭的人。

### 招募与筛选

招募前先记录渠道类别和计划名额，不记录公开身份。允许的来源是维护者的个人网络、获得社区管理者许可的料理相关社群，以及主动表示愿意参加研究的现有用户。不得抓取联系名单、向无关用户批量发送邀请或在第三方页面发布未经许可的招募信息。

筛选只问：

1. 是否年满 18 岁；
2. 通常每周为自己或家庭决定并准备几次餐食；
3. 最近一个月是否遇到过时间、现有食材、厨具、预算或非医疗性饮食偏好造成的取舍；
4. 是否属于 Cooking Lab 项目团队，或是否以 UX、产品、软件工程为主要职业；
5. 希望使用的界面语言和设备类别；
6. 是否能在 session 中使用一个真实但无需披露敏感信息的料理情境。

候选人按资格和覆盖缺口选择，不按对产品的预先态度选择。最多 2 人来自同一个紧密关系圈或同一职业类别，至少 4 人不以 UX、产品或软件工程为主要职业。每个有效参与者的 repo 记录只保留招募渠道类别，不保留具体社区、雇主或关系。

本轮默认不提供报酬，必须在接受邀请前说明；不得以正面评价换取任何利益。如果无报酬导致招募不足或样本明显偏斜，结论为 `inconclusive`，后续付费招募需要单独的成本与数据处理授权。

## 研究问题

1. 用户能否从一个真实的晚餐情境出发，独立找到愿意做且认为可执行的 Recipe？
2. 用户能否复述推荐结果为什么适合自己的条件，并区分“当前 Recipe 条件”和“整餐条件”？
3. 用户是否信任产品对时间、营养、成本和工具限制的表达？哪些内容让信任上升或下降？
4. 产品相对用户平时使用的搜索、短视频、收藏或临时决定方式，提供了什么具体增量价值？
5. 用户是否能描述未来两周内一个具体的再次使用触发场景？
6. Pairing 是有帮助的下一步，还是不必要、重复或令人怀疑的建议？

## 方法

优先使用 30–45 分钟的远程或面对面 moderated usability session。参与者使用自己的设备和一个真实但不必披露敏感细节的做饭情境。主持人观察并做结构化笔记，默认不录音、不录像。

如果参与者无法参加同步 session，可以使用完整的自助任务和一次文字追问，但它只能作为 supplemental participant report，不能进入任务完成率、复用价值或 Pairing 阈值的分母。方向门槛只使用研究人员实时观察到参与者操作 Production 的 moderated session。单独提交 bug、点赞、泛泛建议、假设性回答、AI 生成回复、转述或只有最终链接而没有观察记录的反馈都不算有效 session。

每完成 2 个 session 做一次研究运行检查，只修复会污染后续证据的严重故障、隐私问题或明显误导。不得在看到早期结果后修改成功门槛；普通可用性问题留到本轮综合时一起排序。

## 参与者任务

主持人先说：“我们测试的是产品，不是你。过程中没有正确答案；请按你平时的判断行动，并把正在想什么说出来。”

### Task 1：从真实条件开始

“请想一个你最近确实需要决定吃什么的晚餐情境。只告诉我你愿意分享、且不涉及医疗或隐私的条件。打开 Cooking Lab，找一道你在这个情境下愿意考虑制作的料理。”

观察：

- 是否发现并使用“决定今晚吃什么”；
- 使用了哪些条件，哪些现实条件无法表达；
- 是否不经提示得到候选 Recipe；
- 最终是否愿意选择一道料理，以及为什么。

### Task 2：判断推荐是否可信

“请查看你选择的料理，告诉我哪些信息支持或阻止你真的去做。你认为产品为什么把它推荐给你？”

观察：

- 能否复述主要推荐理由；
- 是否理解时间、营养和成本是估算；
- 是否发现条件作用域或产生错误推断；
- 关键步骤、食材、工具或内容缺口是否阻止行动。

### Task 3：继续组成一餐

“如果你还想看看这道料理可以怎样组成一餐，请继续。告诉我这个建议是否让你的决定更容易，以及任何不自然、不可信或重复的地方。”

必须特别观察但不能向参与者暗示答案：

- Tomato and Scrambled Eggs + Salted Lassi 的跨菜系接受度；
- Greek Village Salad + Tomato and Scrambled Eggs 的番茄与酸味重复感；
- partial、empty 与显式放宽条件是否被理解。

### Task 4：价值回顾

“如果没有 Cooking Lab，你刚才会怎样做决定？Cooking Lab 哪一步改变了你的决定？未来两周内，什么具体情况会让你再次打开它？”

避免只问“你喜欢吗”或“你会用吗”。追问实际替代方案、触发时刻和没有价值的部分。

## 主持讨论指南

### 开始前

1. 核对目标用户条件，不记录不必要的人口统计信息。
2. 提供参与者说明，逐项确认 consent。
3. 说明可以跳过任何问题、随时停止，并且退出不会带来不利影响。
4. 确认默认不录音、不录像；若未来确有录制需要，必须另行修改协议和取得明确同意，不能沿用本轮 consent。

### 过程中

- 使用中性提示，如“你现在在想什么？”、“是什么让你这样判断？”、“如果平时遇到这里，你会怎么做？”
- 不指出按钮、不解释产品逻辑、不替参与者选择条件。
- 参与者完全卡住时可在记录一次 `moderator_assist` 后帮助其继续，以便研究后续步骤；该任务不能记为独立完成。
- 发现医疗、过敏或其他敏感信息时停止记录细节，只保留“参与者选择不披露的限制无法安全评估”。

### 结束时

- 询问还有什么让参与者不愿再次使用；
- 说明结果只用于改进 Cooking Lab；
- 再次说明退出和删除请求渠道；
- 不承诺某项建议一定进入产品。

## 参与者说明与知情同意

### 中文参与者说明

Cooking Lab 正在验证一个公开料理决策 Beta 是否能帮助真实用户根据时间、食材、厨具和偏好决定吃什么。本次活动约 30–45 分钟。你会使用公开站点完成一次料理决策，并谈谈你理解、信任或不需要的部分。

参与完全自愿。你可以跳过任何问题或随时停止。默认只做文字笔记，不录音、不录像。请不要提供姓名、邮箱、住址、医疗诊断、未成年人信息或其他敏感资料。营养、成本和时间均为演示估算，不构成医学或个体化饮食建议。

研究记录以 P01–P08 假名编号保存，在研究人员仍能通过 consent 记录对应参与者期间属于 pseudonymised data，不宣称为完全匿名。仓库只保留进一步去标识化的观察和综合结论。联系信息若用于安排 session，只能保存在仓库之外，并在 session 安排完成后删除；原始笔记在综合完成后 14 天内删除；consent 记录在 M8 关闭后保留 30 天再删除。你可以在去标识化记录合并前，通过邀请中写明的私密研究联系渠道要求退出或删除资料。

去标识化记录一旦进入公开 Git 仓库，可能已被复制到 commit history、fork、cache 或其他公开副本，维护者无法保证完全撤回所有副本。参与者必须在 consent 时明确接受这一限制；未接受时 session 不开始，也不会发布其记录。

研究负责人和 data controller 是 Cooking Lab 仓库维护者。每份实际邀请必须把 `Private research contact: <可直接回复的具体私密渠道或地址>` 替换成真实可用的联系方式；带占位符的材料不得发送，未验证私密联系渠道的 session 无效。产品问题可在公开 GitHub 仓库查看；与参与、退出或删除有关的请求只使用邀请中的私密渠道，不要在公开 Issue 中填写个人资料。

### 中文 consent 核对

参与者必须对每一项明确回答“同意”：

- 我已阅读并理解上述参与者说明；
- 我已年满 18 岁，并自愿参与；
- 我理解本轮默认只做文字笔记，不录音、不录像；
- 我理解去标识化观察可能进入公开仓库和产品决策文档；
- 我理解发布的是去标识化观察，但公开 Git history、fork 或 cache 中的副本在合并后可能无法被完全撤回；
- 我知道可以跳过问题、随时停止，并在去标识化记录合并前要求删除；
- 我不会在研究记录或公开 GitHub Issue 中提供个人或敏感资料。

任何一项未同意，session 不开始。

### English participant information

Cooking Lab is evaluating whether a public cooking-decision beta helps real users decide what to eat using constraints such as time, ingredients, tools, and preferences. The session takes about 30–45 minutes. You will use the public website for one cooking decision and discuss what you understood, trusted, or did not need.

Participation is voluntary. You may skip any question or stop at any time. The default is written notes only, with no audio or video recording. Do not provide names, email addresses, home addresses, medical diagnoses, information about minors, or other sensitive information. Nutrition, cost, and timing figures are demonstration estimates and are not medical or personalized dietary advice.

Research records use pseudonymous IDs P01–P08. They remain pseudonymised data while the researcher can connect them to a consent record; the repository contains only further de-identified observations and synthesis. Contact details used for scheduling must stay outside the repository and be deleted after the session is arranged. Raw notes are deleted within 14 days after synthesis. Consent records are deleted 30 days after M8 closes. Before a de-identified record is merged, you may withdraw or request deletion through the private research contact named in your invitation.

Once a de-identified record enters the public Git repository, copies may remain in commit history, forks, caches, or other public replicas, and the maintainer cannot guarantee complete withdrawal from every copy. You must explicitly accept this limitation before the session begins; otherwise your session will not be run or published.

The research lead and data controller is the Cooking Lab repository maintainer. Every invitation must replace `Private research contact: <specific reply-capable private channel or address>` with a working contact method. Materials containing the placeholder must not be sent, and a session without a verified private contact is invalid. Product information is available in the public GitHub repository. Use the private contact in the invitation for participation, withdrawal, or deletion requests; do not place personal information in a public issue.

### English consent checklist

The participant must explicitly agree to every item:

- I have read and understood the participant information above.
- I am at least 18 and I am taking part voluntarily.
- I understand that this round uses written notes only and no audio or video recording.
- I understand that de-identified observations may be included in a public repository and product-decision document.
- I understand that copies already published in Git history, forks, or caches may not be fully retractable after merge.
- I may skip questions, stop at any time, and request deletion before the de-identified record is merged.
- I will not provide personal or sensitive information in the research record or a public GitHub issue.

The session does not begin unless every item is accepted.

## Session 有效性与记录模板

每个 session 使用 P01–P08；仓库记录不得包含真实姓名、GitHub 用户名、精确日期、精确地点、雇主、具体医疗情况或可重新识别参与者的原话组合。稀有的 locale、设备、条件和背景组合应概括或删去，只保留回答研究问题需要的最小信息。

```md
## P0X

- Round: M8-R1
- Protocol revision or commit:
- Production deployment URL and commit:
- Evidence status: observed
- Format: moderated-remote | moderated-in-person
- Eligibility: valid | invalid — reason
- Recruitment source category: personal-network | permitted-community | existing-user-opt-in
- Locale: zh-CN | en
- Device class: mobile | desktop | tablet
- Digital confidence: low | medium | high — participant self-description
- Consent confirmed: yes | no
- Private research contact verified: yes | no
- Recording: none
- Moderator intervention: none | assist — task and reason

### Real decision context

- Non-sensitive constraints used: participant-reported and observed input
- Usual alternative: participant-reported

### Task evidence

- Core decision outcome: independent | moderator-assist | not-completed — observed
- Selected Recipe or no selection: observed
- Why selected or rejected: participant-reported
- Recommendation explanation: understood | partial | misunderstood — participant-reported and researcher-coded
- Estimate/constraint trust: trusted | uncertain | breached — participant-reported and researcher-coded
- Blocking usability/content issue: observed | participant-reported — specify

### Pairing evidence

- Reached Pairing: yes | no — observed
- Outcome seen: complete | partial | empty | not-applicable — observed
- Value: added | neutral | reduced — participant-reported and researcher-coded
- Cross-cuisine/repetition observation: observed | participant-reported — specify

### Value signal

- Product changed the decision: yes | partly | no — participant-reported
- Concrete reuse trigger within two weeks: present | absent — participant-reported and researcher-coded
- Paraphrased reason: participant-reported

### Findings

- Failure class: none | usability | content-fit | trust-contract | no-value | research-setup — researcher-coded inference
- Severity: critical | major | moderate | minor | none — researcher-coded application of the predeclared heuristic
- De-identified observation: observed | participant-reported | inference — specify
```

有效 session 必须有：符合资格、完整 consent、已验证私密联系渠道、研究人员实时观察实际使用 Production、Production commit/deployment、协议 revision、核心任务结果、信任判断、价值判断和 Pairing 反应或未进入原因。缺少任一项时标为 invalid，不计入方向阈值。

### 原始资料存储与删除

- 联系信息、consent 和原始笔记不得进入仓库、Issue、PR、第三方转录服务或自动云同步目录。
- 它们只能存放在维护者本人可访问、受操作系统全盘加密和账户认证保护的本地目录；其他协作者默认无权访问。
- consent 记录与原始笔记以 participant ID 对应，联系信息单独保存；repo 中不得保存映射表。
- 删除时移除本地文件并清空废纸篓，同时在不含个人资料的 M8 操作日志中记录删除类别与日期。若文件已进入备份或云同步，该记录不得发布，研究立即停止并评估清理范围。
- repo 输出只保留 round、粗粒度 locale/device、最小情境、观察与编码；可能重新识别参与者的组合必须概括或省略。

## 预先声明的方向决策规则

这些比例只用于小样本决策，不报告置信区间或统计显著性。分母只包含有效、实时 observed moderated session。

| 有效 session 数 | 75% 独立完成最低人数 | 50% 具体复用最低人数 | 少于 40% 复用的最高人数 |
| --- | ---: | ---: | ---: |
| 6 | 5 | 3 | 2 |
| 7 | 6 | 4 | 2 |
| 8 | 6 | 4 | 3 |

“具体、可信的复用触发”必须同时包含未来两周内可能出现的情境、准备采取的产品动作，以及 Cooking Lab 相比原方式能提供的具体帮助。只有“不错”“可能会用”“界面好看”等评价记为 `absent`。研究人员不能根据语气把礼貌性赞同升级为价值信号。

Trust-contract severity 在 session 前固定：`critical` 表示产品会让参与者相信一个实际违反其硬条件、安全边界或明确估算范围的结果；`major` 表示参与者因同一错误理解而无法做出可信决定，但没有现实伤害风险；其余摩擦按 moderate/minor 记录。

方向判定按以下优先级执行，后面的规则不能覆盖前面的规则：

1. 出现安全/隐私停止条件：本规则覆盖其他所有方向规则；本轮状态记为 `Research stopped — reauthorization required`，停止研究且不作产品方向结论。
2. 有效 session 少于 6、样本不合格、关键证据缺失或无法得到唯一结果：`Inconclusive`。
3. 出现任何 critical trust-contract failure，或同一 major trust-contract failure 出现至少 2 次：`Repair then revalidate`。
4. 具体复用低于 40%，且不存在能解释失败的单一集中、低风险可修复问题：`Pivot or stop`。
5. 具体复用达到 50%，但独立完成低于 75%，或存在阻止 Continue 的重复可修复问题：`Repair then revalidate`。
6. 独立完成达到 75%、具体复用达到 50%、且 trust gate 通过：`Continue / iterate`。
7. 40%–50% 之间的离散结果、相互矛盾或不满足任何唯一规则的结果：`Inconclusive`。

Pairing 是主结论之后的独立 modifier。分母只包含在没有研究环境故障的情况下实际进入并看完 Pairing 的有效参与者；至少需要 4 次 Pairing exposure 才能判定。少于 4 次记为 `Pairing inconclusive`。达到 4 次后，`added` 少于 50% 或同一 major Pairing trust 问题出现至少 2 次，则结论附加 `Narrow or deprioritize Pairing`；否则附加 `Continue Pairing cautiously`。Pairing 不能把失败的核心 Recipe 决策提升为 Continue。

### Continue / iterate

同时满足：

- 至少 75% 在没有 `moderator_assist` 的情况下完成核心料理决策；
- 至少 50% 描述一个未来两周内具体、可信的再次使用触发场景；
- 没有 critical trust-contract failure；同一 major trust-contract failure 不超过 1 人；
- 观察到的价值不是只来自页面美观或礼貌性赞同。

下一阶段只能围绕最常见、证据最强的价值路径继续，并把重复摩擦作为候选修复 Issue。

### Repair then revalidate

通常需要至少 50% 有具体复用价值信号，但重复 usability、content-fit 或可修复 trust-contract 问题使 Continue 门槛未通过。优先级规则 3 是明确例外：任何 critical trust-contract failure 或重复 major trust-contract failure 都直接进入 Repair，不受复用比例限制，因为继续验证或发布该行为不安全。先修复最小阻塞，再运行一个新的 bounded round，不能把修复后的内部测试替代外部复核。

### Narrow or deprioritize Pairing

核心 Recipe 决策得到 Continue 或 Repair 主结论，且达到上述 Pairing exposure 门槛后，少于 50% 的 Pairing 体验被评为 `added`，或同一 major Pairing trust 问题至少出现 2 次。保留可靠 engine 边界，但下一阶段不继续扩大 Pairing。

### Pivot or stop

少于 40% 有具体复用价值信号，且主要原因不是一个明确、集中、可低风险修复的 usability 或 content-fit 问题；或者多数参与者明确认为原有方式更快、更可信且 Cooking Lab 没有独特帮助。

### Inconclusive

- 少于 6 个有效 session；
- 参与者不符合目标用户或过度集中于项目关联人/专业评审者；
- 关键记录缺失；
- 证据相互矛盾，无法按上述规则得到唯一主方向。

Inconclusive 时只允许补足或重做验证，不启动内容扩张、账号、Household、Planner、AI companion 或新的整餐约束。

## 停止与升级条件

出现以下任一情况立即停止相关 session，并在不记录敏感细节的前提下登记：

- 参与者撤回同意；
- 研究材料意外收集姓名、联系信息、健康诊断或其他敏感资料；
- 产品出现可能导致现实伤害的误导性饮食、过敏或安全表达；
- Production 故障使任务无法继续且会污染后续 session；
- 研究人员需要新增录音、录像、付费招募或第三方数据处理服务。

最后一项需要单独评估权限、成本、数据处理和新 consent，不属于本协议的默认授权。

触发停止条件后，当前 round 标记为 `Research stopped — reauthorization required`，尚未综合的 session 全部退出方向阈值，只能作为受限 incident evidence。修复隐私、安全或研究设置问题并完成新的协议 revision、consent 和所需授权后，才可用新的 round ID 重新开始；旧 round 的人数不能与新 round 拼接达到门槛。若问题无法安全修复，M8 保持无产品方向结论。

## 分析规则

- `observed evidence`：研究人员直接观察到的行为；
- `participant report`：参与者对理解、信任、替代方案或未来用途的陈述；
- `inference`：由多条证据推导的解释；
- `heuristic`：本轮预先声明的决策阈值。

综合文档必须保留反例和少数意见，不能只报告多数。Recipe 决策与 Pairing 分开评分。任何产品方向决定都必须引用去标识化 session ID，不能只引用汇总百分比。每个用于结论的 claim 都要在同一条记录中标注 `observed`、`participant-reported`、`inference` 或 `heuristic`，一个全局 evidence label 不能覆盖混合来源。

## 外部方法依据

访问日期均为 2026-09-06。

- [GOV.UK — Finding participants for user research](https://www.gov.uk/service-manual/user-research/find-user-research-participants)：参与者应是真实或潜在用户；一轮访谈或 usability test 通常为 4–8 人；应定义筛选条件并收集最少参与信息。
- [GOV.UK — Using moderated usability testing](https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing)：任务应真实、明确、不会提示答案；主持人主要观察和倾听，并保留讨论指南。
- [GOV.UK — Getting informed consent for user research](https://www.gov.uk/service-manual/user-research/getting-users-consent-for-research)：参与者需理解目的、收集数据、用途、保存时间、退出权和录制情况，并留下 consent 记录。
- [GOV.UK — Managing user research data and participant privacy](https://www.gov.uk/service-manual/user-research/managing-user-research-data-participant-privacy)：只收集回答研究问题所需的数据，限制访问，设定保存期，并优先使用完全匿名的研究输出。

这些来源提供研究操作与隐私基线，不证明 Cooking Lab 的成功阈值。样本与方向规则是本项目在真实结果出现前冻结的 heuristic。

## Independent review

Issue #61 由未参与协议编写的独立 reviewer 完成三轮审查。首轮 `REVISE` 要求补齐人数取整与规则优先级、moderated-only evidence、公开 Git 副本不可完全撤回、pseudonymisation、私密联系门禁、原始资料存储/删除、产品与协议版本、field-level provenance 和招募偏差控制。第二轮收紧 Repair/stop contract，第三轮确认 safety/privacy stop 覆盖其他方向规则。

最终 verdict：`PASS`。剩余风险只属于后续执行：当前尚无真实外部 session；每份邀请仍必须替换具体私密联系渠道；每个 session 必须记录协议与 Production 版本并实际遵守本地存储和删除规则。
