# Design — beautytrend 东南亚美妆出海雷达

<!-- impeccable:design-schema 1 -->

视觉世界：**精确编辑感（Precision Editorial）**。苹果官网式的冷静克制（系统 SF Pro、精确的灰、少边框）× 财经杂志的编辑感（衬线阅读时刻、数据排版、发丝分隔线、单一信号色）。深色、暖调。

## Color

| Token | 值 | 用途 |
|---|---|---|
| `paper` | `#1c1a18` | 主背景（暖深炭灰） |
| `paper.tint` | `#262320` | 次级面（卡片、hover、分隔面板） |
| `paper.soft` | `#211e1c` | 更浅的次级面 |
| `ink` | `#f2efe9` | 主文字（暖白） |
| `ink.soft` | `#d8d3cb` | 次要文字 |
| `ink.muted` | `#a8a29a` | 三级文字 |
| `ink.faint` | `#8f8a82` | 弱文字 / 禁用 |
| `line` | `#2e2b27` | 发丝分隔线 |
| `line.strong` | `#3f3b36` | 强调分隔线 / 滚动条 |
| `accent` | `#d6b88f` | 信号色（链接、激活、品牌、高影响） |
| `accent.deep` | `#e5cfa7` | 亮一档（hover 标题） |
| `accent.soft` | `#2a241d` | 信号色深底（标签、横幅） |

深色是唯一模式（`color-scheme: dark`，无条件、不跟随系统）。信号色 = 香槟金（#d6b88f，暖调低饱和、高级感，像专柜金属光泽），只承担「强调 / 重要性」这一种含义；中/低影响用中性灰 + 文字标签区分，避免一色多义。按钮/徽标上的反色文字用 `text-paper`（= 背景色）。

## Typography

- **无衬线（UI / 扫描 / 数字）**：系统 `-apple-system`（Mac 上渲染为 SF Pro）。用于正文、标签、导航、数字、按钮。
- **衬线（阅读时刻）**：系统 `New York`，回退 `Georgia`。用于品牌字标 `beautytrend`、日期大标题、所有区块标题、以及「本周 3 件事」的导读序号与正文。正文与标签仍用无衬线。
- 数字（日期范围、条数、期号）用等宽数字 `.tnum`（`font-variant-numeric: tabular-nums`）。
- 中文类别标签**不用** `uppercase` / `tracking-wider`（对中文无效），改用小号 `font-semibold text-accent`。

## Component language

- **卡片 / 行**：圆角 `rounded-xl`（1rem），无重边框，靠 `paper.tint` 浅底和 `divide-line` 分隔；hover 用 `hover:bg-paper-tint`。
- **分区标题**：左侧一根 4×20px 的 accent 圆角竖条（`h-5 w-1 rounded-full bg-accent`）+ 衬线 `font-serif text-lg font-semibold`，替代 emoji 图标。
- **按钮**：胶囊形 `rounded-full`，主按钮 `bg-accent text-paper`（玫瑰金实底 + 深色字），次按钮 `border border-line`；高度 `h-11`（44px，触控目标）。
- **标签**：胶囊 `rounded-full px-2`；影响等级用 `bg-accent-soft text-accent-deep`（高）或 `bg-paper-tint text-ink-muted/faint`（中/低）。
- **图标**：内联 SVG，统一 `strokeWidth 1.5`、圆角线帽；不出现 emoji 或 Unicode 箭头当图标。
- **焦点**：全局 `:focus-visible` 用 `ring-2 ring-accent/50` + offset；所有可交互元素可键盘聚焦。
- **筛选**：`<details>` 折叠（激活时 `open`），激活筛选以 chip 展示 + 计数徽标 + 全部清除。

## Motion

克制：仅卡片箭头 hover 时轻微右移（`translate-x-0.5`）、标题 hover 变 `accent.deep`、筛选箭头展开时旋转。无装饰性动效。

## States

- hover：`bg-paper-tint` + 标题 `text-accent-deep` + 箭头右移。
- disabled（周切换到头）：`text-ink-faint` + `aria-disabled`，非可点元素。
- empty：政策空 = 「本周各国无重大进入政策变化」；市场筛选空 = 「没有符合筛选条件的市场动态」。
- sample：顶部 `accent-soft` 横幅（不再逐条加「示例」小标签）。

## 范围

已落地：首页（周视图）+ 全局 token / 页头页脚。详情页与周刊页做了最小 token 换色保证可读，但未做完整重做。

## 布局（2026-09-30 更新）

首页为**单栏**：本周 3 件事 → 筛选 → 进入政策 → 市场动态，纵向排布。外层 `max-w-content` 加宽到 **67.5rem（约 1080px）**。进入政策、市场动态两个区块可折叠（默认展开）；市场动态内每个国家分组可折叠（越南默认展开、其他收起，收起显示「国旗 国家名 · N 条」）。分区统一 `space-y-10`，页边距 `py-8 sm:py-10`，列表行高 `py-3`。筛选字段用 `flex-1` 撑满整行宽度。

## 状态（2026-09-30）

首页已完成一轮美化：

1. ✅ 内容加宽到约 1080px（`max-w-content: 67.5rem`）。
2. ✅ 字体统一：日期大标题 + 区块标题用衬线，正文/标签用无衬线。
3. ✅ 强调色换成香槟金 `#d6b88f`（玫瑰/豆沙偏粉仍不够高级，改为暖调香槟金）。
4. ✅ 本周 3 件事可点击进详情页（右侧箭头）；政策条目加国旗国家名；筛选命中自动展开国家分组；导航高亮当前页；筛选栏上移到本周 3 件事与进入政策之间；去掉逐条「示例」标签。
