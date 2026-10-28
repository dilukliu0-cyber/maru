import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DOWS_SHORT, fmtDur, MONTHS_GEN, toMin, todayKey } from './date';
import { MiniRing } from './Ring';
import { sortItems, ThemeChoice, useStore } from './store';
import { MONO, useTheme } from './theme';
import { Segmented, Switch } from './ui';

export function SettingsScreen({ now }: { now: Date }) {
  const t = useTheme();
  const { settings, setSettings, items } = useStore();

  const nm = now.getHours() * 60 + now.getMinutes();
  const next = sortItems(items.filter((i) => i.date === todayKey() && i.type === 'event' && i.kind !== 'allday')).find(
    (e) => toMin(e.start!) >= nm,
  );
  const nextAt = next ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), ...(next.start!.split(':').map(Number) as [number, number])) : null;

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
      <Text style={[st.fh, { color: t.ink }]}>Настройки</Text>

      <View style={[st.row, { borderBottomColor: t.hair }]}>
        <Text style={[st.title, { color: t.ink }]}>Тема</Text>
        <Text style={[st.sub, { color: t.muted }]}>Только чёрный и белый. Авто следует за системой.</Text>
        <Segmented<ThemeChoice>
          style={{ marginTop: 13 }}
          value={settings.theme}
          onChange={(theme) => setSettings({ theme })}
          options={[
            { value: 'light', label: 'Светлая' },
            { value: 'dark', label: 'Тёмная' },
            { value: 'auto', label: 'Авто' },
          ]}
        />
      </View>

      <View style={[st.row, st.rowH, { borderBottomColor: t.hair }]}>
        <View style={{ flex: 1 }}>
          <Text style={[st.title, { color: t.ink }]}>Ночь на кольце</Text>
          <Text style={[st.sub, { color: t.muted }]}>Часы с 00:00 до 06:00 подсвечены серым сектором.</Text>
        </View>
        <Switch label="Ночь на кольце" value={settings.showNight} onChange={(showNight) => setSettings({ showNight })} />
      </View>

      <View style={[st.row, st.rowH, { borderBottomColor: t.hair }]}>
        <View style={{ flex: 1 }}>
          <Text style={[st.title, { color: t.ink }]}>Звук таймера</Text>
          <Text style={[st.sub, { color: t.muted }]}>Сигнал, когда фокус или перерыв заканчивается.</Text>
        </View>
        <Switch label="Звук таймера" value={settings.sound} onChange={(sound) => setSettings({ sound })} />
      </View>

      <View style={[st.row, { borderBottomWidth: 0 }]}>
        <Text style={[st.title, { color: t.ink }]}>Виджет</Text>
        <Text style={[st.sub, { color: t.muted }]}>
          Мини-кольцо на главный экран: сколько дня прошло и что дальше. Добавь его: удержи экран «Домой» → «+» → «Сутки».
        </Text>
        <View style={[st.widget, { backgroundColor: t.soft }]}>
          <MiniRing t={t} size={72} nowMin={nm} nextMin={next ? toMin(next.start!) : null} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontFamily: MONO, fontSize: 11.5, color: t.muted }}>
              {DOWS_SHORT[now.getDay()]}, {now.getDate()} {MONTHS_GEN[now.getMonth()]}
            </Text>
            <Text numberOfLines={2} style={{ fontSize: 15.5, fontWeight: '600', marginTop: 3, color: t.ink }}>
              {next ? `${next.start} · ${next.title}` : 'Дальше — свободно'}
            </Text>
            <Text style={{ fontSize: 12.5, marginTop: 2, color: t.muted }}>
              {nextAt ? `начнётся через ${fmtDur(+nextAt - +now)}` : 'событий на сегодня больше нет'}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[st.foot, { color: t.faint }]}>Все события и заметки хранятся только на этом iPhone.</Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  fh: { fontSize: 21, fontWeight: '600', marginTop: 6 },
  row: { paddingVertical: 20, paddingHorizontal: 2, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  rowH: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  title: { fontSize: 16, fontWeight: '600' },
  sub: { fontSize: 13, marginTop: 3, lineHeight: 19 },
  widget: { marginTop: 14, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  foot: { textAlign: 'center', fontSize: 12, marginTop: 10 },
});
