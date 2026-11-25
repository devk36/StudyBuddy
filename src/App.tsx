import { useEffect, useRef } from 'react';
import { Nav } from './components/Nav';
import { Floaters, Toasts } from './components/Overlays';
import { Welcome } from './components/Welcome';
import { checkAchievements, soloTick } from './lib/actions';
import { unlockAudio } from './lib/audio';
import { useRoute } from './lib/router';
import { connect, getRoom, onVisible, pushMyStats, roomTick, serverNow, updatePresence, useRoom } from './lib/room';
import { getState, profileOf, todayStat, useApp } from './lib/store';
import { isSupabaseConfigured } from './lib/supabase';
import * as T from './lib/timer';
import { dayKey, fmtClock } from './lib/util';
import { themeById } from './content/themes';
import { Achievements } from './pages/Achievements';
import { Home } from './pages/Home';
import { MemeCorner } from './pages/MemeCorner';
import { PetShop } from './pages/PetShop';
import { Settings } from './pages/Settings';
import { SharedRoom } from './pages/SharedRoom';
import { StudyRoom } from './pages/StudyRoom';
import { useUi } from './lib/ui';

/** Background heartbeat: finishes timers on time, keeps presence fresh. */
function useControllers() {
  useEffect(() => {
    const tick = () => {
      soloTick(Date.now());
      roomTick();
      updatePresence();
    };
    tick();
    const id = setInterval(tick, 500);
    const vis = () => {
      if (document.visibilityState === 'visible') {
        tick();
        onVisible();
      }
    };
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('focus', vis);
    window.addEventListener('pageshow', vis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', vis);
      window.removeEventListener('focus', vis);
      window.removeEventListener('pageshow', vis);
    };
  }, []);

  // unlock Web Audio on the first interaction (iOS Safari requirement)
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // streak-based achievements can unlock just by opening the app
  useEffect(() => checkAchievements(), []);

  // silently rejoin the last shared room
  useEffect(() => {
    const code = getState().room.lastCode;
    const routeCode = location.hash.match(/^#\/room\/([a-z0-9]+)/i)?.[1];
    if (isSupabaseConfigured && code && (!routeCode || routeCode === code) && getRoom().status === 'idle') void connect({ code });
  }, []);
}

function useTitle() {
  const s = useApp();
  const room = useRoom();
  const ui = useUi();
  const timer = room.room && location.hash.startsWith('#/room') ? room.room.timer : s.timer;
  const isRoom = timer !== s.timer;
  useEffect(() => {
    const update = () => {
      const now = isRoom ? serverNow() : Date.now();
      document.title =
        timer.status === 'running' || timer.status === 'paused'
          ? `${timer.status === 'paused' ? '⏸ ' : ''}${fmtClock(T.remaining(timer, now))} · ${T.modeEmoji[timer.mode]} ${T.modeLabel[timer.mode]}`
          : 'Study Paws 🐾';
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [timer, isRoom, ui.focus]);
}

export function App() {
  const s = useApp();
  const route = useRoute();
  const room = useRoom();
  const today = todayStat(s, dayKey());
  const prevPage = useRef(route.page);
  useControllers();
  useTitle();

  useEffect(() => {
    const theme = themeById(s.settings.theme);
    document.body.dataset.theme = theme.id;
    document.body.classList.toggle('reduce-motion', s.settings.reduceMotion);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.pageBg);
  }, [s.settings.theme, s.settings.reduceMotion]);

  useEffect(() => {
    if (prevPage.current !== route.page) window.scrollTo(0, 0);
    prevPage.current = route.page;
  }, [route.page]);

  // share my stats with roommates whenever they change
  useEffect(() => {
    if (room.status === 'joined') void pushMyStats();
  }, [room.status, today.minutes, today.sessions, profileOf(s).species, s.room.displayName]); // eslint-disable-line react-hooks/exhaustive-deps

  let page;
  switch (route.page) {
    case 'study':
      page = <StudyRoom />;
      break;
    case 'room':
      page = <SharedRoom code={route.code} />;
      break;
    case 'memes':
      page = <MemeCorner openId={route.id} />;
      break;
    case 'achievements':
      page = <Achievements />;
      break;
    case 'shop':
      page = <PetShop />;
      break;
    case 'settings':
      page = <Settings />;
      break;
    default:
      page = <Home />;
  }

  return (
    <div className="app">
      <a href="#main" className="sr-only" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
      <Nav route={route} />
      <main id="main" className="main" tabIndex={-1}>
        {page}
      </main>
      <Toasts />
      <Floaters />
      {!s.welcomed && <Welcome />}
    </div>
  );
}
