export const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
export const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
export const DOWS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
export const DOWS_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
export const WEEK_HEAD = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const pad = (n: number) => (n < 10 ? '0' : '') + n;
export const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const todayKey = () => keyOf(new Date());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
export const fromMin = (m: number) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
export const nowMinutes = (d = new Date()) => d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
export const atTime = (key: string, t: string) => {
  const d = parseKey(key);
  const [h, m] = t.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
};

// До часа — «мм:сс», дальше — «ч:мм».
export function fmtDur(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 3600) return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  return `${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}`;
}

export function fmtClock(sec: number) {
  sec = Math.max(0, Math.ceil(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function fmtLength(min: number) {
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
}

export const dayLong = (d: Date) => `${DOWS[d.getDay()]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
