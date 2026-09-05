# Recipe Image System

最近更新：2026-09-05

## Goal And Scope

Recipe Image System 为 Web、未来 Mobile 与 API 提供同一套可序列化图片契约。它负责图片角色、交付位置、裁切焦点、来源、授权和 attribution，不包含 React、Next.js props 或供应商 SDK。

Issue #20 只建立系统和最小 Web 接入，不批量下载或生成 100 张图片，也不执行 #21 的消费者 Web redesign。

## Current Audit

Issue #20 开始前：

- Recipe 没有统一图片引用字段
- 仓库没有 `public/images`
- card 没有图片区，detail 使用无语义渐变占位
- 没有 `next/image` 策略、responsive sizes 或加载失败 fallback
- 没有 source、license、attribution registry
- 没有路径、命名、alt 或引用完整性校验

## Architecture

- `types/image.ts`：framework-independent `RecipeImage` 契约与稳定枚举
- `data/recipe-images.ts`：唯一可用图片 registry
- `Recipe.heroImageId?`：Recipe 对 hero 的轻量引用
- `lib/recipe-images.ts`：纯 lookup 与 fallback presentation data
- `lib/image-validation.ts`：图片 metadata 与 Recipe 引用校验
- `components/recipe-image.tsx`：Web-only `next/image`、sizes、preload 和加载错误处理

完整版权 metadata 不复制进每个 Recipe。Recipe 只保存稳定 image ID，registry 是图片记录的 canonical source of truth。

```ts
interface RecipeImage {
  id: string;
  src: string;
  alt: string;
  role: "hero" | "thumbnail" | "step" | "ingredient" | "editorial";
  delivery: "local" | "remote";
  width?: number;
  height?: number;
  aspectRatio: "3:2" | "4:3" | "16:9" | "1:1";
  focalPoint?: { x: number; y: number };
  source: RecipeImageSource;
  sourceUrl?: string;
  author?: string;
  license: RecipeImageLicense;
  licenseUrl?: string;
  attribution?: string;
  ai?: { generator: string; promptVersion: string; createdAt: string };
}
```

M5 Recipe 只接入一张可选 hero。其他 role 先保留稳定语义，不建设 gallery、DAM、step editor 或多尺寸关系模型。

## Source Policy

优先级：

1. 自己拍摄或自己生成
2. Public Domain 或 CC0
3. 明确允许商业使用的图库，如逐张核验后的 Unsplash、Pexels、Pixabay
4. 明确允许商业使用与必要改编的 Creative Commons
5. 有书面许可的 partner 或其他来源

禁止进入 registry：

- Google Images 或 Baidu Image 搜索结果的直接复制
- Pinterest、小红书、大众点评图片
- 社交媒体截图
- 未授权餐厅官网或博客图片
- 带水印或版权状态未知的图片

搜索引擎只能帮助发现原始来源。最终记录必须指向原始 source page，而不是搜索结果页或图片代理 URL。

M6 的文字 Source Registry 与图片 registry 保持分离：文章、博物馆页面或书籍的 `Source.rights` 不自动授权页面内图片。Image research 使用 `docs/CONTENT_RESEARCH.md` 的独立模板，并继续逐图执行本文件的 source page、作者、exact license、attribution、主体匹配与改编权限检查。开放资源的 provider-level 风险评估见 `docs/SOURCE_POLICY.md`。

## License Model

可上线 license：

- `self-created`
- `public-domain`
- `cc0`
- `cc-by`
- `cc-by-sa`
- `unsplash-license`
- `pexels-license`
- `pixabay-content-license`
- `other-permitted`

可识别但不能进入可用 registry：

- `cc-by-nc` / `cc-by-nc-sa`：不作为未来商业产品的默认来源
- `cc-by-nd` / `cc-by-nc-nd`：响应式裁切与处理可能构成改编，因此不适合当前 pipeline
- `unknown`
- `prohibited`

`CC BY` 与 `CC BY-SA` 必须同时记录 author、attribution 和有效 license URL。其他授权即使不强制署名，也应保留 source URL；有自定义署名要求时必须填写 attribution。授权判断以素材取得时的原始条款为准，不能只依赖图库名称。

