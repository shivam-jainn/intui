import React from 'react';
import { BadgeType } from '@prisma/client';
import { Tooltip, HoverCard, Text, Stack } from '@mantine/core';

interface DuckBadgeProps {
  badgeType: BadgeType;
  size?: number;
  customColor?: string | null;
  customAccessory?: string | null;
  customLabel?: string | null;
  tooltipDisabled?: boolean;
}

export const DuckBadge: React.FC<DuckBadgeProps> = ({
  badgeType,
  size = 48,
  customColor,
  customLabel,
  tooltipDisabled = false,
}) => {
  const duckConfig = {
    [BadgeType.FIRST_LOGIN]: { color: '#00b894', label: 'First Time Duck', description: 'Awarded on your very first login to the platform!' },
    [BadgeType.DAILY_LOGIN]: { color: '#0984e3', label: 'Daily Active Duck', description: 'Awarded for being active on the platform today!' },
    [BadgeType.STREAK_1]: { color: '#fdcb6e', label: '1 Day Streak', description: 'Unlocked by maintaining a 1-day active streak.' },
    [BadgeType.STREAK_3]: { color: '#e17055', label: '3 Day Streak', description: 'Unlocked by maintaining a 3-day active streak.' },
    [BadgeType.STREAK_5]: { color: '#d63031', label: '5 Day Streak', description: 'Unlocked by maintaining a 5-day active streak.' },
    [BadgeType.STREAK_10]: { color: '#e84393', label: '10 Day Streak', description: 'Unlocked by maintaining a 10-day active streak.' },
    [BadgeType.STREAK_15]: { color: '#6c5ce7', label: '15 Day Streak', description: 'Unlocked by maintaining a 15-day active streak.' },
    [BadgeType.STREAK_30]: { color: '#a29bfe', label: '30 Day Streak', description: 'Unlocked by maintaining a 30-day active streak.' },
    [BadgeType.STREAK_60]: { color: '#ffeaa7', label: '60 Day Streak', description: 'Unlocked by maintaining a 60-day active streak.' },
    [BadgeType.STREAK_90]: { color: '#fab1a0', label: '90 Day Streak', description: 'Unlocked by maintaining a 90-day active streak.' },
    [BadgeType.STREAK_120]: { color: '#ff7675', label: '120 Day Streak', description: 'Unlocked by maintaining a 120-day active streak.' },
    [BadgeType.STREAK_150]: { color: '#fd79a8', label: '150 Day Streak', description: 'Unlocked by maintaining a 150-day active streak.' },
    [BadgeType.STREAK_180]: { color: '#55efc4', label: '180 Day Streak', description: 'Unlocked by maintaining a 180-day active streak.' },
    [BadgeType.STREAK_270]: { color: '#81ecec', label: '270 Day Streak', description: 'Unlocked by maintaining a 270-day active streak.' },
    [BadgeType.STREAK_365]: { color: '#ffeaa7', label: '1 Year Streak!', description: 'Awarded for maintaining an incredible 1-year active streak!' },
    [BadgeType.MIXER_AWARD]: { color: '#74b9ff', label: 'Mixer Master', description: 'Master of the Mixer mode. Solved custom generated incidents!' },
    [BadgeType.SPEED_P0_15M]: { color: '#ff7675', label: '15 Min P0 Solver', description: 'Solved a critical P0 incident in under 15 minutes.' },
    [BadgeType.SPEED_P0_10M]: { color: '#ff7675', label: '10 Min P0 Solver', description: 'Solved a critical P0 incident in under 10 minutes.' },
    [BadgeType.SPEED_P0_5M]: { color: '#d63031', label: '5 Min P0 Solver', description: 'Solved a critical P0 incident in under 5 minutes.' },
    [BadgeType.SPEED_P0_3M]: { color: '#d63031', label: '3 Min P0 Solver', description: 'Solved a critical P0 incident in under 3 minutes.' },
    [BadgeType.SPEED_P0_1M]: { color: '#2d3436', label: '1 Min P0 Solver', description: 'Solved a critical P0 incident in under 1 minute. Legend!' },
  };

  const config = duckConfig[badgeType] || duckConfig[BadgeType.STREAK_1];
  const finalColor = customColor || config.color;
  const finalLabel = customLabel || config.label;

  // Derive gradient color stops based on base badge color
  const secondaryColor = finalColor === '#2d3436' ? '#636e72' : '#00cec9';

  const svgContent = (
    <svg
      width={size}
      height={size * 1.5}
      viewBox="0 0 120 180"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
        transition: 'transform 0.2s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1) translateY(0)')}
    >
      <defs>
        <linearGradient id={`grad-${badgeType}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={finalColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
        {/* Metallic Shine Gradient */}
        <linearGradient id={`shine-${badgeType}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
          <stop offset="30%" stopColor="rgba(255,255,255,0.1)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.6)" />
          <stop offset="70%" stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
        </linearGradient>
        <radialGradient id={`glow-${badgeType}`} cx="50%" cy="30%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      {/* Outer Card Frame with Sticker Border */}
      <rect
        x="1"
        y="1"
        width="118"
        height="178"
        rx="18"
        fill="#FAF8F3"
        stroke="#FFFFFF"
        strokeWidth="4"
      />

      {/* Glossy Overlay for Card */}
      <rect
        x="1"
        y="1"
        width="118"
        height="178"
        rx="18"
        fill={`url(#shine-${badgeType})`}
        style={{ mixBlendMode: 'overlay' }}
      />

      {/* Curved Gradient Waves at the Top */}
      <path
        d="M 10 10 h 100 v 62 Q 60 52 10 62 Z"
        fill={`url(#grad-${badgeType})`}
      />
      <path
        d="M 10 70 Q 60 60 110 70 v 26 H 10 Z"
        fill={`url(#grad-${badgeType})`}
      />
      
      {/* Metallic Shine Overlay for the Waves */}
      <path
        d="M 10 10 h 100 v 62 Q 60 52 10 62 Z"
        fill={`url(#glow-${badgeType})`}
        style={{ mixBlendMode: 'screen' }}
      />
      
      {/* Badge Label and Code/Category */}
      <text
        x="12"
        y="118"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="9.5"
        fontWeight="800"
        fill="#2d3436"
      >
        {finalLabel.toLowerCase()}
      </text>
      <text
        x="12"
        y="131"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="6.5"
        fontWeight="600"
        fill={finalColor}
        letterSpacing="0.3"
      >
        {badgeType.replace(/_/g, ' ')}
      </text>

      {/* Small seal and emblem details */}
      <circle cx="20" cy="156" r="7" fill="none" stroke="#b2bec3" strokeWidth="1" />
      <circle cx="20" cy="156" r="5" fill="none" stroke={finalColor} strokeWidth="1" />
      <text
        x="20"
        y="159"
        fontFamily="-apple-system, sans-serif"
        fontSize="7"
        fontWeight="900"
        fill={finalColor}
        textAnchor="middle"
      >
        1
      </text>

      {/* Date / Subtag box */}
      <rect x="32" y="149" width="42" height="14" rx="3" fill="none" stroke="#EAE6DC" strokeWidth="1" />
      <text
        x="53"
        y="158"
        fontFamily="-apple-system, sans-serif"
        fontSize="5.5"
        fontWeight="700"
        fill="#636e72"
        textAnchor="middle"
      >
        INTUI
      </text>

      {/* Brand/Company Label at bottom right */}
      <text
        x="108"
        y="159"
        fontFamily="-apple-system, sans-serif"
        fontSize="6.5"
        fontWeight="800"
        fill="#b2bec3"
        textAnchor="end"
      >
        INTUI
      </text>
    </svg>
  );

  if (tooltipDisabled) {
    return svgContent;
  }

  return (
    <HoverCard width={220} shadow="md" withArrow openDelay={100} closeDelay={100} zIndex={10000}>
      <HoverCard.Target>
        <span style={{ display: 'inline-flex', cursor: 'pointer' }}>
          {svgContent}
        </span>
      </HoverCard.Target>
      <HoverCard.Dropdown style={{ backgroundColor: '#1e1e24', borderColor: 'var(--primary-red)', padding: '12px' }}>
        <Stack align="center" gap="xs">
          <DuckBadge
            badgeType={badgeType}
            size={120}
            customColor={customColor}
            customLabel={customLabel}
            tooltipDisabled={true}
          />
          <Text fw={700} size="sm" c="white" className="pixel-font" style={{ textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase' }}>
            {finalLabel}
          </Text>
          <Text size="xs" c="var(--text-muted)" style={{ textAlign: 'center', fontSize: '0.65rem', lineHeight: 1.3 }}>
            {config.description}
          </Text>
        </Stack>
      </HoverCard.Dropdown>
    </HoverCard>
  );
};
