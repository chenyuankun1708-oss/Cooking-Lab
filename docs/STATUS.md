# Status

最近更新：2026-09-02

## 当前阶段

M0 Product Foundation 已完成；M1 Data & Calculation Engine 已完成，可进入 M2 Web MVP。

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
- 透明规则推荐骨架。
- 领域测试与核心文档。

## 正在做

M1 已完成，无已知 blocker；准备进入 M2。

## 下一步

1. Issue #4：实现可交互料理筛选与菜谱发现。
2. Issue #5：完善菜谱目录与详情体验。
3. 后续补充自动化可访问性测试与部署。

## 已知问题与技术债

- demo 营养/价格未引用生产级数据源，仅用于功能验证。
- Issue #1 的食材覆盖已由 30 道菜谱反向验证；当前无悬空 Ingredient ID。
- 食材类别是 MVP 粗粒度分类；更细的食品学分类或多维筛选需在后续独立设计。
- 推荐条件当前等权；盐、添加糖、菜系、标签和技法条件接口已定义但规则待完善。
- 尚无完整列表页、自动化可访问性测试或部署。
- 本机未安装 GitHub CLI；仓库与 Issue 已通过 GitHub 连接器管理。
