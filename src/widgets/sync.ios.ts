import { addDays, atTime, DOWS_SHORT, fmtLength, keyOf, MONTHS_GEN, shortDate, toMin } from '../date';
import { DayItem, eventsOn, focusEventFor, Item, sortItems } from '../store';
import { DayRingWidget, type DayRingProps } from './index';

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

// Состояние виджета на момент `at` (отдельная запись расписания на каждые 10–15 минут).
function build(items: Item[], at: Date, night: boolean): DayRingProps {
  const key = keyOf(at);
  const nm = at.getHours() * 60 + at.getMinutes();
  const evs = sortItems(eventsOn(items, key));

  const q = Array.from({ length: 96 }, (_, i) => {
    const s = i * 15;
    const busy = evs.some((e) => e.kind === 'range' && toMin(e.start!) < s + 15 && toMin(e.end!) > s);
    return busy ? (s + 15 <= nm ? '2' : '1') : '0';
  }).join('');
  const pts = evs.filter((e) => e.kind === 'point').map((e) => toMin(e.start!));

  const next =
    evs.find((e) => e.kind === 'range' && toMin(e.start!) <= nm && nm < toMin(e.end!)) ??
    evs.find((e) => e.kind !== 'allday' && toMin(e.start!) >= nm);
  const allDay = evs.find((e) => e.kind === 'allday');

  // Центр большого виджета — как центр кольца в приложении.
  const ev = focusEventFor(evs, true, nm) as DayItem | null;
  let label = 'планов нет';
  let big = '—';
  let name = 'Свободный день';
  let time = '';
  if (ev) {
    name = clip(ev.title, 40);
    if (ev.kind === 'allday') {
      label = 'сегодня · весь день';
      big = 'весь день';
    } else {
      const s = toMin(ev.start!);
      const e = ev.kind === 'range' ? toMin(ev.end!) : s;
      const sp = ev.span;
      time = sp
        ? key === sp.date
          ? `${sp.start} → ${shortDate(sp.endDate)} ${sp.end}`
          : `до ${shortDate(sp.endDate)} ${sp.end}`
        : ev.kind === 'range'
          ? `${ev.start} – ${ev.end}`
          : `в ${ev.start}`;
      if (ev.kind === 'range' && s <= nm && nm < e) {
        label = 'сейчас идёт · осталось';
        // У многодневного — до настоящего конца, а не до полуночи.
        big = sp ? fmtLength(Math.round((+atTime(sp.endDate, sp.end) - +at) / 60000)) : fmtLength(e - nm);
      } else if (s > nm) {
        label = 'начнётся через';
        big = fmtLength(s - nm);
      } else {
        label = 'уже прошло';
        big = ev.start!;
      }
    }
  }

  return {
    q,
    pts,
    now: nm,
    night,
    label,
    big,
    name,
    time,
    date: `${DOWS_SHORT[at.getDay()]}, ${at.getDate()} ${MONTHS_GEN[at.getMonth()]}`,
    next: next ? clip(next.title, 28) : allDay ? clip(allDay.title, 28) : 'Дальше — свободно',
    nextTime: next ? next.start! : '',
    frac: nm / 1440,
  };
}

export function syncWidgets(items: Item[], night = true) {
  try {
    const now = new Date();
    const entries: { date: Date; props: DayRingProps }[] = [{ date: now, props: build(items, now, night) }];
    const midnight = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), 1);
    // Сегодня — каждые 10 минут (отсчёт в центре), завтра — каждые 15.
    const first = new Date(now);
    first.setMinutes(Math.floor(now.getMinutes() / 10) * 10 + 10, 0, 0);
    for (let d = first; d < midnight; d = new Date(+d + 10 * 60000)) entries.push({ date: d, props: build(items, d, night) });
    const until = addDays(midnight, 1);
    for (let d = midnight; d < until; d = new Date(+d + 15 * 60000)) entries.push({ date: d, props: build(items, d, night) });
    DayRingWidget.updateTimeline(entries);
  } catch {
    // Виджеты недоступны — приложение работает без них.
  }
}

