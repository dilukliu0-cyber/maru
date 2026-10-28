import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { addDays, atTime, dayLong, DOWS, fmtDur, fmtLength, keyOf, MONTHS_GEN, toMin, todayKey } from './date';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Stopwatch } from './Icons';
import { Ring } from './Ring';
import { focusEventFor, isNow, isPast, Item, sortItems, useStore } from './store';
import { MONO, useTheme } from './theme';
import { IconButton, tap, thud } from './ui';

type Props = {
  date: Date;
  setDate: (d: Date) => void;
  now: Date;
  onFocusEvent: (ev: Item) => void;
  onEdit: (it: Item) => void;
};

export function DayScreen({ date, setDate, now, onFocusEvent, onEdit }: Props) {
  const t = useTheme();
  const { items, settings, updateItem } = useStore();
  const { width } = useWindowDimensions();
  const [selection, setSelection] = useState<Record<string, string | null>>({});
  const [closed, setClosed] = useState({ events: false, notes: false });
  const touch = useRef<{ x: number; y: number } | null>(null);

  const key = keyOf(date);
  const isToday = key === todayKey();
  const nm = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const ringMin = Math.floor(nm);
  const dayItems = useMemo(() => items.filter((i) => i.date === key), [items, key]);
  const events = useMemo(() => sortItems(dayItems.filter((i) => i.type === 'event')), [dayItems]);
  const notes = useMemo(() => sortItems(dayItems.filter((i) => i.type === 'note')), [dayItems]);
  const selectedId = selection[key] ?? null;

  const select = (id: string) => {
    tap();
    setSelection((s) => ({ ...s, [key]: s[key] === id ? null : id }));
  };
  const shift = (n: number) => {
    tap();
    setDate(addDays(date, n));
  };

  const center = centerText(events, key, isToday, date, now, nm, selectedId);
  const ringSize = Math.min(width * 0.84, 348);

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
      onTouchStart={(e) => (touch.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY })}
      onTouchEnd={(e) => {
        const s = touch.current;
        touch.current = null;
        if (!s) return;
        const dx = e.nativeEvent.pageX - s.x;
        const dy = e.nativeEvent.pageY - s.y;
        if (Math.abs(dx) > 70 && Math.abs(dy) < 40) shift(dx < 0 ? 1 : -1);
      }}
    >
      <View style={st.head}>
        <IconButton onPress={() => shift(-1)} label="Предыдущий день">
          <ChevronLeft color={t.ink} />
        </IconButton>
        <View style={{ alignItems: 'center' }}>
          {/* Одно и то же место: «сегодня» — метка, на другом дне — кнопка возврата. */}
          {isToday ? (
            <View style={[st.pill, { backgroundColor: t.ink, borderColor: t.ink }]}>
              <Text style={[st.pillText, { color: t.onInk }]}>СЕГОДНЯ</Text>
            </View>
          ) : (
            <Pressable
              accessibilityLabel="Вернуться к сегодня"
              hitSlop={8}
              onPress={() => {
                tap();
                setDate(new Date());
              }}
              style={({ pressed }) => [st.pill, { borderColor: t.ink, backgroundColor: pressed ? t.soft : 'transparent' }]}
            >
              <ChevronLeft size={12} width={2.6} color={t.ink} />
              <Text style={[st.pillText, { color: t.ink }]}>СЕГОДНЯ</Text>
            </Pressable>
          )}
          <Text style={[st.dnum, { color: t.ink }]}>
            {date.getDate()} {MONTHS_GEN[date.getMonth()]}
            {date.getFullYear() !== now.getFullYear() ? ` ${date.getFullYear()}` : ''}
          </Text>
          <Text style={[st.dow, { color: t.muted }]}>
            {isToday ? DOWS[date.getDay()] : `${relDay(date, now)} · ${DOWS[date.getDay()]}`}
          </Text>
        </View>
        <IconButton onPress={() => shift(1)} label="Следующий день">
          <ChevronRight color={t.ink} />
        </IconButton>
      </View>

      <View style={{ width: ringSize, height: ringSize, alignSelf: 'center', marginTop: 14, marginBottom: 4 }}>
        <Ring
          t={t}
          size={ringSize}
          items={dayItems}
          isToday={isToday}
          nowMin={ringMin}
          selectedId={selectedId}
          showNight={settings.showNight}
          onSelect={select}
        />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, st.center]}>
          <Text style={[st.rcLabel, { color: t.muted }]} numberOfLines={1}>
            {center.label}
          </Text>
          <Text style={[st.rcCount, { color: t.ink }]} numberOfLines={1} adjustsFontSizeToFit>
            {center.count}
          </Text>
          <Text style={[st.rcName, { color: t.ink }]} numberOfLines={2}>
            {center.name}
          </Text>
          {!!center.time && <Text style={[st.rcTime, { color: t.muted }]}>{center.time}</Text>}
        </View>
      </View>

      <Section
        title="События"
        count={events.length}
        closed={closed.events}
        onToggle={() => setClosed((c) => ({ ...c, events: !c.events }))}
      >
        {!events.length && <Text style={[st.empty, { color: t.muted }]}>Нет событий — день свободен.</Text>}
        {events.map((ev, i) => {
          const nowFlag = isToday && isNow(ev, nm);
          const past = isToday && isPast(ev, nm);
          const sel = ev.id === selectedId;
          return (
            <View key={ev.id}>
            {i > 0 && <View style={[st.sep, { backgroundColor: t.hair }]} />}
            <Pressable
              onPress={() => select(ev.id)}
              onLongPress={() => {
                thud();
                onEdit(ev);
              }}
              style={[
                st.evRow,
                sel && { backgroundColor: t.soft },
                past && { opacity: 0.42 },
              ]}
            >
              <View style={{ width: 74 }}>
                <Text style={[st.t1, { color: t.ink }]}>{ev.kind === 'allday' ? 'весь' : ev.start}</Text>
                <Text style={[st.t2, { color: t.muted }]}>{ev.kind === 'allday' ? 'день' : ev.kind === 'range' ? `– ${ev.end}` : 'точно'}</Text>
              </View>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                <Text style={[st.evName, { color: t.ink, fontWeight: nowFlag ? '700' : '500' }]}>{ev.title}</Text>
                {nowFlag && (
                  <View style={[st.nowPill, { backgroundColor: t.ink }]}>
                    <Text style={{ color: t.onInk, fontSize: 9.5, fontWeight: '700', letterSpacing: 1 }}>СЕЙЧАС</Text>
                  </View>
                )}
              </View>
              {ev.kind !== 'allday' && (
                <Pressable
                  accessibilityLabel="Фокус по этому событию"
                  onPress={() => onFocusEvent(ev)}
                  hitSlop={6}
                  style={({ pressed }) => [st.focusBtn, { borderColor: t.hair, backgroundColor: pressed ? t.ink : 'transparent' }]}
                >
                  {({ pressed }) => <Stopwatch color={pressed ? t.onInk : t.inkSoft} />}
                </Pressable>
              )}
            </Pressable>
            </View>
          );
        })}
      </Section>

      <Section title="Заметки" count={notes.length} closed={closed.notes} onToggle={() => setClosed((c) => ({ ...c, notes: !c.notes }))}>
        {!notes.length && <Text style={[st.empty, { color: t.muted }]}>Нет заметок.</Text>}
        {notes.map((nt, i) => (
          <Pressable
            key={nt.id}
            onPress={() => {
              tap();
              updateItem(nt.id, { done: !nt.done });
            }}
            onLongPress={() => {
              thud();
              onEdit(nt);
            }}
            style={[st.noteRow, { borderBottomColor: t.hair, borderBottomWidth: i === notes.length - 1 ? 0 : StyleSheet.hairlineWidth * 2 }]}
          >
            <View style={[st.check, nt.done ? { backgroundColor: t.ink, borderColor: t.ink } : { borderColor: t.faint }]}>
              {nt.done && <Check color={t.onInk} />}
            </View>
            <Text style={[st.noteText, { color: nt.done ? t.muted : t.ink, textDecorationLine: nt.done ? 'line-through' : 'none' }]}>{nt.title}</Text>
            <Text style={[st.noteMeta, { color: t.muted }]}>
              {nt.kind === 'allday' ? 'весь день' : nt.kind === 'range' ? `${nt.start} – ${nt.end}` : nt.start}
            </Text>
          </Pressable>
        ))}
      </Section>

      {(events.length > 0 || notes.length > 0) && (
        <Text style={[st.hint, { color: t.faint }]}>Удержи строку, чтобы изменить или удалить</Text>
      )}
    </ScrollView>
  );
}