## AI-generated Policy

AI 图片必须使用 `source: "ai-generated"`，并记录 generator、promptVersion 与 UTC ISO `createdAt`。不得把 AI 图片登记成 self-created photography，也不得使用无法确认训练或输出使用条款的服务。

Issue #20 不调用付费图像 API，不批量生成图片。未来生成任务需要同时保留 prompt 版本、人工质检结果与食品真实性检查。

## Storage And Naming

当前默认使用本地静态资产：

```text
public/images/recipes/{recipe-slug}/hero.webp
public/images/recipes/{recipe-slug}/hero-2.webp
public/images/recipes/{recipe-slug}/step-01.webp
public/images/culinary/{culinary-item-slug}/hero.webp
```

规则：lowercase、kebab-case、目录与 recipe slug 一致，不保留来源网站随机文件名，也不把作者或 license 塞进文件名。

原始 source asset 与 served asset 分开：原图用于授权核验和制作留档，经过方向校正、合理裁切和压缩后的 WebP/AVIF 才进入 `public/`。Next/Image 继续生成请求尺寸的交付版本，不在仓库内再维护一套手工 thumbnail derivatives。

当前 Vercel Hobby 阶段不接 Cloudinary、S3、Supabase Storage 或付费 DAM。remote delivery 已可建模，但 `next.config.ts` 暂不开放任何 remote domain；加入远程素材前必须单独审核域名与 `remotePatterns`。

## Aspect Ratio And Focal Point

- canonical hero asset：优先 `3:2`，允许高质量 `16:9`
- detail hero frame：`3:2`
- recipe card frame：`4:3`
- mobile：保持容器比例并允许 `object-fit: cover` 裁切
- `1:1` 只为未来确有用途的素材保留，不作为 recipe hero 默认比例

`focalPoint.x/y` 使用 0 到 1 的归一化坐标，默认 `{ x: 0.5, y: 0.5 }`。同一 hero 在 card 与 detail 裁切时都使用该焦点，避免主体被切掉。

## Alt Text

Recipe hero 默认是有内容的图片，alt 必须具体描述画面，例如“番茄罗勒意面盛在白色浅盘中，表面有新鲜罗勒叶”。

不要使用“图片”“菜品图片”、无脑复制 recipe name、SEO 关键词堆砌或“最好吃”等主观判断。只有确实纯装饰且不传递内容的非 hero 图片才允许 `alt=""`。

## Next/Image Strategy

当前 Next.js 16.3.4 Web adapter 使用 `next/image`：

- `fill` 配合稳定 aspect-ratio 容器，避免 layout shift
- card sizes：mobile `100vw`，tablet `50vw`，desktop `33vw/25vw`
- detail hero sizes：mobile `100vw`，desktop 最大约 `64rem`
- homepage Living Hero：只有确定性的首张番茄炒蛋图片使用 `100vw` 并 preload
- Hero 初始只挂载当前图和下一张 lazy image；后续图片随序列推进或手动选择再挂载，不一次请求全部五张大图
- 图片切换前必须确认实际像素已经加载；慢图或失败图继续保留上一张和稳定深色底，不闪白、不改变 Hero 高度
- detail hero 作为当前页面 LCP 候选使用 `preload`
- card 图片不 preload，保持默认 lazy loading
- 不使用已被 Next 16 文档替代的全局 `priority` 策略
- 本地 WebP/AVIF 交给 Next Image Optimization，不添加自定义 loader

Living Hero 的五道料理全部来自当前 published set 并继续使用同一 image registry、focal point、source、author、license 和 attribution。韩式拌饭的 `focalPoint.x` 调整为 `0.34`，让移动端窄裁切保留碗主体；没有为单张图增加 CSS 特判。

## Fallback

无 `heroImageId`、引用缺失或浏览器加载失败时，`RecipeImage` 显示固定比例的暖中性色 fallback、Recipe 首字和 cuisine label。fallback 不改变周围布局，也不会用无来源的默认 food photo 冒充菜品。

