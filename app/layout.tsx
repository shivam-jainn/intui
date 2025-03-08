import '@mantine/core/styles.css';

import React from 'react';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { Navbar } from '@/components/Navbar/Navbar';
import { theme } from '../theme';
import './globals.css';
import '@mantine/dates/styles.css';
import TanstackQueryProvider from './TanstackQueryProvider';

export const metadata = {
  title: 'Intui',
  description: 'Your rubber duck for your interview prep',
};

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <TanstackQueryProvider>
            <Navbar />
            {children}
          </TanstackQueryProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
