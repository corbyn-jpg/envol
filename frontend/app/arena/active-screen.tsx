import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  doc,
  getDoc,
  getDocs,
  collection,
  runTransaction,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Banner } from "@/components/banner";
import { ThemedText } from "@/components/themed-text";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useRace } from "@/contexts/race-context";
import { Colors } from "@/constants/theme";
import { Skeleton, SkeletonRow } from '@/components/skeleton';

type Species = {
  id: string;
  commonName: string;
  scientificName: string;
  imageUrl: string;
  funFact: string;
};

export default function ActiveRaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const race = useRace();

  const [allSpecies, setAllSpecies] = useState<Species[]>([]);
  const [foundSpeciesIds, setFoundSpeciesIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [alreadyRecorded, setAlreadyRecorded] = useState(false);

  // Species list only ever needs fetching once — it doesn't change during a race.
  useEffect(() => {
    if (!id) return;

    (async () => {
      const speciesSnapshot = await getDocs(
        collection(db, "arenas", id, "birds"),
      );
      const fetchedSpecies = speciesSnapshot.docs.map((doc) => ({
        id: doc.id,
        commonName: doc.data()["common name"],
        scientificName: doc.data()["scientific name"],
        imageUrl: doc.data().imgURL,
        funFact: doc.data()["fun fact"],
      }));
      setAllSpecies(fetchedSpecies);
      setLoading(false);
    })();
  }, [id]);

  // Progress can change every time you come back from the species detail screen, so this refetches on every focus, not just once on mount.
  useFocusEffect(
    useCallback(() => {
      if (!id || !user) return;

      (async () => {
        const progressSnapshot = await getDoc(
          doc(db, "users", user.uid, "raceProgress", id),
        );
        const progress = progressSnapshot.data();
        setFoundSpeciesIds(progress?.foundSpeciesIds ?? []);
        setAlreadyRecorded(progress?.completed ?? false);

        if (race.arenaId !== id) {
          race.startRace(id, progress?.accumulatedSeconds ?? 0);
        }
      })();
    }, [id, user, race.arenaId]),
  );

  //Stops the clock completely when all birds are found
  const isFullyComplete =
    allSpecies.length > 0 && foundSpeciesIds.length === allSpecies.length;

  // Banked time is saved straight away, so pausing and closing the app doesn't
  // lose the seconds already run.
  async function handlePause() {
    race.pauseRace();

    if (!user || !id) return;
    await setDoc(
      doc(db, "users", user.uid, "raceProgress", id),
      { accumulatedSeconds: race.totalElapsedSeconds },
      { merge: true },
    );
  }

  async function handleFinish() {
    if (!user || !id) return;

    await setDoc(
      doc(db, "users", user.uid, "raceProgress", id),
      {
        accumulatedSeconds: race.totalElapsedSeconds,
        completed: false,
      },
      { merge: true },
    );

    race.stopRace();
    router.push("/(tabs)");
  }

  // Completion is detected purely from found-species count, so it can happen  the moment the last bird is marked found on the detail screen
  useEffect(() => {
    if (!isFullyComplete || alreadyRecorded || !user || !id) return;

    race.stopRace();

    (async () => {
      await setDoc(
        doc(db, "users", user.uid, "raceProgress", id),
        {
          accumulatedSeconds: race.totalElapsedSeconds,
          completed: true,
        },
        { merge: true },
      );

      const userSnapshot = await getDoc(doc(db, "users", user.uid));
      const displayName = userSnapshot.data()?.displayName || "Anonymous Birder";

      // First person to ever fully complete this arena claims First Blood
      await runTransaction(db, async (transaction) => {
        const arenaRef = doc(db, "arenas", id);
        const arenaSnapshot = await transaction.get(arenaRef);
        if (!arenaSnapshot.data()?.firstCompletedBy) {
          transaction.update(arenaRef, { firstCompletedBy: user.uid });
        }
      });

      await addDoc(collection(db, "raceResults"), {
        userId: user.uid,
        displayName,
        arenaId: id,
        totalSeconds: race.totalElapsedSeconds,
        speciesFound: foundSpeciesIds.length,
        completedAt: serverTimestamp(),
      });

      setAlreadyRecorded(true);
    })();
  }, [isFullyComplete, alreadyRecorded, user, id]);

  const minutes = String(Math.floor(race.totalElapsedSeconds / 60)).padStart(
    2,
    "0",
  );
  const seconds = String(race.totalElapsedSeconds % 60).padStart(2, "0");

    if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Banner showBack />
        <View style={styles.timer}>
          <Skeleton width={160} height={48} style={{ alignSelf: "center" }} />
        </View>
        <View style={styles.list}>
          {[0, 1, 2, 3, 4].map((index) => (
            <SkeletonRow key={index} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (isFullyComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <Banner showBack />
        <View style={styles.center}>
          <ThemedText type="title">All Birds Found!</ThemedText>
          <ThemedText style={styles.completeMessage}>
            You've found every bird currently in this arena. Come back once new
            species are added.
          </ThemedText>

          <View style={styles.completeActions}>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => router.push("/(tabs)")}
            >
              <ThemedText style={styles.completeButtonText}>Map</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.completeButton, styles.completeButtonPrimary]}
              onPress={() => router.push("/(tabs)/leaderboard")}
            >
              <ThemedText style={styles.completeButtonPrimaryText}>
                Leaderboard
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // The bird list is deliberately hidden while paused — otherwise stopping the
  // clock would just be a way to hunt for free.
  if (race.isPaused && race.arenaId === id) {
    return (
      <SafeAreaView style={styles.container}>
        <Banner showBack />
        <View style={styles.center}>
          <ThemedText type="display" style={styles.timer}>
            {minutes}:{seconds}
          </ThemedText>
          <ThemedText type="title">Paused</ThemedText>
          <ThemedText style={styles.completeMessage}>
            Your time is stopped. The bird list stays hidden until you resume.
          </ThemedText>

          <TouchableOpacity
            style={[
              styles.completeButton,
              styles.completeButtonPrimary,
              styles.resumeButton,
            ]}
            onPress={race.resumeRace}
          >
            <ThemedText style={styles.completeButtonPrimaryText}>
              Resume Race
            </ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Banner showBack />
      <ThemedText type="display" style={styles.timer}>
        {minutes}:{seconds}
      </ThemedText>

      <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
        <ThemedText style={styles.pauseButtonText}>Pause</ThemedText>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.list}>
        {allSpecies.map((species) => {
          const found = foundSpeciesIds.includes(species.id);

          return (
            <TouchableOpacity
              key={species.id}
              style={[styles.row, found && styles.rowFound]}
              onPress={() =>
                router.push({
                  pathname: "/species/detail-screen",
                  params: { arenaId: id, speciesId: species.id },
                })
              }
            >
              <Image
                source={{ uri: species.imageUrl }}
                style={styles.thumbnail}
              />
              <View style={styles.rowText}>
                <ThemedText type="defaultSemiBold">
                  {species.commonName}
                </ThemedText>
                <ThemedText type="scientific">
                  {species.scientificName}
                </ThemedText>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.barButton}
          onPress={() => router.push("/(tabs)")}
        >
          <ThemedText style={styles.barButtonText}>Map</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.barButton}
          onPress={() => router.push("/(tabs)/ledger")}
        >
          <ThemedText style={styles.barButtonText}>
            Ledger ({foundSpeciesIds.length})
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.barButton, styles.finishButton]}
          onPress={handleFinish}
        >
          <ThemedText style={styles.finishButtonText}>Finish</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  completeMessage: {
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 24,
  },
  completeActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  completeButton: {
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  completeButtonText: {
    fontSize: 13,
  },
  completeButtonPrimary: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  completeButtonPrimaryText: {
    color: Colors.background,
    fontWeight: "600",
  },
  timer: {
    textAlign: "center",
    marginVertical: 16,
  },
  pauseButton: {
    alignSelf: "center",
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 6,
    marginBottom: 16,
  },
  pauseButtonText: {
    fontSize: 13,
  },
  resumeButton: {
    marginTop: 24,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
  },
  rowFound: {
    opacity: 0.5,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  bottomBar: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.accent,
  },
  barButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  barButtonText: {
    fontSize: 13,
  },
  finishButton: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  finishButtonText: {
    color: Colors.background,
    fontWeight: "600",
  },
});
