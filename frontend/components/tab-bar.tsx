import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';

// A fully custom tab bar. @react-navigation/bottom-tabs' built-in tabBarIcon
// slot allocates a hardcoded tiny box (as small as 24x24) and clips anything
// bigger via overflow: hidden — fine for a plain glyph, not for our
// icon+label pill. Rendering the bar ourselves means nothing gets clipped.
export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  return (
    <View style={[styles.bar, { bottom: insets.bottom + 12 }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;

        function onPress() {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }

        return (
          <HapticTab key={route.key} onPress={onPress} style={styles.item}>
            {options.tabBarIcon?.({ focused, color: '', size: 22 })}
          </HapticTab>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 64,
    paddingHorizontal: 10,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    backgroundColor: Colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  item: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
