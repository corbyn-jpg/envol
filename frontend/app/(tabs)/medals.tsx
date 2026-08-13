import { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';

import { Banner } from '@/components/banner';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { MEDALS, type MedalContext } from '@/lib/medals';
import { Colors, Fonts } from '@/constants/theme';

export default function MedalsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [context, setContext] = useState<MedalContext | null>(null);
  const [favouriteMedalId, setFavouriteMedalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      setLoading(true);
      (async () => {
        // Every arena this user has made progress in — gives us the foundAt timestamps and startedAt
        const progressSnapshot = await getDocs(
          collection(db, 'users', user.uid, 'raceProgress')
        );
        const progressByArena = progressSnapshot.docs.map((progressDoc) => {
          const data = progressDoc.data();
          const foundAt: Record<string, Date> = {};
          for (const [speciesId, timestamp] of Object.entries(data.foundAt ?? {})) {
            foundAt[speciesId] = (timestamp as any).toDate();
          }
          return {
            arenaId: progressDoc.id,
            startedAt: data.startedAt ? data.startedAt.toDate() : null,
            foundAt,
          };
        });

        // Every completed race
        const resultsSnapshot = await getDocs(
          query(collection(db, 'raceResults'), where('userId', '==', user.uid))
        );
        const raceResults = resultsSnapshot.docs.map((resultDoc) => {
          const data = resultDoc.data();
          return {
            arenaId: data.arenaId,
            totalSeconds: data.totalSeconds,
            completedAt: data.completedAt.toDate(),
          };
        });

        // For each arena completed, check whether this user is the one who claimed firstCompletedBy on it.
        const arenaIds = [...new Set(raceResults.map((result) => result.arenaId))];
        const firstBloodArenaIds = new Set<string>();
        for (const arenaId of arenaIds) {
          const arenaSnapshot = await getDoc(doc(db, 'arenas', arenaId));
          if (arenaSnapshot.data()?.firstCompletedBy === user.uid) {
            firstBloodArenaIds.add(arenaId);
          }
        }

        setContext({ raceResults, progressByArena, firstBloodArenaIds });

        const userSnapshot = await getDoc(doc(db, 'users', user.uid));
        setFavouriteMedalId(userSnapshot.data()?.favouriteMedalId ?? null);

        setLoading(false);
      })();
    }, [user])
  );

  async function handleSetFavourite(medalId: string) {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), { favouriteMedalId: medalId });
    setFavouriteMedalId(medalId);
  }

  if (loading || !context) {
    return (
      <SafeAreaView style={styles.container}>
        <Banner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Banner />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 12 + 64 + 12 },
        ]}
      >
        <ThemedText type="title">Medals</ThemedText>
        <ThemedText style={styles.hint}>
          Tap an earned medal to set it as your favourite — it'll show next to your name on the leaderboard.
        </ThemedText>

        <View style={styles.grid}>
          {MEDALS.map((medal) => {
            const earned = medal.isEarned(context);
            const isFavourite = medal.id === favouriteMedalId;

            return (
              <TouchableOpacity
                key={medal.id}
                style={[styles.card, !earned && styles.cardLocked]}
                disabled={!earned}
                onPress={() => handleSetFavourite(medal.id)}
              >
                <Image source={medal.image} style={styles.badgeImage} />
                <ThemedText type="defaultSemiBold" style={styles.cardName}>
                  {medal.name}
                </ThemedText>
                <ThemedText style={styles.cardDescription}>{medal.description}</ThemedText>
                {isFavourite && <ThemedText style={styles.favouriteTag}>★ Favourite</ThemedText>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 24,
    gap: 16,
  },
  hint: {
    fontSize: 12,
    opacity: 0.7,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  card: {
    width: '47%',
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
  },
  cardLocked: {
    opacity: 0.35,
  },
  badgeImage: {
    width: 64,
    height: 64,
  },
  cardName: {
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 11,
    textAlign: 'center',
    opacity: 0.7,
  },
  favouriteTag: {
    fontSize: 11,
    color: Colors.text,
    fontFamily: Fonts.bodySemiBold,
    marginTop: 4,
  },
});