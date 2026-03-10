import React, { ReactNode } from 'react'
import { AppShell, Burger, Group, Skeleton } from '@mantine/core';

export default function layout({children}:{
    children:ReactNode
}) {
  return (
    <div style={{height:'100%'}}>
        {children}
    </div>
  )
}
