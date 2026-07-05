'use client';
import React, { createContext, useContext, useRef } from 'react';
import type { TimerHandle } from './Timer';

interface TimerContextValue {
  timerRef: React.MutableRefObject<TimerHandle | null>;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const timerRef = useRef<TimerHandle>(null);
  
  return (
    <TimerContext.Provider value={{ timerRef }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimerContext() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimerContext must be used within TimerProvider');
  }
  return context;
}
