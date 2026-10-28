import { Circle, Gauge, Rectangle, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  clipShape,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  gaugeStyle,
  lineLimit,
  multilineTextAlignment,
  offset,
  opacity,
  rotationEffect,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type DayRingProps = {
  q: string; // 96 символов по 15 минут: 0 — пусто, 1 — событие впереди, 2 — событие прошло
  pts: number[]; // события «точно», минуты от полуночи
  now: number; // минуты от полуночи на момент записи
  night: boolean;
  label: string;
  big: string;
  name: string;
  time: string;
  date: string;
  next: string;
  nextTime: string;
  frac: number;
};

// Код внутри функции с 'widget' не видит ничего снаружи — всё объявлено внутри.
const DayRingLayout = (p: DayRingProps, env: WidgetEnvironment) => {
  'widget';
  const f = env.widgetFamily;
  const dark = env.colorScheme !== 'light';
  const C = dark
    ? { bg: '#0B0B0B', ring: '#3A3A3A', night: '#262626', inner: '#262626', seg: '#1F1F1E', segNight: '#2E2E2C', ink: '#F2F2EF', muted: '#7D7D79', ev: '#6E6E6C', evPast: '#4A4A48' }
    : { bg: '#FFFFFF', ring: '#E4E4E1', night: '#D0D0CC', inner: '#F1F1EE', seg: '#E9E9E6', segNight: '#D9D9D4', ink: '#111111', muted: '#9B9B97', ev: '#8C8C88', evPast: '#BEBEBA' };

  // Угол часа: 00:00 внизу, 12:00 вверху, по часовой стрелке.
  const deg = (min: number) => ((min - 720) / 1440) * 360;
  const at = (min: number, r: number) => {
    const a = (deg(min) * Math.PI) / 180;
    return { x: r * Math.sin(a), y: -r * Math.cos(a) };
  };
  // Прямоугольник, повёрнутый по радиусу и сдвинутый на окружность радиуса r.
  const block = (key: string, min: number, r: number, w: number, h: number, color: string, op = 1) => {
    const o = at(min, r);
    return (
      <Rectangle
        key={key}
        modifiers={[frame({ width: w, height: h }), foregroundStyle(color), opacity(op), rotationEffect(deg(min)), offset({ x: o.x, y: o.y })]}
      />
    );
  };
  const quarters = (r: number, w: number, h: number, future: string, past: string) =>
    p.q.split('').map((c, i) => (c === '0' ? null : block(`q${i}`, i * 15 + 7.5, r, w, h, c === '1' ? future : past)));

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

  if (f === 'systemLarge' || f === 'systemExtraLarge') {
    // Кольцо суток как в приложении.
    const R = 112;
    const handMid = at(p.now, R);
    return (
      <ZStack modifiers={[containerBackground(C.bg, 'widget'), widgetURL('maru://day')]}>
        {Array.from({ length: 24 }, (_, h) => block(`h${h}`, h * 60 + 30, R, 27, 26, h < 6 && p.night ? C.segNight : C.seg))}
        {p.q.split('').map((c, i) => (c === '0' ? null : block(`e${i}`, i * 15 + 7.5, R, 7.9, 26, C.ink, c === '1' ? 0.38 : 0.16)))}
        {p.pts.map((m, i) => {
          const o = at(m, R);
          return (
            <ZStack key={`p${i}`} modifiers={[offset({ x: o.x, y: o.y })]}>
              <Circle modifiers={[frame({ width: 15, height: 15 }), foregroundStyle(C.bg)]} />
              <Circle modifiers={[frame({ width: 11, height: 11 }), foregroundStyle(C.ink), opacity(m < p.now ? 0.3 : 1)]} />
            </ZStack>
          );
        })}
        {block('hand', p.now, 112, 2, 44, C.ink)}
        <Circle modifiers={[frame({ width: 9, height: 9 }), foregroundStyle(C.ink), offset({ x: handMid.x, y: handMid.y })]} />
        <Circle modifiers={[frame({ width: 4.5, height: 4.5 }), foregroundStyle(C.bg), offset({ x: handMid.x, y: handMid.y })]} />
        {Array.from({ length: 24 }, (_, h) => {
          const o = at(h * 60, 145);
          return (
            <Text key={`l${h}`} modifiers={[font({ size: 9.5, design: 'monospaced' }), foregroundStyle(C.muted), offset({ x: o.x, y: o.y })]}>
              {String(h)}
            </Text>
          );
        })}
        <VStack spacing={4} modifiers={[frame({ width: 150 })]}>
          <Text modifiers={[font({ size: 10, weight: 'semibold' }), foregroundStyle(C.muted), lineLimit(1)]}>{p.label.toUpperCase()}</Text>
          <Text modifiers={[font({ size: 28, weight: 'semibold', design: 'monospaced' }), foregroundStyle(C.ink), lineLimit(1)]}>{p.big}</Text>
          <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundStyle(C.ink), lineLimit(2), multilineTextAlignment('center')]}>{p.name}</Text>
          {p.time ? <Text modifiers={[font({ size: 11, design: 'monospaced' }), foregroundStyle(C.muted)]}>{p.time}</Text> : null}
        </VStack>
      </ZStack>
    );
  }

  // Маленький: сплошное кольцо, ночная четверть темнее, события выступают наружу.
  const D = 128;
  return (
    <ZStack modifiers={[containerBackground(C.bg, 'widget'), widgetURL('maru://day')]}>
      <ZStack modifiers={[frame({ width: D, height: D }), clipShape('circle')]}>
        <Rectangle modifiers={[foregroundStyle(C.ring)]} />
        {p.night ? <Rectangle modifiers={[frame({ width: D / 2, height: D / 2 }), foregroundStyle(C.night), offset({ x: -D / 4, y: D / 4 })]} /> : null}
      </ZStack>
      <Circle modifiers={[frame({ width: 62, height: 62 }), foregroundStyle(C.inner)]} />
      {quarters(58, 4.4, 20, C.ev, C.evPast)}
      {p.pts.map((m, i) => block(`p${i}`, m, 58, 5, 20, m < p.now ? C.evPast : C.ev))}
      {block('hand', p.now, 48.5, 3, 36, C.ink)}
      <Text modifiers={[font({ size: 15 }), foregroundStyle(C.ink), lineLimit(1)]}>{p.nextTime || 'сегодня'}</Text>
    </ZStack>
  );
};

export const DayRingWidget = createWidget<DayRingProps>('DayRingWidget', DayRingLayout);
