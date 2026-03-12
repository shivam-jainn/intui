"use client";
import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Badge,
  Loader,
  Center,
  Stack,
} from '@mantine/core';
import { IconArrowRight, IconPlayerPlayFilled } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import {
  Difficulty,
  DIFFICULTY_VALUES,
  difficultyColor,
  DSA_GENRES,
  type GenreConfig,
} from '@/lib/common/types/question.types';

type Topic = { topic: { name: string } };

type Question = {
  id: number;
  displayOrder: number;
  slug: string;
  name: string;
  difficulty: Difficulty;
  topics: Topic[];
};

function matchesGenre(question: Question, genre: GenreConfig) {
  const topicValues = question.topics.map((t) => t.topic.name.toLowerCase());
  return genre.patterns.some((p) => topicValues.some((v) => v.includes(p)));
}


export default function StoryMode() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty | null>(null);

  useEffect(() => {
    let mounted = true;

    fetch('/api/questions')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load episodes');
        }
        return response.json();
      })
      .then((data: Question[]) => {
        if (!mounted) {
          return;
        }
        setQuestions(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setError('Unable to load storyline episodes right now.');
      })
      .finally(() => {
        if (!mounted) {
          return;
        }
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

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
    <div style={{ minHeight: '100vh', background: '#08080d', position: 'relative' }}>

      {/* Ambient glow orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-6%', left: '14%', width: 620, height: 620, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.14)', filter: 'blur(120px)' }} />
        <div style={{ position: 'absolute', top: '35%', right: '8%', width: 440, height: 440, borderRadius: '50%', background: 'rgba(236, 72, 153, 0.09)', filter: 'blur(100px)' }} />
        <div style={{ position: 'absolute', bottom: '8%', left: '28%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.07)', filter: 'blur(110px)' }} />
      </div>

      <Container size="xl" style={{ padding: '36px 20px 64px', position: 'relative', zIndex: 1 }}>

        {loading ? (
          <Center py={80}><Loader color="indigo" /></Center>
        ) : error ? (
          <div style={glassStyle({ borderColor: 'rgba(239,68,68,0.3)', radius: 14, pad: '20px 24px' })}>
            <Text c="red.4">{error}</Text>
          </div>
        ) : episodes.length === 0 ? (
          <div style={glassStyle({ radius: 14, pad: '20px 24px' })}>
            <Text c="dimmed">No questions found yet. Seed questions to begin the storyline.</Text>
          </div>
        ) : (
          <Stack gap={44}>

            {/* ── Featured hero ── */}
            {featuredEpisode && (
              <div style={glassStyle({ radius: 20, pad: '44px 48px' })}>
                <Badge variant="light" color="violet" mb={14}>
                  Featured Question
                </Badge>
                <Title
                  order={1}
                  c="white"
                  style={{ fontSize: 'clamp(26px, 4vw, 44px)', lineHeight: 1.08, fontWeight: 700, letterSpacing: '-0.02em' }}
                >
                  Question {featuredEpisode.displayOrder}: {featuredEpisode.name}
                </Title>
                <Text c="gray.4" mt={12} mb={20} style={{ maxWidth: 540, lineHeight: 1.7, fontSize: 15 }}>
                  Start here. Each question builds on the last — solve them in sequence to develop sharp pattern recognition.
                </Text>
                <Group gap={8} mb={24}>
                  <Badge variant="light" color={difficultyColor[featuredEpisode.difficulty]}>
                    {featuredEpisode.difficulty}
                  </Badge>
                  {featuredEpisode.topics.slice(0, 4).map((topic) => (
                    <Badge
                      key={topic.topic.name}
                      variant="outline"
                      color="gray"
                      style={{ borderColor: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.55)' }}
                    >
                      {topic.topic.name}
                    </Badge>
                  ))}
                </Group>
                <Group>
                  <Button
                    leftSection={<IconPlayerPlayFilled size={14} />}
                    size="md"
                    color="violet"
                    onClick={() => router.push(`/${featuredEpisode.slug}`)}
                    style={{ borderRadius: 10 }}
                  >
                    Solve Question
                  </Button>
                  <Button
                    variant="subtle"
                    color="gray"
                    size="md"
                    rightSection={<IconArrowRight size={14} />}
                    onClick={() => router.push(`/${featuredEpisode.slug}`)}
                    style={{ borderRadius: 10 }}
                  >
                    View Details
                  </Button>
                </Group>
              </div>
            )}

            {/* ── Filters ── */}
            <div style={glassStyle({ radius: 14, pad: '16px 20px' })}>
              <Group justify="space-between" align="flex-start" gap="xl">

                {/* Genre filter */}
                <div>
                  <Text size="xs" c="gray.6" mb={10} style={{ textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
                    Pattern
                  </Text>
                  <Group gap={6}>
                    <FilterPill
                      label="All"
                      active={activeGenre === null}
                      onClick={() => setActiveGenre(null)}
                    />
                    {DSA_GENRES.map((genre) => (
                      <FilterPill
                        key={genre.id}
                        label={genre.label}
                        active={activeGenre === genre.id}
                        onClick={() => setActiveGenre(activeGenre === genre.id ? null : genre.id)}
                      />
                    ))}
                  </Group>
                </div>

                {/* Difficulty filter */}
                <div>
                  <Text size="xs" c="gray.6" mb={10} style={{ textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
                    Difficulty
                  </Text>
                  <Group gap={6}>
                    <FilterPill
                      label="All"
                      active={activeDifficulty === null}
                      onClick={() => setActiveDifficulty(null)}
                    />
                    {DIFFICULTY_VALUES.map((d) => (
                      <FilterPill
                        key={d}
                        label={d}
                        active={activeDifficulty === d}
                        accentColor={difficultyColor[d]}
                        onClick={() => setActiveDifficulty(activeDifficulty === d ? null : d)}
                      />
                    ))}
                  </Group>
                </div>

              </Group>
            </div>

            {/* ── Genre rails ── */}
            {genreRails.map((rail) => (
              <section key={rail.id}>
                <Group justify="space-between" mb={16} align="baseline">
                  <Text
                    fw={600}
                    c="white"
                    style={{ fontSize: 16, letterSpacing: '-0.01em' }}
                  >
                    {rail.label}
                  </Text>
                  <Text size="xs" c="gray.6">
                    {rail.episodes.length} question{rail.episodes.length !== 1 ? 's' : ''}
                  </Text>
                </Group>

                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    overflowX: 'auto',
                    paddingBottom: 10,
                    scrollSnapType: 'x mandatory',
                    /* hide scrollbar but keep scroll */
                    msOverflowStyle: 'none',
                  }}
                >
                  {rail.episodes.map((q) => (
                    <QuestionCard
                      key={q.slug}
                      question={q}
                      onClick={() => router.push(`/${q.slug}`)}
                    />
                  ))}
                </div>
              </section>
            ))}

          </Stack>
        )}

      </Container>
    </div>
  );
}

/* ─── helpers ───────────────────────────────────────────────────────────── */

function FilterPill({
  label,
  active,
  accentColor,
  onClick,
}: {
  label: string;
  active: boolean;
  accentColor?: string;
  onClick: () => void;
}) {
  const accent = accentColor ?? 'indigo';
  // map Mantine colour names → rough hex for inline glow
  const glowMap: Record<string, string> = {
    teal: '20,184,166',
    yellow: '234,179,8',
    red: '239,68,68',
    indigo: '99,102,241',
  };
  const glowRgb = glowMap[accent] ?? '99,102,241';

  return (
    <div
      onClick={onClick}
      style={{
        cursor: 'pointer',
        padding: '4px 12px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.02em',
        transition: 'all 0.18s ease',
        background: active ? `rgba(${glowRgb},0.18)` : 'rgba(255,255,255,0.05)',
        border: active ? `1px solid rgba(${glowRgb},0.5)` : '1px solid rgba(255,255,255,0.1)',
        color: active ? `rgb(${glowRgb})` : 'rgba(255,255,255,0.46)',
        boxShadow: active ? `0 0 12px rgba(${glowRgb},0.25)` : 'none',
      }}
    >
      {label}
    </div>
  );
}


function glassStyle({
  radius = 16,
  pad = '28px 32px',
  borderColor = 'rgba(255,255,255,0.1)',
}: { radius?: number; pad?: string; borderColor?: string } = {}): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: `1px solid ${borderColor}`,
    borderRadius: radius,
    padding: pad,
  };
}

function QuestionCard({
  question,
  onClick,
}: {
  question: Question;
  onClick: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        minWidth: 232,
        maxWidth: 232,
        cursor: 'pointer',
        background: hovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.09)'}`,
        borderRadius: 14,
        padding: '16px 18px',
        scrollSnapAlign: 'start',
        transition: 'background 0.18s ease, border-color 0.18s ease',
      }}
    >
      <Group justify="space-between" mb={10}>
        <Text size="xs" c="gray.5" fw={600} style={{ letterSpacing: '0.05em' }}>
          Q{question.displayOrder}
        </Text>
        <Badge variant="light" color={difficultyColor[question.difficulty]} size="xs">
          {question.difficulty}
        </Badge>
      </Group>

      <Text
        fw={600}
        c="gray.0"
        mb={10}
        lineClamp={2}
        style={{ fontSize: 13.5, lineHeight: 1.35 }}
      >
        {question.name}
      </Text>

      <Group gap={4}>
        {question.topics.slice(0, 2).map((topic) => (
          <Badge
            key={topic.topic.name}
            variant="outline"
            color="gray"
            size="xs"
            style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.38)', fontSize: 10.5 }}
          >
            {topic.topic.name}
          </Badge>
        ))}
      </Group>
    </div>
  );
}