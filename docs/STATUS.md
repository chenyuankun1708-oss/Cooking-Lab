# Status

最近更新：2026-09-01

## 当前阶段

M0 Product Foundation 已完成基础版本；M1 Data & Calculation Engine 已建立最小可验证实现。

## 已完成

- Next.js/TypeScript/Tailwind 项目骨架与响应式首页、详情页。
- Ingredient、Recipe、Nutrition、Recommendation 类型。
- 10 种 demo 食材、4 道结构化 demo 菜谱。
- 单位换算、营养估算、成本估算和透明规则推荐骨架。
- 领域测试与核心文档。

## 正在做

等待进入 M1 数据扩充与 M2 可交互筛选。

## 下一步

1. 把数据扩充并人工审核至约 30 道菜谱。
2. 将首页标签升级为真实可操作筛选，并展示推荐解释。
3. 安装/登录 GitHub CLI 后创建远程仓库、Milestone 与分组 Issue。

## 已知问题与技术债

- demo 营养/价格未引用生产级数据源，仅用于功能验证。
- 推荐条件当前等权；盐、添加糖、菜系、标签和技法条件接口已定义但规则待完善。
- 尚无 schema 运行时校验、完整列表页、自动化可访问性测试或部署。
- 本机未安装 GitHub CLI，远程仓库、Milestone 和 Issue 尚未创建。
