import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';

// A fully custom tab bar
export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  return (

    //Ensures that the navbar fits every phone
    <View style={[styles.bar, { bottom: insets.bottom + 12 }]}>
      {state.routes.map((route, index) => {

      { /* Pulls out the specific tab config */}
        const { options } = descriptors[route.key];
        const focused = state.index === index;

        function onPress() {
          // navigation.emit(...) broadcasts a real tabPress event through the navigation system first
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          //Navigate to the tab if nothing is cancelled and it isn't already the active tab
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
