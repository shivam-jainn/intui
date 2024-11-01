"use client";
import React from 'react'
import { PanelGroup,Panel,PanelResizeHandle } from 'react-resizable-panels'
import QuestionPanel from '@/components/Playground/QuestionPanel';

export default function page() {
  return (
<PanelGroup direction="horizontal">
   <Panel defaultSize={40} minSize={20}>
     <QuestionPanel questionTitle='House Robber' difficulty='Medium'  description='sdjsddskds' companies={['Swiftride']} topics={['DP']} />
   </Panel>
   <PanelResizeHandle style={{width:'0.5rem',backgroundColor:'blue'}} />
   <Panel defaultSize={60} minSize={20}>
     Text
   </Panel>
 </PanelGroup>
  )
}
