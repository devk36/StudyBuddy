/** Browser notifications (desktop + Android; iOS only when installed to Home Screen, iOS 16.4+). */
export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window;

export async function requestNotifications(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

export function notify(title: string, body: string): void {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  if (document.visibilityState === 'visible' && document.hasFocus()) return;
  try {
    const n = new Notification(title, { body, icon: './favicon.svg', tag: 'study-paws-timer' });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* some mobile browsers only allow service-worker notifications */
  }
}
