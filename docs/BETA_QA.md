# Public Beta QA

最近更新：2026-09-03

本清单区分代码/构建静态验证与真实浏览器人工验证。自动化浏览器在当前环境不可用时，相关项目必须保持未勾选并标记 **NOT VERIFIED IN BROWSER**。

## Desktop — NOT VERIFIED IN BROWSER

- [ ] 首页与 Hero 目视复核
- [ ] 筛选、重置与即时推荐交互
- [ ] 无结果状态
- [ ] 菜谱目录与卡片
- [ ] 菜谱详情与返回导航
- [ ] 无效 slug 的 404 页面

## Mobile — NOT VERIFIED IN BROWSER

- [ ] 375px
- [ ] 390px
- [ ] 768px
- [x] 静态审计确认窄屏筛选 select 为单列，`sm` 起双列
- [x] 静态审计未发现固定宽度、移动端 sticky 或已知横向溢出源

## Keyboard — NOT VERIFIED IN BROWSER

- [ ] Tab 导航顺序
- [ ] 筛选控件与 chips
- [ ] 重置按钮
- [ ] 菜谱链接
- [x] 原生 input/select/button/Link、fieldset/legend 与 label 静态检查
- [x] 交互元素具有可见焦点样式，结果区域使用 `aria-live`

## Content and defensive UI

- [x] 每份与整道口径具有文字标签
- [x] 首页、目录和详情使用同一 `demo-estimated` 提示
- [x] formatter 和发布回归测试防止 NaN/Infinity 暴露
- [x] 缺少食材区分一种“只缺”与多种“还缺”
- [x] 厨具、火候与单位均有可读未知值 fallback
- [x] 营养/成本不完整时显示“估算不完整”及 warning
- [x] 空结果提供调整条件和重置入口
- [x] 无效 slug 使用自定义 404

## User paths (static and automated audit)

- [x] Path A：首页条件 → 硬限制/软偏好 → 推荐解释 → 详情
- [x] Path B：首页 → 全部菜谱 → 卡片 → 详情 → 返回导航
- [x] Path C：详情 metadata → 食材 → 营养/限制 → 厨具 → 步骤/原因/原理
- [x] 30 个 slug 唯一且均可生成详情 view model

## Performance and privacy

- [x] 仅 RecipeDiscovery 因即时筛选使用 Client Component
- [x] 目录、详情、领域引擎和数据保持 server/static 优先
- [x] 未发现无意义 effect、状态或第三方 UI/AI/数据库/分析依赖
- [x] 不使用账号、cookie、analytics、付费服务或 secrets

## Build gate

- [x] `npm test`（6 files / 76 tests）
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run build`（34 个静态页面，包含 30 个菜谱 slug）

GitHub Actions 最小 CI 已评估，但当前 OAuth 凭据无权写入 workflow。为避免扩大本 Issue 的账号权限要求，CI 留作单独 Issue；本次 PR 以本地完整验证作为门禁。

## Deployment

- [x] README 包含新机器启动和 Vercel Hobby 步骤
- [x] 项目无需环境变量、数据库或自定义 Vercel 配置
- [x] GitHub Issue template 与站内反馈链接已准备
- [ ] 创建公开 Vercel 项目（需要用户账号授权，本 Issue 不擅自执行）

## Remaining manual release check

获得可用浏览器或部署预览 URL 后，应在 Chrome/Edge/Safari/Firefox 的代表性环境中完成上述未勾选项目，重点复核 375px、390px、768px 和桌面宽屏的排版、对比度、键盘焦点及交互行为。
