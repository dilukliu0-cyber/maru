import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { addDays, dayLong, fromMin, keyOf, parseKey, toMin } from './date';
import { ChevronLeft, ChevronRight, Close } from './Icons';
import { Item, ItemType, Kind, useStore } from './store';
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

export function AddSheet({ visible, editing, date, onClose, onDone }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { addItem, updateItem, removeItem } = useStore();

  const [type, setType] = useState<ItemType>('event');
  const [kind, setKind] = useState<Kind>('range');
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('13:00');
  const [end, setEnd] = useState('14:00');
  const [point, setPoint] = useState('18:00');
  const [day, setDay] = useState(date);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setError('');
    if (editing) {
      setType(editing.type);
      setKind(editing.kind);
      setTitle(editing.title);
      setStart(editing.kind === 'range' ? editing.start! : '13:00');
      setEnd(editing.kind === 'range' ? editing.end! : '14:00');
      setPoint(editing.kind === 'point' ? editing.start! : '18:00');
      setDay(parseKey(editing.date));
    } else {
      const s = defaultStart();
      setType('event');
      setKind('range');
      setTitle('');
      setStart(fromMin(s));
      setEnd(fromMin(Math.min(s + 60, 23 * 60 + 59)));
      setPoint(fromMin(s));
      setDay(date);
    }
  }, [visible, editing, date]);

  const submit = () => {
    const name = title.trim();
    if (!name) return setError('Впиши название');
    if (kind === 'range' && toMin(end) <= toMin(start)) return setError('Конец должен быть позже начала');
    const base = {
      type,
      kind,
      title: name,
      date: keyOf(day),
      start: kind === 'range' ? start : kind === 'point' ? point : undefined,
      end: kind === 'range' ? end : undefined,
    };
    success();
    if (editing) {
      updateItem(editing.id, base);
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

          <View style={[st.dayRow, { borderColor: t.hair }]}>
            <IconButton size={34} onPress={() => (tap(), setDay(addDays(day, -1)))} label="День назад">
              <ChevronLeft size={18} color={t.inkSoft} />
            </IconButton>
            <Text style={{ fontSize: 14.5, fontWeight: '600', color: t.ink }}>{dayLong(day)}</Text>
            <IconButton size={34} onPress={() => (tap(), setDay(addDays(day, 1)))} label="День вперёд">
              <ChevronRight size={18} color={t.inkSoft} />
            </IconButton>
          </View>

          <View style={st.field}>
            <MicroLabel style={st.label}>Тип</MicroLabel>
            <Segmented
              value={type}
              onChange={setType}
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

          {kind === 'range' && (
            <View style={[st.field, st.times]}>
              <View style={{ flex: 1 }}>
                <Text style={[st.tl, { color: t.muted }]}>Начало</Text>
                <TimeField value={start} onChange={setStart} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[st.tl, { color: t.muted }]}>Конец</Text>
                <TimeField value={end} onChange={setEnd} />
              </View>
            </View>
          )}
          {kind === 'point' && (
            <View style={st.field}>
              <Text style={[st.tl, { color: t.muted }]}>Время</Text>
              <TimeField value={point} onChange={setPoint} />
            </View>
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
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const st = StyleSheet.create({
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 14, paddingHorizontal: 22 },
  grip: { width: 38, height: 4.5, borderRadius: 99, alignSelf: 'center', marginBottom: 10 },
  head: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 19, fontWeight: '700' },
  dayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 4, paddingVertical: 2 },
  field: { marginTop: 16 },
  label: { marginBottom: 9 },
  input: { borderWidth: 1, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 14, fontSize: 16 },
  times: { flexDirection: 'row', gap: 10 },
  tl: { fontSize: 11.5, fontWeight: '500', marginBottom: 6 },
  error: { marginTop: 14, fontSize: 13.5, fontWeight: '600', textAlign: 'center' },
  submit: { marginTop: 22, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  delete: { marginTop: 6, paddingVertical: 12, alignItems: 'center' },
});
