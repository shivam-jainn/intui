'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Skeleton } from '@mantine/core';
import { useCachedSession } from '@/lib/hooks/useSession';
import Intui from './Intui';
import Profile from './Profile';
import classes from './Navbar.module.css';
import Timer from '@/components/Timer/Timer';
import { useTimerContext } from '@/components/Timer/TimerContext';

interface ClientNavbarProps {
  initialSession: any;
}

export default function ClientNavbar({ initialSession }: ClientNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, isPending } = useCachedSession();
  const { timerRef } = useTimerContext();


  const isQuestionPage =
  /^\/(?!p0$)[^/]+$/.test(pathname) || /^\/p0\/[^/]+$/.test(pathname);

  const currentSession = isPending ? initialSession : data;
  const isLoggedIn = currentSession?.user != null;

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <div className={classes.root}>
        <header className={classes.header}>
          {/* Logo */}
          <a
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              color: 'var(--primary-red)',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <Intui />
          </a>

          <nav className={classes.navLinks}>
            {isLoggedIn && (
              <>
                <Link
                  href="/"
                  className={`pixel-font ${classes.link} ${isActive('/') ? classes.linkActive : ''}`}
                >
                  Home
                </Link>
                <Link
                  href="/p0"
                  className={`pixel-font ${classes.link} ${isActive('/p0') ? classes.linkActive : ''}`}
                >
                  P0
                </Link>
              </>
            )}
          </nav>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexShrink: 0,
            }}
          >
            {/* Timer */}
            {isLoggedIn && isQuestionPage && (
              <div style={{ marginRight: '64px', display: 'flex' }}>
                <Timer ref={timerRef} />
              </div>
            )}

            {/* Auth Section */}
            <div className={classes.desktopAuthContainer}>
              {isPending ? (
                <Skeleton height={32} width={120} radius="xl" />
              ) : isLoggedIn ? (
                <Profile avatar={currentSession.user.image} />
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className={`pixel-btn-ghost ${classes.mobileBtn}`}
                    onClick={() => router.push('/signin')}
                    style={{ fontSize: '0.6rem', padding: '0.5rem' }}
                  >
                    Log in
                  </button>
                  <button
                    type="button"
                    className={`pixel-btn ${classes.mobileBtn}`}
                    onClick={() => router.push('/signup')}
                    style={{ fontSize: '0.6rem', padding: '0.5rem' }}
                  >
                    Sign up
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
      </div>
    </>
  );
}
