import { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Colors } from '@/constants/theme';

type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

// A single grey block that gently pulses while real content loads.
export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[styles.base, { width, height, borderRadius, opacity: pulse }, style]}
    />
  );
}

// The species/racer row shape reused across the ledger, leaderboard and race screens.
export function SkeletonRow() {
  return (
    <View style={styles.row}>
      <Skeleton width={44} height={44} borderRadius={22} />
      <View style={styles.rowText}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={11} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.accent + '40',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
  },
  rowText: {
    flex: 1,
    gap: 6,
  },
});