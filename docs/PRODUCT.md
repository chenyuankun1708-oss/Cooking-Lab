# Product

## 当前产品状态

- 当前阶段：Cooking Lab Public Beta v0.1
- Production URL：[https://cooking-lab-pied.vercel.app](https://cooking-lab-pied.vercel.app)
- `Cooking Lab` 目前仍是工程名和 working title，不代表最终消费者品牌名

## 定位与用户价值

传统菜谱主要回答“这道菜怎么做”，Cooking Lab 要回答的是：

“在我现有的食材、时间、营养目标、预算和厨具条件下，今天更适合做什么，为什么是它，以及这道菜背后的做法逻辑是什么。”

当前核心价值不是“搜索菜谱”，而是：

- 在现实限制下帮助用户决定吃什么
- 解释推荐结果为什么成立
- 让用户在做饭过程中逐渐建立自己的料理知识
- 为未来的个人化饮食系统打基础

长期方向可以概括为三层：

- Cooking Decision System
- Cooking Knowledge System
- Personal / Household Food Companion

这意味着产品未来不只是 Recipe Website，而是从“今天吃什么”逐步延伸到：

今天吃什么
-> 料理推荐
-> 菜谱
-> 烹饪学习
-> 食材知识
-> 我的口味
-> 我的冰箱
-> 饮食记录
-> Household / 家庭成员
-> Weekly Meal Planning
-> Shopping List
-> AI Cooking Companion

## 当前版本边界

M0-M4 已完成，当前 Public Beta 已具备：

- 100 道结构化 `demo-estimated` 菜谱与 73 种食材，其中 10 道通过发布审核并进入公开产品
- 本地营养、成本、单位换算和推荐引擎
- 首页多条件料理决策
- `/recipes` 已发布料理目录
- 详情页步骤、原理与估算信息
- 公开 Beta 反馈入口
- Vercel 上线能力与已部署生产环境

## 产品原则

- 结构化数据优先，而不是把内容全部埋进长文本
- 确定性计算优先，而不是用不可解释的黑箱结果替代底层规则
- 推荐必须可解释，用户能理解为什么被推荐或被排除
- 营养、成本、时间等信息明确标注为估算，不伪装成医学或实时精度
- AI 未来可以作为交互层和增强层，但不替代底层结构化数据与规则引擎

## M5 目标

M5 `Content, Brand & Experience` 的目标不是简单增加几个功能，而是把当前“技术 MVP / 工具型 Demo”升级为一个更像消费者产品的料理体验：

- 更有食欲
- 更有内容深度
- 更有品牌感和辨识度
- 更适合长期扩展到 Web + Mobile

M5 当前已经完成 taxonomy v2、shared-core audit、100 道菜数据扩展、image system，并在 Issue #21 落地消费者 Web 重设计。本阶段仍不完成最终品牌命名、完整 100 张图片覆盖或 Mobile App 开发。

100 道 structured recipes 是内容储备，不等于 100 道 published recipes。Issue #30 建立独立的 publication status 与技术 eligibility；公开首页、目录、推荐和详情当前只消费 10 道已审核 Recipe，其余内容继续保留为 draft。

Issue #31 在 Recipe Detail 尾部加入 deterministic similar-recipe discovery。它根据 canonical Flavor、主食材、cuisine、technique 和 dish type 寻找少量真正有料理逻辑的 published Recipe，不复用用户条件 Recommendation score，也不向用户展示系统分数。当前公开集较小时宁可只显示 1–2 道，或没有结果时隐藏整段，也不为了填满卡片公开 draft 内容。

## M5.1 产品自然化

Issue #29 开始把用户体验从“参数和数据库描述”转向真实做饭语言：

- `recipe.flavor` 成为口味、香气、口感和饮食感受的 canonical data
- 用户可以用清淡、鲜辣、酸爽、浓郁、焦香、暖乎乎表达 soft preference
- 首页与卡片优先显示自然时间分组，详情页仍保留精确分钟
- Recipe Card 使用单一整卡链接，不再展示匹配百分比或流程式 CTA
- step reasoning 融入步骤正文，不重复显示“为什么这样做？”
- Beta 状态与完整估算免责声明收回 footer，主要内容只保留必要的简短估算提示

## 体验方向

### 首页 v2 实现

首页保留推荐引擎的核心能力，同时采用更偏内容和发现的信息架构：

- Hero prompt：`今晚，想吃点什么？`
- 快速表达条件
- 立即进入推荐
- 今日灵感
- 按你的条件
- 探索世界料理
- 按食材探索
- 按技法探索
- 今天学一个技巧
- 料理故事

推荐引擎仍然是核心，但 UI 不应继续被“左侧筛选 / 右侧结果”的工作台式结构完全主导。

### Recipe Detail v2 实现

详情页已经从工程化 sidebar 布局改为内容型料理页面，当前顺序为：

- Hero image
- Recipe name
- country / region / cuisine
- 一句话简介
- time / difficulty / nutrition / cost
- 这道菜
- ingredients
- steps
- 每一步自然衔接的料理原因
- cooking principles
- nutrition / limiting metrics / cost
- tools
- story / origin / cultural context（仅在已有可靠内容时出现）
- 料理正文与可选文化内容结束后的相近料理探索（只使用 published Recipe）

### Brand / Visual 方向

下一版需要明显减少：

- Dashboard 感
- SaaS 工具感
- 工程 Demo 感
- 指标板式主导的首页

同时增加：

- food-first 视觉层级
- 更自然温暖的版式
- 真实料理与食材图像
- 探索感、生活感和料理文化感

## 长期领域扩展

未来产品不只服务“我一个人吃什么”，还可能服务“我们这一桌人吃什么”。因此需要为未来的 `Household` 领域预留空间，但不在当前 M5 落地：

- Me
- Partner
- Parent
- Child

未来每个成员可能拥有：

- preferences
- dislikes
- allergies
- nutrition goals
- portion needs

## 当前非目标

当前阶段仍不做：

- 登录与用户数据库
- 支付、订阅、会员体系
- 电商和实时价格
- 图片识别 / 冰箱识别
- 自动生成菜谱
- 复杂社区功能
- 医疗或临床营养建议
- 原生 Mobile App 实现

相关设计方向会在 M5 留下清晰扩展点，但不会在本轮直接实现。
