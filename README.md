# SEA Beauty Radar — 东南亚美妆出海雷达

SEA Beauty Radar is a weekly automated news radar that tracks competitor moves and policy changes for beauty brands expanding into Southeast Asia. It fetches local-language news across six countries, filters and classifies it with AI, and delivers Chinese-language briefings through a web dashboard and an email newsletter. The whole thing — requirements, design, and code — was built by one person working with Claude Code.

**SEA Beauty Radar 每周自动抓取东南亚 6 国（越南优先）当地语言的美妆新闻，用 AI 筛选、分类并翻译成中文，做成商业情报 Dashboard 和每周邮件周刊。**

🔗 在线演示：<https://sea-beauty-radar.vercel.app>（每周一自动更新）

## 界面截图

| 首页（周视图） | 详情页 |
|---|---|
| ![首页](./docs/screenshots/home.png) | ![详情页](./docs/screenshots/detail.png) |

| 总览（跨周） | 邮件周刊 |
|---|---|
| ![总览](./docs/screenshots/overview.png) | ![邮件周刊](./docs/screenshots/newsletter.png) |

## 解决什么问题

出海美妆团队需要持续、及时地知道东南亚各国「竞品在做什么、政策在怎么变」，但这些信息分散在 6 个国家、多种语言里，靠人工追不过来，也经常发现得太晚。这个工具每周自动把它们抓回来、筛掉无关内容、分好类、翻译成中文、做成三段式解读，然后推送到网页和邮件。

## 核心功能

- **每周自动抓取**：东南亚 6 国（越南优先）当地语言新闻 + 中文出海媒体，只保留上一个完整周。
- **AI 两步分析**：先筛选分类（市场动态 5 类 / 进入政策 6 类，丢掉无关的），再对相关的做三段式解读（发生了什么 / 为什么重要 / 意味着什么）。
- **周视图 Dashboard**：本周 3 件事、进入政策、市场动态；可切换周，可按国家 / 板块 / 类别 / 品牌筛选。
- **配套页面**：跨周总览、单条详情页、往期周刊列表与网页版周刊。
- **每周邮件周刊**：一份一分钟能扫完的中文简报，点「查看解读」跳到详情页。

## 运作流程

```
Google News（6 国当地语言）+ 中文出海媒体
  → 统一格式 + 去重 + 上一个完整周过滤
  → AI 筛选分类（丢掉无关的）
  → AI 三段式解读（只对相关的）
  → 存入 SQLite
  → Dashboard 网页 + 每周邮件周刊
```

每周一早上 8 点（北京时间）由 GitHub Actions 自动跑一遍整条流水线，跑完把新数据提交回仓库，Vercel 检测到 push 自动重新部署。

## 关键设计决定

1. **当地语言一手来源**：用越南语、印尼语等当地语言直接搜 Google News，而不是读英文二手转述，信息更早、更全。
2. **单列「进入政策」**：把各国监管变化（备案、清真认证、平台规则等）单独拎出来追踪——它最枯燥、最少人盯，代价却最高。
3. **按背后资本标注品牌出身**：一些中国资本品牌对外包装成本土或韩系品牌，名单按「背后资本」标注，让用户看清谁才是真正的中国出海品牌。
4. **公开 / 私人名单分离**：公开仓库只放公开可查的品牌名单，直接竞品和自家品牌留在本地私人名单（gitignore），保证公开数据不泄露敏感标签。

## 迭代中发现的问题与修复

- **新增「执法与打假」类别**：测试中同一起打假事件被分进两个不同类别，判断是类别设计有缺口，新增该类别并在合并后统一重分类。
- **政策比例异常排查与回测**：首期政策条目虚高（19 条），排查发现展会、科普、例行执法活动被误判，收紧判定标准后用回测脚本重过历史数据，政策降至 10 条。
- **「运行成功但未产出」的排查与告警**：抓取被限流时返回 0 条却仍显示绿勾，改为检查 HTTP 状态码，失败源超过一半就红叉告警。
- **数据未存回导致回补返工**：SQLite 路径相对 schema 解析，数据写错目录导致每次从空库开始，修正后重新回补 5 周；此后先用单周验证整条链路（包括数据是否真的存下来），再批量处理。

## 技术栈

| 部分 | 选择 |
|---|---|
| 应用 | Next.js 15（App Router）、React 19、Tailwind CSS |
| AI | DeepSeek（默认，可切 Anthropic），结构化 JSON 输出 |
| 存储 | SQLite（Prisma） |
| 邮件 | Resend（没有 key 时只演练、不发送） |
| 定时 | GitHub Actions cron + 手动触发 |
| 部署 | Vercel（免费） |

## 本地运行

