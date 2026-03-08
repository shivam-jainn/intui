'use client';

import { Burger, Drawer, rem, ScrollArea, Skeleton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Intui from './Intui';
import classes from './Navbar.module.css';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import React from 'react';
import Profile from './Profile';

// Navbar is purely client-side now; we rely on react-query caching so the
// component stays mounted across route transitions.  no props required.

export default function ClientNavbar() {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const router = useRouter();
  const { data, isPending } = useSession();

  // react-query sometimes returns `undefined` during a refetch even though
  // previous data is cached.  that transient undefined is what causes the
  // avatar to swap to the loading skeleton on every route change.  we keep a
  // ref of the last *non-undefined* value so that temporary gaps are
  // ignored.
  const lastSession = React.useRef<typeof data>();
  if (data !== undefined) {
    // update when we have a fresh value (including `null` when logged out)
    lastSession.current = data;
  }
  const currentSession = data !== undefined ? data : lastSession.current;
  const isLoggedIn = currentSession?.user != null;

  const pathname = usePathname() || '/';
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Spacer so fixed nav doesn't overlap page content */}
      <div className={classes.spacer} />

      {/* Fixed floating pill */}
      <div className={classes.root}>
        <header className={classes.header}>
          {/* Logo */}
          <a
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              color: '#fff',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <Intui />
          </a>

          {/* Desktop nav links — centered */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
            className="visibleFromSm"
          >
            <nav
              style={{ display: 'flex', gap: '0.5rem', height: '100%', alignItems: 'center' }}
            >
              <a
                href="/"
                className={`${classes.link} ${isActive('/') ? classes.linkActive : ''}`}
              >
                Home
              </a>
              <a
                href="/questions"
                className={`${classes.link} ${isActive('/questions') ? classes.linkActive : ''}`}
              >
                Questions
              </a>
            </nav>
          </div>

          {/* Desktop auth / profile */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexShrink: 0,
            }}
          >
            {isPending && !currentSession ? (
              <Skeleton height={32} width={120} radius="xl" />
            ) : isLoggedIn ? (
              <Profile avatar={currentSession.user.image || ''} />
            ) : (
              <>
                {/* Hide on mobile */}
                <button
                  type="button"
                  className={classes.btnLogin}
                  onClick={() => router.push('/signin')}
                  style={{ display: 'var(--nav-btn-display, flex)' } as React.CSSProperties}
                >
                  Log in
                </button>
                <button
                  type="button"
                  className={classes.btnSignup}
                  onClick={() => router.push('/signup')}
                  style={{ display: 'var(--nav-btn-display, flex)' } as React.CSSProperties}
                >
                  Sign up
                </button>
              </>
            )}

            {/* Mobile burger */}
            <Burger
              opened={drawerOpened}
              onClick={toggleDrawer}
              hiddenFrom="sm"
              color="white"
              size="sm"
            />
          </div>
        </header>
      </div>

      {/* Mobile full-screen drawer */}
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="xl"
        hiddenFrom="sm"
        zIndex={1000000}
        styles={{
          content: { background: '#000' },
          header: { background: '#000' },
          close: { color: 'white' },
        }}
        withCloseButton
      >
        <ScrollArea h={`calc(100vh - ${rem(80)})`}>
          <nav style={{ paddingTop: '1rem' }}>
            <a
              href="/"
              className={`${classes.mobileLink} ${isActive('/') ? classes.mobileLinkActive : ''}`}
              onClick={closeDrawer}
            >
              Home
            </a>
            <a
              href="/questions"
              className={`${classes.mobileLink} ${isActive('/questions') ? classes.mobileLinkActive : ''}`}
              onClick={closeDrawer}
            >
              Questions
            </a>
          </nav>

          <div className={classes.mobileBtnRow}>
            {isLoggedIn ? (
              <Profile avatar={currentSession?.user?.image || ''} />
            ) : (
              <>
                <button
                  type="button"
                  className={classes.btnLogin}
                  onClick={() => { closeDrawer(); router.push('/signin'); }}
                >
                  Log in
                </button>
                <button
                  type="button"
                  className={classes.btnSignup}
                  onClick={() => { closeDrawer(); router.push('/signup'); }}
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </ScrollArea>
      </Drawer>
    </>
  );
}