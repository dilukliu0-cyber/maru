import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

type P = { size?: number; color: string; width?: number; fill?: string };

export const ChevronLeft = ({ size = 22, color, width = 2 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="14.5 5.5 8 12 14.5 18.5" />
  </Svg>
);
export const ChevronRight = ({ size = 22, color, width = 2 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="9.5 5.5 16 12 9.5 18.5" />
  </Svg>
);
export const ChevronDown = ({ size = 17, color, width = 2.2 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="5.5 9.5 12 16 18.5 9.5" />
  </Svg>
);
export const Plus = ({ size = 24, color, width = 2.2 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round">
    <Line x1="12" y1="5" x2="12" y2="19" />
    <Line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);
export const Close = ({ size = 20, color, width = 2 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round">
    <Line x1="6" y1="6" x2="18" y2="18" />
    <Line x1="18" y1="6" x2="6" y2="18" />
  </Svg>
);
export const Stopwatch = ({ size = 16, color, width = 1.9 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round">
    <Circle cx="12" cy="13.4" r="7.6" />
    <Polyline points="12 9.6 12 13.4 14.6 15" />
    <Line x1="9.5" y1="2.6" x2="14.5" y2="2.6" />
    <Line x1="12" y1="2.6" x2="12" y2="5.8" />
  </Svg>
);
export const Check = ({ size = 11, color, width = 3.4 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="4.5 12.5 9.5 17.5 19.5 6.5" />
  </Svg>
);
export const DayIcon = ({ size = 23, color, width = 1.8 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round">
    <Circle cx="12" cy="12" r="8.6" />
    <Polyline points="12 7.6 12 12 15 14" />
  </Svg>
);
export const MonthIcon = ({ size = 23, color, width = 1.8 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width}>
    <Rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <Line x1="3.5" y1="10" x2="20.5" y2="10" />
    <Line x1="8.3" y1="3" x2="8.3" y2="6.6" />
    <Line x1="15.7" y1="3" x2="15.7" y2="6.6" />
  </Svg>
);
export const SettingsIcon = ({ size = 23, color, width = 1.8, fill }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round">
    <Line x1="4" y1="7.5" x2="20" y2="7.5" />
    <Circle cx="9" cy="7.5" r="2.3" fill={fill} />
    <Line x1="4" y1="16.5" x2="20" y2="16.5" />
    <Circle cx="15.5" cy="16.5" r="2.3" fill={fill} />
  </Svg>
);
export const Play = ({ size = 26, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M8 5.5v13l11-6.5Z" />
  </Svg>
);
export const Pause = ({ size = 26, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Rect x="6.5" y="5.5" width="4" height="13" rx="1.2" />
    <Rect x="13.5" y="5.5" width="4" height="13" rx="1.2" />
  </Svg>
);
export const Reset = ({ size = 19, color, width = 2 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 12a9 9 0 1 0 2.6-6.3L3 8" />
    <Polyline points="3 3 3 8 8 8" />
  </Svg>
);
export const Trash = ({ size = 18, color, width = 1.9 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="4 7 20 7" />
    <Path d="M9.5 7V4.5h5V7" />
    <Path d="M6.5 7l1 13h9l1-13" />
  </Svg>
);
