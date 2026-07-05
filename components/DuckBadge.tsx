import React from 'react';
import { BadgeType } from '@prisma/client';
import { Tooltip } from '@mantine/core';

interface DuckBadgeProps {
  badgeType: BadgeType;
  size?: number;
}

export const DuckBadge: React.FC<DuckBadgeProps> = ({ badgeType, size = 32 }) => {
  // Map badge types to colors/accessories
  const duckConfig = {
    [BadgeType.STREAK_1]: { color: '#ffb347', accessory: 'none', label: '1 Day Streak' },
    [BadgeType.STREAK_5]: { color: '#ff8c00', accessory: 'fire', label: '5 Day Streak' },
    [BadgeType.STREAK_10]: { color: '#ff4500', accessory: 'crown', label: '10 Day Streak' },
    [BadgeType.SPEED_P0_15M]: { color: '#a0d8ef', accessory: 'none', label: '15 Min P0 Solver' },
    [BadgeType.SPEED_P0_10M]: { color: '#87cefa', accessory: 'goggles', label: '10 Min P0 Solver' },
    [BadgeType.SPEED_P0_5M]: { color: '#00bfff', accessory: 'lightning', label: '5 Min P0 Solver' },
    [BadgeType.SPEED_P0_3M]: { color: '#1e90ff', accessory: 'wings', label: '3 Min P0 Solver' },
    [BadgeType.SPEED_P0_1M]: { color: '#00008b', accessory: 'superhero', label: '1 Min P0 Solver' },
  };

  const config = duckConfig[badgeType] || duckConfig[BadgeType.STREAK_1];

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

  return (
    <Tooltip label={config.label}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 8 8"
        xmlns="http://www.w3.org/2000/svg"
        style={{ imageRendering: 'pixelated' }}
      >
        {pixels.map((row, y) =>
          row.map((col, x) => (
            col ? <rect key={`body-${x}-${y}`} x={x} y={y} width={1} height={1} fill={config.color} /> : null
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
      </svg>
    </Tooltip>
  );
};
