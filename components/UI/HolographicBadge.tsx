'use client';

import HolographicSticker from 'holographic-sticker';

interface HolographicBadgeProps {
  text: string;
  subText?: string;
  rotation?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function HolographicBadge({
  text,
  subText,
  rotation = 0,
  className = '',
  style = {}
}: HolographicBadgeProps) {
  
  // A simple white circle SVG to act as the mask for the hologram
  const circleMask = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="white" stroke="white" stroke-width="4"/></svg>`;

  return (
    <div 
      className={className} 
      style={{ 
        ...style, 
        width: 140, 
        height: 140, 
        position: 'absolute', 
        rotate: `${rotation}deg`,
        zIndex: 10
      }}
    >
      <HolographicSticker.Root>
        <HolographicSticker.Scene>
          <HolographicSticker.Card className="rounded-full">
            {/* The base layer (can be transparent or solid) */}
            <div style={{ width: '100%', height: '100%', backgroundColor: '#111', borderRadius: '50%', border: '4px solid white' }} />

            {/* Pattern holographic effect */}
            <HolographicSticker.Pattern
              maskUrl={circleMask}
              maskSize="contain"
              textureUrl="https://assets.codepen.io/605876/figma-texture.png"
              textureSize="6cqi"
              mixBlendMode="hard-light"
              opacity={0.8}
            >
              <HolographicSticker.Refraction intensity={2} />
            </HolographicSticker.Pattern>

            <HolographicSticker.Content>
              <div style={{ 
                position: 'absolute', 
                inset: 0, 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'white',
                fontWeight: 900,
                fontFamily: 'monospace',
                fontSize: '1.2rem',
                textAlign: 'center',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)'
              }}>
                {text}
                {subText && <span style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>{subText}</span>}
              </div>
            </HolographicSticker.Content>
          </HolographicSticker.Card>
        </HolographicSticker.Scene>
      </HolographicSticker.Root>
    </div>
  );
}
