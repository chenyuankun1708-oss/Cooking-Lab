# Beta QA Checklist

最近更新：2026-09-03

## Current Verification Status

- Automated browser smoke QA completed on 2026-09-03
- Checked breakpoints: 375px, 390px, 1024px
- Checked paths: homepage, recommendation flow, catalog, detail page, invalid slug
- Console errors observed during smoke QA: none
- Manual cross-browser visual sign-off: NOT VERIFIED IN BROWSER for Safari and Firefox

## Desktop

- [x] 首页可打开且首屏文案清楚
- [x] 筛选面板可见且可操作
- [x] 推荐结果会随条件更新
- [x] 空结果状态有明确说明
- [x] `/recipes` 目录可访问
- [x] 详情页可阅读
- [x] 非法 slug 进入合理 404

## Mobile

- [x] 375px smoke check
- [x] 390px smoke check
- [ ] 768px manual visual sign-off

## Keyboard

- [x] 原生 select 可通过键盘操作
- [x] checkbox chip 具备可聚焦 input
- [x] reset 按钮可聚焦
- [x] recipe links 可聚焦

## Content

- [x] 每份与整道标签口径已区分
- [x] demo-estimated disclaimer 出现在首页、目录、详情与 README
- [x] smoke QA 未发现 `NaN`
- [x] smoke QA 未发现 `undefined`
- [x] 缺失食材说明可读
- [x] 当前数据集中涉及的厨具标签可读

## Build

- [x] `npm test`
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run build`

## Deployment

- [x] README 已包含本地运行说明
- [x] README 已包含 Vercel 免费部署路径
- [x] 已提供 GitHub Issues 反馈入口
- [x] Public Beta 已上线到生产环境

## Remaining Manual Checks After Launch

- [ ] 在 Safari 做一轮手机与桌面人工目视检查
- [ ] 在 Firefox 做一轮桌面人工目视检查
