'use client';

import { useEffect } from 'react';

export function ActivityTracker() {
  useEffect(() => {
    // Ping the activity endpoint to update streaks and login badges
    fetch('/api/user/activity', { method: 'POST' }).catch(console.error);
  }, []);

  return null;
}
