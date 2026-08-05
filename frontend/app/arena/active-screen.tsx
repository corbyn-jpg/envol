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
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ThemedText } from "@/components/themed-text";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Colors } from "@/constants/theme";

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

  const [allSpecies, setAllSpecies] = useState<Species[]>([]);
  const [foundSpeciesIds, setFoundSpeciesIds] = useState<string[]>([]);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
  const [loading, setLoading] = useState(true);

  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState(0);

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
      setSessionStartTime(Date.now());
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
        setAccumulatedSeconds(progress?.accumulatedSeconds ?? 0);
      })();
    }, [id, user]),
  );

  // The clock only starts once sessionStartTime is set (right after the species fetch resolves) — never before we know the real accumulated total.
  useEffect(() => {
    if (!sessionStartTime) return;

    const interval = setInterval(() => {
      setSessionElapsedSeconds(
        Math.floor((Date.now() - sessionStartTime) / 1000),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  const unfoundSpecies = allSpecies.filter(
    (species) => !foundSpeciesIds.includes(species.id),
  );

  async function handleFinish() {
    if (!user || !id) return;

    const allFound =
      foundSpeciesIds.length === allSpecies.length && allSpecies.length > 0;

    await setDoc(
      doc(db, "users", user.uid, "raceProgress", id),
      {
        accumulatedSeconds: totalElapsedSeconds,
        completed: allFound,
      },
      { merge: true },
    );

    if (allFound) {
      await addDoc(collection(db, "raceResults"), {
        userId: user.uid,
        arenaId: id,
        totalSeconds: totalElapsedSeconds,
        speciesFound: foundSpeciesIds.length,
        completedAt: serverTimestamp(),
      });
    }

    router.push("/(tabs)");
  }

  const totalElapsedSeconds = accumulatedSeconds + sessionElapsedSeconds;
  const minutes = String(Math.floor(totalElapsedSeconds / 60)).padStart(2, "0");
  const seconds = String(totalElapsedSeconds % 60).padStart(2, "0");

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ThemedText type="title" style={styles.timer}>
        {minutes}:{seconds}
      </ThemedText>

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
        <Image source={{ uri: species.imageUrl }} style={styles.thumbnail} />
        <View style={styles.rowText}>
          <ThemedText type="defaultSemiBold">{species.commonName}</ThemedText>
          <ThemedText type="scientific">{species.scientificName}</ThemedText>
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
  container: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  timer: { textAlign: "center", marginVertical: 16 },
  list: { paddingHorizontal: 24, paddingBottom: 24, gap: 12 },
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
  thumbnail: { width: 48, height: 48, borderRadius: 24 },
  rowText: { flex: 1, gap: 2 },
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
  barButtonText: { fontSize: 13 },
  finishButton: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  finishButtonText: { color: Colors.background, fontWeight: "600" },
});
