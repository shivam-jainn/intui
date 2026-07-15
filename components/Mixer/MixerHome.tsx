'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconArrowRight, IconTerminal2, IconAlertOctagon } from '@tabler/icons-react';
import { Center, Container, Group, Stack, Text, Title, SimpleGrid } from '@mantine/core';
import { motion } from 'framer-motion';
import {
  Difficulty,
  DIFFICULTY_VALUES,
  DSA_GENRES,
  type GenreConfig,
} from '@/lib/common/types/question.types';
import { useQuestions } from '@/lib/hooks/useQuestions';
import type { Question } from '@/lib/hooks/useQuestions';
import { useIncidents } from '@/lib/hooks/useIncidents';
import { useUserProfile } from '@/lib/hooks/useSession';
import { colors } from '@/lib/theme/colors';
import { DuckBadge } from '../DuckBadge';
import { BadgeType } from '@prisma/client';
import styles from './MixerHome.module.css';

function matchesGenre(question: Question, genre: GenreConfig) {
  const topicValues = question.topics.map((t) => t.topic.name.toLowerCase());
  return genre.patterns.some((p) => topicValues.some((v) => v.includes(p)));
}

// Map difficulty to our custom brutalist palette
const getDifficultyClass = (diff: Difficulty) => {
  switch (diff.toLowerCase()) {
    case 'easy': return styles.diffEasy;
    case 'medium': return styles.diffMedium;
    case 'hard': return styles.diffHard;
    default: return styles.diffEasy;
  }
};

// Framer Motion Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: 'spring' as any, stiffness: 200, damping: 20 } 
  },
};

