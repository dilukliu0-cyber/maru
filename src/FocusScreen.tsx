import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { fmtClock, todayKey } from './date';
import { Pause, Play, Reset } from './Icons';
import { eventsOn, sortItems, useStore } from './store';
import { MONO, useTheme } from './theme';
import type { TimerApi } from './timer';
import { MicroLabel, Segmented, tap, thud } from './ui';

const FOCUS_PRESETS = [15, 25, 50];
const BREAK_PRESETS = [5, 10, 15];
const R = 132;
const CIRC = 2 * Math.PI * R;

export function FocusScreen({ api }: { api: TimerApi }) {
  const t = useTheme();
  const { items, settings } = useStore();
  const { width } = useWindowDimensions();
  const { timer, remain } = api;
  const size = Math.min(width * 0.72, 272);

  const today = todayKey();
  const tasks = useMemo(() => sortItems(eventsOn(items, today).filter((i) => i.kind !== 'allday')), [items, today]);

  const state = timer.running
    ? timer.mode === 'focus'
      ? 'фокус идёт'
      : 'перерыв идёт'
    : remain <= 0
      ? 'готово'
      : remain < timer.total
        ? 'на паузе'
        : 'готов к старту';
  const presets = timer.mode === 'focus' ? FOCUS_PRESETS : BREAK_PRESETS;
  const cur = timer.mode === 'focus' ? settings.focusMin : settings.breakMin;
  const isPreset = timer.total === cur * 60;
  const frac = timer.total ? remain / timer.total : 0;
  const slots = Math.max(4, api.sessionsToday);

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
      <View style={{ alignItems: 'center', marginTop: 6 }}>
        <Text style={[st.fh, { color: t.ink }]}>Фокус</Text>
        <Text style={[st.fs, { color: t.muted }]}>{timer.task ? timer.task.title : 'Таймер концентрации к событиям дня'}</Text>
      </View>

      <Segmented
        style={{ maxWidth: 250, width: '100%', alignSelf: 'center', marginTop: 18 }}
        value={timer.mode}
        onChange={(m) => m !== timer.mode && api.setMode(m)}
        options={[
          { value: 'focus', label: 'Фокус' },
          { value: 'break', label: 'Перерыв' },
        ]}
      />

      <View style={{ width: size, height: size, alignSelf: 'center', marginTop: 22 }}>
        <Svg width={size} height={size} viewBox="0 0 300 300" style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={150} cy={150} r={R} fill="none" stroke={t.soft2} strokeWidth={9} />
          <Circle
            cx={150}
            cy={150}
            r={R}
            fill="none"
            stroke={t.ink}
            strokeWidth={9}
            strokeLinecap="round"
            strokeDasharray={`${CIRC} ${CIRC}`}
            strokeDashoffset={CIRC * (1 - frac)}
            opacity={frac > 0.001 ? 1 : 0}
          />
        </Svg>
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={[st.time, { color: t.ink }]}>{fmtClock(remain)}</Text>
          <MicroLabel style={{ marginTop: 9 }}>{state}</MicroLabel>
        </View>
      </View>

      <MicroLabel style={{ textAlign: 'center', marginTop: 16 }}>
        {timer.mode === 'focus' ? 'Длительность фокуса, мин' : 'Длительность перерыва, мин'}
      </MicroLabel>
      <View style={st.presetRow}>
        {presets.map((min) => {
          const on = isPreset && min === cur;
          return (
            <Pressable
              key={min}
              onPress={() => {
                tap();
                api.setPreset(min);
              }}
              style={[st.preset, { borderColor: on ? t.ink : t.hair, backgroundColor: on ? t.ink : 'transparent' }]}
            >
              <Text style={{ fontFamily: MONO, fontSize: 13.5, fontWeight: on ? '600' : '500', color: on ? t.onInk : t.inkSoft }}>{min}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={st.controls}>
        <Pressable
          accessibilityLabel="Сбросить таймер"
          onPress={() => {
            tap();
            api.reset();
          }}
          style={[st.ghost, { borderColor: t.hair }]}
        >
          <Reset color={t.inkSoft} />
        </Pressable>
        <Pressable
          accessibilityLabel="Старт или пауза"
          onPress={() => {
            thud();
            timer.running ? api.pause() : api.start();
          }}
          style={({ pressed }) => [st.play, { backgroundColor: t.ink, transform: [{ scale: pressed ? 0.95 : 1 }] }]}
        >
          {timer.running ? <Pause color={t.onInk} /> : <Play color={t.onInk} />}
        </Pressable>
        <Pressable
          accessibilityLabel="Добавить минуту"
          onPress={() => {
            tap();
            api.plusMinute();
          }}
          style={[st.ghost, { borderColor: t.hair }]}
        >
          <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '600', color: t.inkSoft }}>+1′</Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 28 }}>
        <MicroLabel style={{ textAlign: 'center' }}>Задача из сегодняшнего дня</MicroLabel>
        <View style={st.chips}>
          {[{ id: null as string | null, title: 'Без задачи', start: '' }, ...tasks.map((e) => ({ id: e.id as string | null, title: e.title, start: e.start! }))].map((it) => {
            const on = (timer.task?.id ?? null) === it.id;
            return (
              <Pressable
                key={it.id ?? 'none'}
                onPress={() => {
                  tap();
                  api.setTask(it.id ? { id: it.id, title: it.title } : null);
                }}
                style={[st.chip, { borderColor: on ? t.ink : t.hair, backgroundColor: on ? t.ink : 'transparent' }]}
              >
                <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: on ? '600' : '500', color: on ? t.onInk : t.inkSoft }}>
                  {it.id ? `${it.start} · ${it.title}` : it.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={st.sessions}>
        <MicroLabel>Сессии сегодня</MicroLabel>
        <View style={{ flexDirection: 'row', gap: 6, marginLeft: 9 }}>
          {Array.from({ length: slots }, (_, i) => (
            <View
              key={i}
              style={[st.sDot, i < api.sessionsToday ? { backgroundColor: t.ink, borderColor: t.ink } : { borderColor: t.faint }]}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  fh: { fontSize: 21, fontWeight: '600' },
  fs: { fontSize: 13.5, marginTop: 3, textAlign: 'center' },
  time: { fontFamily: MONO, fontSize: 52, fontWeight: '600', letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  presetRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' },
  preset: { borderWidth: 1, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 20 },
  play: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  ghost: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 11 },
  chip: { borderWidth: 1, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 13, maxWidth: '100%' },
  sessions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 26 },
  sDot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5 },
});
