'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useCachedSession, useUserProfile } from '@/lib/hooks/useSession';
import Intui from './Intui';
import Profile from './Profile';
import classes from './Navbar.module.css';
import Timer from '@/components/Timer/Timer';
import { useTimerContext } from '@/components/Timer/TimerContext';
import { Text } from '@mantine/core';

interface ClientNavbarProps {
  initialSession: any;
}

export default function ClientNavbar({ initialSession }: ClientNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, isPending } = useCachedSession();
  const { timerRef } = useTimerContext();

  const excludedRoutes = new Set([
  '/',
  '/p0',
  '/achievements',
  '/leaderboard',
  '/profile',
  '/signin',
  '/signup',
]);

const isQuestionPage =
  !excludedRoutes.has(pathname) &&
  (
    /^\/[^/]+$/.test(pathname) ||
    /^\/p0\/[^/]+$/.test(pathname)
  );


  const currentSession = isPending ? initialSession : data;
  const isLoggedIn = currentSession?.user != null;

  const { data: profileData } = useUserProfile();

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
            {isLoggedIn && isQuestionPage && (
              <Timer ref={timerRef} />
            )}
          </nav>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexShrink: 0,
              marginLeft: 'auto',
            }}
          >
            {/* Auth Section */}
            <div className={classes.desktopAuthContainer}>
              {isPending ? (
                <div className="pixel-skeleton" style={{ height: 32, width: 120 }} />
              ) : isLoggedIn ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {profileData && (
                    <div className="pixel-border" style={{ padding: '4px 8px', background: 'var(--surface-default)' }}>
                      <Text className="pixel-font" size="xs" c="var(--primary-red)" fw="bold">
                        {profileData.currentStreak} 🔥
                      </Text>
                    </div>
                  )}
                  <Profile avatar={currentSession.user.image} />
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    className="pixel-btn-ghost-sm"
                    onClick={() => router.push('/signin')}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Log in
                  </button>
                  <button
                    type="button"
                    className="pixel-btn-sm"
                    onClick={() => router.push('/signup')}
                    style={{ whiteSpace: 'nowrap' }}
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
