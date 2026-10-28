import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { keyOf, MONTHS, MONTHS_GEN, todayKey, WEEK_HEAD } from './date';
import { ChevronLeft, ChevronRight } from './Icons';
import { itemsByDate, useStore } from './store';
import { useTheme } from './theme';
import { IconButton, tap } from './ui';

export type Cursor = { y: number; m: number; mode: 'month' | 'year' };

type Props = {
  cursor: Cursor;
  setCursor: (c: Cursor) => void;
  selected: Date;
  onPickDay: (d: Date) => void;
};

// 42 клетки с понедельника.
function monthCells(y: number, m: number) {
  const lead = (new Date(y, m, 1).getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => new Date(y, m, 1 - lead + i));
}

export function MonthScreen({ cursor, setCursor, selected, onPickDay }: Props) {
  const t = useTheme();
  const { items } = useStore();
  const byDate = useMemo(() => itemsByDate(items), [items]);
  const tKey = todayKey();
  const sKey = keyOf(selected);

  if (cursor.mode === 'year') {
    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 10, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <View style={st.head}>
          <IconButton onPress={() => setCursor({ ...cursor, y: cursor.y - 1 })} label="Предыдущий год">
            <ChevronLeft color={t.ink} />
          </IconButton>
          <Text style={[st.yearBig, { color: t.ink }]}>{cursor.y}</Text>
          <IconButton onPress={() => setCursor({ ...cursor, y: cursor.y + 1 })} label="Следующий год">
            <ChevronRight color={t.ink} />
          </IconButton>
        </View>
        <View style={st.yearGrid}>
          {MONTHS.map((name, m) => {
            const isCur = cursor.y === new Date().getFullYear() && m === new Date().getMonth();
            return (
              <Pressable
                key={m}
                onPress={() => {
                  tap();
                  setCursor({ y: cursor.y, m, mode: 'month' });
                }}
                style={({ pressed }) => [st.miniMonth, pressed && { backgroundColor: t.soft }]}
              >
                <Text style={[st.miniName, { color: t.ink, fontWeight: isCur ? '700' : '600' }]}>{name.slice(0, 3)}</Text>
                <View style={st.miniGrid}>
                  {monthCells(cursor.y, m).map((d, i) => {
                    const other = d.getMonth() !== m;
                    const k = keyOf(d);
                    const isT = !other && k === tKey;
                    const has = !other && !!byDate[k]?.length;
                    return (
                      <View key={i} style={st.miniCell}>
                        <View style={[st.miniDay, isT && { backgroundColor: t.ink }]}>
                          <Text
                            style={{
                              fontSize: 7.5,
                              color: other ? 'transparent' : isT ? t.onInk : has ? t.ink : t.muted,
                              fontWeight: has || isT ? '700' : '400',
                            }}
                          >
                            {d.getDate()}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  const step = (n: number) => {
    let m = cursor.m + n;
    let y = cursor.y;
    if (m < 0) (m = 11), y--;
    if (m > 11) (m = 0), y++;
    setCursor({ y, m, mode: 'month' });
  };

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
      <Pressable
        onPress={() => {
          tap();
          setCursor({ ...cursor, mode: 'year' });
        }}
        style={st.yearBack}
        hitSlop={8}
      >
        <ChevronLeft size={17} color={t.inkSoft} />
        <Text style={{ fontSize: 15, fontWeight: '600', color: t.inkSoft }}>{cursor.y}</Text>
      </Pressable>
      <View style={st.head}>
        <IconButton onPress={() => step(-1)} label="Предыдущий месяц">
          <ChevronLeft color={t.ink} />
        </IconButton>
        <Text style={[st.monthName, { color: t.ink }]}>{MONTHS[cursor.m]}</Text>
        <IconButton onPress={() => step(1)} label="Следующий месяц">
          <ChevronRight color={t.ink} />
        </IconButton>
      </View>
      <View style={st.calHead}>
        {WEEK_HEAD.map((d) => (
          <Text key={d} style={[st.calHeadTxt, { color: t.muted }]}>
            {d}
          </Text>
        ))}
      </View>
      <View style={st.grid}>
        {monthCells(cursor.y, cursor.m).map((d) => {
          const k = keyOf(d);
          const list = byDate[k] ?? [];
          const hasEv = list.some((x) => x.type === 'event');
          const hasNt = list.some((x) => x.type === 'note');
          const other = d.getMonth() !== cursor.m;
          const isT = k === tKey;
          const isS = k === sKey;
          return (
            <Pressable
              key={k}
              accessibilityLabel={`${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`}
              onPress={() => {
                tap();
                onPickDay(d);
              }}
              style={st.cell}
            >
              <View
                style={[
                  st.d,
                  isT && !isS && { borderWidth: 1.6, borderColor: t.ink },
                  isS && { backgroundColor: t.ink },
                ]}
              >
                <Text
                  style={{
                    fontSize: 15.5,
                    fontWeight: isS || isT ? '700' : '500',
                    color: isS ? t.onInk : other ? t.faint : t.ink,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {d.getDate()}
                </Text>
              </View>
              <View style={st.dots}>
                {hasEv && <View style={[st.dot, { backgroundColor: other ? t.faint : t.ink }]} />}
                {hasNt && <View style={[st.dotNote, { borderColor: other ? t.faint : t.muted }]} />}
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={st.legend}>
        <View style={st.legendItem}>
          <View style={[st.dot, { backgroundColor: t.ink }]} />
          <Text style={{ fontSize: 12.5, color: t.muted }}>событие</Text>
        </View>
        <View style={st.legendItem}>
          <View style={[st.dotNote, { borderColor: t.muted }]} />
          <Text style={{ fontSize: 12.5, color: t.muted }}>заметка</Text>
        </View>
      </View>
      <Text style={[st.hint, { color: t.muted }]}>Нажми на день, чтобы открыть его кольцо суток.</Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  yearBack: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', marginBottom: 2 },
  monthName: { fontSize: 21, fontWeight: '600', letterSpacing: -0.2 },
  yearBig: { fontSize: 28, fontWeight: '700', letterSpacing: -0.4 },
  calHead: { flexDirection: 'row', marginTop: 18, marginBottom: 6 },
  calHeadTxt: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', letterSpacing: 0.9, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 4 },
  cell: { width: `${100 / 7}%`, aspectRatio: 0.92, alignItems: 'center', justifyContent: 'center', gap: 4 },
  d: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dots: { height: 6, flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot: { width: 5.5, height: 5.5, borderRadius: 3 },
  dotNote: { width: 5.5, height: 5.5, borderRadius: 3, borderWidth: 1.4 },
  legend: { flexDirection: 'row', gap: 20, justifyContent: 'center', marginTop: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  hint: { textAlign: 'center', fontSize: 13, marginTop: 26, lineHeight: 19 },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, rowGap: 10 },
  miniMonth: { width: '33.333%', paddingHorizontal: 6, paddingVertical: 6, borderRadius: 12 },
  miniName: { fontSize: 15, marginBottom: 5, paddingLeft: 2 },
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  miniCell: { width: `${100 / 7}%`, alignItems: 'center' },
  miniDay: { width: 13, height: 13, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
});
