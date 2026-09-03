# Brand Directions

最近更新：2026-09-04

## Scope and confirmed context

- 当前工作基于最新 `main`
- Production URL：
  [https://cooking-lab-pied.vercel.app](https://cooking-lab-pied.vercel.app)
- M0-M4 已完成，Public Beta 已上线
- M5 已启动，当前进入 `Content, Brand & Experience` 阶段
- 本 Issue 不负责最终 UI 实现
- 本 Issue 不替用户决定最终品牌名
- `Cooking Lab` 继续作为 working title

## Visual Audit

### 为什么现在有 dashboard / SaaS / engineering demo 感

当前 Production 的核心问题不是风格“太素”，而是信息层级首先传达了一个高密度工具，而不是一个让人想浏览和想吃的料理产品。

具体原因：

- 首页的核心交互是 `components/recipe-discovery.tsx` 的“左侧 sticky 筛选器 + 右侧结果面板”结构，这种布局天然像后台工作台、SaaS 搜索页或 BI 面板。
- 推荐逻辑虽然强，但首屏直接暴露大量表单控件、条件摘要和结果计数，让用户在看到食物之前先看到“配置界面”。
- `components/recipe-card.tsx` 把时间、热量、蛋白质、成本、工具、推荐解释、评分拆解都放在一级视觉层，导致每张卡都像小型数据面板。
- 详情页把指标、限制说明、营养、成本、工具集中放进右侧 sticky rail，多张白色卡片垂直堆叠，让阅读体验像规格页或实验报告。
- 没有真实料理图片，首页、列表页、详情页都缺少食物本身作为视觉锚点，因此产品无法靠“食欲”组织层级，只能靠信息框和标签组织层级。

### 哪些组件造成这种感觉

- `RecipeDiscovery`
  - sticky 侧栏
  - 多组表单控件
  - 条件摘要 bar
  - 结果计数和逻辑筛选网格
- `RecipeCard`
  - 图片缺席
  - 多指标 grid
  - explanation block
  - score breakdown
  - 工具、限制、标签在首层密集出现
- Recipe detail page
  - 深色 Hero 里只有文字和渐变占位块
  - 右侧 rail 被多张信息卡切碎
  - 页面视觉中心不是料理本身，而是“这道菜的结构化说明”

### 当前 Hero、筛选器、recipe card、详情页的问题

#### Hero

- 文字可信，但缺乏欲望和记忆点
- 没有食物摄影或品牌视觉信号
- 高度偏短，像产品说明开头，不像消费者入口
- 深绿色大色块营造出沉稳感，但不够新鲜和开胃

#### 筛选器

- 筛选维度合理，但呈现方式太像控制台
- 左栏长期可见，占据太多注意力
- 用户要先“操作系统”再“看到灵感”
- 这更适合 advanced mode，不适合作为默认首页主体验

#### Recipe card

- 信息正确，但信息密度过高
- 没有主视觉导致每张卡的差异主要来自文本，而不是菜品气质
- 标签和指标比菜名更抢眼
- 卡片圆角大、白底多、结构重复，形成模板感而不是品牌感

#### 详情页

- Hero image 用渐变占位，无法建立第一印象
- “这道菜是什么”与“这道菜的数据”同时争抢视觉优先级
- 右侧白卡堆叠造成阅读中断，像在查看管理后台 side panel
- story / origin / why / cooking science 这些更有内容价值的部分没有被真正抬到视觉主位

### 当前 typography、spacing、color、card density 的问题

#### Typography

- 主要依赖系统 sans，可靠但没有品牌记忆
- display、heading、body、metric 的性格差异不够
- 详情页与列表页的排版节奏偏同质化，像结构化报告而不是内容页

#### Spacing

- 区块间距有一定秩序，但更多是在“卡片之间留白”，不是在“内容叙事之间留白”
- 卡片内部塞得较满，尤其在指标和补充信息上
- 宽屏页面出现较大空白，但空白没有被组织成 editorial rhythm

#### Color

- 深绿 + 米白 + 白色的基础并不差，说明产品已经有 calm / grounded 的种子
- 问题是 accent 太少，色彩层次过窄，整体显得干、平、保守
- 这种配色更像企业风内页，而不是料理产品首页

#### Card density

- 太多白底矩形承载太多同级信息
- 卡片既承担布局，又承担内容层级，又承担状态解释，职责过重
- 当没有图像时，卡片更容易滑向“数据容器”而不是“内容入口”

### 为什么缺乏食欲

- 没有真实料理图像
- 页面缺少食材纹理、蒸汽感、自然光、器皿、颜色层次这些食物线索
- 推荐结果的第一视觉不是“这道菜看起来很好吃”，而是“这道菜符合若干约束”
- 整体色彩偏冷静理性，缺少新鲜蔬菜、果酸、香料、面包、汤汁这些能让人想点进去的暖亮对比

### 为什么缺乏品牌辨识度

- 当前记忆点主要来自功能，不来自视觉或语言
- 组件更像合格的产品模板，而不是被一个鲜明品牌世界统一
- “Cooking Lab” 的理性身份出现了，但它更像内部工程概念，而不是消费者愿意记住的品牌体验

### 哪些部分值得保留

- calm、可信、不装腔作势的底色
- 透明披露估算值的产品诚实感
- recommendation explanation 的可解释性
- 分类、条件、约束这些真实有用的结构
- 当前米白与深绿的基础可以保留为某一方向的底盘
- 页面内容秩序和可读性基本健康，不需要走向花哨或过度营销化

## Direction A: Fresh Editorial

### Core keywords

- fresh
- editorial
- ingredient-led
- bright
- modern magazine
- calm appetite
- cultural texture

### Emotional goal

让用户第一眼觉得“这像一本会做推荐的现代料理杂志”，既高级又可亲，重点是食材、成菜和浏览欲。

### Color direction

- warm ivory background
- leafy green and herb accents
- tomato / citrus / saffron 作为少量高亮
- 深炭色正文而非纯黑

### Font direction

- display：带一点 editorial personality 的 serif 或 soft transitional serif
- heading/body：现代 sans，字面干净
- metric：紧凑、克制的 sans

### Spacing

- section spacing 大
- card internal spacing 中等偏松
- hero 和图片带呼吸感

### Radius

- 小到中等 radius
- 图片容器略圆，但不做大圆角卡片宇宙

### Shadow

- 轻阴影或几乎无阴影
- 依靠层级、留白和图片本身建立质感

### Photography style

- 自然光
- 真实食材纹理
- 桌面或厨房环境轻入镜
- 明亮但不过曝
- 少量 editorial styling，不做豪华 fine dining

### Illustration/icon style

- 极少量线性图标
- 插画只在空状态或内容分隔中轻微辅助
- 不以插画构成品牌主角

### Motion direction

- 慢一点的淡入、上浮
- section 进入感轻，不做强烈滑动
- 图片 hover 轻缩放

### Homepage composition

- 全宽 Hero 图片 + 一句核心问题
- Hero 下方直接给简短条件入口
- Today's Inspiration 以大图精选卡开场
- 推荐、世界料理、按食材、按技法和故事模块采用杂志式不同版式节奏

### Recipe card style

- 以图片为主
- 标题和地域信息清楚
- 一句短描述增强食欲
- 时间和关键标签放在第二层
- 营养 / 成本收纳为 secondary info

### Recipe detail style

- 大 Hero 图像
- 标题、地域、简介覆盖在下方或旁侧
- story / origin 提前
- ingredients / steps 是主体内容，数据摘要收成一行或两行 summary

### Mobile adaptation

- 大图单列滚动很自然
- 快速条件用 chips / horizontal scroller
- 卡片图像比例固定，避免长文本挤压

### Accessibility considerations

- serif display 需要和中文搭配谨慎，避免可读性下降
- 浅底图片区必须保证标题对比
- secondary info 不能因追求杂志感而过淡

### Advantages

- 食欲提升最快
- 最容易摆脱工程 demo 气质
- 很适合后续图像系统和内容扩展

### Risks

- 如果图片质量不稳定，会立刻显得空
- 若过度追求“高级”，可能偏离 everyday cooking

### Future product fit

- Web consumer experience
- editorial content
- cuisine stories
- newsletter / content brand
- later lifestyle app surfaces

## Direction B: Warm Companion

### Core keywords

- warm
- everyday
- reassuring
- home kitchen
- companion
- soft confidence
- approachable

### Emotional goal

让用户感觉这是一个会陪你想今晚吃什么、不会评价你、也不会把做饭变成任务管理的产品。

### Color direction

- oat / rice / warm cream backgrounds
- tomato red、carrot、olive、sage 作为柔和强调
- text 用深棕炭灰而不是冷黑

### Font direction

- display：圆润但不幼稚的 humanist sans
- heading/body：同一家族或相近的人文 sans
- metric：窄一点、清楚但不抢戏

### Spacing

- 中到大间距
- 模块更完整，少碎卡片
- 文案与图片区块更靠近生活杂志而不是工具台

### Radius

- 中等 radius
- 按钮、chips、图片区块更柔和

### Shadow

- 轻到中等阴影
- 有一点温暖的 surface lift

### Photography style

- 生活化
- 桌边、手部、餐具、厨房场景可少量出现
- 不刻意造景，强调真实家庭感

### Illustration/icon style

- 可接受少量小插图或简单图形语言
- 后续最容易接入 mascot / companion
- 图标可以稍圆润

### Motion direction

- 响应更亲切，按钮和卡片微动更明显一点
- 页面过渡柔和，避免冷硬闪切

### Homepage composition

- Hero 以一句陪伴式问题开场
- 快速条件像“今天的偏好小选择”而不是筛选器
- 推荐区更像“为你准备”
- 学习和故事区更靠近日常陪伴内容

### Recipe card style

- 图片 + 菜名 + 一句话 + 时间最突出
- 标签数量少，语气友好
- 卡片可更像内容卡而非数据卡

### Recipe detail style

- 上半屏建立“这道菜适合你”的安心感
- ingredients / steps 仍清晰，但 why 与替代建议更温和地嵌入
- cost / nutrition 退到辅助层

### Mobile adaptation

- 很适合单列连续体验
- CTA、chips、tag 触控友好
- 家庭使用场景下可自然延展到 future household flows

### Accessibility considerations

- 温暖浅色容易掉对比，需要谨慎设定 text/border
- 圆润设计不能牺牲信息辨识
- 如果未来引入角色，必须避免只有颜色和情绪差异而无结构差异

### Advantages

- 最容易建立“陪伴感”
- 对未来 household / assistant / saved preference 很友好
- 容易让产品从工具变成日常习惯

### Risks

- 处理不好会偏向母婴 / 轻生活 App
- 如果过软，会削弱产品的理性可信度

### Future product fit

- household companion
- personalized recommendation
- mobile app
- onboarding and retention
- future voice / assistant persona

## Direction C: Modern Culinary Lab

### Core keywords

- culinary studio
- modern lab
- rational warmth
- precise
- tasteful
- knowledge-led
- food science with soul

### Emotional goal

保留 Cooking Lab 的“理解料理、解释为什么”的独特性，但把表达从工程后台换成现代料理工作室和 editorial lab。

### Color direction

- bone / parchment / stone as base
- forest / basil / ink green for trust
- copper / paprika / yolk as controlled accents
- 颜色比当前更丰富，但仍有理性克制

### Font direction

- display：简洁、干净、略带专业感的 serif 或 refined sans
- heading/body：清楚现代的 sans
- metric：紧凑对齐、适合数据摘要

### Spacing

- 外部 section 宽松
- 内部信息编排更有 grid discipline
- 保留一点 lab precision，但不堆卡片

### Radius

- 小到中等 radius
- 形体更利落

### Shadow

- 极轻 shadow
- 通过边框、背景层次和图文分区建立结构

### Photography style

- 成菜与食材同样重要
- 允许更清楚地展示切面、锅具、工序
- 像料理工作室记录，而不是家庭随手拍

### Illustration/icon style

- 简洁线性 icon
- 可加入少量图表式辅助视觉，但永远是配角
- 几何感比 B 更强

### Motion direction

- 精准、快速、克制
- hover 和 state 反馈更像高品质数字出版物

### Homepage composition

- Hero 可以是成菜与食材并置的摄影
- Recommendation Engine 作为一块“decision studio”出现，但不是整页框架
- 内容模块之间用更清楚的结构与节奏组织

### Recipe card style

- 图片主导
- 二级信息有秩序地排列
- why / technique / score 只在推荐卡里选择性露出

### Recipe detail style

- hero、intro、story、why 和 cooking science 形成强叙事骨架
- 指标统一收纳在 intro summary 中
- 相关菜谱和知识块有“继续研究”感，但不做仪表盘

### Mobile adaptation

- 模块可很好地下沉为 editorial stack
- summary metrics 可做横向 compact chips
- 适合未来 richer content surfaces

### Accessibility considerations

- 小字号和精密感容易过冷，需要确保正文尺寸和对比
- 数据摘要必须保持语言清晰，不靠难懂缩写

### Advantages

- 最能保留产品差异化
- 最适合 recommendation + knowledge 双核心
- 既能走内容，也能保持可信赖的结构化感

### Risks

- 执行不好会重新滑回“更精致一点的 SaaS”
- 对版式和图片质量的要求比 B 更高

### Future product fit

- cooking knowledge product
- premium-feeling consumer web
- structured recipe detail
- future multi-surface design system

## Naming Exploration

当前只做命名探索，不定最终名字。以下候选都需要后续从商标、域名、语义稳定性、跨语种可读性再筛。

### 1. 中文自然系

#### 旬味

- 含义：强调季节与当下的味道
- 语气：清新、自然、克制
- 优势：短、好记、有食材感
- 风险：偏内容品牌，功能感较弱
- 是否易延展到 App / IP / household：中等，适合内容和商品化延展

#### 食光里

- 含义：做饭与日常生活片段
- 语气：温柔、生活化
- 优势：有家庭感
- 风险：略常见，辨识度需靠视觉强化
- 是否易延展到 App / IP / household：是

#### 四时厨房

- 含义：四季、时令、厨房
- 语气：稳、温和、有秩序
- 优势：适合食材探索和内容体系
- 风险：略偏传统，国际传播一般
- 是否易延展到 App / IP / household：是

#### 今日鲜案

- 含义：今天的食材灵感台
- 语气：现代、轻 editorial
- 优势：有新鲜感，也能接推荐逻辑
- 风险：`案` 字略书面
- 是否易延展到 App / IP / household：中等

#### 好味生长

- 含义：料理体验和口味一起成长
- 语气：有生命感
- 优势：有长期陪伴意味
- 风险：作为产品名略抽象
- 是否易延展到 App / IP / household：是

#### 烟火食集

- 含义：日常厨房和内容集合
- 语气：生活化、有温度
- 优势：有中国语境的亲切感
- 风险：稍像内容平台或市集
- 是否易延展到 App / IP / household：中等

### 2. 中文陪伴系

#### 今晚吃什么

- 含义：直击核心需求
- 语气：直接、亲近
- 优势：极强产品问题表达
- 风险：像栏目名，且较泛
- 是否易延展到 App / IP / household：中等

#### 陪你做饭

- 含义：把产品定位成陪伴者
- 语气：温暖、自然
- 优势：陪伴感强
- 风险：略偏功能口号，不够品牌化
- 是否易延展到 App / IP / household：是

#### 饭搭子

- 含义：料理陪伴关系
- 语气：轻松、年轻
- 优势：记忆点强，社交感轻
- 风险：流行语寿命和成熟度需要观察
- 是否易延展到 App / IP / household：是，但偏年轻

#### 厨房同伴

- 含义：可靠的 cooking companion
- 语气：平实、可信
- 优势：未来 household / assistant 很顺
- 风险：稍直白，品牌张力一般
- 是否易延展到 App / IP / household：是

#### 好好吃饭

- 含义：照顾自己和家人的日常目标
- 语气：温柔、生活化
- 优势：情感价值明确
- 风险：像 campaign slogan
- 是否易延展到 App / IP / household：是

#### 饭点研究所

- 含义：陪伴感里保留一点理性趣味
- 语气：轻松、聪明
- 优势：能连接 recommendation 和内容
- 风险：仍带一点“研究所”工具感
- 是否易延展到 App / IP / household：中等

### 3. 中文料理 / 知识系

#### 料理笔记

- 含义：记录做法、理解和灵感
- 语气：理性、温和
- 优势：适合知识产品
- 风险：略像个人内容账号
- 是否易延展到 App / IP / household：是

#### 料理志

- 含义：更有 editorial 气质的料理记录
- 语气：克制、认真
- 优势：适合内容和品牌栏目
- 风险：稍文艺，陪伴感较弱
- 是否易延展到 App / IP / household：中等

#### 食材实验室

- 含义：突出理性和理解
- 语气：知识型、结构化
- 优势：与当前 working title 连续
- 风险：太像工程工具或 B2B
- 是否易延展到 App / IP / household：中等

#### 风味研究室

- 含义：关注味道、方法与文化
- 语气：专业但不冰冷
- 优势：比实验室更柔和
- 风险：仍偏知识品牌
- 是否易延展到 App / IP / household：是

#### 会做菜

- 含义：从不会到会，强调成长
- 语气：直接、鼓励型
- 优势：清楚好懂
- 风险：较泛，品牌独特性有限
- 是否易延展到 App / IP / household：中等

#### 厨房方法论

- 含义：强调理解与底层逻辑
- 语气：理性、现代
- 优势：与 explainability 相合
- 风险：太知识化，食欲弱
- 是否易延展到 App / IP / household：更适合作为栏目

### 4. 国际品牌系

#### Savora

- 含义：来自 savor，延展成更柔和的品牌词
- 语气：现代、国际、食欲友好
- 优势：可品牌化、好读
- 风险：需查重名和商标
- 是否易延展到 App / IP / household：是

#### Mise

- 含义：联想到 mise en place，带料理专业感
- 语气：简洁、现代
- 优势：短，记忆点强
- 风险：太短，重名风险高；部分用户不了解含义
- 是否易延展到 App / IP / household：是

#### Avero

- 含义：偏 fresh / clever 的中性造词
- 语气：现代、干净
- 优势：可承载多种方向
- 风险：需要品牌教育
- 是否易延展到 App / IP / household：是

#### Nomae

- 含义：有料理感和国际感的造词
- 语气：轻高级、安静
- 优势：有品牌记忆
- 风险：发音和现有品牌联想需验证
- 是否易延展到 App / IP / household：是

#### Saltory

- 含义：salt + story，料理与故事结合
- 语气：有内容感
- 优势：贴合 recipe + culture
- 风险：略像内容媒体
- 是否易延展到 App / IP / household：是

#### Kinbroth

- 含义：kin + broth，家庭与食物
- 语气：温暖、国际
- 优势：有陪伴与 household 感
- 风险：更偏西式语感
- 是否易延展到 App / IP / household：是

### 5. 中英混合系

#### Cook好

- 含义：把 cooking 变成轻松日常动作
- 语气：轻、现代
- 优势：年轻，记忆点直观
- 风险：略口号化
- 是否易延展到 App / IP / household：是

#### Taste日常

- 含义：把味道放进日常生活
- 语气：轻 editorial、生活方式
- 优势：适合内容世界
- 风险：偏内容品牌，不够工具感
- 是否易延展到 App / IP / household：是

#### Kitchen 料理室

- 含义：国际感 + 中文理解门槛低
- 语气：现代、理性
- 优势：保留一点 studio / lab 气质
- 风险：略长，读起来不够利落
- 是否易延展到 App / IP / household：中等

#### Flavor 厨房

- 含义：突出风味与做饭
- 语气：偏美食内容
- 优势：食欲感较强
- 风险：较像栏目或媒体
- 是否易延展到 App / IP / household：是

#### Daily 菜谱实验室

- 含义：保留 lab 的连续性，同时加入 everyday
- 语气：理性带生活感
- 优势：连接现有 working title
- 风险：仍然有一点工具品牌感
- 是否易延展到 App / IP / household：中等

#### Cook Lab 家常版

- 含义：把理性实验和家庭烹饪放在一起
- 语气：轻松、过渡性
- 优势：可做内部到外部的桥接
- 风险：不像最终成熟品牌名
- 是否易延展到 App / IP / household：更适合作为系列名

## Design Tokens

本节不是最终 CSS，而是后续 UI implementation 可继承的轻量 token proposal。

### Color roles

- `background`
  - warm neutral, avoid cold gray-white
  - example direction: ivory / oat / parchment
- `surface`
  - slightly raised warm white or soft stone
- `text`
  - deep charcoal, brown-charcoal, or ink green-black
- `muted`
  - medium warm gray for supporting labels
- `accent`
  - one primary fresh accent from green / herb / basil family
  - one optional food accent from tomato / citrus / paprika family
- `success`
  - muted herb green, not neon
- `warning`
  - saffron / amber, readable and warm
- `border`
  - low-contrast warm line, still visible on beige surfaces

### Typography roles

- `display`
  - used in hero and featured story titles only
  - 36-56 px desktop, 28-36 px mobile
- `heading`
  - section titles and recipe names
  - 24-32 px desktop, 20-28 px mobile
- `body`
  - primary reading copy
  - 16-18 px with relaxed line-height
- `caption`
  - tags, meta, disclaimers
  - 12-14 px, never too low contrast
- `metric`
  - time, calories, cost, nutrition summaries
  - 13-16 px with clear alignment and restrained emphasis

### Spacing scale

- `space-1`: 4 px
- `space-2`: 8 px
- `space-3`: 12 px
- `space-4`: 16 px
- `space-5`: 24 px
- `space-6`: 32 px
- `space-7`: 48 px
- `space-8`: 64 px
- `space-9`: 96 px

### Radius scale

- `radius-sm`: 8 px
- `radius-md`: 12 px
- `radius-lg`: 16 px
- `radius-xl`: 20 px

建议：

- cards 以 `12-16 px` 为主
- featured surfaces 可到 `20 px`
- 避免全站 `24-32 px` 的过度圆角

### Shadow scale

- `shadow-0`: none
- `shadow-1`: subtle ambient lift for cards
- `shadow-2`: stronger lift for overlays or featured surfaces

建议整体偏轻，优先依靠图片、分区和边框，而不是依靠重阴影堆层次。

### Image aspect ratios

- hero: `16:9` 或 `3:2`
- featured recipe card: `4:3`
- catalog card: `4:3` 或 `1:1`
- recommendation card: `4:3`
- ingredient / technique thumbnails: `1:1`

### Card density

- featured card: low density
- recommendation card: medium density
- catalog card: medium density
- 数据密集的 nutrition / cost / tool 信息进入 secondary layer

### Content width

- hero copy column: `560-720 px`
- standard content width: `1120-1280 px`
- reading column for detail prose: `640-760 px`
- full-bleed image bands can exceed content width

### Responsive breakpoints

- `375 px`
- `390 px`
- `768 px`
- `1024 px`
- `1280 px+`

## Homepage Wireframes

Recommendation Engine 仍然是核心，但不再以“左筛选 + 右结果”占满首页。

### Direction A wireframe

1. Hero image band
2. 核心问题：今晚，想吃点什么？
3. Quick condition row：食材 / 时间 / 口味 / 工具
4. Recommended for tonight：2-4 张高质量 recommendation cards
5. Today's Inspiration：一张 featured story card + 两张次级卡
6. Explore World Cuisines：世界料理横向带
7. Explore by Ingredient：季节或常见食材入口
8. Explore by Technique：煎 / 炒 / 烤 / 汤等
9. Learn One Thing Today：技巧卡
10. Story / Culture section
11. Footer

### Direction B wireframe

1. Warm Hero with companion question
2. “今天家里有什么？” quick chips
3. “为你准备的推荐” cards
4. Today's Inspiration
5. Explore by mood / meal moment
6. Explore by Ingredient
7. Explore by Technique
8. Learn One Thing Today
9. Gentle story / culture / habit block
10. Footer

### Direction C wireframe

1. Studio-style Hero with finished dish + ingredient context
2. Decision Studio compact entry
3. Recommended for tonight
4. Today's Inspiration
5. Explore World Cuisines
6. Explore by Ingredient
7. Explore by Technique
8. Learn One Thing Today / Cooking Science
9. Story / Origin / Context
10. Footer

## Recipe Card v2

### 第一层信息优先级

1. 图片
2. 菜名
3. 菜系 / 地域
4. 一句话
5. 时间
6. 关键标签

营养、成本、工具、推荐评分、why explanation 不应该全部进入第一视觉层。

### Card variants

#### Catalog card

- 目标：快速扫视和浏览
- 信息：图片、标题、地域、一句话、时间、2-3 个标签
- secondary info：hover 或二级行展示难度 / 饮食标签

#### Recommendation card

- 目标：解释“为什么适合你”
- 信息：在 catalog card 基础上增加一句 `为什么推荐`
- 只露出 1-2 个最重要的约束匹配点，例如“30 分钟内”或“适合高蛋白”

#### Featured card

- 目标：承担首页内容节奏和食欲拉力
- 信息：更大图片、更多留白、更短文字
- 可承载故事、季节、文化或主编式推荐感

### 是否需要区别

需要区别，但不需要三套完全不同的视觉语言。更好的方式是共享同一骨架，再通过：

- 图像比例
- 文案长度
- secondary info 的露出程度
- 是否出现 recommendation reason

来区分角色。

## Recipe Detail v2

### Visual structure

1. Hero Image
2. Recipe Name
3. country / region / cuisine
4. intro
5. summary row：time / difficulty / nutrition / cost
6. story / origin
7. why
8. ingredients
9. steps
10. cooking science
11. tools
12. nutrition / cost
13. related recipes

### Primary visual

- hero image
- recipe name
- geography / cuisine identity
- intro
- story / origin where reliable

### Secondary information

- nutrition
- cost
- tools
- limits and disclaimers
- detailed metrics and calculations

这些内容仍然重要，但应该服务于理解和信任，而不是抢占页面人格。

### Design intent

- 详情页应该像一篇“能立刻开做的料理内容页”
- why 和 cooking science 是差异化资产，应比现在更清晰，但排版上不能像说明书边栏
- 相关菜谱和技法内容应鼓励继续探索，而不是只作为底部附录

## Photography Direction

### 基础摄影语言

- 自然光
- 新鲜食材
- 真实纹理
- 色彩明亮但不假
- 少量摆盘
- 生活化
- 不油腻
- 不过度饱和
- 不明显 stock 感
- 不大量使用黑背景 fine-dining 风格

### 各菜系是否保持统一语言

建议保持统一摄影语言，但允许内容层面的局部差异。

#### 中国菜

- 允许更多锅气、热气、碗盘层次
- 但仍以自然光和真实质感为主，不做重油重暗风格

#### 欧洲菜

- 可以更强调桌面、烘焙、器皿和切面
- 仍应保持真实厨房感，不走酒店餐厅摄影

#### 东南亚

- 允许更鲜明的香草、果酸、辣椒色彩
- 但不要把饱和度推得过头

#### 早餐 / 沙拉

- 可以更明亮、更轻、更接近晨间自然光
- 保持新鲜与可做感，避免健身餐 App 既视感

### 可以保留的差异

- 盘器和餐具地域差异
- 食材颜色本身的鲜明度
- 用餐场景轻微变化

### 不建议出现的断裂

- 有些图像像手机随手拍，有些像商业图库
- 有些图像黑背景高端餐厅，有些图像极亮家常
- 有些图像饱和爆表，有些图像灰暗发脏

## IP Direction

### 是否适合未来加入

适合，但不应在当前 M5 品牌建立初期抢前台。

### 可评估方向

- mascot
- cooking companion
- narrator voice
- ingredient character
- household assistant

### 什么时候引入合适

- 当 recommendation / content / household 场景足够清晰之后
- 当品牌已经先被记住为“可信又有温度的料理产品”之后
- 当角色能承担明确功能，例如引导、解释、陪伴、长期习惯建立

### 什么时候会显得幼稚或喧宾夺主

- 当产品还没有稳定的主视觉和摄影语言时
- 当角色替代真实食物成为首页主体时
- 当角色语气过满，压过用户的料理目标和内容价值时

### 当前建议

- 先建立 voice，而不是先画角色
- 可以先定义 narrator tone、标题语气、微文案节奏
- 角色形象至少晚于品牌方向和摄影语言稳定之后再进入

## Decisions Required From User

1. 请选择 `A / B / C`，或明确指定你想要的混合方向。
2. 请选择更想继续收敛的命名方向：
   - 中文自然系
   - 中文陪伴系
   - 中文料理 / 知识系
   - 国际品牌系
   - 中英混合系
3. 是否保留 `Cooking Lab` 作为对外名，还是只保留为 working title？
4. 摄影风格更偏向：
   - editorial food-first
   - warm home kitchen
   - modern culinary studio
5. 未来是否希望加入 character / mascot / cooking companion？
