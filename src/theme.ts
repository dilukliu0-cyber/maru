import { createContext, useContext } from 'react';
import { Platform } from 'react-native';

// Строго чёрно-белая палитра из прототипа: только оттенки серого.
export const LIGHT = {
  bg: '#FFFFFF',
  ink: '#111111',
  inkSoft: '#3C3C3C',
  muted: '#9B9B97',
  faint: '#CFCFCB',
  hair: '#E8E8E4',
  soft: '#F5F5F2',
  soft2: '#ECECEA',
  seg: '#E9E9E6',
  segNight: '#D9D9D4',
  onInk: '#FFFFFF',
  backdrop: 'rgba(0,0,0,0.42)',
  dark: false,
};

export const DARK: typeof LIGHT = {
  bg: '#000000',
  ink: '#F4F4F1',
  inkSoft: '#C9C9C5',
  muted: '#7D7D79',
  faint: '#3A3A38',
  hair: '#222221',
  soft: '#0E0E0E',
  soft2: '#171716',
  seg: '#1B1B1A',
  segNight: '#2C2C2A',
  onInk: '#000000',
  backdrop: 'rgba(0,0,0,0.6)',
  dark: true,
};

export type Theme = typeof LIGHT;

export const ThemeContext = createContext<Theme>(LIGHT);
export const useTheme = () => useContext(ThemeContext);

// Цифры моноширинные, чтобы обратный отсчёт не «прыгал».
export const MONO = Platform.select({
  ios: 'Menlo',
  web: '"SF Mono", ui-monospace, Menlo, monospace',
  default: 'monospace',
});
