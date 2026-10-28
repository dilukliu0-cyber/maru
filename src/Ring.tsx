import { memo } from 'react';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import { toMin } from './date';
import { isPast, Item } from './store';
import { MONO, Theme } from './theme';

// 00:00 внизу, 12:00 вверху — как на эскизе.
export function polar(cx: number, cy: number, r: number, mins: number): [number, number] {
  const a = ((mins - 720) / 1440) * Math.PI * 2;
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
}
export function arcPath(cx: number, cy: number, r: number, m1: number, m2: number) {
  const [x1, y1] = polar(cx, cy, r, m1);
  const [x2, y2] = polar(cx, cy, r, m2);
  const large = m2 - m1 > 720 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

type Props = {
  t: Theme;
  size: number;
  items: Item[];
  isToday: boolean;
  nowMin: number;
  selectedId: string | null;
  showNight: boolean;
  onSelect: (id: string) => void;
};

const C = 180;
const R = 128;

function RingImpl({ t, size, items, isToday, nowMin, selectedId, showNight, onSelect }: Props) {
  const events = items.filter((i) => i.type === 'event');
  const allDay = items.filter((i) => i.kind === 'allday').slice(0, 2);

  return (
    <Svg width={size} height={size} viewBox="0 0 360 360">
      {allDay.map((it, idx) => (
        <Circle
          key={it.id}
          cx={C}
          cy={C}
          r={149 + idx * 5.5}
          fill="none"
          strokeWidth={3}
          stroke={it.type === 'event' ? t.ink : t.muted}
          opacity={0.75}
        />
      ))}

      {Array.from({ length: 24 }, (_, h) => (
        <Path
          key={h}
          d={arcPath(C, C, R, h * 60 + 2, h * 60 + 58)}
          fill="none"
          strokeWidth={30}
          stroke={h < 6 && showNight ? t.segNight : t.seg}
        />
      ))}

      {events.map((ev) => {
        const sel = ev.id === selectedId;
        const past = isToday && isPast(ev, nowMin);
        if (ev.kind === 'range') {
          const s = toMin(ev.start!);
          const e = toMin(ev.end!);
          return (
            <G key={ev.id} onPress={() => onSelect(ev.id)}>
              <Path d={arcPath(C, C, R, s + 1, e - 1)} fill="none" strokeWidth={30} stroke={t.ink} opacity={sel ? 1 : past ? 0.16 : 0.38} />
              <Path d={arcPath(C, C, R, s, e)} fill="none" strokeWidth={44} stroke="transparent" />
            </G>
          );
        }
        if (ev.kind === 'point') {
          const [x, y] = polar(C, C, R, toMin(ev.start!));
          return (
            <G key={ev.id} onPress={() => onSelect(ev.id)}>
              <Circle cx={x} cy={y} r={sel ? 8 : 6.5} fill={t.ink} stroke={t.bg} strokeWidth={2} opacity={past && !sel ? 0.3 : 1} />
              <Circle cx={x} cy={y} r={15} fill="transparent" />
            </G>
          );
        }
        return null;
      })}

      {isToday && <NowHand t={t} nowMin={nowMin} />}

      {Array.from({ length: 24 }, (_, h) => {
        const [x, y] = polar(C, C, 167, h * 60);
        return (
          <SvgText key={h} x={x} y={y + 3.8} textAnchor="middle" fontSize={10.5} fontFamily={MONO} fill={t.muted}>
            {String(h)}
          </SvgText>
        );
      })}
    </Svg>
  );
}

function NowHand({ t, nowMin }: { t: Theme; nowMin: number }) {
  const a1 = polar(C, C, 100, nowMin);
  const a2 = polar(C, C, 152, nowMin);
  const am = polar(C, C, R, nowMin);
  return (
    <G>
      <Line x1={a1[0]} y1={a1[1]} x2={a2[0]} y2={a2[1]} strokeWidth={2} strokeLinecap="round" stroke={t.ink} />
      <Circle cx={am[0]} cy={am[1]} r={4} fill={t.bg} stroke={t.ink} strokeWidth={2.2} />
    </G>
  );
}

export const Ring = memo(RingImpl);

// Мини-кольцо для карточки виджета в настройках.
export function MiniRing({ t, size, nowMin, nextMin }: { t: Theme; size: number; nowMin: number; nextMin: number | null }) {
  const c = 36;
  const frac = nowMin / 1440;
  const p = nextMin != null ? polar(c, c, 29, nextMin) : null;
  return (
    <Svg width={size} height={size} viewBox="0 0 72 72">
      <Circle cx={c} cy={c} r={29} fill="none" strokeWidth={5.5} stroke={t.soft2} />
      {frac > 0.002 && <Path d={arcPath(c, c, 29, 720, 720 + frac * 1440)} fill="none" strokeWidth={5.5} strokeLinecap="round" stroke={t.ink} />}
      {p && <Circle cx={p[0]} cy={p[1]} r={3.4} fill={t.ink} stroke={t.soft} strokeWidth={1.6} />}
    </Svg>
  );
}
