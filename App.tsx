import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddSheet } from './src/AddSheet';
import { DayScreen } from './src/DayScreen';
import { ErrorBoundary } from './src/ErrorBoundary';
import { FocusScreen } from './src/FocusScreen';
import { DayIcon, MonthIcon, Plus, SettingsIcon, Stopwatch } from './src/Icons';
import { Cursor, MonthScreen } from './src/MonthScreen';
import { SettingsScreen } from './src/SettingsScreen';
import { Item, StoreProvider, useStore } from './src/store';
import { DARK, LIGHT, ThemeContext, useTheme } from './src/theme';
import { useTimerEngine } from './src/timer';
import { tap, thud, Toast } from './src/ui';
import { syncWidgets } from './src/widgets/sync';

type View_ = 'day' | 'month' | 'focus' | 'settings';

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StoreProvider>
          <Themed />
        </StoreProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

function Themed() {
  const { settings, ready } = useStore();
  const system = useColorScheme();
  const dark = settings.theme === 'auto' ? system === 'dark' : settings.theme === 'dark';
  const t = dark ? DARK : LIGHT;
  return (
    <ThemeContext.Provider value={t}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <View style={{ flex: 1, backgroundColor: t.bg }}>{ready && <Main />}</View>
    </ThemeContext.Provider>
  );
}

function Main() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { items, settings } = useStore();
  const [view, setView] = useState<View_>('day');
  const [date, setDate] = useState(() => new Date());
  const [cursor, setCursor] = useState<Cursor>(() => ({ y: new Date().getFullYear(), m: new Date().getMonth(), mode: 'month' }));
  const [now, setNow] = useState(() => new Date());
  const [sheet, setSheet] = useState<{ open: boolean; editing: Item | null }>({ open: false, editing: null });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((m: string) => {
    setToastMsg(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2200);
  }, []);
  const timer = useTimerEngine(toast);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    syncWidgets(items, settings.showNight);
  }, [items, settings.showNight]);

  const pickDate = (d: Date) => {
    setDate(d);
    setCursor({ y: d.getFullYear(), m: d.getMonth(), mode: 'month' });
  };

  const tabs: { key: View_; label: string; icon: (c: string) => React.ReactNode }[] = [
    { key: 'day', label: 'День', icon: (c) => <DayIcon color={c} /> },
    { key: 'month', label: 'Месяц', icon: (c) => <MonthIcon color={c} /> },
    { key: 'focus', label: 'Фокус', icon: (c) => <Stopwatch size={23} width={1.8} color={c} /> },
    { key: 'settings', label: 'Настройки', icon: (c) => <SettingsIcon color={c} fill={t.bg} /> },
  ];

  const tabButton = (tb: (typeof tabs)[number]) => {
    const on = view === tb.key;
    const c = on ? t.ink : t.muted;
    return (
      <Pressable
        key={tb.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: on }}
        onPress={() => {
          if (!on) tap();
          // Повторное нажатие на «Месяц» в виде года возвращает к месяцу.
          if (tb.key === 'month' && on && cursor.mode === 'year') setCursor({ ...cursor, mode: 'month' });
          setView(tb.key);
        }}
        style={st.tab}
      >
        {tb.icon(c)}
        <Text style={[st.tabLabel, { color: c }]}>{tb.label}</Text>
        {tb.key === 'focus' && timer.timer.running && view !== 'focus' && <View style={[st.runDot, { backgroundColor: t.ink }]} />}
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <View style={{ flex: 1 }}>
        {view === 'day' && (
          <DayScreen
            date={date}
            setDate={pickDate}
            now={now}
            onEdit={(it) => setSheet({ open: true, editing: it })}
            onFocusEvent={(ev) => {
              thud();
              timer.startFor(ev);
              setView('focus');
              toast(`Фокус: ${ev.title}`);
            }}
          />
        )}
        {view === 'month' && (
          <MonthScreen
            cursor={cursor}
            setCursor={setCursor}
            selected={date}
            onPickDay={(d) => {
              pickDate(d);
              setView('day');
            }}
          />
        )}
        {view === 'focus' && <FocusScreen api={timer} />}
        {view === 'settings' && <SettingsScreen now={now} />}
      </View>

      <View style={[st.tabbar, { borderTopColor: t.hair, backgroundColor: t.bg, paddingBottom: 10 + Math.max(insets.bottom - 8, 4) }]}>
        {tabButton(tabs[0])}
        {tabButton(tabs[1])}
        <Pressable
          accessibilityLabel="Добавить событие или заметку"
          onPress={() => {
            thud();
            setSheet({ open: true, editing: null });
          }}
          style={({ pressed }) => [st.add, { backgroundColor: t.ink, transform: [{ scale: pressed ? 0.94 : 1 }] }]}
        >
          <Plus color={t.onInk} />
        </Pressable>
        {tabButton(tabs[2])}
        {tabButton(tabs[3])}
      </View>

      <Toast message={toastMsg} />

      <AddSheet
        visible={sheet.open}
        editing={sheet.editing}
        date={date}
        onClose={() => setSheet({ open: false, editing: null })}
        onDone={(msg, d) => {
          setSheet({ open: false, editing: null });
          if (d) pickDate(d);
          setView('day');
          toast(msg);
        }}
      />
    </View>
  );
}

const st = StyleSheet.create({
  tabbar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingHorizontal: 14,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
  },
  tab: { alignItems: 'center', gap: 4, width: 64, paddingVertical: 2 },
  tabLabel: { fontSize: 10.5, fontWeight: '600', letterSpacing: 0.3 },
  runDot: { position: 'absolute', top: 0, right: 16, width: 6, height: 6, borderRadius: 3 },
  add: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
});
