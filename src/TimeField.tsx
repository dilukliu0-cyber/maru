import { useEffect, useState } from 'react';
import { TextInput } from 'react-native';

import { pad } from './date';
import { MONO, useTheme } from './theme';

// Запасной ввод времени (браузерный предпросмотр): «ЧЧ:ММ».
export function TimeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useTheme();
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <TextInput
      value={text}
      onChangeText={setText}
      onBlur={() => {
        const m = text.match(/^(\d{1,2})[:.\s]?(\d{2})$/);
        if (m && +m[1] < 24 && +m[2] < 60) onChange(`${pad(+m[1])}:${m[2]}`);
        else setText(value);
      }}
      maxLength={5}
      keyboardType="numbers-and-punctuation"
      style={{
        borderWidth: 1,
        borderColor: t.hair,
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 12,
        fontSize: 16,
        color: t.ink,
        fontFamily: MONO,
      }}
    />
  );
}
