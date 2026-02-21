import React, { ReactNode } from 'react';
import { AppShell, Burger, Group, Skeleton } from '@mantine/core';

export default function layout({ children }:{
    children:ReactNode
}) {
  return (
    <div style={{ height: 'calc(100vh - 60px)', minHeight: 0, overflow: 'hidden' }}>
        {children}
    </div>
  );
}