function Section({ title, count, closed, onToggle, children }: { title: string; count: number; closed: boolean; onToggle: () => void; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ marginTop: 20 }}>
      <Pressable
        onPress={() => {
          tap();
          onToggle();
        }}
        accessibilityState={{ expanded: !closed }}
        style={st.secHead}
      >
        <Text style={[st.secTitle, { color: t.ink }]}>{title}</Text>
        {count > 0 && <Text style={[st.secCount, { color: t.muted }]}>{count}</Text>}
        <View style={{ marginLeft: 'auto', transform: [{ rotate: closed ? '-90deg' : '0deg' }] }}>
          <ChevronDown color={t.muted} />
        </View>
      </Pressable>
      {!closed && <View style={{ marginTop: 2 }}>{children}</View>}
    </View>
  );
}

// «завтра», «через 3 дня», «5 дней назад».
function relDay(date: Date, now: Date) {
  const a = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const n = Math.round((+a - +b) / 86400000);
  if (n === 1) return 'завтра';
  if (n === -1) return 'вчера';
  if (n === 2) return 'послезавтра';
  if (n === -2) return 'позавчера';
  const k = Math.abs(n);
  const m10 = k % 10;
  const m100 = k % 100;
  const word = m10 === 1 && m100 !== 11 ? 'день' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'дня' : 'дней';
  return n > 0 ? `через ${k} ${word}` : `${k} ${word} назад`;
}

