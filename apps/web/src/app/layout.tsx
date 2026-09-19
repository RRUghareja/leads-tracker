import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { SignOutButton } from '@/components/SignOutButton';
import { ROUTES } from '@/constants/constants';
import { MESSAGES } from '@/constants/messages';
import { readPortalAuth } from '@/lib/portal-auth';
import { isSignedIn } from '@/lib/session-server';
import './globals.css';

export const metadata: Metadata = {
  title: { default: MESSAGES.APP.TITLE, template: `%s | ${MESSAGES.APP.TITLE}` },
  description: MESSAGES.APP.DESCRIPTION,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // "Sign out" only makes sense when there is a login and you are signed in to it.
  const auth = readPortalAuth();
  const showSignOut = auth.mode === 'on' && (await isSignedIn(auth));

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
              {showSignOut && <SignOutButton />}
            </nav>
          </div>
        </header>
        <main className="container page">{children}</main>
      </body>
    </html>
  );
}
