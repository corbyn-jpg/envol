import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { OrnateDivider } from '@/components/ornate-divider';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

type BannerProps = {
  showBack?: boolean;
};

// Shared top banner — styled to exactly match the Home/Map screen's own
// header (same 3-child row: title, OrnateDivider, settings button, spaced
// with justifyContent: 'space-between'). Meant to be the first child inside
// a screen's own SafeAreaView — it doesn't add top inset padding itself,
// unlike the Map screen's header, which floats over a fullscreen map with
// no SafeAreaView around it and has to account for insets manually.
//
// Note: adding the back button here (a 4th element, on top of the 3 the map
// screen already fits fairly snugly) risks reintroducing the overflow bug
// where a wide OrnateDivider pushed the settings button off-screen — watch
// for that specifically on showBack screens.
export function Banner({ showBack = false }: BannerProps) {
  const { primary } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.header, { backgroundColor: primary }]}>
      {showBack && (
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={22} color={Colors.background} />
        </TouchableOpacity>
      )}

      <View>
        <ThemedText type="display" style={styles.title}>
          Envol
        </ThemedText>
      </View>

      <OrnateDivider />

      <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/settings')}>
        <IconSymbol name="gearshape.fill" size={22} color={Colors.background} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.accent,
  },
  title: {
    fontSize: 26,
    color: '#fff',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
