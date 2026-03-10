'use client';

import React, { Fragment, useEffect, useRef } from 'react';
import { Text, Box, Container } from '@mantine/core';
import { useRouter } from 'next/navigation';
import styles from './Landing.module.css';

const FEATURES = [
  {
    title: 'Socratic Learning',
    description:
      'Our AI guides you with questions instead of answers — helping you genuinely internalize concepts and perform confidently under real interview pressure.',
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
    wide: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
        <path d="M20 3H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM19 17H5v-1c0-1 4-2 5-2h4c1 0 5 1 5 2v1z" />
      </svg>
    ),
  },
  {
    title: 'Verified Badges',
    description:
      'Earn verifiable skill badges via Badgepa.cc that prove your readiness to employers.',
    gradient: 'linear-gradient(135deg, #4ECDC4 0%, #556270 100%)',
    wide: false,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L9 13.17l6.59-6.59L17 8l-7 7z" />
      </svg>
    ),
  },
  {
    title: 'Contests & Bounties',
    description:
      'Join employer-sponsored challenges and fast-track your path to an offer.',
    gradient: 'linear-gradient(135deg, #4CB8C4 0%, #3CD3AD 100%)',
    wide: false,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
      </svg>
    ),
  },
];

const STATS = [
  { value: '500+', label: 'Practice problems' },
  { value: 'AI-guided', label: 'Hints & explanations' },
  { value: 'Verifiable', label: 'Skill badges' },
  { value: 'Free', label: 'To get started' },
];

const DUCK_RADIUS = 200;

const Landing: React.FC = () => {
  const duckRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const scrollToFeatures = () => {
    document.getElementById('whyus')?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const duck = duckRef.current;
      if (!duck) return;
      const rect = duck.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < DUCK_RADIUS) {
        const mx = (dx / dist) * 30;
        const my = (dy / dist) * 30;
        duck.style.transform = `translate(${-mx}px, ${-my}px) rotate(30deg)`;
      } else {
        duck.style.transform = 'rotate(30deg)';
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────── */}
      <section
        style={{
          background: '#000',
          height: 'calc(100vh - 80px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Colorful ambient glows */}
        <div className={styles.glowLeft} />
        <div className={styles.glowRight} />

        {/* Badge + title + subtitle */}
        <Container
          size="lg"
          style={{ width: '100%', textAlign: 'center', paddingTop: '3rem', zIndex: 2 }}
        >
          <div className={styles.badge}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#4ECDC4',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            AI-powered interview prep
          </div>
          <h1 className={styles.heroTitle}>Intui</h1>

          <p className={styles.heroSubtitle}>
            Your rubber duck for interview prep
          </p>
        </Container>

        {/* Duck — outer wrapper owns float animation; inner ref owns repel */}
        <div className={styles.duckFloat} style={{ zIndex: 1 }}>
          <div
            ref={duckRef}
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: 'url(/prismduck.png)',
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              transform: 'rotate(30deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </div>

        {/* CTA buttons */}
        <div className={styles.ctaRow}>
          <button
            onClick={() => router.push('/signup')}
            type="button"
            className={styles.btnPrimary}
          >
            Get Started
          </button>
          <button
            onClick={scrollToFeatures}
            type="button"
            className={styles.btnGhost}
          >
            Why Intui?
          </button>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={scrollToFeatures}
          type="button"
          className={styles.scrollArrow}
          aria-label="Scroll to features"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </section>

      {/* ── Stats strip ───────────────────────────────────── */}
      <div
        style={{
          background: '#000',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '1.35rem 0',
        }}
      >
        <Container size="lg">
          <div className={styles.statsRow}>
            {STATS.map((stat, i) => (
              <Fragment key={stat.label}>
                {i > 0 && <div className={styles.statDivider} />}
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span className={styles.statLabel}>{stat.label}</span>
                </div>
              </Fragment>
            ))}
          </div>
        </Container>
      </div>

      {/* ── Features ──────────────────────────────────────── */}
      <section
        id="whyus"
        style={{
          background: '#000',
          color: '#fff',
          padding: '7rem 0',
        }}
      >
        <Container size="lg">
          <Box mb={56} style={{ textAlign: 'center' }}>
            <Text
              style={{
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.28)',
                marginBottom: '1rem',
              }}
            >
              Why choose us
            </Text>
            <Text
              component="h2"
              style={{
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1.1,
                letterSpacing: '-0.025em',
                margin: 0,
              }}
            >
              Built different.
            </Text>
            <Text
              style={{
                marginTop: '0.875rem',
                fontSize: '1rem',
                color: 'rgba(255,255,255,0.38)',
                maxWidth: '420px',
                margin: '0.875rem auto 0',
              }}
            >
              Everything you need to walk into any technical interview with confidence.
            </Text>
          </Box>

          {/* Bento grid */}
          <div className={styles.bentoGrid}>
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`${styles.featureCard} ${f.wide ? styles.wideCard : ''}`}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '11px',
                    background: f.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.25rem',
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </div>
                <Text fw={700} size="lg" c="white" mb={6}>
                  {f.title}
                </Text>
                <Text size="sm" style={{ color: 'rgba(255,255,255,0.42)', lineHeight: 1.75 }}>
                  {f.description}
                </Text>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section
        style={{
          background: '#050505',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '8rem 0',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle centre glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: '600px',
            height: '300px',
            background:
              'radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <Container size="sm" style={{ position: 'relative', zIndex: 1 }}>
          <Text
            component="h2"
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.2,
              letterSpacing: '-0.025em',
              margin: '0 0 0.875rem',
            }}
          >
            Ready to ace your next interview?
          </Text>
          <Text
            style={{
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.36)',
              marginBottom: '2.25rem',
            }}
          >
            Start practicing with Intui today — it&apos;s free.
          </Text>
          <button
            onClick={() => router.push('/signup')}
            type="button"
            className={styles.btnPrimary}
          >
            Get Started Free
          </button>
        </Container>
      </section>
    </>
  );
};

export default Landing;
