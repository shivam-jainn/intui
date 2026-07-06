'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container, Text } from '@mantine/core';
import { motion, useAnimation, useInView } from 'framer-motion';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import styles from './Landing.module.css';

const FEATURES = [
  {
    title: 'P0 Incidents',
    description:
      'LLD+DSA timed incident response simulation. Hone your production debugging skills in a high-pressure "War Room" environment.',
    gradient: `linear-gradient(135deg, var(--primary-red) 0%, var(--blood-dark) 100%)`,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    title: 'DSA Questions',
    description:
      'Master Data Structures and Algorithms through curated, pattern-based questions. Build intuition to perform flawlessly under interview pressure.',
    gradient: `linear-gradient(135deg, var(--primary-orange) 0%, var(--primary-red) 100%)`,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
        <path d="M20 3H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5-2.5zM19 17H5v-1c0-1 4-2 5-2h4c1 0 5 1 5 2v1z" />
      </svg>
    ),
  },
  {
    title: 'Mixer Mode (Hardcore)',
    description:
      'A timed gauntlet mixing Easy, Med, and Hard tiers. High stakes: fail the SLA, and face system penalties—from a forced wallpaper change to bricking your PC.',
    gradient: `linear-gradient(135deg, #FF3D00 0%, #8A1C00 100%)`,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
      </svg>
    ),
  },
];

const STATS = [
  { value: 'P0 Sim', label: 'Incident Debugging' },
  { value: 'Pattern-based', label: 'DSA Questions' },
  { value: 'High-Stakes', label: 'Mixer Mode' },
  { value: 'Free', label: 'To get started' },
];

const DUCK_RADIUS = 250;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as any, stiffness: 200, damping: 20 },
  },
};

