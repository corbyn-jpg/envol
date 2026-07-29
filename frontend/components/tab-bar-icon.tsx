import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts } from '@/constants/theme';

type TabBarIconProps = {
  focused: boolean;
  label: string;
  icon: ReactNode;
};

// Active tab renders as a filled pill with an icon + label, inactive tabs are just the bare icon.
export function TabBarIcon({ focused, label, icon }: TabBarIconProps) {
  if (!focused) {
    return <View style={styles.iconOnly}>{icon}</View>;
  }

  return (
    <View style={styles.pill}>
      {icon}
      <ThemedText style={styles.pillLabel}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  iconOnly: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pillLabel: {
    color: Colors.background,
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
