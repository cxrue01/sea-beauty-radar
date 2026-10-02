# beautytrend — 东南亚美妆出海雷达

每周自动抓取东南亚 6 国（越南优先）当地语言的美妆新闻，用 AI 筛选、分类并翻译成中文，做成商业情报 Dashboard 和每周邮件周刊 `sensebeauty周报`。

> 本项目基于 [learn-from-github](https://github.com/viviannnl/learn-from-github) 改造。原项目抓取 GitHub Trending 做 AI 分析；本项目保留了它的整体架构（数据管道 + Dashboard + 周刊 + GitHub Actions 定时运行），把数据源从 GitHub 换成了东南亚美妆新闻。

## 它解决什么问题

出海美妆团队需要持续、及时地知道东南亚各国「竞品在做什么、政策在怎么变」，但这些信息分散在 6 个国家、多种语言里，靠人工追不过来。这个工具每周自动把它们抓回来、筛掉无关内容、分好类、翻译成中文、做成三段式解读，然后推送到网页和邮件。

## 技术栈

| 部分 | 选择 |
|---|---|
| 应用 | Next.js 15 (App Router)、React 19、Tailwind CSS |
| AI | 默认 DeepSeek，可切换 Anthropic（结构化 JSON 输出） |
| 存储 | SQLite（通过 Prisma） |
| 邮件 | Resend（没有 key 时只演练、不发送） |
| 定时 | GitHub Actions cron + 可手动触发的 CLI 脚本 |

## 快速开始

```bash
npm install
cp .env.example .env        # 填入 DEEPSEEK_API_KEY 等
npm run db:push             # 创建 SQLite 数据库
npm run seed:demo           # 插入两周示例数据（不需要任何 key 也能看效果）
npm run dev                 # http://localhost:3000
```

没有任何 API key 时，`npm run seed:demo` 会插入两周虚构的示例数据（品牌都是「示例品牌A」这类假名），网页能完整演示周切换、筛选、详情页和往期周刊。

## 命令

```bash
npm run dev                 # 本地开发
npm run db:push             # 同步数据库结构
npm run seed:demo           # 插入示例数据
npx tsx scripts/fetch-news.ts        # 抓取新闻（--vn 只跑越南）
npx tsx scripts/test-analyze.ts      # AI 筛选/分类/解读小批量测试
```

## 数据流程

```
Google News（6 国当地语言）+ 中文出海媒体 + 行业媒体
  → 统一格式 + 去重 + 7 天过滤
  → AI 筛选分类（丢掉无关的）
  → AI 三段式解读（只对相关的）
  → 存入 SQLite
  → Dashboard 网页 + 每周邮件周刊
```

## 目录结构

```
app/                    页面：首页/周视图、详情页、往期周刊
components/             ItemCard、WeekSwitcher、Filters、BrandTag
config/
  sources.ts            数据源插槽
  keywords.ts           6 国关键词（越南最全）
  brands.ts             公开版品牌名单
  brands.local.example.ts 私人版名单模板（不上传）
lib/
  fetch.ts              抓取 + 去重
  analyze.ts            AI 筛选/分类/三段式解读/每周汇总
  llm.ts                AI 服务商切换层
  brands.ts / labels.ts 品牌标签与中文映射
  db.ts / week.ts       Prisma 客户端、周次工具
prisma/schema.prisma    Item（动态）、Issue（周刊）
scripts/seed-demo.ts    示例数据
```

## 安全

- API key 只放在本地 `.env`（已写进 gitignore），绝不上传 GitHub。
- 私人品牌名单 `config/brands.local.ts` 只留本地，不在公开版出现任何真实竞品或自家品牌。
- 存进 GitHub 的数据里不会出现「直接竞品 / 自家品牌」标签。
