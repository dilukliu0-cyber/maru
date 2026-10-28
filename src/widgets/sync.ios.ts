import { addDays, DOWS_SHORT, keyOf, MONTHS_GEN, toMin } from '../date';
import { Item, sortItems } from '../store';
import { DayRingWidget, type DayRingProps } from './index';

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

// Состояние виджета на момент `at` (каждый час — своя запись в расписании).
function build(items: Item[], at: Date): DayRingProps {
  const key = keyOf(at);
  const nm = at.getHours() * 60 + at.getMinutes();
  const evs = sortItems(items.filter((i) => i.date === key && i.type === 'event'));
  const segs = Array.from({ length: 24 }, (_, h) => {
    const busy = evs.some((e) => {
      if (e.kind === 'range') return toMin(e.start!) < (h + 1) * 60 && toMin(e.end!) > h * 60;
      if (e.kind === 'point') return Math.floor(toMin(e.start!) / 60) === h;
      return false;
    });
    const past = (h + 1) * 60 <= nm;
    return busy ? (past ? 3 : 2) : past ? 1 : 0;
  });
  const next =
    evs.find((e) => e.kind === 'range' && toMin(e.start!) <= nm && nm < toMin(e.end!)) ??
    evs.find((e) => e.kind !== 'allday' && toMin(e.start!) >= nm);
  const allDay = evs.find((e) => e.kind === 'allday');
  return {
    segs,
    date: `${DOWS_SHORT[at.getDay()]}, ${at.getDate()} ${MONTHS_GEN[at.getMonth()]}`,
    next: next ? clip(next.title, 28) : allDay ? clip(allDay.title, 28) : 'Дальше — свободно',
    nextTime: next ? next.start! : '',
    frac: nm / 1440,
  };
}

export function syncWidgets(items: Item[]) {
  try {
    const now = new Date();
    const entries: { date: Date; props: DayRingProps }[] = [{ date: now, props: build(items, now) }];
    // Обновление каждые 15 минут до конца завтрашнего дня.
    const first = new Date(now);
    first.setMinutes(Math.floor(now.getMinutes() / 15) * 15 + 15, 0, 0);
    const until = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), 2);
    for (let d = first; d < until; d = new Date(+d + 15 * 60000)) entries.push({ date: d, props: build(items, d) });
    DayRingWidget.updateTimeline(entries);
  } catch {
    // Виджеты недоступны — приложение работает без них.
  }
}
