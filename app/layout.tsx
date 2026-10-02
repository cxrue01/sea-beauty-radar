import type { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { NEWSLETTER_NAME, SITE_NAME, SITE_SUBTITLE } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  title: `${SITE_NAME} — ${SITE_SUBTITLE}`,
  description:
    '每周自动抓取东南亚 6 国当地语言的美妆新闻，AI 筛选、分类并翻译成中文，做成商业情报 Dashboard 和每周邮件周刊。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <header className="sticky top-0 z-40 border-b border-line bg-paper/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-content items-center justify-between gap-4 px-6">
            <Link href="/" className="flex items-baseline gap-2.5">
              <span className="font-serif text-lg font-semibold tracking-tight text-ink">
                {SITE_NAME}
              </span>
              <span className="hidden text-sm text-ink-muted sm:inline">{SITE_SUBTITLE}</span>
            </Link>
            <Nav />
          </div>
        </header>

        <main>{children}</main>

        <footer className="mt-24 border-t border-line">
          <div className="mx-auto flex max-w-content flex-col gap-2 px-6 py-10 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-ink-muted">
              {NEWSLETTER_NAME} · {SITE_SUBTITLE}
            </p>
            <p className="text-ink-faint">
              数据来自 Google News 与公开媒体，AI 生成的摘要与解读仅供参考，请自行核实后再决策。
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