当前 10 道 Recipe 具备已审核 hero 并进入公开集合。Fallback 仍是图片组件的容错能力，但其余 90 道无已审核 hero 的 Recipe 保持 draft，不会因为存在 fallback 就自动公开。

## Validation

自动校验覆盖：

- image ID 唯一且为 kebab-case
- role、source、license、aspect ratio 为已知值
- unknown、prohibited、NC、ND license 不得上线
- hero alt 非空
- CC BY / CC BY-SA attribution 完整
- external source URL 与 remote src 使用 HTTPS
- local path 符合命名规范且文件实际存在于 `public/`
- width/height 成对且为正数
- focal point 在 0 到 1
- AI provenance 完整
- Recipe heroImageId 存在、role 正确且路径 slug 对齐

测试不访问互联网。来源真实性与授权文本仍需要人工审核，validator 只保证记录完整和明显不安全状态不会进入 dataset。

## Add One Image Workflow

1. 选择 Recipe，并确认照片应真实呈现该配方
2. 按优先级找到原始合法来源
3. 阅读原始 license，确认商业使用、裁切和必要处理权限
4. 保存原始 source page、author、license URL 与 attribution 文案
5. 获取原图并检查分辨率、水印、真实性和视觉方向
6. 按 hero 构图裁切并输出 WebP 或 AVIF
7. 保存为 `public/images/recipes/{recipe-slug}/hero.webp`
8. 在 `data/recipe-images.ts` 新增唯一 registry entry
9. 在对应 Recipe 添加 `heroImageId`
10. 编写描述实际画面的 alt，并设置 focal point
11. 运行 validation、Web preview、移动端和桌面端 crop 检查
12. 只提交 served asset、metadata 与 Recipe 引用

## Future 100-image Expansion

补齐 100 张 hero 应作为独立 content batch，不属于 Issue #20：

1. China
2. Europe
3. East Asia
4. Southeast Asia
5. Global

每批都要独立完成来源审核、视觉一致性检查、移动/桌面裁切预览和文件体积检查。数量不能替代授权与内容准确性。

## Sample Assets

Issue #21 加入第一批 10 张真实 seed assets，用于验证首页、card、detail 和响应式裁切：

- 中国：番茄炒蛋、家常麻婆豆腐、川味拍黄瓜
- 日韩：日式味噌豆腐汤、韩式拌饭家庭版
- 东南亚：泰式罗勒鸡、越式牛肉米粉汤家庭版
- 欧洲：法式普罗旺斯炖蔬菜、番茄罗勒意面
- 其他地区：黎巴嫩风味鹰嘴豆泥

全部来源于 Wikimedia Commons 的原始 file page，授权为 CC0、CC BY 或 CC BY-SA。`data/recipe-images.ts` 逐张记录 author、source URL、license URL、attribution、alt 与 focal point；served asset 统一裁切为 `1500 x 1000` WebP。原始图片不进入仓库。

Issue #30 再次逐张检查这 10 张图片的本地文件、授权记录、alt 与食物主体，并将它们作为初始 published set 的必要条件。本轮没有新增图片；90 道无已审核 hero 的 Recipe 保持 draft，不再由公开 UI fallback 掩盖发布缺口。Publishing eligibility 会拒绝缺失 hero、受限 license、无意义 alt、悬空引用或本地文件不存在的 `published` Recipe。

## Culinary Library Assets

Issue #40 新增 16 张 native CulinaryItem hero，全部从具体 Wikimedia Commons file page 逐张核验，并保存 author、source URL、exact CC license URL、attribution、alt、尺寸与 focal point。served assets 统一为 `public/images/culinary/{slug}/hero.webp` 下的 1500 x 1000 WebP；原始下载文件不进入仓库。

`validateImageAssets()` 同时接受 recipe 与 culinary 两种本地路径，`validateCulinaryImageReferences()` 检查 primary role、ID 完整性和 slug 对齐。统一 publishing context 还注入本地文件存在性检查。当前共 26 / 26 个统一公开条目有合格 hero，但现有 Recipe Web 页面仍只消费原有 10 张 Recipe 图片。
