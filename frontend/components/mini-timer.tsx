import { StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useRace } from '@/contexts/race-context';
import { Colors } from '@/constants/theme';

export function MiniTimer() {
  const { arenaId, totalElapsedSeconds } = useRace();
  const router = useRouter();

  if (!arenaId) return null;

  const minutes = String(Math.floor(totalElapsedSeconds / 60)).padStart(2, '0');
  const seconds = String(totalElapsedSeconds % 60).padStart(2, '0');

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push({ pathname: '/arena/active-screen', params: { id: arenaId } })}
    >
      <ThemedText style={styles.text}>⏱ {minutes}:{seconds}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  text: {
    color: Colors.text,
    fontWeight: '600',
  },
});