function centerText(events: Item[], key: string, isToday: boolean, date: Date, now: Date, nm: number, selectedId: string | null) {
  const ev = focusEventFor(events, isToday, nm, selectedId);
  if (!ev) return { label: 'планов нет', count: '—', name: 'Свободный день', time: '' };
  if (ev.kind === 'allday') {
    return { label: isToday ? 'сегодня · весь день' : `${DOWS[date.getDay()]} · весь день`, count: 'весь день', name: ev.title, time: '' };
  }
  const len = ev.kind === 'range' ? toMin(ev.end!) - toMin(ev.start!) : 0;
  const time = ev.kind === 'range' ? `${ev.start} – ${ev.end} · ${fmtLength(len)}` : `в ${ev.start}`;
  if (!isToday) return { label: dayLong(date), count: ev.start!, name: ev.title, time };
  const startD = atTime(key, ev.start!);
  if (ev.kind === 'range') {
    const endD = atTime(key, ev.end!);
    if (now >= startD && now < endD) return { label: 'сейчас идёт · осталось', count: fmtDur(+endD - +now), name: ev.title, time };
    if (now < startD) return { label: 'начнётся через', count: fmtDur(+startD - +now), name: ev.title, time };
    return { label: 'уже прошло', count: ev.start!, name: ev.title, time };
  }
  if (now < startD) return { label: 'начнётся через', count: fmtDur(+startD - +now), name: ev.title, time };
  return { label: 'сегодня в', count: ev.start!, name: ev.title, time };
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  dow: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  dnum: { fontSize: 21, fontWeight: '600', letterSpacing: -0.2, marginTop: 1 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1.2, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10, marginBottom: 5 },
  pillText: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1.2 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: '19%' },
  rcLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1.4, textTransform: 'uppercase' },
  rcCount: { fontFamily: MONO, fontSize: 34, fontWeight: '600', letterSpacing: -0.6, marginTop: 6, fontVariant: ['tabular-nums'] },
  rcName: { fontSize: 17, fontWeight: '600', marginTop: 8, textAlign: 'center', lineHeight: 21 },
  rcTime: { fontFamily: MONO, fontSize: 12, marginTop: 3, textAlign: 'center' },
  secHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 2 },
  secTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' },
  secCount: { fontFamily: MONO, fontSize: 12 },
  empty: { paddingVertical: 12, paddingHorizontal: 8, fontSize: 14 },
  evRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 10 },
  t1: { fontFamily: MONO, fontSize: 13.5, fontWeight: '600' },
  t2: { fontFamily: MONO, fontSize: 11.5, marginTop: 2 },
  evName: { fontSize: 15.5, lineHeight: 20 },
  nowPill: { marginLeft: 8, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2.5 },
  focusBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sep: { height: StyleSheet.hairlineWidth * 2, marginHorizontal: 8 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 11, paddingHorizontal: 8 },
  check: { width: 21, height: 21, borderRadius: 11, borderWidth: 1.6, alignItems: 'center', justifyContent: 'center' },
  noteText: { flex: 1, fontSize: 15, fontWeight: '500' },
  noteMeta: { fontFamily: MONO, fontSize: 11.5 },
  hint: { textAlign: 'center', fontSize: 12, marginTop: 18 },
});