const Landing: React.FC = () => {
  const duckRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  
  const particlesInit = useCallback(async (engine: any) => {
    await loadSlim(engine);
  }, []);
  
  const featuresRef = useRef(null);
  const isFeaturesInView = useInView(featuresRef, { once: true, margin: "-100px" });
  const featuresControls = useAnimation();

  useEffect(() => {
    if (isFeaturesInView) {
      featuresControls.start('visible');
    }
  }, [isFeaturesInView, featuresControls]);

  const scrollToFeatures = () => {
    document.getElementById('whyus')?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Only run mouse effect on desktop
    if (window.innerWidth < 768) return; 

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
        const mx = (dx / dist) * 40;
        const my = (dy / dist) * 40;
        const rotX = (dy / dist) * 20;
        const rotY = -(dx / dist) * 20;
        duck.style.transform = `translate(${-mx}px, ${-my}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.1)`;
        duck.style.filter = `drop-shadow(0 20px 40px rgba(230, 30, 30, 0.4))`;
      } else {
        duck.style.transform = 'translate(0px, 0px) rotateX(0deg) rotateY(0deg) scale(1)';
        duck.style.filter = `drop-shadow(0 15px 25px rgba(0, 0, 0, 0.8))`;
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className={styles.pageWrapper}>
      {/* Global Grain Overlay */}
      <div className={styles.noiseOverlay} />

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className={styles.heroSection}>
        <Particles
          id="ember-particles"
          className={styles.particlesContainer}
          // @ts-ignore
          init={particlesInit}
          options={{
            background: { color: { value: "transparent" } },
            fpsLimit: 60,
            particles: {
              color: { value: ["#E61E1E", "#FF5A00", "#660000"] }, 
              move: {
                direction: "top",
                enable: true,
                outModes: { default: "out" },
                random: true,
                speed: 1,
                straight: false,
              },
              number: { density: { enable: true, width: 800, height: 800 }, value: 60 },
              opacity: { animation: { enable: true, speed: 1, sync: false }, value: { min: 0.2, max: 0.8 } },
              shape: { type: "circle" },
              size: { value: { min: 1, max: 4 }, animation: { enable: true, speed: 2, sync: false } },
            },
            detectRetina: true,
          }}
        />

        <div className={styles.glowLeft} />
        <div className={styles.glowRight} />

        <Container size="lg" className={styles.heroContentContainer}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={styles.badge}>
            <span className={styles.badgeDot} />
            SYSTEM OFFLINE OR ASCEND
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.1, type: "spring" }}
            className={styles.heroTitle}
          >
            INTUI
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={styles.heroSubtitle}>
            Master production debugging . Debug P0 incidents . Survive the Mixers.
          </motion.p>
        </Container>

        {/* 3D Asset Floating Wrapper */}
        <motion.div animate={{ y: [0, -25, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} className={styles.duckFloatWrapper}>
          <div ref={duckRef} className={styles.hero3DAsset} />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className={styles.ctaRow}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => router.push('/signup')} type="button" className={styles.btnPrimary}>
            Enter the Fire
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={scrollToFeatures} type="button" className={styles.btnGhost}>
            Why Intui?
          </motion.button>
        </motion.div>
      </section>

      {/* ── Emergency Marquee Banner ──────────────────────── */}
      <div className={styles.marqueeContainer}>
        <div className={styles.marqueeTrack}>
          {Array(4).fill(0).map((_, i) => (
            <span key={i} className={styles.marqueeText}>
              // P0 INCIDENT DETECTED // SLA BREACH IMMINENT // NO SAFETY NETS 
            </span>
          ))}
        </div>
      </div>

      {/* ── Stats strip ───────────────────────────────────── */}
      <div className={styles.statsStrip}>
        <Container size="lg">
          <div className={styles.statsRow}>
            {STATS.map((stat, i) => (
              <React.Fragment key={stat.label}>
                {i > 0 && <div className={styles.statDivider} />}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className={styles.statItem}>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span className={styles.statLabel}>{stat.label}</span>
                </motion.div>
              </React.Fragment>
            ))}
          </div>
        </Container>
      </div>

      {/* ── Features ──────────────────────────────────────── */}
      <section id="whyus" ref={featuresRef} className={styles.featuresSection}>
        <Container size="lg">
          <Box mb={72} style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
            <motion.div variants={containerVariants} initial="hidden" animate={featuresControls}>
              <motion.div variants={itemVariants}>
                <Text className={styles.sectionEyebrow}>The Arsenal</Text>
              </motion.div>
              <motion.div variants={itemVariants}>
                <Text component="h2" className={styles.sectionTitle}>BUILT DIFFERENT.</Text>
              </motion.div>
              <motion.div variants={itemVariants}>
                <Text className={styles.sectionSubtitle}>Train your intuition or risk your system uptime. No safety nets.</Text>
              </motion.div>
            </motion.div>
          </Box>

          <motion.div className={styles.bentoGrid} variants={containerVariants} initial="hidden" animate={featuresControls}>
            {FEATURES.map((f) => (
              <motion.div key={f.title} variants={itemVariants} whileHover={{ y: -10, borderColor: 'var(--primary-red)' }} whileTap={{ scale: 0.98 }} className={styles.featureCard}>
                <div className={styles.featureIconWrapper} style={{ background: f.gradient }}>
                  {f.icon}
                </div>
                <Text fw={800} size="xl" className={styles.featureTitle} mb={8}>{f.title}</Text>
                <Text size="md" className={styles.featureDesc}>{f.description}</Text>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className={styles.footerSection}>
        <div className={styles.footerGlowDivider} />
        
        <Container size="xl" className={styles.footerContainer}>
          <div className={styles.footerLayout}>
            
            {/* Left Side: Links & Text */}
            <div className={styles.footerLeft}>
              <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={styles.footerHeadline}>
                SURVIVE<br/>
                <span className={styles.textOutline}>THE FIRE.</span>
              </motion.h2>

              <div className={styles.footerLinksGrid}>
                <div className={styles.footerCol}>
                  <h4>Platform</h4>
                  <a href="/p0">P0 War Room</a>
                  <a href="/">DSA Patterns</a>
                </div>
                <div className={styles.footerCol}>
                  <h4>Legal</h4>
                  <a href="#">Privacy Policy</a>
                  <a href="#">Terms of Service</a>
                </div>
              </div>
            </div>

            {/* Right Side: P0 Terminal Monitor */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className={styles.p0GlassyCard}>
              <div className={styles.glassyHeader}>
                <div className={styles.glassyTitle}>
                  <span className={styles.statusDotRed} />
                  P0_INCIDENT_MONITOR
                </div>
                <div className={styles.glassyTime}>SLA: 04:12:59</div>
              </div>
              
              <div className={styles.glassyBody}>
                <p className={styles.terminalText}>
                  <span className={styles.terminalMuted}>&gt; Analyzing cluster...</span><br/>
                  <span className={styles.terminalMuted}>&gt; Memory leak detected in us-east-1.</span><br/>
                  <span className={styles.terminalAlert}>&gt; FATAL ERROR: UPTIME COMPROMISED.</span><br/>
                  <span className={styles.terminalCursor}>_</span>
                </p>
              </div>

              <div className={styles.glassyFooter}>
                <motion.button 
                  whileHover={{ backgroundColor: 'var(--primary-orange)' }} 
                  whileTap={{ scale: 0.95 }} 
                  onClick={() => router.push('/signup')} 
                  type="button" 
                  className={styles.btnSecondary}
                >
                  INITIATE SEQUENCE
                </motion.button>
              </div>
            </motion.div>

          </div>
        </Container>

        {/* Massive Brand Edge-to-Edge */}
        <div className={styles.massiveFooterBrandWrapper}>
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ delay: 0.3, duration: 0.8 }} 
            className={styles.massiveFooterBrand}
          >
            INTUI
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;