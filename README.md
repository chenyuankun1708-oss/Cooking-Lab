# Cooking Lab

Cooking Lab 是一个“料理决策与学习”Web MVP。它根据食材、时间、营养、限制性指标、预算和厨具帮助用户选择料理，并解释每一步背后的烹饪原理。

当前版本包含结构化食材/菜谱 demo 数据、营养与成本估算引擎、透明规则推荐接口、首页菜谱卡片和菜谱详情页。数据仅用于产品验证，不构成医学或个体化营养建议。

## 技术栈

Next.js 16（App Router）、React 19、TypeScript、Tailwind CSS 4、Vitest。第一阶段没有数据库、登录、付费 API 或独立后端。

## 本地启动

要求 Node.js 20.9+（当前开发环境为 24.13.1）。

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。验证命令：

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

更多信息见 `docs/PRODUCT.md`、`docs/ARCHITECTURE.md`、`docs/DATA_MODEL.md`、`docs/ROADMAP.md` 和 `docs/STATUS.md`。
