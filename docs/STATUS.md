# Status

最近更新：2026-09-03

## 当前阶段

M0 Product Foundation、M1 Data & Calculation Engine、M2 Web MVP 与 M3 Recommendation Engine 已完成；M4 Public Beta readiness 已完成代码与 QA 收尾，等待用户执行部署授权。

## 已完成

- Next.js/TypeScript/Tailwind 项目骨架与响应式首页、详情页。
- Ingredient、Recipe、Nutrition、Recommendation 类型与本地静态 repository。
- 30 种 `demo-estimated` 食材与 30 道结构化 `demo-estimated` 菜谱。
- Nutrition、Cost、Unit Conversion、Dataset Validation 与 Recommendation Engine 领域能力。
- 首页即时料理决策、`/recipes` 目录与 30 个稳定 slug 的详情页。
- 公开 Beta 所需的基础 metadata、统一 disclaimer、反馈入口与自定义 404 页面。
- 已补齐当前菜谱中出现的厨具标签映射，避免 machine value 泄露到用户界面。
- 推荐解释文案已区分“只缺 1 种”和“还缺多种”食材。
- README 已重写为可直接运行与部署的说明，并补充 Vercel 免费部署路径。
- 新增 Beta QA checklist 与 GitHub Issues 反馈模板。

## 本轮 M4 验证

- GitHub Issue #7 已读取并按 release gate 执行。
- GitHub PR #13 已于 2026-09-03 合并，Issue #6 已关闭。
- 本地 `main` 已拉取到 `c64b208` 后，从最新 `main` 创建 `feature/issue-7-public-beta`。
- 自动化验证已通过：`npm test`、`npm run lint`、`npm run typecheck`、`npm run build`。
- 浏览器级 smoke QA 已在 `127.0.0.1:3000` 完成首页、目录、详情页与非法 slug 检查，并覆盖 375px、390px、1024px 断点。

## Known Limitations

- 当前仍是公开 Beta，不含登录、数据库、分析 SDK、错误上报服务或付费基础设施。
- 营养、价格与时间均为 demo 估算，不适合被解释为实时、临床或个体化建议。
- 浏览器自动化 smoke QA 已完成，但 Safari/Firefox 的人工目视复核仍建议在正式公开前补做一次。
- 当前反馈入口依赖 GitHub Issues，适合早期 Beta；后续若需要更低门槛反馈收集，可在新 Issue 中独立评估。

## 下一步

1. 由用户授权在 Vercel Hobby 创建项目并生成公开 Beta URL。
2. 进行一轮真实外部试用，观察推荐权重、文案和筛选心智模型是否顺手。
3. 部署后再进入后续功能议题，而不是在本 Issue 中继续扩展核心产品范围。
