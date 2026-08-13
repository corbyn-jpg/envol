import { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

import { Banner } from '@/components/banner';
import { MiniTimer } from '@/components/mini-timer';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/auth-context';
import { useRace } from '@/contexts/race-context';
import { useNearbyArena } from '@/hooks/use-nearby-arena';
import { db } from '@/lib/firebase';
import { Colors, Fonts } from '@/constants/theme';

type Species = {
  id: string;
  commonName: string;
  scientificName: string;
  imageUrl: string;
};

export default function LedgerScreen() {
  const { user } = useAuth();
  const { nearest, isActive } = useNearbyArena();
  const race = useRace();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const arenaId = isActive ? (nearest?.arena.id ?? null) : null;
  const arenaName = nearest?.arena.name ?? '';

  const [allSpecies, setAllSpecies] = useState<Species[]>([]);
  const [foundSpeciesIds, setFoundSpeciesIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!arenaId || !user) return;

      setLoading(true);
      (async () => {
        const speciesSnapshot = await getDocs(collection(db, 'arenas', arenaId, 'birds'));
        setAllSpecies(
          speciesSnapshot.docs.map((doc) => ({
            id: doc.id,
            commonName: doc.data()['common name'],
            scientificName: doc.data()['scientific name'],
            imageUrl: doc.data().imgURL,
          }))
        );

        const progressSnapshot = await getDoc(doc(db, 'users', user.uid, 'raceProgress', arenaId));
        setFoundSpeciesIds(progressSnapshot.data()?.foundSpeciesIds ?? []);

        setLoading(false);
      })();
    }, [arenaId, user])
  );

  if (!arenaId) {
    return (
      <SafeAreaView style={styles.container}>
        <Banner />
        <View style={styles.emptyState}>
          <ThemedText type="subtitle">No Arena Nearby</ThemedText>
          <ThemedText style={styles.emptyText}>
            Get closer to an arena to see your ledger here.
          </ThemedText>
          <TouchableOpacity style={styles.mapButton} onPress={() => router.push('/(tabs)')}>
            <ThemedText style={styles.mapButtonText}>Go to Map</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Banner />
      </SafeAreaView>
    );
  }

  const found = allSpecies.filter((species) => foundSpeciesIds.includes(species.id));
  const notFound = allSpecies.filter((species) => !foundSpeciesIds.includes(species.id));
  const progress = allSpecies.length > 0 ? found.length / allSpecies.length : 0;

  return (
    <SafeAreaView style={styles.container}>
      <Banner />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 12 + 64 + 12 },
        ]}
      >
        {race.arenaId === arenaId && (
          <View style={styles.miniTimerFloat}>
            <MiniTimer />
          </View>
        )}

        <View style={styles.ledgerHeader}>
          <View>
            <ThemedText style={styles.eyebrow}>{arenaName.toUpperCase()}</ThemedText>
            <ThemedText type="title">My Ledger</ThemedText>
          </View>
          {race.arenaId === arenaId && (
            <TouchableOpacity
              style={styles.backToRaceButton}
              onPress={() => router.push({ pathname: '/arena/active-screen', params: { id: arenaId } })}
            >
              <ThemedText style={styles.backToRaceText}>Back to Race</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.progressRow}>
          <ThemedText type="title">{found.length}</ThemedText>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          </View>
          <ThemedText type="title">{allSpecies.length}</ThemedText>
        </View>
        <ThemedText style={styles.progressCaption}>
          {found.length} of {allSpecies.length} {arenaName} species logged
        </ThemedText>

        <ThemedText style={styles.sectionLabel}>FOUND · {found.length}</ThemedText>
        {found.map((species) => (
          <View key={species.id} style={styles.row}>
            <Image source={{ uri: species.imageUrl }} style={styles.thumbnail} />
            <View style={styles.rowText}>
              <ThemedText type="defaultSemiBold">{species.commonName}</ThemedText>
              <ThemedText type="scientific">{species.scientificName}</ThemedText>
            </View>
            <View style={styles.foundPill}>
              <IconSymbol name="checkmark" size={11} color={Colors.background} />
              <ThemedText style={styles.foundPillText}>Found</ThemedText>
            </View>
          </View>
        ))}

        <ThemedText style={styles.sectionLabel}>NOT YET FOUND · {notFound.length}</ThemedText>
        {notFound.map((species) => (
          <View key={species.id} style={styles.row}>
            <Image source={{ uri: species.imageUrl }} style={styles.thumbnail} />
            <View style={styles.rowText}>
              <ThemedText type="defaultSemiBold">{species.commonName}</ThemedText>
              <ThemedText type="scientific">{species.scientificName}</ThemedText>
            </View>
            <View style={styles.unseenPill}>
              <ThemedText style={styles.unseenPillText}>Unseen</ThemedText>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 24,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  mapButton: {
    backgroundColor: Colors.text,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 12,
  },
  mapButtonText: {
    color: Colors.background,
    fontFamily: Fonts.bodySemiBold,
  },
  content: {
    padding: 24,
    gap: 16,
  },
  ledgerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1,
    opacity: 0.7,
  },
  backToRaceButton: {
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  backToRaceText: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent + '40',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.text,
    borderRadius: 4,
  },
  progressCaption: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: -8,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 1,
    opacity: 0.7,
    marginTop: 8,
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
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  foundPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.text,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  foundPillText: {
    color: Colors.background,
    fontSize: 11,
    fontFamily: Fonts.bodySemiBold,
  },
  unseenPill: {
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  unseenPillText: {
    fontSize: 11,
    opacity: 0.7,
  },
  miniTimerFloat: {
    alignSelf: 'flex-start',
    alignItems: 'center',
  },
});