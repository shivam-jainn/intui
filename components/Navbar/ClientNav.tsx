'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useCachedSession } from '@/lib/hooks/useSession';
import Intui from './Intui';
import Profile from './Profile';
import classes from './Navbar.module.css';
import Timer from '@/components/Timer/Timer';
import { useTimerContext } from '@/components/Timer/TimerContext';
import { useQuery } from '@tanstack/react-query';
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

  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const res = await fetch('/api/user/profile');
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Profile Fetch Error:", errorText);
        throw new Error('Failed to fetch profile: ' + errorText);
      }
      return res.json();
    },
    enabled: isLoggedIn,
  });

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
            }}
          >
            {/* Auth Section */}
            <div className={classes.desktopAuthContainer}>
              {isPending ? (
                <div className="pixel-border animate-pulse" style={{ height: 32, width: 120, background: 'var(--surface-default)' }} />
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
