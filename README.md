# Cooking Lab

Cooking Lab 是一个“料理决策与学习”Web Beta：根据现有食材、时间、营养目标、预算和厨具条件推荐合适料理，并解释推荐理由与关键烹饪原理。

## 当前 Beta 功能

- 30 种结构化食材与 30 道可浏览菜谱
- 营养和成本估算引擎
- 带硬限制、软偏好和可读解释的规则推荐
- 食材、时间、营养、预算、厨具、菜系和标签筛选
- 完整菜谱目录、稳定详情页与烹饪科学说明
- 缺失数据、无结果、未知标签和无效菜谱链接的可读降级体验

## Tech Stack

Next.js 16（App Router）、React 19、TypeScript、Tailwind CSS 4、Vitest，以及仓库内的结构化本地数据。当前没有数据库、登录、分析 SDK、付费 API 或独立后端。

## Requirements

- Node.js 20.9 或更高版本
- npm（随 Node.js 安装）

## Local Development

```bash
git clone https://github.com/chenyuankun1708-oss/Cooking-Lab.git
cd Cooking-Lab
npm ci
npm run dev
```

打开 `http://localhost:3000`。

## Validation

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## Data Disclaimer

营养、成本与时间均为 `demo-estimated` 演示估算，用于验证产品和计算逻辑。实际结果会因食材品牌、份量及烹饪方式不同而变化；营养信息不构成医学或个体化饮食建议。数据层保留了未来替换为可靠营养与价格来源的接口边界。

## Architecture

依赖方向保持为：UI → 应用/推荐逻辑 → 领域计算引擎 → 数据。营养、成本、筛选与推荐规则不放在 UI 组件中，Repository 接口允许未来替换本地数据源。

进一步阅读：[产品说明](docs/PRODUCT.md)、[架构](docs/ARCHITECTURE.md)、[数据模型](docs/DATA_MODEL.md)、[推荐规则](docs/RECOMMENDATION.md)、[Beta QA](docs/BETA_QA.md)、[路线图](docs/ROADMAP.md) 和 [当前状态](docs/STATUS.md)。

## Deployment

项目可使用 Vercel Hobby 免费方案直接部署，无需环境变量、数据库或 secrets：

1. 登录 Vercel，并导入此 GitHub 仓库。
2. 保持自动识别的 Next.js framework preset、`npm ci` 安装和 `npm run build` 构建设置。
3. 确认选择免费 Hobby 方案后部署。

仓库代码已为部署做好准备，但实际创建公开项目需要仓库所有者完成 GitHub/Vercel 账号授权。

## Feedback

发现问题或有建议，请[提交 Beta 反馈](https://github.com/chenyuankun1708-oss/Cooking-Lab/issues/new?template=beta-feedback.md&labels=beta-feedback)。请勿提交账号、联系方式或其他隐私信息。
