// Custom badge generator for dynamic awards (e.g. Mixer Mode solved questions)

const PREMIUM_COLORS = [
  '#FF6B6B', // Coral Red
  '#4D96FF', // Neon Blue
  '#6BCB77', // Emerald Green
  '#FFD93D', // Bright Yellow
  '#B336FF', // Electric Purple
  '#FF9F43', // Warm Orange
  '#1DD1A1', // Mint Green
  '#00D2D3', // Turquoise
  '#FF6B8B', // Soft Pink
  '#5F27CD', // Indigo
];

const ACCESSORIES = ['fire', 'crown', 'goggles', 'lightning', 'wings', 'superhero'];

// Simple deterministic hash function for string seeds
function getHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export interface GeneratedBadgeConfig {
  color: string;
  accessory: string;
  label: string;
}

export function generateMixerBadge(questionName: string): GeneratedBadgeConfig {
  const seed = getHash(questionName);
  
  const color = PREMIUM_COLORS[seed % PREMIUM_COLORS.length];
  const accessory = ACCESSORIES[(seed >> 2) % ACCESSORIES.length];
  const label = `Mixer: ${questionName}`;
  
  return {
    color,
    accessory,
    label,
  };
}
