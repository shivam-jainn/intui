import '@mantine/core/styles.css';

import React from 'react';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { Navbar } from '@/components/Navbar/Navbar';
import { theme } from '@/core/theme';
import './globals.css';
import '@mantine/dates/styles.css';
import TanstackQueryProvider from './TanstackQueryProvider';

export const metadata = {
  title: 'Intui – interactive coding playground',
  description: 'Your rubber duck for interview prep and learning – code, submit, and iterate in real time.',
  icons: {
    icon: '/prismduck.png',
    shortcut: '/prismduck.png',
    apple: '/prismduck.png',
  },
  openGraph: {
    title: 'Intui',
    description: 'Interactive coding playground and learning platform',
    images: '/prismduck.png',
  },
};

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
        <link rel="icon" type="image/png" sizes="32x32" href="/prismduck.png" />
        <link rel="shortcut icon" href="/prismduck.png" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="dark">
          <TanstackQueryProvider>
            <Navbar />
            {children}
          </TanstackQueryProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
