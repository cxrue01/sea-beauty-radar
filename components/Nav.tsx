'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: '首页', match: (p: string) => p === '/' || p.startsWith('/week/') },
  { href: '/overview', label: '总览', match: (p: string) => p === '/overview' },
  { href: '/newsletter', label: '往期周刊', match: (p: string) => p.startsWith('/newsletter') },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 text-sm">
      {LINKS.map((l) => {
        const active = l.match(pathname);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? 'page' : undefined}
            className={`rounded-full px-3.5 py-1.5 transition-colors ${
              active ? 'bg-paper-tint text-ink' : 'text-ink-muted hover:bg-paper-tint hover:text-ink'
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
