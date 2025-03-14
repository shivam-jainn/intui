"use client";
import React, { useState } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Card,
  Badge,
  Modal,
  Timeline,
  Avatar,
  Collapse
} from '@mantine/core';
import { IconLock, IconUser, IconMessage } from '@tabler/icons-react';

export default function StoryMode() {
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null);
  const [dialogueOpen, setDialogueOpen] = useState(false);

  // Sample episode data
  const episodes = [
    {
      id: 1,
      title: "The Binary Breach",
      status: "unlocked",
      completion: 0,
      brief: "A sophisticated hacker has breached the FBI database. Your team needs to trace the attack pattern and secure the system.",
      characters: ["Agent Sarah Chen", "Director Roberts", "Unknown Hacker"],
      currentScene: 0,
      difficulty: "Medium",
      story: [
        {
          character: "Director Roberts",
          dialogue: "Agent, we've detected an unusual pattern in our mainframe.",
          avatar: "DR"
        },
        {
          character: "Agent Sarah Chen",
          dialogue: "I'm seeing multiple entry points. This is no ordinary breach.",
          avatar: "SC"
        },
        {
          character: "Unknown Hacker",
          dialogue: "Catch me if you can, agents... 😈",
          avatar: "UH"
        }
      ],
      challenges: [
        {
          id: "1.1",
          title: "Trace the Entry Point",
          description: "Implement a function to detect the first point of unauthorized access",
          unlocked: true,
          completed: false,
          leetcodeLink: "/problems/binary-search"
        },
        {
          id: "1.2",
          title: "Decrypt the Message",
          description: "Break the hacker's encryption using pattern matching",
          unlocked: false,
          completed: false,
          leetcodeLink: "/problems/valid-anagram"
        }
      ]
    },
    {
      id: 2,
      title: "The Quantum Conspiracy",
      status: "locked",
      completion: 0,
      brief: "A quantum computer is being used to break into government facilities worldwide. Your coding skills are needed to prevent global chaos.",
      characters: ["Agent Mike Ross", "Dr. Quantum", "Mystery Syndicate"],
      difficulty: "Hard",
      locked: true
    }
  ];

  const renderDialogue = (episode: any) => {
    return (
      <Timeline active={episode.currentScene} bulletSize={24} lineWidth={2}>
        {episode.story.map((scene: any, index: number) => (
          <Timeline.Item
            key={index}
            bullet={
              <Avatar size={24} radius="xl">
                {scene.avatar}
              </Avatar>
            }
            title={scene.character}
          >
            <Text size="sm" style={{ marginTop: '5px' }}>
              {scene.dialogue}
            </Text>
          </Timeline.Item>
        ))}
      </Timeline>
    );
  };

  return (
    <Container size="xl" style={{ padding: '40px 20px' }}>
      {/* Hero Section */}
      <Paper
        style={{
          background: '#1A1B1E',
          padding: '40px',
          borderRadius: '16px',
          marginBottom: '40px',
          color: 'white'
        }}
      >
        <Title order={1} style={{ fontSize: '44px', marginBottom: '20px' }}>
          FBI Code Division: Case Files
        </Title>
        <Text size="xl" style={{ opacity: 0.9, marginBottom: '20px' }}>
          Solve coding challenges to unlock the story and crack the case.
        </Text>
      </Paper>

      {/* Episodes List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {episodes.map((episode) => (
          <Card
            key={episode.id}
            style={{
              border: '1px solid #2C2E33',
              position: 'relative',
              opacity: episode.status === 'locked' ? 0.7 : 1
            }}
          >
            {episode.status === 'locked' && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1
              }}>
                <IconLock size={40} />
              </div>
            )}

            <Group style={{ marginBottom: '15px' }}>
              <Badge size="lg" color={episode.difficulty === 'Hard' ? 'red' : 'blue'}>
                {episode.difficulty}
              </Badge>
              <Text size="sm">Episode {episode.id}</Text>
            </Group>

            <Title order={3} style={{ marginBottom: '15px' }}>
              {episode.title}
            </Title>

            <Text size="sm" style={{ marginBottom: '20px', color: '#666' }}>
              {episode.brief}
            </Text>

            <Group style={{ marginBottom: '20px' }}>
              <IconUser size={20} />
              <Text size="sm">Featured: {episode.characters.join(', ')}</Text>
            </Group>

            {!episode.locked && (
              <>
                <Button
                  fullWidth
                  style={{
                    marginBottom: '10px',
                    background: '#228BE6'
                  }}
                  onClick={() => {
                    setSelectedEpisode(episode.id);
                    setDialogueOpen(true);
                  }}
                >
                  Continue Case
                </Button>
              </>
            )}
          </Card>
        ))}
      </div>

      {/* Story Dialog Modal */}
<Modal
  opened={dialogueOpen}
  onClose={() => setDialogueOpen(false)}
  size="lg"
  title={
    <Title order={3}>
      {episodes.find(e => e.id === selectedEpisode)?.title ?? "Unknown Case"}
    </Title>
  }
>
  {selectedEpisode && episodes.find(e => e.id === selectedEpisode) ? (
    <div>
      {renderDialogue(episodes.find(e => e.id === selectedEpisode)!)}

      <Title order={4} style={{ marginTop: "20px", marginBottom: "15px" }}>
        Current Objectives
      </Title>

      {episodes
        .find(e => e.id === selectedEpisode)
        ?.challenges?.map((challenge) => (
          <Card
            key={challenge.id}
            style={{
              marginBottom: "10px",
              opacity: challenge.unlocked ? 1 : 0.7,
              border: "1px solid #eee",
            }}
          >
            <Group>
              <div>
                <Text fw={500}>{challenge.title}</Text>
                <Text size="sm" color="dimmed">
                  {challenge.description}
                </Text>
              </div>
              {challenge.unlocked ? "" : <IconLock size={20} />}
            </Group>

            {challenge.unlocked && (
              <Button
                fullWidth
                variant="light"
                style={{ marginTop: "10px" }}
                component="a"
                href={`https://leetcode.com${challenge.leetcodeLink}`}
                target="_blank"
              >
                Solve Challenge
              </Button>
            )}
          </Card>
        ))}
    </div>
  ) : (
    <Text>No episode selected.</Text>
  )}
</Modal>;

    </Container>
  );
}