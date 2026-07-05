import React, { ReactNode } from 'react';


export default function layout({ children }: { children: ReactNode }) {
  return <div style={{ height: '100%' }}>{children}</div>;
}