```bash
npm install
cp .env.example .env        # 填入 DEEPSEEK_API_KEY 等
npm run db:push             # 创建 SQLite 数据库
npm run seed:demo           # 插入两周示例数据（不需要任何 key）
npm run dev                 # http://localhost:3000
```

没有任何 API key 时，`npm run seed:demo` 会插入两周虚构的示例数据（品牌都是「示例品牌A」这类假名），网页就能完整演示周切换、筛选、详情页和往期周刊。

## 部署你自己的版本

想把这份雷达部署成你自己的线上版本，跟着下面 5 步走，全程约 20 分钟，不需要买服务器或域名（Vercel 免费，仓库可以保持私有）。

### 第 1 步：Fork 仓库

在 GitHub 打开本仓库，点右上角 **Fork**，复制到你的账号下。之后所有操作都在你的 Fork 里做。

### 第 2 步：准备 key

| Key | 用途 | 是否必填 | 在哪申请 |
|---|---|---|---|
| **DeepSeek key** | AI 筛选 / 分类 / 解读的「钥匙」 | ✅ 必填 | <https://platform.deepseek.com>，充值少量余额后创建 API key |
| **Resend key** | 发邮件周刊的「钥匙」 | ⚪ 可选 | <https://resend.com>（不配也能跑，只是不发真邮件、只在日志里演练） |

### 第 3 步：在 GitHub 配置 Secrets 和 Variables

进你的 Fork → **Settings** → **Secrets and variables** → **Actions**。

**Secrets（密钥，GitHub 帮你保密，填完只显示成小圆点）：**

| 名称 | 填什么 | 是否必填 |
|---|---|---|
| `DEEPSEEK_API_KEY` | 第 2 步的 DeepSeek key | ✅ 必填 |
| `RECIPIENT_EMAIL` | 收周报的邮箱 | ⚪ 发邮件才需要 |
| `RESEND_API_KEY` | 第 2 步的 Resend key | ⚪ 发邮件才需要 |

**Variables（变量，普通配置，不保密）：**

| 名称 | 填什么 | 是否必填 |
|---|---|---|
| `SITE_URL` | 你的线上网址（第 4 步部署完拿到，形如 `https://你的用户名-sea-beauty-radar.vercel.app`） | ⚪ 建议填（不填邮件里的「查看解读」链接指向 localhost） |
| `NEWSLETTER_FROM` | 发件人地址（Resend 验证域名后的地址） | ⚪ 发邮件才需要 |
| `LLM_PROVIDER` | `deepseek`（默认就是它，一般不用动） | ⚪ 可选 |

### 第 4 步：部署到 Vercel

1. 用 GitHub 账号登录 <https://vercel.com>。
2. 点 **Add New → Project**，选中刚 Fork 的仓库，一路 **Deploy**（Vercel 会自动识别这是 Next.js 项目）。
3. 部署完拿到一个网址（`https://xxx.vercel.app`），把它填回第 3 步的 `SITE_URL`。

### 第 5 步：在 Actions 手动触发一次验证

1. 进你的 Fork → **Actions** → 左侧选 **Weekly pipeline** → 点 **Run workflow** → 直接点绿色 **Run workflow**（week 留空，会自动抓上一个完整周）。
2. 等它跑完看到绿色 ✓（几分钟到十几分钟）。
3. 验证：打开你的 Vercel 网址能看到刚生成的一周数据；配了 Resend key 的话邮箱会收到本周刊，没配的话点进那次运行看日志，能看到演练的邮件内容。

以后每周一早上 8 点（北京时间）自动跑，不用再手动操作。

> **国内网络提醒：** ① **本地运行**抓新闻需要代理（Google News 在国内访问不了，在 `.env` 里填 `HTTPS_PROXY`）；② **GitHub Actions 和 Vercel** 跑在海外服务器，不需要代理；③ 但**你自己在国内打开 Vercel 网页**时，`vercel.app` 可能被墙，需要自备代理。

## 已知局限

- 免费 Vercel 部署在中国大陆访问不稳定（`vercel.app` 可能被墙），面试官在国内时需自备代理。
- 数据源依赖 Google News，对共享 IP 偶发限流，个别周抓取可能不全。
- V1 只抓标题 + 摘要，不抓新闻全文。

## 开发方式

本项目由我（Rue）以产品经理的身份写需求和验收标准，借助 Claude Code 完成开发。需求见 `SPEC.md`、进度与关键决定见 `PROGRESS.md`、设计规范见 `DESIGN.md`。

## 开源协议

本项目以 MIT 协议开源，可直接使用。版权归 Rue（2026），详见 [LICENSE](LICENSE)。

## 致谢

架构参考开源项目 [learn-from-github](https://github.com/viviannnl/learn-from-github)（数据管道 + 周刊 + 定时运行的整体结构）。产品定位、数据源、分类体系、AI 分析流程、品牌名单、网页和邮件设计均为本项目重新设计。
