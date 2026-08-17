import { useCallback, useEffect, useRef, useState } from "react";
import {
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
import { formatTime, progressKey, type GameMode } from "@/lib/game-modes";
import { Colors, Layout } from "@/constants/theme";
import { Skeleton, SkeletonRow } from "@/components/skeleton";

type Species = {
  id: string;
  commonName: string;
  scientificName: string;
  imageUrl: string;
  funFact: string;
};

export default function ActiveRaceScreen() {
  //Route params are always strings, so the limit has to be converted by hand
  const {
    id,
    mode: modeParam,
    limit,
  } = useLocalSearchParams<{ id: string; mode?: string; limit?: string }>();

  const mode: GameMode = modeParam === "countdown" ? "countdown" : "sprint";
  const limitSeconds = limit ? Number(limit) : null;
  const isCountdown = mode === "countdown";
  const progressId = progressKey(id, mode, limitSeconds);

  const { user } = useAuth();
  const router = useRouter();
  const race = useRace();
  const runEnded = useRef(false);

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
        const progressRef = doc(db, "users", user.uid, "raceProgress", progressId);

        //Switching arena OR mode OR duration all count as starting a new race
        const isNewRace =
          race.arenaId !== id ||
          race.mode !== mode ||
          race.limitSeconds !== limitSeconds;

        // A Countdown is a single sitting, so starting one wipes any leftover
        // finds — but never after this run has already ended.
        if (isNewRace && isCountdown && !runEnded.current) {
          await setDoc(progressRef, {
            foundSpeciesIds: [],
            accumulatedSeconds: 0,
            completed: false,
          });
          setFoundSpeciesIds([]);
          setAlreadyRecorded(false);
          race.startRace(id, mode, limitSeconds, 0);
          return;
        }

        const progressSnapshot = await getDoc(progressRef);
        const progress = progressSnapshot.data();
        const completed = progress?.completed ?? false;

        setFoundSpeciesIds(progress?.foundSpeciesIds ?? []);
        setAlreadyRecorded(completed);

        // A finished race must not restart its clock, or the mini timer keeps running on the other tabs after the arena is already complete.
        if (isNewRace && !completed) {
          race.startRace(id, mode, limitSeconds, progress?.accumulatedSeconds ?? 0);
        }
      })();
    }, [
      id,
      user,
      mode,
      limitSeconds,
      progressId,
      isCountdown,
      race.arenaId,
      race.mode,
      race.limitSeconds,
    ]),
  );

  const isFullyComplete =
    allSpecies.length > 0 && foundSpeciesIds.length === allSpecies.length;

  const isTimeUp = isCountdown && race.remainingSeconds === 0;

  //Counts down in Countdown, up in Sprint
  const displaySeconds = race.remainingSeconds ?? race.totalElapsedSeconds;

  //Writes the finished run to the leaderboard. Shared by every way a race can end.
  async function recordResult() {
    if (!user || !id) return;

    // Must happen before stopRace() clears the race context — otherwise the
    // focus effect can see the cleared context mid-write, think a new race is
    // starting, and reset the timer before this function finishes recording.
    runEnded.current = true;

    try {
      race.stopRace();

      // The ticker can pass zero by a second before the effect fires, so a Countdown's stored time is clamped to its limit.
      const finalSeconds =
        limitSeconds !== null
          ? Math.min(race.totalElapsedSeconds, limitSeconds)
          : race.totalElapsedSeconds;

      await setDoc(
        doc(db, "users", user.uid, "raceProgress", progressId),
        { accumulatedSeconds: finalSeconds, completed: true },
        { merge: true },
      );

      const userSnapshot = await getDoc(doc(db, "users", user.uid));
      const displayName =
        userSnapshot.data()?.displayName || "Anonymous Birder";

      // First Blood is a Sprint achievement, a timed run can't claim the arena
      if (mode === "sprint") {
        await runTransaction(db, async (transaction) => {
          const arenaRef = doc(db, "arenas", id);
          const arenaSnapshot = await transaction.get(arenaRef);
          if (!arenaSnapshot.data()?.firstCompletedBy) {
            transaction.update(arenaRef, { firstCompletedBy: user.uid });
          }
        });
      }

      await addDoc(collection(db, "raceResults"), {
        userId: user.uid,
        displayName,
        arenaId: id,
        mode,
        limitSeconds,
        totalSeconds: finalSeconds,
        speciesFound: foundSpeciesIds.length,
        completedAt: serverTimestamp(),
      });

      setAlreadyRecorded(true);
    } catch (err) {
      console.log("recordResult failed:", err);
    }
  }

  // A race ends either by finding everything or by running out of time. Both  can happen without the user pressing anything, so this watches for both.
  const shouldRecord = isFullyComplete || isTimeUp;

  useEffect(() => {
    if (!shouldRecord || alreadyRecorded || !user || !id) return;
    recordResult();
  }, [shouldRecord, alreadyRecorded, user, id]);

  // Banked time is saved straight away, so pausing and closing the app doesn't lose the seconds already run.
  async function handlePause() {
    race.pauseRace();

    if (!user || !id) return;
    await setDoc(
      doc(db, "users", user.uid, "raceProgress", progressId),
      { accumulatedSeconds: race.totalElapsedSeconds },
      { merge: true },
    );
  }

  async function handleFinish() {
    if (!user || !id) return;

    // Ending a Countdown early still scores
    if (isCountdown) {
      if (!alreadyRecorded) await recordResult();
      return;
    }

    await setDoc(
      doc(db, "users", user.uid, "raceProgress", progressId),
      {
        accumulatedSeconds: race.totalElapsedSeconds,
        completed: false,
      },
      { merge: true },
    );

    race.stopRace();
    router.push("/(tabs)");
  }

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

  // Countdown results come first, so a timed run that found everything still  reports its score rather than falling through to the Sprint screen.
  if (isCountdown && alreadyRecorded) {
    return (
      <SafeAreaView style={styles.container}>
        <Banner showBack />
        <ScrollView contentContainerStyle={styles.centerContent}>
          <ThemedText type="title">
            {isFullyComplete ? "Cleared It!" : "Time's Up!"}
          </ThemedText>
          <ThemedText type="display" style={styles.timer}>
            {foundSpeciesIds.length}
          </ThemedText>
          <ThemedText style={styles.completeMessage}>
            {foundSpeciesIds.length === 1 ? "species" : "species"} found in{" "}
            {formatTime(limitSeconds ?? 0)}
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
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isFullyComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <Banner showBack />
        <ScrollView contentContainerStyle={styles.centerContent}>
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
        </ScrollView>
      </SafeAreaView>
    );
  }

  // The bird list is deliberately hidden while paused
  if (race.isPaused && race.arenaId === id) {
    return (
      <SafeAreaView style={styles.container}>
        <Banner showBack />
        <ScrollView contentContainerStyle={styles.centerContent}>
          <ThemedText type="display" style={styles.timer}>
            {formatTime(displaySeconds)}
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

          <View style={styles.completeActions}>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => router.push("/(tabs)")}
            >
              <ThemedText style={styles.completeButtonText}>Map</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => router.push("/(tabs)/ledger")}
            >
              <ThemedText style={styles.completeButtonText}>Ledger</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Banner showBack />

      <ThemedText style={styles.modeLabel}>
        {isCountdown ? "COUNTDOWN CHALLENGE" : "STOPWATCH SPRINT"}
      </ThemedText>
      <ThemedText type="display" style={styles.timer}>
        {formatTime(displaySeconds)}
      </ThemedText>

      {/* Pausing a timed challenge would defeat its whole premise */}
      {!isCountdown && (
        <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
          <ThemedText style={styles.pauseButtonText}>Pause</ThemedText>
        </TouchableOpacity>
      )}

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
                  params: {
                    arenaId: id,
                    speciesId: species.id,
                    mode,
                    ...(limitSeconds !== null
                      ? { limit: String(limitSeconds) }
                      : {}),
                  },
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
  // flexGrow rather than flex so the content still centres on a tall screen but scrolls instead of clipping on a short landscape one.
  centerContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
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
  modeLabel: {
    textAlign: "center",
    fontSize: 11,
    letterSpacing: 1,
    opacity: 0.7,
    marginTop: 16,
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
    width: "100%",
    maxWidth: Layout.contentMaxWidth,
    alignSelf: "center",
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
    width: "100%",
    maxWidth: Layout.contentMaxWidth,
    alignSelf: "center",
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