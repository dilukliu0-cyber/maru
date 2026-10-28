import DateTimePicker from '@react-native-community/datetimepicker';
import { View } from 'react-native';

import { pad } from './date';
import { useTheme } from './theme';

// Системный компактный выбор времени iOS: пилюля, по нажатию — колесо.
export function TimeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useTheme();
  const [h, m] = value.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return (
    <View style={{ alignItems: 'flex-start' }}>
      <DateTimePicker
        value={d}
        mode="time"
        display="compact"
        locale="ru-RU"
        minuteInterval={5}
        themeVariant={t.dark ? 'dark' : 'light'}
        accentColor={t.ink}
        onChange={(_, date) => date && onChange(`${pad(date.getHours())}:${pad(date.getMinutes())}`)}
      />
    </View>
  );
}
