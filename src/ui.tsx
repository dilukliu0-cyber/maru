import * as Haptics from 'expo-haptics';
import { ReactNode, useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { useTheme } from './theme';

export const tap = () => {
  if (Platform.OS === 'ios') Haptics.selectionAsync().catch(() => {});
};
export const thud = () => {
  if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};
export const success = () => {
  if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
};

export function IconButton({ onPress, children, label, size = 38 }: { onPress: () => void; children: ReactNode; label: string; size?: number }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? t.soft : 'transparent',
      })}
    >
      {children}
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <View style={[{ flexDirection: 'row', backgroundColor: t.soft, borderRadius: 999, padding: 3, gap: 2 }, style]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              if (!on) tap();
              onChange(o.value);
            }}
            style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999, backgroundColor: on ? t.ink : 'transparent', alignItems: 'center' }}
          >
            <Text numberOfLines={1} style={{ fontSize: 13.5, fontWeight: on ? '600' : '500', color: on ? t.onInk : t.muted }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Switch({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const t = useTheme();
  const x = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(x, { toValue: value ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [value, x]);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={() => {
        tap();
        onChange(!value);
      }}
      style={{ width: 50, height: 30, borderRadius: 999, backgroundColor: value ? t.ink : t.soft2, justifyContent: 'center' }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 3,
          left: x.interpolate({ inputRange: [0, 1], outputRange: [3, 23] }),
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: t.bg,
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 1 },
        }}
      />
    </Pressable>
  );
}

export function MicroLabel({ children, style }: { children: ReactNode; style?: StyleProp<any> }) {
  const t = useTheme();
  return <Text style={[s.micro, { color: t.muted }, style]}>{children}</Text>;
}

export function Toast({ message }: { message: string | null }) {
  const t = useTheme();
  if (!message) return null;
  return (
    <View pointerEvents="none" style={[s.toast, { backgroundColor: t.ink }]}>
      <Text style={{ color: t.onInk, fontSize: 13.5, fontWeight: '600' }}>{message}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  micro: { fontSize: 11, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 110,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    zIndex: 60,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
});
