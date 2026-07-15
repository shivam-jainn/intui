'use client';

import { useEffect } from 'react';

export function ActivityTracker() {
  useEffect(() => {
    const now = Date.now();
    const lastPing = localStorage.getItem('intui-last-activity-ping');

    if (lastPing) {
      const diff = now - parseInt(lastPing, 10);
      if (diff < 5 * 60 * 1000) {
        // 5 minutes
        return;
      }
    }

    // Ping the activity endpoint to update streaks and login badges
    fetch('/api/user/activity', { method: 'POST' })
      .then(() => {
        localStorage.setItem('intui-last-activity-ping', String(Date.now()));
      })
      .catch(console.error);
  }, []);

  return null;
}
