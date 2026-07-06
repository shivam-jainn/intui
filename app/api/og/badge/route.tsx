import { ImageResponse } from 'next/og';
import { BadgeType } from '@prisma/client';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || BadgeType.STREAK_1;
    
    // Map badge types to colors/accessories
    const duckConfig: Record<string, { color: string; accessory: string; label: string }> = {
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

    const config = duckConfig[type as string] || duckConfig[BadgeType.STREAK_1];
    const color = searchParams.get('color') || config.color;
    const accessory = searchParams.get('accessory') || config.accessory;
    const label = searchParams.get('label') || config.label;

    // We can just construct a basic box view for the badge 
    // Satori doesn't support complex SVG easily so we'll build the duck out of divs!
    
    const scale = 16;
    
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

    let accessoryPixels: { x: number; y: number; color: string }[] = [];

    if (accessory === 'crown') {
      accessoryPixels.push(
        { x: 2, y: -1, color: '#ffd700' },
        { x: 3, y: -1, color: '#ffd700' },
        { x: 4, y: -1, color: '#ffd700' },
        { x: 2, y: 0, color: '#ffd700' },
        { x: 4, y: 0, color: '#ffd700' }
      );
    } else if (accessory === 'fire') {
      accessoryPixels.push(
        { x: 3, y: -1, color: '#ff4500' },
        { x: 2, y: 0, color: '#ff8c00' },
        { x: 4, y: 0, color: '#ff8c00' },
        { x: 0, y: 3, color: '#ff4500' },
        { x: 0, y: 4, color: '#ff8c00' }
      );
    } else if (accessory === 'goggles') {
      accessoryPixels.push(
        { x: 2, y: 1, color: '#00ffff' },
        { x: 3, y: 1, color: '#00ffff' },
        { x: 4, y: 1, color: '#00ffff' },
        { x: 1, y: 1, color: '#333333' },
        { x: 5, y: 1, color: '#333333' }
      );
    } else if (accessory === 'lightning') {
      accessoryPixels.push(
        { x: 5, y: 0, color: '#ffff00' },
        { x: 4, y: 1, color: '#ffff00' },
        { x: 5, y: 1, color: '#ffff00' },
        { x: 4, y: 2, color: '#ffff00' }
      );
    } else if (accessory === 'wings') {
      accessoryPixels.push(
        { x: -1, y: 4, color: '#ffffff' },
        { x: 0, y: 4, color: '#ffffff' },
        { x: -1, y: 5, color: '#ffffff' },
        { x: 0, y: 5, color: '#ffffff' }
      );
    } else if (accessory === 'superhero') {
      accessoryPixels.push(
        { x: -1, y: 5, color: '#d63031' },
        { x: -1, y: 6, color: '#d63031' },
        { x: 0, y: 6, color: '#d63031' }
      );
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0a',
            backgroundImage: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
            border: '8px solid #ff4500',
            fontFamily: 'monospace',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
            <div style={{ color: '#ff4500', fontSize: 40, letterSpacing: '4px', marginBottom: 10 }}>INTUI COLLECTIBLE</div>
            <div style={{ color: '#ffffff', fontSize: 60, fontWeight: 'bold' }}>{label.toUpperCase()}</div>
          </div>
          
          <div
            style={{
              display: 'flex',
              position: 'relative',
              width: 10 * scale * 2,
              height: 10 * scale * 2,
              backgroundColor: '#111',
              borderRadius: '50%',
              boxShadow: '0 0 50px rgba(255, 69, 0, 0.2)',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <div style={{ 
              position: 'relative', 
              display: 'flex', 
              width: 10 * scale * 2, 
              height: 10 * scale * 2 
            }}>
              {/* Render Duck using divs since it's pixel art and reliable in Satori */}
              {pixels.map((row, y) =>
                row.map((col, x) => (
                  col ? <div key={`body-${x}-${y}`} style={{ position: 'absolute', left: (x+1) * scale * 2, top: (y+1) * scale * 2, width: scale * 2, height: scale * 2, backgroundColor: color }} /> : null
                ))
              )}
              {beakPixels.map((row, y) =>
                row.map((col, x) => (
                  col ? <div key={`beak-${x}-${y}`} style={{ position: 'absolute', left: (x+1) * scale * 2, top: (y+1) * scale * 2, width: scale * 2, height: scale * 2, backgroundColor: '#ff8c00' }} /> : null
                ))
              )}
              {eyePixels.map((row, y) =>
                row.map((col, x) => (
                  col ? <div key={`eye-${x}-${y}`} style={{ position: 'absolute', left: (x+1) * scale * 2, top: (y+1) * scale * 2, width: scale * 2, height: scale * 2, backgroundColor: '#000' }} /> : null
                ))
              )}
              {accessoryPixels.map((p, i) => (
                <div key={`acc-${i}`} style={{ position: 'absolute', left: (p.x+1) * scale * 2, top: (p.y+1) * scale * 2, width: scale * 2, height: scale * 2, backgroundColor: p.color }} />
              ))}
            </div>
          </div>
          
          <div style={{ color: '#888888', fontSize: 30, marginTop: 60, display: 'flex' }}>
            CAN YOU BEAT MY STREAK? START SOLVING ON INTUI
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error(e);
    return new Response('Failed to generate image', { status: 500 });
  }
}
