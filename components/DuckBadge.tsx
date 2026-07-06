import React from 'react';
import { BadgeType } from '@prisma/client';
import { Tooltip } from '@mantine/core';

interface DuckBadgeProps {
  badgeType: BadgeType;
  size?: number;
  customColor?: string | null;
  customAccessory?: string | null;
  customLabel?: string | null;
}

export const DuckBadge: React.FC<DuckBadgeProps> = ({
  badgeType,
  size = 32,
  customColor,
  customAccessory,
  customLabel,
}) => {
  // Map badge types to colors/accessories
  const duckConfig = {
    [BadgeType.FIRST_LOGIN]: { color: '#a8e6cf', accessory: 'none', label: 'First Time Duck' },
    [BadgeType.DAILY_LOGIN]: { color: '#dcedc1', accessory: 'goggles', label: 'Daily Active Duck' },
    [BadgeType.STREAK_1]: { color: '#ffb347', accessory: 'none', label: '1 Day Streak' },
    [BadgeType.STREAK_3]: { color: '#ffd3b6', accessory: 'none', label: '3 Day Streak' },
    [BadgeType.STREAK_5]: { color: '#ff8c00', accessory: 'fire', label: '5 Day Streak' },
    [BadgeType.STREAK_10]: { color: '#ff4500', accessory: 'crown', label: '10 Day Streak' },
    [BadgeType.STREAK_15]: { color: '#ff8b94', accessory: 'lightning', label: '15 Day Streak' },
    [BadgeType.STREAK_30]: { color: '#ffaaa6', accessory: 'wings', label: '30 Day Streak' },
    [BadgeType.STREAK_60]: { color: '#ff8b94', accessory: 'superhero', label: '60 Day Streak' },
    [BadgeType.STREAK_90]: { color: '#845ef7', accessory: 'crown', label: '90 Day Streak' },
    [BadgeType.STREAK_120]: { color: '#5c7cfa', accessory: 'fire', label: '120 Day Streak' },
    [BadgeType.STREAK_150]: { color: '#22b8cf', accessory: 'wings', label: '150 Day Streak' },
    [BadgeType.STREAK_180]: { color: '#20c997', accessory: 'superhero', label: '180 Day Streak' },
    [BadgeType.STREAK_270]: { color: '#51cf66', accessory: 'lightning', label: '270 Day Streak' },
    [BadgeType.STREAK_365]: { color: '#fcc419', accessory: 'crown', label: '1 Year Streak!' },
    [BadgeType.MIXER_AWARD]: { color: '#74c0fc', accessory: 'none', label: 'Mixer Master' },
    [BadgeType.SPEED_P0_15M]: { color: '#a0d8ef', accessory: 'none', label: '15 Min P0 Solver' },
    [BadgeType.SPEED_P0_10M]: { color: '#87cefa', accessory: 'goggles', label: '10 Min P0 Solver' },
    [BadgeType.SPEED_P0_5M]: { color: '#00bfff', accessory: 'lightning', label: '5 Min P0 Solver' },
    [BadgeType.SPEED_P0_3M]: { color: '#1e90ff', accessory: 'wings', label: '3 Min P0 Solver' },
    [BadgeType.SPEED_P0_1M]: { color: '#00008b', accessory: 'superhero', label: '1 Min P0 Solver' },
  };

  const config = duckConfig[badgeType] || duckConfig[BadgeType.STREAK_1];
  
  const finalColor = customColor || config.color;
  const finalAccessory = customAccessory || config.accessory;
  const finalLabel = customLabel || config.label;

  // 8x8 pixel art duck
  const pixels = [
    [0, 0, 1, 1, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
  ];

  const beakPixels = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ];

  const eyePixels = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ];

  // Dynamic accessories
  let accessoryPixels: { x: number; y: number; color: string }[] = [];

  if (finalAccessory === 'crown') {
    accessoryPixels.push(
      { x: 2, y: -1, color: '#ffd700' },
      { x: 3, y: -1, color: '#ffd700' },
      { x: 4, y: -1, color: '#ffd700' },
      { x: 2, y: 0, color: '#ffd700' },
      { x: 4, y: 0, color: '#ffd700' }
    );
  } else if (finalAccessory === 'fire') {
    accessoryPixels.push(
      { x: 3, y: -1, color: '#ff4500' },
      { x: 2, y: 0, color: '#ff8c00' },
      { x: 4, y: 0, color: '#ff8c00' },
      { x: 0, y: 3, color: '#ff4500' },
      { x: 0, y: 4, color: '#ff8c00' }
    );
  } else if (finalAccessory === 'goggles') {
    accessoryPixels.push(
      { x: 2, y: 1, color: '#00ffff' },
      { x: 3, y: 1, color: '#00ffff' },
      { x: 4, y: 1, color: '#00ffff' },
      { x: 1, y: 1, color: '#333333' },
      { x: 5, y: 1, color: '#333333' }
    );
  } else if (finalAccessory === 'lightning') {
    accessoryPixels.push(
      { x: 5, y: 0, color: '#ffff00' },
      { x: 4, y: 1, color: '#ffff00' },
      { x: 5, y: 1, color: '#ffff00' },
      { x: 4, y: 2, color: '#ffff00' }
    );
  } else if (finalAccessory === 'wings') {
    accessoryPixels.push(
      { x: -1, y: 4, color: '#ffffff' },
      { x: 0, y: 4, color: '#ffffff' },
      { x: -1, y: 5, color: '#ffffff' },
      { x: 0, y: 5, color: '#ffffff' }
    );
  } else if (finalAccessory === 'superhero') {
    accessoryPixels.push(
      { x: -1, y: 5, color: '#d63031' },
      { x: -1, y: 6, color: '#d63031' },
      { x: 0, y: 6, color: '#d63031' }
    );
  }

  return (
    <Tooltip label={finalLabel}>
      <svg
        width={size}
        height={size}
        viewBox="-1 -1 10 10"
        xmlns="http://www.w3.org/2000/svg"
        style={{ imageRendering: 'pixelated' }}
      >
        {pixels.map((row, y) =>
          row.map((col, x) => (
            col ? <rect key={`body-${x}-${y}`} x={x} y={y} width={1} height={1} fill={finalColor} /> : null
          ))
        )}
        {beakPixels.map((row, y) =>
          row.map((col, x) => (
            col ? <rect key={`beak-${x}-${y}`} x={x} y={y} width={1} height={1} fill="#ff8c00" /> : null
          ))
        )}
        {eyePixels.map((row, y) =>
          row.map((col, x) => (
            col ? <rect key={`eye-${x}-${y}`} x={x} y={y} width={1} height={1} fill="#000" /> : null
          ))
        )}
        {accessoryPixels.map((p, i) => (
          <rect key={`acc-${i}`} x={p.x} y={p.y} width={1} height={1} fill={p.color} />
        ))}
      </svg>
    </Tooltip>
  );
};
