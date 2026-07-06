'use client';

import React, { useState, useEffect } from 'react';
import { IconDeviceDesktop } from '@tabler/icons-react';

export default function DesktopWarning() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 768) {
        setShow(true);
      } else {
        setShow(false);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      backgroundColor: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div className="pixel-border" style={{
        backgroundColor: 'var(--surface-default)',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        maxWidth: '400px'
      }}>
        <IconDeviceDesktop size={48} color="var(--primary-red)" />
        <h2 className="pixel-font" style={{ color: 'var(--text-primary)', fontSize: '1.2rem', margin: 0, lineHeight: 1.4 }}>
          DESKTOP RECOMMENDED
        </h2>
        <p className="pixel-font" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
          The Command Center and Playground are intensive environments best experienced on a desktop computer.
        </p>
        <button 
          onClick={() => setShow(false)}
          className="pixel-font"
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--primary-red)',
            color: 'var(--primary-red)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            letterSpacing: '0.05em'
          }}
        >
          CONTINUE ANYWAY
        </button>
      </div>
    </div>
  );
}
