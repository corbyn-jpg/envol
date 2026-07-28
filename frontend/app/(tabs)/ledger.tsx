import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

export default function LedgerScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ThemedText type="subtitle">Ledger</ThemedText>
      <ThemedText>Coming soon.</ThemedText>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.background,
  },
});
