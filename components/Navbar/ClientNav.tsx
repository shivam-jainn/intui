'use client';

import { Skeleton } from '@mantine/core';
import Intui from './Intui';
import classes from './Navbar.module.css';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import React from 'react';
import Profile from './Profile';

interface ClientNavbarProps {
  initialSession: any;
}

export default function ClientNavbar({ initialSession }: ClientNavbarProps) {
  const router = useRouter();
  const { data, isPending } = useSession();

  const currentSession = isPending ? initialSession : data;
  const isLoggedIn = currentSession?.user != null;

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
              color: '#fff',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <Intui />
          </a>

          {/* Desktop auth / profile — flex-grow pushes it right */}
          <div style={{ flex: 1 }} />
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
                <Skeleton height={32} width={120} radius="xl" />
              ) : isLoggedIn ? (
                <Profile avatar={currentSession.user.image} />
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className={classes.btnLogin}
                    onClick={() => router.push('/signin')}
                  >
                    Log in
                  </button>
                  <button
                    type="button"
                    className={classes.btnSignup}
                    onClick={() => router.push('/signup')}
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