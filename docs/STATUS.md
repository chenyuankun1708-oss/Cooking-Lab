# Status

最近更新：2026-09-02

## 当前阶段

M0 Product Foundation 与 M1 Data & Calculation Engine 已完成；M2 Web MVP 开发中。

## 已完成

- Next.js/TypeScript/Tailwind 项目骨架与响应式首页、详情页。
- Ingredient、Recipe、Nutrition、Recommendation 类型。
- 30 种 `demo-estimated` 食材，覆盖 30 道 MVP 菜谱所需的鸡/猪/牛肉、鱼虾、蛋类、豆制品、主食、蔬菜、菌菇、水果和基础调味料。
- 食材数据完整性校验与测试，可发现重复标识、非法营养/价格、无效单位换算等明显错误。
- 30 道结构化 `demo-estimated` 菜谱，覆盖煎、炒、蒸、煮、炖、焖、烤、汤、凉拌和电饭锅料理。
- Recipe 数据校验可发现重复 ID/slug、悬空食材引用、非法用量/时间、油盐不一致、步骤与工具异常。
- 全部菜谱可由 Nutrition Engine 与 Cost Engine 无 warning 地计算估算结果。
- 单位换算覆盖 g/kg/ml/piece/tsp/tbsp，并对非法输入、缺失密度和非有限结果提供明确错误。
- 营养与成本引擎保留计算精度，返回 estimated、complete 和结构化 warnings，不静默生成 NaN/Infinity。
- `validateDataset` 可在测试/build-time 一次验证完整 30 Ingredient + 30 Recipe 数据集。
- 首页料理决策界面：食材、时间、每份热量/蛋白质/预算、用油、厨具、菜系与标签可即时组合筛选。
- 透明硬条件推荐规则与稳定排序；不完整营养/成本结果不会作为可靠的 0 参与匹配。
- 推荐结果卡展示匹配度、理由、时间、每份营养/成本、用油、厨具、菜系和类别。
- 筛选结果数量、当前条件摘要、一键重置、无结果引导，以及移动端和键盘操作基础体验。
- 独立 `/recipes` 目录展示全部 30 道菜，可从首页进入并导航到稳定 slug 详情页。
- 完整菜谱详情展示基础信息、准备/烹饪/总时间、每份营养、整道限制指标、整道与每份成本、可读食材/厨具、步骤解释和关键原理。
- 详情展示通过轻量 view model 组合 Repository、Nutrition/Cost Engine、共享 formatter 与 machine-value 标签，不完整估算具有明确提示。
- 领域测试与核心文档。

## 正在做

Issue #4 的交互筛选与 Issue #5 的目录/详情体验已完成；M2 核心浏览体验已具备，无已知 blocker。

## 下一步

1. Issue #6：在用户研究基础上升级推荐权重与软硬条件策略。
2. 后续补充自动化可访问性测试与部署。

## 已知问题与技术债

- demo 营养/价格未引用生产级数据源，仅用于功能验证。
- Issue #1 的食材覆盖已由 30 道菜谱反向验证；当前无悬空 Ingredient ID。
- 食材类别是 MVP 粗粒度分类；更细的食品学分类或多维筛选需在后续独立设计。
- Issue #4 使用可预测的硬条件与等权匹配解释；复杂缺失食材权重、偏好权重和软条件留给 Issue #6。
- 筛选状态当前不写入 URL，刷新或分享链接不会保留条件。
- 已落实语义化表单、键盘焦点与响应式布局，但尚无浏览器级自动化可访问性测试。
- 尚无自动化浏览器可访问性测试或部署。
- 本机未安装 GitHub CLI；仓库与 Issue 已通过 GitHub 连接器管理。
