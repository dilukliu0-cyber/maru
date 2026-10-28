import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { addDays, DOWS_SHORT, fromMin, keyOf, MONTHS_GEN, parseKey, toMin } from './date';
import { ChevronLeft, ChevronRight, Close } from './Icons';
import { Item, ItemType, Kind, NoteMode, useStore } from './store';
import { useTheme } from './theme';
import { TimeField } from './TimeField';
import { IconButton, MicroLabel, Segmented, success, tap } from './ui';

type Props = {
  visible: boolean;
  editing: Item | null;
  date: Date;
  onClose: () => void;
  onDone: (msg: string, date?: Date) => void;
};

function confirmDelete(title: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`Удалить «${title}»?`)) onYes();
    return;
  }
  Alert.alert('Удалить?', `«${title}» исчезнет без возможности вернуть.`, [
    { text: 'Отмена', style: 'cancel' },
    { text: 'Удалить', style: 'destructive', onPress: onYes },
  ]);
}

// Ближайший «круглый» час после текущего — по умолчанию для нового события.
function defaultStart() {
  const n = new Date();
  return Math.min(23 * 60, (n.getHours() + 1) * 60);
}

const dayShort = (d: Date) => `${DOWS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;

// Выбор дня стрелками: ‹ чт, 29 октября ›. Раньше `min` уйти нельзя.
function DayStepper({ value, onChange, min }: { value: Date; onChange: (d: Date) => void; min?: Date }) {
  const t = useTheme();
  const canBack = !min || keyOf(value) > keyOf(min);
  return (
    <View style={[st.stepper, { borderColor: t.hair }]}>
      <IconButton size={32} onPress={() => canBack && (tap(), onChange(addDays(value, -1)))} label="День назад">
        <ChevronLeft size={17} color={canBack ? t.inkSoft : t.faint} />
      </IconButton>
      <Text numberOfLines={1} style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: t.ink }}>
        {dayShort(value)}
      </Text>
      <IconButton size={32} onPress={() => (tap(), onChange(addDays(value, 1)))} label="День вперёд">
        <ChevronRight size={17} color={t.inkSoft} />
      </IconButton>
    </View>
  );
}

export function AddSheet({ visible, editing, date, onClose, onDone }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { addItem, updateItem, removeItem } = useStore();

  const [type, setType] = useState<ItemType>('event');
  const [kind, setKind] = useState<Kind>('range');
  const [noteMode, setNoteMode] = useState<NoteMode>('day');
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('13:00');
  const [end, setEnd] = useState('14:00');
  const [point, setPoint] = useState('18:00');
  const [day, setDay] = useState(date);
  const [endDay, setEndDay] = useState(date);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setError('');
    if (editing) {
      setType(editing.type);
      setKind(editing.kind);
      setNoteMode(editing.noteMode ?? 'open');
      setTitle(editing.title);
      setStart(editing.kind === 'range' ? editing.start! : '13:00');
      setEnd(editing.kind === 'range' ? editing.end! : '14:00');
      setPoint(editing.kind === 'point' ? editing.start! : '18:00');
      setDay(parseKey(editing.date));
      setEndDay(parseKey(editing.endDate ?? editing.date));
    } else {
      const s = defaultStart();
      setType('event');
      setKind('range');
      setNoteMode('day');
      setTitle('');
      setStart(fromMin(s));
      setEnd(fromMin(Math.min(s + 60, 23 * 60 + 59)));
      setPoint(fromMin(s));
      setDay(date);
      setEndDay(date);
    }
  }, [visible, editing, date]);

  // Конец не раньше начала: двигаем день конца вместе с днём начала.
  const changeDay = (d: Date) => {
    setDay(d);
    if (keyOf(endDay) < keyOf(d)) setEndDay(d);
    setError('');
  };

  const submit = () => {
    const name = title.trim();
    if (!name) return setError('Впиши название');
    const k0 = keyOf(day);
    const k1 = keyOf(endDay);
    let base: Omit<Item, 'id' | 'created'>;
    if (type === 'event') {
      const multi = kind === 'range' && k1 > k0;
      if (kind === 'range' && !multi && toMin(end) <= toMin(start)) return setError('Конец должен быть позже начала');
      base = {
        type,
        kind,
        title: name,
        date: k0,
        endDate: multi ? k1 : undefined,
        start: kind === 'range' ? start : kind === 'point' ? point : undefined,
        end: kind === 'range' ? end : undefined,
      };
    } else {
      const mode: NoteMode = noteMode === 'span' && k1 <= k0 ? 'day' : noteMode;
      base = { type, kind: 'allday', noteMode: mode, title: name, date: k0, endDate: mode === 'span' ? k1 : undefined };
    }
    success();
    if (editing) {
      updateItem(editing.id, { ...base, start: base.start, end: base.end, endDate: base.endDate });
      onDone('Сохранено', day);
    } else {
      addItem({ ...base, done: type === 'note' ? false : undefined });
      onDone(type === 'event' ? 'Событие добавлено' : 'Заметка добавлена', day);
    }
  };

  const heading = editing ? (type === 'event' ? 'Событие' : 'Заметка') : type === 'event' ? 'Новое событие' : 'Новая заметка';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: t.backdrop }]} onPress={onClose} accessibilityLabel="Закрыть" />
        <View style={[st.sheet, { backgroundColor: t.bg, paddingBottom: 22 + insets.bottom }]}>
          <View style={[st.grip, { backgroundColor: t.faint }]} />
          <View style={st.head}>
            <View style={{ flex: 1 }}>
              <Text style={[st.title, { color: t.ink }]}>{heading}</Text>
            </View>
            <IconButton onPress={onClose} label="Закрыть">
              <Close color={t.ink} />
            </IconButton>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View style={st.field}>
              <MicroLabel style={st.label}>Тип</MicroLabel>
              <Segmented
                value={type}
                onChange={(v) => {
                  setType(v);
                  setError('');
                }}
                options={[
                  { value: 'event', label: 'Событие' },
                  { value: 'note', label: 'Заметка' },
                ]}
              />
            </View>

            <View style={st.field}>
              <MicroLabel style={st.label}>Название</MicroLabel>
              <TextInput
                value={title}
                onChangeText={(v) => {
                  setTitle(v);
                  if (error) setError('');
                }}
                placeholder={type === 'event' ? 'Например, тренировка' : 'Например, купить хлеб'}
                placeholderTextColor={t.muted}
                autoFocus={!editing}
                returnKeyType="done"
                onSubmitEditing={submit}
                style={[st.input, { borderColor: t.hair, color: t.ink }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]}
              />
            </View>

            {type === 'event' ? (
              <>
                <View style={st.field}>
                  <MicroLabel style={st.label}>Когда</MicroLabel>
                  <Segmented
                    value={kind}
                    onChange={(k) => {
                      setKind(k);
                      setError('');
                    }}
                    options={[
                      { value: 'range', label: 'Промежуток' },
                      { value: 'point', label: 'Точно' },
                      { value: 'allday', label: 'Весь день' },
                    ]}
                  />
                </View>

                {kind === 'range' ? (
                  <>
                    <View style={st.field}>
                      <Text style={[st.tl, { color: t.muted }]}>Начало</Text>
                      <View style={st.when}>
                        <DayStepper value={day} onChange={changeDay} />
                        <View style={st.time}>
                          <TimeField value={start} onChange={setStart} />
                        </View>
                      </View>
                    </View>
                    <View style={st.fieldTight}>
                      <Text style={[st.tl, { color: t.muted }]}>Конец</Text>
                      <View style={st.when}>
                        <DayStepper value={endDay} onChange={(d) => (setEndDay(d), setError(''))} min={day} />
                        <View style={st.time}>
                          <TimeField value={end} onChange={setEnd} />
                        </View>
                      </View>
                    </View>
                  </>
                ) : (
                  <View style={st.field}>
                    <Text style={[st.tl, { color: t.muted }]}>{kind === 'point' ? 'День и время' : 'День'}</Text>
                    <View style={st.when}>
                      <DayStepper value={day} onChange={changeDay} />
                      {kind === 'point' && (
                        <View style={st.time}>
                          <TimeField value={point} onChange={setPoint} />
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </>
            ) : (
              <>
                <View style={st.field}>
                  <MicroLabel style={st.label}>Срок</MicroLabel>
                  <Segmented
                    value={noteMode}
                    onChange={(m) => {
                      setNoteMode(m);
                      setError('');
                      if (m === 'span' && keyOf(endDay) <= keyOf(day)) setEndDay(addDays(day, 1));
                    }}
                    options={[
                      { value: 'day', label: 'День' },
                      { value: 'span', label: 'Период' },
                      { value: 'open', label: 'Бессрочно' },
                    ]}
                  />
                </View>
                <View style={st.field}>
                  <Text style={[st.tl, { color: t.muted }]}>{noteMode === 'day' ? 'День' : 'С'}</Text>
                  <DayStepper value={day} onChange={changeDay} />
                </View>
                {noteMode === 'span' && (
                  <View style={st.fieldTight}>
                    <Text style={[st.tl, { color: t.muted }]}>По</Text>
                    <DayStepper value={endDay} onChange={(d) => (setEndDay(d), setError(''))} min={addDays(day, 1)} />
                  </View>
                )}
                <Text style={[st.hint, { color: t.muted }]}>
                  {noteMode === 'day'
                    ? 'Только в этот день.'
                    : noteMode === 'span'
                      ? 'Видна каждый день периода.'
                      : 'Пока не закроешь — переходит на следующие дни.'}
                </Text>
              </>
            )}

            {!!error && <Text style={[st.error, { color: t.ink }]}>{error}</Text>}

            <Pressable onPress={submit} style={({ pressed }) => [st.submit, { backgroundColor: t.ink, opacity: pressed ? 0.85 : 1 }]}>
              <Text style={{ color: t.onInk, fontSize: 16, fontWeight: '600' }}>{editing ? 'Сохранить' : 'Добавить'}</Text>
            </Pressable>
            {editing && (
              <Pressable
                onPress={() =>
                  confirmDelete(editing.title, () => {
                    removeItem(editing.id);
                    onDone('Удалено');
                  })
                }
                style={st.delete}
              >
                <Text style={{ color: t.muted, fontSize: 15, fontWeight: '600' }}>Удалить</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const st = StyleSheet.create({
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 14, paddingHorizontal: 22, maxHeight: '92%' },
  grip: { width: 38, height: 4.5, borderRadius: 99, alignSelf: 'center', marginBottom: 10 },
  head: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 19, fontWeight: '700' },
  stepper: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 2, minHeight: 46 },
  when: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  time: { width: 96 },
  field: { marginTop: 16 },
  fieldTight: { marginTop: 10 },
  label: { marginBottom: 9 },
  input: { borderWidth: 1, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 14, fontSize: 16 },
  tl: { fontSize: 11.5, fontWeight: '500', marginBottom: 6 },
  hint: { fontSize: 12.5, marginTop: 10, lineHeight: 17 },
  error: { marginTop: 14, fontSize: 13.5, fontWeight: '600', textAlign: 'center' },
  submit: { marginTop: 22, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  delete: { marginTop: 6, paddingVertical: 12, alignItems: 'center' },
});
