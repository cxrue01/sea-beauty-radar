# 项目进度（PROGRESS）

> 记录项目当前进度和关键决定。基于开源项目 [learn-from-github](https://github.com/viviannnl/learn-from-github) 改造。

## 项目概况

东南亚美妆出海雷达：每周自动抓取东南亚 6 国（越南优先）当地语言新闻 → AI 筛选/分类/三段式解读 → Dashboard（网页）+ 每周邮件周刊。

## 下一步（按顺序）

1. 写 README（附网页截图、周刊截图、演示视频）
2. 公开前检查
3. 公开仓库
4. 网页美化

> 注：10/12 是第一次自动运行（周一 8 点定时），需确认：网站自动更新、收到周刊、邮件里的「查看解读」链接能打开。

## 已完成

### 阶段 1：环境检查 + 跑通原项目 ✅
- Node v24 满足要求；原项目已克隆到本目录，示例数据跑通（本地 `http://localhost:3000`）。

### 阶段 2：数据源 + 关键词 + 品牌名单 ✅（基本完成）
- 关键词：6 国（越南最全），见 `config/keywords.ts`。
- 品牌名单：公开版 `config/brands.ts`（16 个）+ 私人版模板 `config/brands.local.example.ts`。
- 数据源插槽：`config/sources.ts`，3 种类型：`google_news` / `rss` / `google_news_site`。
- 抓取逻辑：`lib/fetch.ts`（统一格式 + URL 去重 + 7 天过滤 + 报错响亮不崩）。
- 测试脚本：`scripts/fetch-news.ts`（`--vn` 只跑越南）。

### 数据源 + 最近 7 天条数（2026-09-29 实测）

| 数据源 | 类型 | 7 天内（去重后） |
|---|---|---|
| Google News 越南 | google_news | 80 |
| Google News 印尼 | google_news | 22 |
| Google News 泰国 | google_news | 9 |
| Google News 菲律宾 | google_news | 4 |
| Google News 马来西亚 | google_news | 9 |
| Google News 新加坡 | google_news | 8 |
| 白鲸出海 | rss | 0 ⚠️ |
| 亿邦动力 | google_news_site | 12 |
| 36氪 | google_news_site | 5 |
| 雨果网 | google_news_site | 1 |
| **合计** | | **150** |

### 阶段 3：AI 筛选 + 分类 + 三段式解读 ✅
- 服务商切换：`lib/llm.ts`（默认 DeepSeek，可切 Anthropic；JSON 输出模式 + 格式校验 + 失败重试一次、再失败记录跳过）。
- 分析逻辑：`lib/analyze.ts`（筛选分类 → 标题相似合并 → 三段式解读 → 每周汇总）。
- 测试脚本：`scripts/test-analyze.ts`（`--vn` / `--limit N` / `--per-country N`）。
- 政策类新增第 6 类「执法与打假」；标题相似合并只在同国家内做，合并组分类不一致时对代表标题重分类一次。
- 边界规则：品牌涉诉（合规/货源/执法保留，仅私事丢弃）；中国品牌整体趋势保留归市场格局；解读中数字保留原文+中文换算。
- 测试：越南 15 条 + 6 国各 5 条两轮，分类准、不编造、无关内容正确丢弃，验收通过。
- 以上规则已完整同步进 SPEC.md 第 9 节。

### 阶段 4：改造 Dashboard ✅
- 数据落库：新增 `Item` 模型（说明书 10.1）、改造 `Issue` 模型（10.2），删除旧 `Repo`/`RepoLocale`/`Subscriber`。
- 页面：首页重定向到最新一周；`/week/[周]` 周视图（本周 3 件事 / 进入政策 / 市场动态 + 周切换 + 筛选）；`/item/[id]` 详情页；`/newsletter` 往期列表 + `/newsletter/[周]` 网页版周刊。
- 周切换用「周一日期」作标识（沿用阶段 2/3 的 `weekOf`），标题显示日期范围「9/21 – 9/27」，网址形如 `/week/2026-09-28`。
- 筛选做成网址参数（国家/板块/类别/品牌/层级/资本），切周时条件不丢。
- 品牌层级/资本标签在显示时动态解析（不落库，保证云端数据不泄露 direct/own）。
- 示例数据：`scripts/seed-demo.ts` 插入连续两周（13+12 条）+ 两期周刊，品牌虚构、标注「示例数据」。
- 改名：项目 `beautytrend`、副标题 `东南亚美妆出海雷达`、周刊 `sensebeauty周报`（用户确认拼写）；页面/邮件/README 里的 LearnFromGithub 已全部替换；README 保留「基于 learn-from-github 改造」署名。
- 删除旧文件：`lib/ai.ts`、`lib/github.ts`、`lib/locale.ts`、`lib/server-locale.ts`、`scripts/run-pipeline.ts`、`scripts/backfill-locale.ts`、`components/RepoCard.tsx`、`components/SubscribeForm.tsx`、`components/LocaleToggle.tsx`、`app/api/subscribe/route.ts`。
- 验证：`tsc --noEmit` 通过；dev 服务器下所有页面 200；`country=VN` 筛选后 4 条、`section=policy` 筛选后 3 条，筛选生效。

### 首页折叠 + 总览页（2026-09-30）

- 首页改回**单栏布局**（去掉右侧筛选栏），新增折叠：「进入政策」「市场动态」区块可折叠（默认展开）；市场动态内每个国家分组可折叠（越南默认展开、其他收起，收起显示「国旗 国家名 · N 条」）。
- 新增「总览」页 `/overview`：跨周查看，可切「进入政策 / 市场动态」+ 时间范围「近 4 周 / 近 3 个月 / 全部」，筛选与首页一致，按国家分组、最新在前，复用首页卡片与筛选组件。导航改为「首页 ｜ 总览 ｜ 往期周刊」。
- 抽出 `lib/items.ts`（FilterState / matches / groupByCountry / sortNewest）供首页和总览共用。

### 阶段 5：改造周刊 ✅（2026-09-30）

- 重写 `lib/email.ts`：`buildSubject`（主题「sensebeauty周报 · 第 X 期（9/21 – 9/27）」）+ `buildEmailHtml`（本周 3 件事 / 进入政策 / 各国动态，香槟金暗色、每条一句话 + 查看解读链接）+ `sendIssue`（读 `RECIPIENT_EMAIL`，无 `RESEND_API_KEY` 时 dry run 只打印不发送）。
- 新建 `scripts/send-newsletter.ts`：`npm run newsletter:send`，支持 `--week`（指定周次）/ `--dry`（强制演练）/ `--dump=文件`（导出 HTML）。阶段 6 的 GitHub Actions 会调用它。
- env 对齐：`.env.example` 和本地 `.env` 统一用 `RECIPIENT_EMAIL`（原来叫 `NEWSLETTER_TO`），并补 `RESEND_API_KEY` / `SITE_URL`。
- 删除 `lib/markdown.ts`（旧邮件用的 markdown 渲染，已无引用）。
- 修 `seed-demo.ts`：补 `issue.deleteMany`，否则旧 seed 的 issue 残留、导致「最新一期没 item」。
- 验证：`tsc --noEmit` 通过；dry run 输出第 2 期 9/21–9/27（3 政策 + 10 市场 = 13 条），邮件 HTML 结构正确（政策项显示「[高影响] 🇻🇳 越南 · … → 查看解读」）。
- 真实发送已测通：用 Resend 免费测试发件人 `onboarding@resend.dev`（`NEWSLETTER_FROM`）成功发到自己的收件邮箱（已脱敏），用户已确认收到（内容为示例数据）。正式上线需换验证域名 + 部署后改 `SITE_URL`（邮件里的「查看解读」链接现在指向 localhost）。

## 关键决定

1. **数据持久化**：数据存回 GitHub 仓库（方案①）。云端流水线写 `data/prod.db` 并提交回仓库；本地开发用 `data/dev.db`（gitignore，不上传）。
2. **代理只写在 .env**：`HTTPS_PROXY` 放 `.env`（gitignore，不上传）。本地访问 Google 需要；GitHub Actions（美国服务器）不需要。
3. **Google News 的 hl 参数**：英文/马来语必须用「语言-地区」写法（`en-PH` / `en-SG` / `ms-MY`），两字母（`en` / `ms`）会返回空。越南/印尼/泰语用两字母（`vi` / `id` / `th`）即可。
4. **白鲸出海地址**：用 `https://www.baijing.cn/feed`（原 `baijingapp.com` 会 301 跳转）。
5. **标题相似合并挪到阶段 3**：同一事件多媒体报道时合并成一条、保留所有来源链接，用 AI 判断更准，放阶段 3 做。
6. **关键词修改**（用户 2026-09-29 确认）：印尼/马来 `serum pemutih`→`serum pencerah`；越南政策加 `công bố mỹ phẩm`、市场加 `mỹ phẩm giả`；各国加"化妆品市场"词；菲律宾/新加坡英文词加国家名。
7. **品牌名单保密**：私人名单 `config/brands.local.ts` 只留本地（gitignore）；云端只用公开版；存进 GitHub 的数据绝不能出现 `direct`（直接竞品）/ `own`（自家品牌）标签。
8. **AI 服务商用 DeepSeek**（用户 2026-09-29 确认）：默认 `LLM_PROVIDER=deepseek`（兼容 OpenAI 接口）；保留 `anthropic` 可切换设计（说明书 9.5）。
9. **上传需确认**：任何上传到 GitHub 的操作（git push、创建仓库、创建 PR 等）都必须先问用户、得到确认才执行。云端流水线每周自动提交数据是产品功能，配置时需用户明确同意。
10. **收件邮箱保密**：收件邮箱只放本地 `.env`（`RECIPIENT_EMAIL`）和 GitHub Secret（不是 Variable），绝不能出现在任何会上传的文件里。每次 push 前扫描敏感信息（邮箱、key、私人品牌名、direct/own 标签）。
11. **本地同步命令**：部署前提供 `npm run sync`，把云端提交的 prod.db 拉到本地查看。
12. **新关键词观察 3 周**（2026-10-04）：新增的连锁/KOL 关键词先保留观察 3 周；流水线每次运行时在报告里输出各关键词的命中数，连续 3 周零命中的再删除。
13. **不买服务器/域名，用免费部署**（2026-10-07）：项目主要用于简历展示，改为免费方案（Vercel 或 GitHub Pages，二选一待定）。不买香港服务器、不买域名。代价是大陆访问不稳定（vercel.app / github.io 均可能被墙），面试官在国内时需自备代理或接受风险。

## 阶段 6：配置 GitHub Actions ✅（完成）

### 代码改动（已提交 GitHub）
- `scripts/run-pipeline.ts` 加 `--week=YYYY-MM-DD`：手动指定回补周次（回补不发邮件）。
- 数据加 `keyword` 字段（`lib/fetch.ts` + `prisma/schema.prisma`）：抓取时标记来源关键词，供命中统计用。
- 邮件底部加「运行报告」（`lib/email.ts` / `lib/newsletter.ts`）：各源抓取条数、AI 判相关条数、政策/市场各多少、零命中关键词。**只进邮件、不进网页。**
- 重写 `.github/workflows/weekly-pipeline.yml`：周一北京时间 8 点定时（`0 0 * * 1`）+ 手动触发（week / send）+ 跑完提交 `data/prod.db` 回仓库；加 `concurrency` 防并发（注意：不用于批量回补，每队列只留 1 个排队）。
- `.gitignore` 放行 `data/prod.db`（其它 DB 继续忽略）。
- 新增 `scripts/keyword-hit-report.ts`（四周命中报告）+ `config/new-keywords.ts`（25 个新关键词清单，两脚本共用）。

### GitHub 侧已完成
- 私有仓库 `github.com/cxrue01/sea-beauty-radar`；git 身份 `Rue` + GitHub 隐藏邮箱。
- Secrets：`DEEPSEEK_API_KEY`、`RESEND_API_KEY`、`RECIPIENT_EMAIL` 已配；Variable：`NEWSLETTER_FROM` 已配（`SITE_URL` / `LLM_PROVIDER` 可选，暂走默认 localhost / deepseek）。
- 代码已 push 到 `main`。

### 回补（已完成，8/31–9/28 共 5 周）
- 顺序：`2026-08-31` → `2026-09-07` → `2026-09-14` → `2026-09-21`，一周一周手动触发，`send` 取消勾选（只存数据、不发邮件）。
- 每次只触发一周，等绿勾确认成功后再下一周（GitHub concurrency 每队列只留 1 个排队，连发会取消中间的）。
- 8/31 距今天约一个月，Google News 大概率抓不到 → 大概率空结果（正常，非报错）。

### 回补完成后待办
- 跑 `scripts/keyword-hit-report.ts` 出五周各关键词命中数，列零命中清单 + 删词建议 ✅（见「期号按日期重排 + 关键词命中报告」节，配合关键决定 12）。

## 政策/市场比例排查 + 调整方案（2026-10-02，已执行）

> 当前状态：流水线已重建（`scripts/run-pipeline.ts` + `lib/newsletter.ts`），周次按「上一个完整周」标注；示例数据在有真实数据时自动清除。第 1 期真实数据 = week 2026-09-21（9/21–9/27）。

### 排查结论（调整前数字）

- 第 1 期：**政策 19 条、市场 13 条**，政策虚高、市场偏少。
- 19 条政策里：**保留 10 条**、**误判应改市场 7 条**、**应丢弃 2 条**。

### 根因

1. **清真展会/颁奖被误判为政策**：`sertifikasi halal kosmetik` / `kosmetik halal` 抓回大量清真展、企业获清真奖、合作签约，AI 全判成「清真认证」。
2. **例行执法协作、科普活动被误判为执法**：`BPOM kosmetik` 抓回的「警方与 BPOM 协作签约」「药监进校园」被算成「执法与打假」。
3. **市场关键词漏进政策**：VN「mỹ phẩm giả（假冒化妆品）」「thị trường mỹ phẩm（化妆品市场）」、ID「kosmetik China」这些**市场类**关键词，抓回的是打假/涉诉新闻，被 AI 判成政策「执法与打假」（共 4 条）。

### 调整方案（清空上下文后靠这一节执行）

**A. 收紧政策判断（改 `lib/analyze.ts` 分类提示词，只加严、不放水）：**
- 「清真认证」只收：强制要求、法规变化、时间表、准入门槛。**不收**：清真展会、企业获清真奖、合作签约。
- 「执法与打假」只收：具体的查处、下架、召回、罚款、立案。**不收**：进校园科普、例行协作签约、真假混卖现象综述。
- 行业展会统一归「市场格局」，或直接丢弃。

**B. 补充市场关键词（改 `config/keywords.ts`）：**
- 各国补渠道词、品牌动作、KOL 代言、新品类词。越南补：`Watsons`、`Guardian`、`Hasaki`、`đại sứ thương hiệu`（代言人）等；并补 TikTok Shop、当地连锁相关词。
- 其余 5 国同样补 TikTok Shop、当地连锁（Watsons / Guardian / Hasaki 等）、KOL 合作词。

**C. 存疑 3 条已定：**
- #1 Doktif 化妆品在 Richard Lee 庭审被指含中国货 → **保留**（涉货源，符合「品牌涉诉」边界规则）。
- #14 美妆香水市场真假混卖问题突出 → **改市场格局**。
- #17 美妆假货借标签造假侵蚀信任 → **改市场格局**。

### 已更新 SPEC
- 第 9.2 节：已按方案 A 收紧「清真认证」「执法与打假」判定标准，并补「行业展会统一归市场格局或丢弃」。
- 第 7 节：已新增关键词规则「选市场关键词要检查实际抓回的内容，主要抓回执法/展会/颁奖新闻的词不适合放市场类」，并注明 v1 存档 `docs/keywords-v1.md`。
- 代码：`lib/analyze.ts` 分类提示词已收紧；`config/keywords.ts` 已补 6 国渠道/KOL/代言人关键词（越南多补 Hasaki）。

### 回测 + 重跑（2026-10-04）
- 新增脚本 `scripts/reclassify-check.ts`：**改分类提示词后，用历史数据回测效果**（取收紧前入库的原始条目，用新提示词重新分类，看政策/市场/丢弃变化）。
- 回测数据：用新标准重新分类收紧前的 32 条 → 政策 19→10、市场 13→13、丢弃 0→9；被剔除的主要是展会、科普、例行签约。
- 清空周 09-21 数据后用新规则完整重跑，恢复为第 1 期，top3 基于全部条目。
- **最终结果**：重跑后周 09-21 = 政策 10 · 市场 17（共 27 条）；政策收紧有效（回测 19→10）。
- 新增的 25 个连锁/KOL 关键词中 **23 个零命中**（仅 ID「Watsons kosmetik」1 丢弃、PH「beauty brand ambassador」1 相关），原因是词太窄、新闻频率低；市场 17 条主要来自原有宽泛关键词。

### 存档
- 关键词 v1 存档：`docs/keywords-v1.md`。
- git commit `1b07cf2 关键词 v1 + 政策收紧前`（本地，未 push）。

## 云端限流修复（2026-10-05，已执行）

- **问题**：第一次定时自动跑（周一 8 点）时，Google News 几乎全部返回 HTML 验证页（报错 `Feed not recognized as RSS 1 or 2` / `Unquoted attribute value`），6 国 + 亿邦/36氪/雨果网（走 `site:` 搜索）全 0 条，仅白鲸出海（直连 RSS）成功，但运行仍显示绿勾。
- **根因**：Google 对 GitHub Actions 共享 IP 间歇性限流；且 `fetchSource` 把单个关键词失败都吞掉、不抛错，导致「0 条」被当成成功。
- **修复**：
  - `lib/fetch.ts`：`fetchXml` 检查 HTTP 状态码（非 200 报错）；`fetchFeed` 解析失败时打印响应开头、加重试（最多 2 次，等 10s / 30s，带随机抖动）；`fetchSource` 关键词间加 2s 间隔，某国全部关键词失败时抛错。
  - `scripts/run-pipeline.ts`：抓取结束后统计失败源数量，失败超过一半 → 退出码 1（红叉），不发邮件、不提交数据。
- **后续**：push 后重新回补 8/31 验证。

## 回补后三个问题修复（2026-10-07，已执行）

- **邮件变 dry run**：workflow 里 `send` 输入是 `type: boolean`，`inputs.send == 'true'` 拿布尔值比字符串、永远不成立，导致勾了「发邮件」仍不传 `--send`。改成在 shell 里判断 `[ "${{ inputs.send }}" = "true" ]`；`lib/email.ts` 把「dry run」和「没配 RESEND_API_KEY」两种提示分开，避免误报。
- **数据没存回仓库**（每次都从空库开始、永远「第 1 期」）：Prisma 的 SQLite `file:` 路径是相对 schema 文件（`prisma/`）解析的，`file:./data/prod.db` 实际写到 `prisma/data/prod.db`，而提交步骤检查根目录 `data/prod.db` → 永远「不存在，跳过提交」。改 workflow 两处 `DATABASE_URL` 为 `file:../data/prod.db`。已确认 `.gitignore` 的 `!data/prod.db` 放行有效（`git add data/prod.db` 能正常暂存）。
- **标题合并失败**（「索引 30 重复出现」→ 整批不合并、政策虚高）：`validateClusters` 遇到重复索引就整批作废。改成容错去重（重复索引只保留第一次、不足 2 条的组丢弃）；`clusterCountry` 的 `maxTokens` 1000→4000（71 条一起喂容易超）。

## 期号按日期重排 + 关键词命中报告（2026-10-07，已执行）

- **期号修正**：回补时 9/14、9/21 顺序弄反，期号错位（9/14=4、9/21=3）。已用 `scripts/renumber-issues.ts` 把 prod.db 里 5 期按周次重排为 1..5；`run-pipeline.ts` 改成每次落库后按周次重排期号（不再「max+1」按运行先后）。
- **关键词命中（5 周，25 个新关键词去重后 23 个）**：
  - **19 个五周全零命中（暂不删，以后再决定）**：
    - 越南：`Watsons mỹ phẩm`、`Guardian mỹ phẩm`、`Hasaki`、`đại sứ thương hiệu mỹ phẩm`
    - 印尼：`Watsons kosmetik`、`Guardian kosmetik`、`brand ambassador kosmetik`
    - 泰国：`Guardian เครื่องสำอาง`、`พรีเซนเตอร์ เครื่องสำอาง`、`บิวตี้บล็อกเกอร์ เครื่องสำอาง`
    - 菲律宾：`Watsons beauty Philippines`、`Guardian beauty Philippines`、`beauty influencer Philippines`
    - 马来：`duta jenama kosmetik`、`influencer kecantikan`
    - 新加坡：`Watsons beauty Singapore`、`Guardian beauty Singapore`、`beauty brand ambassador Singapore`、`beauty influencer Singapore`
    - 注：`Watsons kosmetik` / `Guardian kosmetik` 在印尼和马来共用同一词。
  - **4 个各命中 1 次（暂留观察）**：越南 `KOL mỹ phẩm`、印尼 `kol kecantikan`、泰国 `Watsons เครื่องสำอาง`、菲律宾 `beauty brand ambassador Philippines`。

## 部署上线（Vercel）✅（2026-10-07，已执行）

- 免费部署到 Vercel：`https://sea-beauty-radar.vercel.app`，已显示 5 周真实数据（8/31–9/28），仓库保持私有。
- **踩坑**：Vercel 是无服务器环境，运行时读不了 SQLite（报 `Error code 14: Unable to open the database file`）。改为「构建时把 `data/prod.db` 导出成 JSON 快照，运行时读 JSON」：新增 `scripts/export-data.ts`、`lib/data.ts`（页面数据层）、`lib/view.ts`（纯函数，从 `lib/db.ts` 拆出），6 个页面改用 `lib/data` 查询；`package.json` 的 build 加导出步骤，加 `predev` / `export:data`。
- 数据每周自动更新：周一机器人提交 prod.db → Vercel 检测到 push 自动重新部署 → 新一周上线。
- `SITE_URL` 已在 GitHub Variables 设为线上网址（邮件「查看解读」链接会指向线上页面）。
- 验证：类型检查、生产构建、生产模式页面（首页跳最新周、周页真实数据、详情页三段式）均通过。

## 改名 + SPEC 同步（2026-10-08，已执行）

- **改名：** 产品名 `beautytrend` → `SEA Beauty Radar`，周刊名 `sensebeauty周报` → `SEA Beauty Radar 周报`；副标题「东南亚美妆出海雷达」保留，网址/仓库名不变。改 `lib/site.ts` 常量（自动传播到页头/页脚/页面标题/邮件）、详情页标题、README/PRODUCT/DESIGN/SPEC；`package.json` 的 `name` 改为 `sea-beauty-radar`。
- **SPEC 同步（对照代码一次性全改）：** 数据源补 `google_news_site`、中文媒体（白鲸 RSS + 3 家站内搜索）、行业媒体「V1 暂未接入」；抓取范围改「上一个完整周（周一到周日）」；失败处理（失败超一半才红叉 + 限流重试）；新增 §7.4 关键词观察（观察 3 周规则 + 5 周数据 19 零命中暂不删 + 按品牌名搜索实验）；Item 补 `keyword` 字段、`week` 改周一日期 `2026-09-28`、Issue 补期号按周次重排；邮件补「运行报告」（只进邮件不进网页）；§13 修 UTC（周一 00:00）、手动触发/回补不发邮件、prod.db 提交回仓库；§16 删「上线部署」；§17 阶段 1–6 标 ✅ + 新增部署上线节。

## 待办 / 注意事项

> **视觉美化暂缓（2026-09-30）**：先暂停视觉美化，继续做阶段 5（周刊）；信号色已定香槟金 `#d6b88f`、内容宽度 1080px，后续再回来继续美化。

> **安全待办**：测试完成后，换一把新的 Resend key（当前这把已在对话里明文出现过，正式使用前换新）。

### ① 首页功能调整
- 政策条目加国旗国家名：政策列表里每条前显示「🇻🇳 越南」等国家标识。 ✅
- 示例数据改用两个**已过完的周**：9/14–9/20 和 9/21–9/27（当前用的是本周/上周，日期会随运行时间漂移）。 ✅
- 公开版不显示「直接竞品 / 自家品牌」筛选：这两个层级只存在于私人版 `brands.local.ts`，公开版（云端）的筛选下拉里不应出现。
- 本周 3 件事可点击：目前 top3 只是纯文本，需要能跳到对应的详情页（可能要给 Issue 的 top3 存 item id）。 ✅
- 筛选结果为空时显示提示：例如「没有符合条件的动态」。

### ② 视觉重做
- 已完成首页**深色主题**重做：暖深炭灰底（`#1c1a18`）+ 香槟金信号色（`#d6b88f`），方向「苹果简洁 × 财经杂志编辑感」，用 Impeccable 技能辅助。排版结构（衬线「本周 3 件事」大卡、折叠筛选、分区竖条、周切换、国家分组细横线）已落地；详情页 / 周刊页只做了最小 token 换色，未完整重做。
- 用户反馈：**还不够好看**，下一步继续美化 —— 内容太宽太空、字体不统一。
- 内容宽度：`max-w-content` 从 45rem（720px）**加宽到 67.5rem（1080px）**（用户觉得 720 太窄、不像完整网页）；筛选字段改 `flex-1` 撑满整行。文章页（详情/周刊）仍用 `max-w-prose` 44rem 保持阅读宽度。
- ⚠️ 坑：改 `tailwind.config.ts` 里的颜色后**必须重启 dev 服务器**才生效（Next.js dev 不总是自动重编译 tailwind 配置）。清空 `.next` 后 CSS 要等页面首次请求才编译，纯 curl CSS 路径不会触发编译。

### ③ Impeccable 的 gitignore 规则
- 已把 `.impeccable/`、`.impeccable-live.json`、`.impeccable-live/`、`.impeccable.md` 加进 `.gitignore`（来自 impeccable 官方 .gitignore）✅

### ④ 市场动态质量提升（实验）
- 按品牌名搜索：公开名单里的出海标杆品牌 + 国家名（如「Skintific Vietnam」「Glad2Glow Indonesia」），作为提升市场动态质量的下一个方案（当前新连锁/KOL 关键词零命中率高，市场主要靠宽泛品类词）。

### 其他观察
- 白鲸出海、雨果网 7 天内条数很少（feed 可能更新慢 / site: 搜索按相关度排序），继续观察是否调整。
- 菲律宾、马来西亚、新加坡 7 天内**相关**新闻偏少（AI 筛选后 PH 0 相关、MY 0 相关、SG 极少），先观察，看是否加关键词或换数据源。
- 本地抓取依赖代理；GitHub Actions 里不需要代理。
