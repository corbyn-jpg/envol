import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/banner';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

export default function MedalsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Banner />
      <View style={styles.content}>
        <ThemedText type="subtitle">Medals</ThemedText>
        <ThemedText>Coming soon.</ThemedText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
});
