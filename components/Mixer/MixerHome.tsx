'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconArrowRight, IconTerminal2 } from '@tabler/icons-react';
import { Center, Container, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { motion } from 'framer-motion';
import {
  Difficulty,
  DIFFICULTY_VALUES,
  DSA_GENRES,
  type GenreConfig,
} from '@/lib/common/types/question.types';
import { useQuestions } from '@/lib/hooks/useQuestions';
import type { Question } from '@/lib/hooks/useQuestions';
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
  const { data: questionsData, isLoading: loading, error } = useQuestions();
  const questions = React.useMemo(
    () => (Array.isArray(questionsData) ? questionsData : []),
    [questionsData]
  );
  
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty | null>(null);

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

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.noiseOverlay} />
      <div className={styles.scanlineOverlay} />

      <Container size="xl" className={styles.mainContainer}>
        {loading ? (
          <Center py={100}>
            <Loader color="red" type="bars" />
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
            <Stack gap={48}>
              {/* ── Featured Hero / P0 Alert ── */}
              {featuredEpisode && (
                <motion.div variants={itemVariants} className={`pixel-border ${styles.featuredAlertBox}`}>
                  <div className={`pixel-font ${styles.alertHeader}`}>
                    <span className={styles.statusDotBlink} />
                    PRIORITY INCIDENT DETECTED
                  </div>
                  
                  <Title className={`pixel-font ${styles.featuredTitle}`}>
                    INCIDENT #{featuredEpisode.displayOrder}: {featuredEpisode.name.toUpperCase()}
                  </Title>
                  
                  <Text className={styles.featuredDesc}>
                    &gt; Target acquired. Sequence initialized. Resolve this incident to establish baseline pattern recognition before system failure. 
                  </Text>
                  
                  <Group gap={8} mb={32}>
                    <span className={`pixel-font ${styles.tagBase} ${getDifficultyClass(featuredEpisode.difficulty)}`}>
                      {featuredEpisode.difficulty.toUpperCase()}
                    </span>
                    {featuredEpisode.topics.slice(0, 4).map((topic) => (
                      <span key={topic.topic.name} className={`pixel-font ${styles.tagOutline}`}>
                        {topic.topic.name.toUpperCase()}
                      </span>
                    ))}
                  </Group>
                  
                  <Group gap={16}>
                    <button
                      onClick={() => router.push(`/${featuredEpisode.slug}`)}
                      className="pixel-btn"
                    >
                      <IconTerminal2 size={18} />
                      DEBUG INCIDENT
                    </button>
                    <button
                      onClick={() => router.push(`/${featuredEpisode.slug}`)}
                      className="pixel-btn-ghost"
                    >
                      VIEW LOGS <IconArrowRight size={18} />
                    </button>
                  </Group>
                </motion.div>
              )}

              {/* ── System Filters ── */}
              <motion.div variants={itemVariants} className={styles.filtersContainer}>
                <Group justify="space-between" align="flex-start" gap="xl">
                  {/* Genre Filter */}
                  <div className={styles.filterGroup}>
                    <Text className={`pixel-font ${styles.filterLabel}`}>[ PARAMETER: PATTERN ]</Text>
                    <Group gap={8}>
                      <button
                        className={`pixel-font ${styles.filterBtn} ${activeGenre === null ? styles.active : ''}`}
                        onClick={() => setActiveGenre(null)}
                      >
                        ALL_PATTERNS
                      </button>
                      {DSA_GENRES.map((genre) => (
                        <button
                          key={genre.id}
                          className={`pixel-font ${styles.filterBtn} ${activeGenre === genre.id ? styles.active : ''}`}
                          onClick={() => setActiveGenre(activeGenre === genre.id ? null : genre.id)}
                        >
                          {genre.label.toUpperCase()}
                        </button>
                      ))}
                    </Group>
                  </div>

                  {/* Difficulty Filter */}
                  <div className={styles.filterGroup}>
                    <Text className={`pixel-font ${styles.filterLabel}`}>[ PARAMETER: THREAT LEVEL ]</Text>
                    <Group gap={8}>
                      <button
                        className={`pixel-font ${styles.filterBtn} ${activeDifficulty === null ? styles.active : ''}`}
                        onClick={() => setActiveDifficulty(null)}
                      >
                        ALL_LEVELS
                      </button>
                      {DIFFICULTY_VALUES.map((d) => (
                        <button
                          key={d}
                          className={`pixel-font ${styles.filterBtn} ${activeDifficulty === d ? styles.active : ''}`}
                          onClick={() => setActiveDifficulty(activeDifficulty === d ? null : d)}
                        >
                          {d.toUpperCase()}
                        </button>
                      ))}
                    </Group>
                  </div>
                </Group>
              </motion.div>

              {/* ── Incident Rails ── */}
              {genreRails.map((rail) => (
                <motion.section key={rail.id} variants={itemVariants} className={styles.railSection}>
                  <Group justify="space-between" mb={16} align="baseline">
                    <Text className={`pixel-font ${styles.railTitle}`}>
                      &gt; DIR / {rail.label.toUpperCase()}
                    </Text>
                    <Text className={`pixel-font ${styles.railCount}`}>
                      [{rail.episodes.length} NODE{rail.episodes.length !== 1 ? 'S' : ''}]
                    </Text>
                  </Group>

                  <div className={styles.railScrollContainer}>
                    {rail.episodes.map((q) => (
                      <div
                        key={q.slug}
                        className={styles.questionCard}
                        onClick={() => router.push(`/${q.slug}`)}
                      >
                        <Group justify="space-between" mb={12}>
                          <Text className={`pixel-font ${styles.cardOrder}`}>#{q.displayOrder}</Text>
                          <span className={`pixel-font ${styles.cardDifficulty} ${getDifficultyClass(q.difficulty)}`}>
                            {q.difficulty.toUpperCase()}
                          </span>
                        </Group>

                        <Text className={`pixel-font ${styles.cardName}`} lineClamp={2}>
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
            </Stack>
          </motion.div>
        )}
      </Container>
    </div>
  );
}