'use client';

import React from 'react';
import { MantineProvider } from '@mantine/core';
import { theme } from '../theme';

interface MantineProvidersProps {
  children: React.ReactNode;
}

export function MantineProviders({ children }: MantineProvidersProps) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      {children}
    </MantineProvider>
  );
}
