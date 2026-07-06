import { Metadata, ResolvingMetadata } from 'next';
import { BadgeType } from '@prisma/client';
import { Center, Container, Title, Text, Button } from '@mantine/core';
import Link from 'next/link';

type Props = {
  params: { type: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const type = params.type;
  
  const title = `I unlocked a new badge on Intui!`;
  const description = `Can you beat my streak? Start solving on Intui today!`;
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `/api/og/badge?type=${type}`,
          width: 1200,
          height: 630,
          alt: 'Intui Badge Achievement',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/og/badge?type=${type}`],
    },
  }
}

export default function ShareBadgePage({ params }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: 'clamp(2rem, 5vw, 4rem) 1rem' }}>
      <Container size="md">
        <Center style={{ flexDirection: 'column', textAlign: 'center', marginTop: '10vh' }}>
          <Title className="pixel-font" c="var(--primary-red)" mb="xl">
            AWESOME ACHIEVEMENT!
          </Title>
          <Text className="pixel-font" c="var(--text-secondary)" mb="xl">
            Someone shared their awesome badge with you. 
          </Text>
          
          <img 
            src={`/api/og/badge?type=${params.type}`} 
            alt="Badge Share" 
            style={{ width: '100%', maxWidth: '800px', borderRadius: '12px', border: '4px solid var(--border-subtle)', marginBottom: '2rem' }} 
          />

          <Link href="/achievements" style={{ textDecoration: 'none' }}>
            <button className="pixel-btn">
              START YOUR JOURNEY ON INTUI
            </button>
          </Link>
        </Center>
      </Container>
    </div>
  )
}
