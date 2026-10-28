import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { toMin, todayKey } from './date';
import { Item, TimerState, useStore } from './store';
import { success } from './ui';

const IOS = Platform.OS === 'ios';

if (IOS) {
  // Пока приложение открыто, сигнал играет само приложение — баннер не нужен.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

let notifId: string | null = null;
let askedPermission = false;

async function cancelEndNotification() {
  if (!IOS || !notifId) return;
  const id = notifId;
  notifId = null;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

// Звук по окончании цикла, даже если приложение свёрнуто.
async function scheduleEndNotification(t: TimerState, sound: boolean) {
  if (!IOS) return;
  await cancelEndNotification();
  try {
    if (!askedPermission) {
      askedPermission = true;
      const cur = await Notifications.getPermissionsAsync();
      if (!cur.granted && cur.canAskAgain) await Notifications.requestPermissionsAsync();
    }
    const secs = Math.max(1, Math.round((t.endAt - Date.now()) / 1000));
    notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: t.mode === 'focus' ? 'Фокус завершён' : 'Перерыв окончен',
        body: t.mode === 'focus' ? (t.task ? `${t.task.title} — время перерыва` : 'Время перерыва') : 'Пора вернуться к делу',
        sound: sound ? 'chime.wav' : undefined,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: secs },
    });
  } catch {
    notifId = null;
  }
}

export type TimerApi = ReturnType<typeof useTimerEngine>;

export function useTimerEngine(toast: (m: string) => void) {
  const { timer, setTimer, settings, setSettings, addSession, sessions } = useStore();
  const chime = useAudioPlayer(require('../assets/chime.wav'));
  const [, force] = useState(0);
  const ref = useRef(timer);
  ref.current = timer;
  const soundRef = useRef(settings.sound);
  soundRef.current = settings.sound;

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  const beep = useCallback(() => {
    success();
    if (!soundRef.current) return;
    try {
      chime.seekTo(0);
      chime.play();
    } catch {}
  }, [chime]);

  const presetFor = useCallback((mode: 'focus' | 'break') => (mode === 'focus' ? settings.focusMin : settings.breakMin) * 60, [settings.focusMin, settings.breakMin]);

  const start = useCallback(
    (base?: TimerState) => {
      const t = base ?? ref.current;
      const remain = t.remain <= 0 ? t.total : t.remain;
      const next = { ...t, remain, running: true, endAt: Date.now() + remain * 1000 };
      setTimer(next);
      scheduleEndNotification(next, soundRef.current);
    },
    [setTimer],
  );

  const pause = useCallback(() => {
    const t = ref.current;
    setTimer({ ...t, running: false, remain: Math.max(0, (t.endAt - Date.now()) / 1000) });
    cancelEndNotification();
  }, [setTimer]);

  const reset = useCallback(() => {
    const t = ref.current;
    const total = presetFor(t.mode);
    setTimer({ ...t, running: false, total, remain: total, endAt: 0 });
    cancelEndNotification();
  }, [presetFor, setTimer]);

  const setMode = useCallback(
    (mode: 'focus' | 'break') => {
      const total = presetFor(mode);
      setTimer({ ...ref.current, mode, running: false, total, remain: total, endAt: 0 });
      cancelEndNotification();
    },
    [presetFor, setTimer],
  );

  const setPreset = useCallback(
    (min: number) => {
      const t = ref.current;
      setSettings(t.mode === 'focus' ? { focusMin: min } : { breakMin: min });
      setTimer({ ...t, running: false, total: min * 60, remain: min * 60, endAt: 0 });
      cancelEndNotification();
    },
    [setSettings, setTimer],
  );

  const plusMinute = useCallback(() => {
    const t = ref.current;
    const next = { ...t, total: t.total + 60, remain: t.remain + 60, endAt: t.running ? t.endAt + 60000 : t.endAt };
    setTimer(next);
    if (next.running) scheduleEndNotification(next, soundRef.current);
  }, [setTimer]);

  const setTask = useCallback((task: TimerState['task']) => setTimer({ ...ref.current, task }), [setTimer]);

  // Кнопка у события: сразу запускаем фокус на длительность события.
  const startFor = useCallback(
    (ev: Item) => {
      let secs = settings.focusMin * 60;
      if (ev.kind === 'range') secs = Math.min(180, Math.max(5, toMin(ev.end!) - toMin(ev.start!))) * 60;
      start({ mode: 'focus', total: secs, remain: secs, endAt: 0, running: false, task: { id: ev.id, title: ev.title } });
    },
    [settings.focusMin, start],
  );

  const finish = useCallback(() => {
    const t = ref.current;
    beep();
    cancelEndNotification();
    if (t.mode === 'focus') {
      addSession(todayKey());
      toast('Фокус завершён — время перерыва');
      const total = settings.breakMin * 60;
      start({ ...t, mode: 'break', total, remain: total, running: false, endAt: 0 });
    } else {
      toast('Перерыв окончен');
      const total = settings.focusMin * 60;
      setTimer({ ...t, mode: 'focus', total, remain: total, running: false, endAt: 0 });
    }
  }, [addSession, beep, settings.breakMin, settings.focusMin, setTimer, start, toast]);

  useEffect(() => {
    const check = () => {
      const t = ref.current;
      if (!t.running) return;
      if (Date.now() >= t.endAt) finish();
      else force((x) => x + 1);
    };
    const id = setInterval(check, 250);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && check());
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [finish]);

  const remain = timer.running ? Math.max(0, (timer.endAt - Date.now()) / 1000) : timer.remain;

  return {
    timer,
    remain,
    sessionsToday: sessions[todayKey()] ?? 0,
    start: () => start(),
    pause,
    reset,
    setMode,
    setPreset,
    plusMinute,
    setTask,
    startFor,
  };
}
