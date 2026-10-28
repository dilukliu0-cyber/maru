import { Gauge, RoundedRectangle, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  frame,
  gaugeStyle,
  lineLimit,
  offset,
  padding,
  rotationEffect,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

// segs: 24 часа, 0 — впереди, 1 — прошло, 2 — событие впереди, 3 — событие прошло.
export type DayRingProps = { segs: number[]; date: string; next: string; nextTime: string; frac: number };

// Код внутри функции с 'widget' не видит ничего снаружи — всё объявлено внутри.
const DayRingLayout = (p: DayRingProps, env: WidgetEnvironment) => {
  'widget';
  const f = env.widgetFamily;
  const INK = '#F4F4F1';
  const GREY = '#8E8E8A';
  const COLORS = ['#2A2A28', '#5C5C59', '#F4F4F1', '#8E8E8A'];

  if (f === 'accessoryInline') return <Text>{p.nextTime ? `${p.nextTime} · ${p.next}` : p.next}</Text>;
  if (f === 'accessoryCircular') {
    return (
      <Gauge value={p.frac} modifiers={[gaugeStyle('circularCapacity')]} currentValueLabel={<Text>{p.nextTime || '—'}</Text>}>
        <Text>maru</Text>
      </Gauge>
    );
  }
  if (f === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={1}>
        <Text modifiers={[font({ size: 12, weight: 'semibold' })]}>{p.date}</Text>
        <Text modifiers={[font({ size: 17, weight: 'semibold' }), lineLimit(1)]}>{p.next}</Text>
        <Text modifiers={[font({ size: 12, design: 'monospaced' })]}>{p.nextTime || 'весь день свободен'}</Text>
      </VStack>
    );
  }

  const R = 56;
  return (
    <ZStack modifiers={[padding({ all: 0 }), containerBackground('#000000', 'widget'), widgetURL('maru://day')]}>
      {p.segs.map((s, h) => (
        <RoundedRectangle
          key={h}
          cornerRadius={2}
          modifiers={[
            frame({ width: 10, height: 15 }),
            foregroundStyle(COLORS[s] ?? COLORS[0]),
            offset({ y: -R }),
            rotationEffect(180 + h * 15 + 7.5),
          ]}
        />
      ))}
      <VStack spacing={2} modifiers={[frame({ width: 82 })]}>
        <Text modifiers={[font({ size: 20, weight: 'semibold', design: 'monospaced' }), foregroundStyle(INK)]}>{p.nextTime || p.date}</Text>
        <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundStyle(GREY), lineLimit(2)]}>{p.next}</Text>
      </VStack>
    </ZStack>
  );
};

export const DayRingWidget = createWidget<DayRingProps>('DayRingWidget', DayRingLayout);
