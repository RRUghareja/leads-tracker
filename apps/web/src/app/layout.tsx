import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ROUTES } from '@/constants/constants';
import { MESSAGES } from '@/constants/messages';
import './globals.css';

export const metadata: Metadata = {
  title: { default: MESSAGES.APP.TITLE, template: `%s | ${MESSAGES.APP.TITLE}` },
  description: MESSAGES.APP.DESCRIPTION,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container site-header__inner">
            <Link href={ROUTES.LEADS} className="brand">
              <span className="brand__mark" aria-hidden="true" />
              {MESSAGES.APP.TITLE}
            </Link>
            <nav className="site-nav" aria-label={MESSAGES.APP.MAIN_NAV_LABEL}>
              <Link href={ROUTES.LEADS}>{MESSAGES.APP.NAV_LEADS}</Link>
              <Link href={ROUTES.NEW_LEAD} className="btn">
                {MESSAGES.APP.NAV_NEW_LEAD}
              </Link>
            </nav>
          </div>
        </header>
        <main className="container page">{children}</main>
      </body>
    </html>
  );
}
