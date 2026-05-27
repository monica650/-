import { useEffect } from 'react';

export function useNotifications(enabled: boolean, time: string) {
  useEffect(() => {
    if (!enabled || !time) return;

    async function requestPermission() {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
    requestPermission();

    const [h, m] = time.split(':').map(Number);

    function scheduleNext() {
      const now = new Date();
      const next = new Date();
      next.setHours(h, m, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      const ms = next.getTime() - now.getTime();

      return window.setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('该动起来了 ✨', {
            body: '打开任务清单，完成一个小步骤吧！',
            icon: '/favicon.ico',
          });
        }
        scheduleNext();
      }, ms);
    }

    const timer = scheduleNext();
    return () => clearTimeout(timer);
  }, [enabled, time]);
}
