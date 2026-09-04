# Cooking Lab

Cooking Lab 是一个帮助用户根据现有食材、时间、营养、预算和厨具条件做出料理决策的 Web Beta。

## 当前 Beta 功能

- 100 道结构化 demo 菜谱与 73 种基础食材数据
- 本地营养与成本估算
- 可解释的规则推荐与条件筛选
- 支持口味偏好的确定性推荐
- 自然时间分组与精确分钟并存
- 全量菜谱目录
- 菜谱详情页与步骤原理说明
- 公开 Beta 反馈入口

## Tech Stack

- Next.js 16（App Router）
- React 19
- TypeScript
- Tailwind CSS 4
- Vitest
- 本地 TypeScript 结构化数据

## Requirements

- Node.js 20.9+
- npm 10+

## Local Development

```bash
git clone https://github.com/chenyuankun1708-oss/Cooking-Lab.git
cd Cooking-Lab
npm ci
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## Validation

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## Data Disclaimer

当前营养、成本与时间数据均为 `demo-estimated` 演示估算，实际结果会因食材品牌、份量、设备火力与烹饪方式不同而变化；营养信息不构成医学或个体化饮食建议。

## Architecture

项目保持静态优先的数据流：

`UI (app/components) -> application/recommendation helpers -> domain engines (lib) -> local data (data)`

更多说明见：

- [docs/PRODUCT.md](docs/PRODUCT.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/DATA_MODEL.md](docs/DATA_MODEL.md)
- [docs/RECOMMENDATION.md](docs/RECOMMENDATION.md)
- [docs/STATUS.md](docs/STATUS.md)

## Deployment

当前代码已经部署在 Vercel Hobby（免费）并保持零额外基础设施：

- Production URL: [https://cooking-lab-pied.vercel.app](https://cooking-lab-pied.vercel.app)

如需重新部署或复制环境，可按以下步骤操作：

1. 在 Vercel 中选择 `Add New Project`
2. 导入 GitHub 仓库 `chenyuankun1708-oss/Cooking-Lab`
3. 保持默认 Framework Preset 为 Next.js
4. Build Command 使用默认 `next build`
5. Install Command 使用默认 `npm install` 或改为 `npm ci`
6. 当前项目不需要额外环境变量
7. 点击部署

当前生产环境已经可访问；后续若需要新的部署环境或新的公开 URL，仍只需要用户完成自己的 Vercel 账号授权与项目创建。

## Feedback

公开 Beta 反馈入口：

- GitHub Issues: [提交 Beta 反馈](https://github.com/chenyuankun1708-oss/Cooking-Lab/issues/new?template=beta-feedback.md&title=%5BBeta%20Feedback%5D%20)
- 仓库主页: [chenyuankun1708-oss/Cooking-Lab](https://github.com/chenyuankun1708-oss/Cooking-Lab)
