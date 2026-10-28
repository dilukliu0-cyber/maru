import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { toMin } from './date';

export type ItemType = 'event' | 'note';
export type Kind = 'range' | 'point' | 'allday';

export type Item = {
  id: string;
  date: string; // YYYY-MM-DD
  type: ItemType;
  kind: Kind;
  title: string;
  start?: string; // HH:MM
  end?: string;
  done?: boolean;
  doneDate?: string; // день, в который заметку закрыли
  created: number;
};

export type ThemeChoice = 'light' | 'dark' | 'auto';

export type Settings = {
  theme: ThemeChoice;
  showNight: boolean;
  sound: boolean;
  focusMin: number;
  breakMin: number;
};

export type TimerState = {
  mode: 'focus' | 'break';
  total: number; // секунды
  remain: number; // секунды на момент паузы
  endAt: number; // мс, если идёт
  running: boolean;
  task: { id: string; title: string } | null;
};

type Data = {
  items: Item[];
  settings: Settings;
  sessions: Record<string, number>;
  timer: TimerState;
};

const KEY = 'maru.v1';

const DEFAULT_SETTINGS: Settings = { theme: 'auto', showNight: true, sound: true, focusMin: 25, breakMin: 5 };
const DEFAULT_TIMER: TimerState = { mode: 'focus', total: 25 * 60, remain: 25 * 60, endAt: 0, running: false, task: null };
const EMPTY: Data = { items: [], settings: DEFAULT_SETTINGS, sessions: {}, timer: DEFAULT_TIMER };

type Store = Data & {
  ready: boolean;
  addItem: (it: Omit<Item, 'id' | 'created'>) => void;
  updateItem: (id: string, patch: Partial<Item>) => void;
  removeItem: (id: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
  setTimer: (t: TimerState | ((t: TimerState) => TimerState)) => void;
  addSession: (date: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(EMPTY);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const d = JSON.parse(raw) as Partial<Data>;
        setData({
          items: Array.isArray(d.items) ? d.items : [],
          settings: { ...DEFAULT_SETTINGS, ...d.settings },
          sessions: d.sessions ?? {},
          timer: { ...DEFAULT_TIMER, ...d.timer },
        });
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
  }, []);

  // Сохраняем всё целиком при любом изменении (данных немного).
  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {});
  }, [data]);

  const addItem = useCallback((it: Omit<Item, 'id' | 'created'>) => {
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
    setData((d) => ({ ...d, items: [...d.items, { ...it, id, created: Date.now() }] }));
  }, []);
  const updateItem = useCallback((id: string, patch: Partial<Item>) => {
    setData((d) => ({ ...d, items: d.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
  }, []);
  const removeItem = useCallback((id: string) => {
    setData((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }));
  }, []);
  const setSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);
  const setTimer = useCallback((t: TimerState | ((t: TimerState) => TimerState)) => {
    setData((d) => ({ ...d, timer: typeof t === 'function' ? t(d.timer) : t }));
  }, []);
  const addSession = useCallback((date: string) => {
    setData((d) => ({ ...d, sessions: { ...d.sessions, [date]: (d.sessions[date] ?? 0) + 1 } }));
  }, []);

  const value = useMemo(
    () => ({ ...data, ready, addItem, updateItem, removeItem, setSettings, setTimer, addSession }),
    [data, ready, addItem, updateItem, removeItem, setSettings, setTimer, addSession],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider missing');
  return s;
}

// Весь день — наверху, остальное по времени начала.
export function sortItems<T extends Item>(arr: T[]) {
  return [...arr].sort((a, b) => {
    const ka = a.kind === 'allday' ? -1 : toMin(a.start!);
    const kb = b.kind === 'allday' ? -1 : toMin(b.start!);
    return ka - kb || a.created - b.created;
  });
}

export function itemsByDate(items: Item[]) {
  const map: Record<string, Item[]> = {};
  for (const it of items) (map[it.date] ??= []).push(it);
  return map;
}

// Заметка видна со своего дня и дальше, пока её не закрыли (и в день закрытия).
export const noteVisibleOn = (n: Item, key: string) =>
  n.type === 'note' && n.date <= key && (!n.done || (n.doneDate ?? n.date) >= key);

export const isPast =(it: Item, nm: number) =>
  (it.kind === 'range' && toMin(it.end!) <= nm) || (it.kind === 'point' && toMin(it.start!) < nm);
export const isNow = (it: Item, nm: number) => it.kind === 'range' && toMin(it.start!) <= nm && nm < toMin(it.end!);

// Событие для центра кольца: выбранное → идущее → ближайшее → на весь день.
export function focusEventFor(evs: Item[], isToday: boolean, nm: number, selectedId?: string | null) {
  const sorted = sortItems(evs);
  if (!sorted.length) return null;
  if (selectedId) {
    const s = sorted.find((e) => e.id === selectedId);
    if (s) return s;
  }
  if (isToday) {
    return (
      sorted.find((e) => isNow(e, nm)) ??
      sorted.find((e) => e.kind !== 'allday' && toMin(e.start!) > nm) ??
      sorted.find((e) => e.kind === 'allday') ??
      sorted[sorted.length - 1]
    );
  }
  return sorted.find((e) => e.kind !== 'allday') ?? sorted[0];
}
