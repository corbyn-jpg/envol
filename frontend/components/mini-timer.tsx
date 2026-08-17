import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRace } from '@/contexts/race-context';
import { formatTime } from '@/lib/game-modes';
import { Colors } from '@/constants/theme';

export function MiniTimer() {
  const { arenaId, mode, limitSeconds, totalElapsedSeconds, remainingSeconds } = useRace();
  const router = useRouter();

  if (!arenaId) return null;

  //Counts down in Countdown, up in Sprint
  const displaySeconds = remainingSeconds ?? totalElapsedSeconds;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() =>
        router.push({
          pathname: '/arena/active-screen',
          params: {
            id: arenaId,
            mode,
            ...(limitSeconds !== null ? { limit: String(limitSeconds) } : {}),
          },
        })
      }
    >
      <View style={styles.row}>
        <IconSymbol name="stopwatch.fill" size={13} color={Colors.text} />
        <ThemedText style={styles.text}>{formatTime(displaySeconds)}</ThemedText>
      </View>
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
    row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});