'use client';

import React from 'react';
import Home from '@/components/Home/Home';
import { colors } from '@/lib/theme/colors';

export default function Page() {
  return (
    <div style={{ minHeight: '100vh', background: colors.bg.base, overflow: 'auto' }}>
      <Home />
    </div>
  );
}