export default function MixerHome() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'questions' | 'incidents'>('incidents');
  const { data: questionsData, isLoading: loading, error } = useQuestions();
  const { data: incidentsData, isLoading: loadingIncidents, error: incidentsError } = useIncidents();

  const questions = React.useMemo(
    () => (Array.isArray(questionsData) ? questionsData : []),
    [questionsData]
  );

  const incidents = React.useMemo(() => incidentsData ?? [], [incidentsData]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'questions') {
        setActiveTab('questions');
      }
    }
  }, []);
  
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty | null>(null);

  const [activeP0Service, setActiveP0Service] = useState<string | null>(null);
  const [activeP0Severity, setActiveP0Severity] = useState<string | null>(null);
  const [activeP0Difficulty, setActiveP0Difficulty] = useState<Difficulty | null>(null);

  const p0Services = useMemo(() => {
    const set = new Set(incidents.map((inc) => inc.service));
    return Array.from(set);
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (activeP0Service && inc.service !== activeP0Service) return false;
      if (activeP0Severity && inc.severity !== activeP0Severity) return false;
      if (activeP0Difficulty && inc.difficulty !== activeP0Difficulty) return false;
      return true;
    });
  }, [incidents, activeP0Service, activeP0Severity, activeP0Difficulty]);

  const episodes = useMemo(() => {
    return [...questions].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [questions]);

  const featuredEpisode = episodes[0];

  const difficultyFiltered = useMemo(() => {
    if (!activeDifficulty) return episodes;
    return episodes.filter((q) => q.difficulty === activeDifficulty);
  }, [episodes, activeDifficulty]);

  const genreRails = useMemo(() => {
    const source = difficultyFiltered;

    let rails = DSA_GENRES.map((genre) => ({
      ...genre,
      episodes: source.filter((q) => matchesGenre(q, genre)),
    })).filter((rail) => rail.episodes.length > 0);

    if (activeGenre) {
      rails = rails.filter((rail) => rail.id === activeGenre);
    }

    const usedSlugs = new Set(rails.flatMap((rail) => rail.episodes.map((q) => q.slug)));
    const uncategorized = source.filter((q) => !usedSlugs.has(q.slug));

    if (uncategorized.length > 0 && !activeGenre) {
      rails.push({
        id: 'uncategorized',
        label: 'Mixed Concepts',
        patterns: [],
        episodes: uncategorized,
      });
    }

    return rails;
  }, [difficultyFiltered, activeGenre]);

  const { data: profileData } = useUserProfile();

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.noiseOverlay} />
      <div className={styles.scanlineOverlay} />

      <Container size="xl" className={styles.mainContainer}>
        {loading ? (
          <Center py={100}>
            <div className="pixel-skeleton" style={{ padding: '20px 40px' }}>
              <Text className="pixel-font" style={{ color: 'var(--primary-red)' }}>LOADING DATABANKS...</Text>
            </div>
          </Center>
        ) : error ? (
          <div className={`pixel-border ${styles.errorBox}`}>
            <Text className="pixel-font">FATAL ERROR: {(error as Error)?.message}</Text>
          </div>
        ) : episodes.length === 0 ? (
          <div className={`pixel-border ${styles.emptyBox}`}>
            <Text c="dimmed" className="pixel-font">SYSTEM EMPTY. SEED INCIDENTS TO BEGIN.</Text>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible"
          >
            <Stack gap={24}>
              {/* ── User Progress Header (Sleek Inline Status) ── */}
              {profileData && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.85, paddingBottom: 4 }}>
                  <Text className="pixel-font" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    &gt; OPERATIVE STATUS: <span style={{ color: 'var(--primary-orange)' }}>ACTIVE</span>
                  </Text>
                  {profileData.badges && profileData.badges.length > 0 && (
                    <Group gap="xs">
                      {profileData.badges.map((b: any) => (
                        <DuckBadge key={b.badgeType} badgeType={b.badgeType as BadgeType} size={24} />
                      ))}
                    </Group>
                  )}
                </div>
              )}

              {/* ── Tab Switcher (Minimal) ── */}
              <div className={styles.tabContainer}>
                <button
                  type="button"
                  onClick={() => setActiveTab('incidents')}
                  className={`${styles.tabBtn} ${activeTab === 'incidents' ? styles.tabActive : ''}`}
                >
                  <span className={styles.statusDotBlink} style={{ width: 6, height: 6, display: 'inline-block' }} />
                  COMMAND CENTER (P0)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('questions')}
                  className={`${styles.tabBtn} ${activeTab === 'questions' ? styles.tabActive : ''}`}
                >
                  <IconTerminal2 size={16} />
                  DSA PRACTICE
                </button>
              </div>

              {/* ── DSA Questions Tab ── */}
              {activeTab === 'questions' && (
                <>
                  {/* Featured System Anomaly Alert Banner */}
                  {featuredEpisode && (
                    <motion.div
                      variants={itemVariants}
                      className={styles.alertBanner}
                      onClick={() => router.push(`/${featuredEpisode.slug}`)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <IconAlertOctagon size={18} className={styles.alertIcon} />
                        <span className="pixel-font" style={{ fontSize: 11, letterSpacing: '0.05em' }}>
                          <strong>ANOMALY DETECTED:</strong> #{featuredEpisode.displayOrder} - {featuredEpisode.name.toUpperCase()}
                        </span>
                      </div>
                      <button className={`pixel-font ${styles.alertBtn}`}>
                        DEBUG <IconArrowRight size={14} />
                      </button>
                    </motion.div>
                  )}

                  {/* System Filters (Inline Pills) */}
                  <motion.div variants={itemVariants} className={styles.filterRow}>
                    <div className={styles.filterInlineGroup}>
                      <span className={`pixel-font ${styles.filterGroupLabel}`}>PATTERN</span>
                      <div className={styles.filterBtnContainer}>
                        <button
                          className={`pixel-font ${styles.filterPill} ${activeGenre === null ? styles.filterPillActive : ''}`}
                          onClick={() => setActiveGenre(null)}
                        >
                          ALL
                        </button>
                        {DSA_GENRES.map((genre) => (
                          <button
                            key={genre.id}
                            className={`pixel-font ${styles.filterPill} ${activeGenre === genre.id ? styles.filterPillActive : ''}`}
                            onClick={() => setActiveGenre(activeGenre === genre.id ? null : genre.id)}
                          >
                            {genre.label.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.filterInlineGroup}>
                      <span className={`pixel-font ${styles.filterGroupLabel}`}>THREAT LEVEL</span>
                      <div className={styles.filterBtnContainer}>
                        <button
                          className={`pixel-font ${styles.filterPill} ${activeDifficulty === null ? styles.filterPillActive : ''}`}
                          onClick={() => setActiveDifficulty(null)}
                        >
                          ALL
                        </button>
                        {DIFFICULTY_VALUES.map((d) => (
                          <button
                            key={d}
                            className={`pixel-font ${styles.filterPill} ${activeDifficulty === d ? styles.filterPillActive : ''}`}
                            onClick={() => setActiveDifficulty(activeDifficulty === d ? null : d)}
                          >
                            {d.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {/* Incident Rails */}
                  {genreRails.map((rail) => (
                    <motion.section key={rail.id} variants={itemVariants} className={styles.railSection}>
                      <Group justify="space-between" mb={12} align="baseline">
                        <Text className={`pixel-font ${styles.railTitle}`}>
                          &gt; DIR / {rail.label.toUpperCase()}
                        </Text>
                        <Text className={`pixel-font ${styles.railCount}`}>
                          [{rail.episodes.length}]
                        </Text>
                      </Group>

                      <div className={styles.railScrollContainer}>
                        {rail.episodes.map((q) => (
                          <div
                            key={q.slug}
                            className={styles.questionCard}
                            onClick={() => router.push(`/${q.slug}`)}
                          >
                            <Group justify="space-between" mb={8}>
                              <Text className={`pixel-font ${styles.cardOrder}`}>#{q.displayOrder}</Text>
                              <span className={`pixel-font ${styles.cardDifficulty} ${getDifficultyClass(q.difficulty)}`}>
                                {q.difficulty.toUpperCase()}
                              </span>
                            </Group>

                            <Text className={`pixel-font ${styles.cardName}`} lineClamp={1}>
                              {q.name}
                            </Text>

                            <div className={styles.cardTags}>
                              {q.topics.slice(0, 2).map((topic) => (
                                <span key={topic.topic.name} className={`pixel-font ${styles.tagMicro}`}>
                                  {topic.topic.name.toUpperCase()}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.section>
                  ))}
                </>
              )}

              {/* ── Command Center P0 Tab ── */}
              {activeTab === 'incidents' && (
                <motion.div variants={itemVariants}>
                  <Stack gap={20}>
                    {/* Inline P0 Filters */}
                    <div className={styles.filterRow}>
                      {p0Services.length > 0 && (
                        <div className={styles.filterInlineGroup}>
                          <span className={`pixel-font ${styles.filterGroupLabel}`}>SERVICE</span>
                          <div className={styles.filterBtnContainer}>
                            <button
                              className={`pixel-font ${styles.filterPill} ${activeP0Service === null ? styles.filterPillActive : ''}`}
                              onClick={() => setActiveP0Service(null)}
                            >
                              ALL
                            </button>
                            {p0Services.map((s) => (
                              <button
                                key={s}
                                className={`pixel-font ${styles.filterPill} ${activeP0Service === s ? styles.filterPillActive : ''}`}
                                onClick={() => setActiveP0Service(activeP0Service === s ? null : s)}
                              >
                                {s.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className={styles.filterInlineGroup}>
                        <span className={`pixel-font ${styles.filterGroupLabel}`}>THREAT LEVEL</span>
                        <div className={styles.filterBtnContainer}>
                          <button
                            className={`pixel-font ${styles.filterPill} ${activeP0Difficulty === null ? styles.filterPillActive : ''}`}
                            onClick={() => setActiveP0Difficulty(null)}
                          >
                            ALL
                          </button>
                          {DIFFICULTY_VALUES.map((d) => (
                            <button
                              key={d}
                              className={`pixel-font ${styles.filterPill} ${activeP0Difficulty === d ? styles.filterPillActive : ''}`}
                              onClick={() => setActiveP0Difficulty(activeP0Difficulty === d ? null : d)}
                            >
                              {d.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className={styles.filterInlineGroup}>
                        <span className={`pixel-font ${styles.filterGroupLabel}`}>SEVERITY</span>
                        <div className={styles.filterBtnContainer}>
                          <button
                            className={`pixel-font ${styles.filterPill} ${activeP0Severity === null ? styles.filterPillActive : ''}`}
                            onClick={() => setActiveP0Severity(null)}
                          >
                            ALL
                          </button>
                          {['SEV0', 'SEV1', 'SEV2'].map((sev) => (
                            <button
                              key={sev}
                              className={`pixel-font ${styles.filterPill} ${activeP0Severity === sev ? styles.filterPillActive : ''}`}
                              onClick={() => setActiveP0Severity(activeP0Severity === sev ? null : sev)}
                            >
                              {sev}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {loadingIncidents ? (
                      <Center py={60}>
                        <div className="pixel-skeleton" style={{ padding: '20px 40px' }}>
                          <Text className="pixel-font" style={{ color: 'var(--primary-red)' }}>RETRIEVING LIVE TELEMETRY...</Text>
                        </div>
                      </Center>
                    ) : incidentsError ? (
                      <div className={`pixel-border ${styles.errorBox}`}>
                        <Text className="pixel-font">FAILED TO CONNECT TO SERVER: {(incidentsError as Error)?.message}</Text>
                      </div>
                    ) : filteredIncidents.length === 0 ? (
                      <div className={`pixel-border ${styles.emptyBox}`}>
                        <Text c="dimmed" className="pixel-font">NO INCIDENTS MATCH FILTER PARAMETERS.</Text>
                      </div>
                    ) : (
                      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={16}>
                        {filteredIncidents.map((incident) => {
                          const difficultyColor: Record<string, string> = {
                            Easy: colors.success[500],
                            Medium: colors.warning[500],
                            Hard: colors.danger[500],
                          };
                          const cardDiffColor = difficultyColor[incident.difficulty] ?? colors.text.secondary;

                          return (
                            <div
                              key={incident.id}
                              onClick={() => router.push(`/p0/${incident.slug}`)}
                              className={styles.incidentCard}
                            >
                              <div className={styles.incidentCardHeader}>
                                <span className={styles.severityBadge}>
                                  {incident.severity}
                                </span>
                                <span
                                  className="pixel-font"
                                  style={{
                                    padding: '4px 8px',
                                    background: 'var(--surface-default)',
                                    border: `1px solid var(--border-default)`,
                                    color: cardDiffColor,
                                    fontSize: 8,
                                  }}
                                >
                                  {incident.difficulty}
                                </span>
                                <div style={{ flex: 1 }} />
                                <span className="pixel-font" style={{ fontSize: 8, color: 'var(--text-muted)' }}>
                                  INC-{String(incident.id).padStart(3, '0')}
                                </span>
                              </div>

                              <Text className={`pixel-font ${styles.incidentTitle}`}>
                                {incident.title}
                              </Text>

                              <p className={styles.incidentSummary}>
                                {incident.summary}
                              </p>

                              <div className={styles.incidentFooter}>
                                <span className="pixel-font" style={{ fontSize: 9, color: 'var(--text-secondary)' }}>
                                  &gt; {incident.service}
                                </span>
                                <span className="pixel-font" style={{ fontSize: 9, color: 'var(--primary-red)', fontWeight: 'bold' }}>
                                  SLA {incident.slaMinutes}m
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </SimpleGrid>
                    )}
                  </Stack>
                </motion.div>
              )}
            </Stack>
          </motion.div>
        )}
      </Container>
    </div>
  );
}