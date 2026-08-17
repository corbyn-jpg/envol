import { useCallback, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { Banner } from "@/components/banner";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/contexts/auth-context";
import { useNearbyArena } from "@/hooks/use-nearby-arena";
import { db } from "@/lib/firebase";
import { getMedal } from "@/lib/medals";
import { Colors, Fonts, Layout } from "@/constants/theme";
import { Skeleton, SkeletonRow } from "@/components/skeleton";
import { COUNTDOWN_PRESETS, formatTime, type GameMode } from "@/lib/game-modes";

type RaceResult = {
  userId: string;
  displayName: string;
  speciesFound: number;
  totalSeconds: number;
  completedAt: Date;
  mode: GameMode;
  limitSeconds: number | null;
};

type UserProfile = {
  displayName: string | null;
  photoUrl: string | null;
  favouriteMedalId: string | null;
};

// Negative means `a` ranks above `b`. Primary: more species found wins.
// Tiebreaker: if two people found the same number, the faster time wins.
function compareResults(a: RaceResult, b: RaceResult) {
  if (b.speciesFound !== a.speciesFound) return b.speciesFound - a.speciesFound;
  return a.totalSeconds - b.totalSeconds;
}

function bestPerUser(results: RaceResult[]): RaceResult[] {
  const bestByUser = new Map<string, RaceResult>();

  for (const result of results) {
    const existing = bestByUser.get(result.userId);
    if (!existing || compareResults(result, existing) < 0) {
      bestByUser.set(result.userId, result);
    }
  }

  return Array.from(bestByUser.values()).sort(compareResults);
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const { nearest, isActive, loading: arenaLoading } = useNearbyArena();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const arenaId = isActive ? (nearest?.arena.id ?? null) : null;
  const arenaName = nearest?.arena.name ?? "";

  const [allResults, setAllResults] = useState<RaceResult[]>([]);
  const [profilesByUser, setProfilesByUser] = useState<
    Record<string, UserProfile>
  >({});
  const [loading, setLoading] = useState(true);
  const [selectedMode, setSelectedMode] = useState<GameMode>("sprint");
  const [selectedDuration, setSelectedDuration] = useState(
    COUNTDOWN_PRESETS[1].seconds,
  );

  useFocusEffect(
    useCallback(() => {
      if (!arenaId) return;

      setLoading(true);
      (async () => {
        const snapshot = await getDocs(
          query(collection(db, "raceResults"), where("arenaId", "==", arenaId)),
        );
        const results = snapshot.docs.map((doc): RaceResult => {
          const data = doc.data();
          return {
            userId: data.userId,
            displayName: data.displayName,
            speciesFound: data.speciesFound,
            totalSeconds: data.totalSeconds,
            completedAt: data.completedAt.toDate(),
            // Results written before Countdown existed have no mode field at all
            mode: data.mode === "countdown" ? "countdown" : "sprint",
            limitSeconds: data.limitSeconds ?? null,
          };
        });
        setAllResults(results);

        // Look up each unique racer's chosen favourite medal, so it can render next to their name.
        // One read per racer gives us their live name, photo and chosen medal.
        const uniqueUserIds = [
          ...new Set(results.map((result) => result.userId)),
        ];
        const profiles: Record<string, UserProfile> = {};
        for (const userId of uniqueUserIds) {
          const userSnapshot = await getDoc(doc(db, "users", userId));
          const data = userSnapshot.data();
          profiles[userId] = {
            displayName: data?.displayName ?? null,
            photoUrl: data?.photoUrl ?? null,
            favouriteMedalId: data?.favouriteMedalId ?? null,
          };
        }
        setProfilesByUser(profiles);

        setLoading(false);
      })();
    }, [arenaId]),
  );

  function LeaderboardSkeleton() {
    return (
      <SafeAreaView style={styles.container}>
        <Banner />
        <View style={styles.content}>
          <Skeleton width={140} height={11} />
          <Skeleton width={200} height={28} />
          <Skeleton height={40} />
          <View style={styles.podiumRow}>
            {[0, 1, 2].map((slot) => (
              <View key={slot} style={styles.podiumSlot}>
                <Skeleton
                  width={slot === 1 ? 72 : 56}
                  height={slot === 1 ? 72 : 56}
                  borderRadius={36}
                />
                <Skeleton width={60} height={12} />
                <Skeleton width={30} height={12} />
              </View>
            ))}
          </View>
          {[0, 1, 2].map((index) => (
            <SkeletonRow key={index} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // The name stored on the race result is frozen at completion time, so prefer the user's current name and only fall back if their profile can't be read.
  function displayNameFor(entry: RaceResult) {
    return profilesByUser[entry.userId]?.displayName ?? entry.displayName;
  }

  //Sprint shows how long the run took. Countdown shows how much time was left when they stopped
  function displayTimeFor(entry: RaceResult): string {
    if (entry.mode === "countdown" && entry.limitSeconds !== null) {
      return formatTime(Math.max(0, entry.limitSeconds - entry.totalSeconds));
    }
    return formatTime(entry.totalSeconds);
  }

  if (arenaLoading) return <LeaderboardSkeleton />;

  if (!arenaId) {
    return (
      <SafeAreaView style={styles.container}>
        <Banner />
        <View style={styles.emptyState}>
          <ThemedText type="subtitle" style={styles.emptyTitle}>
            No Arena Nearby
          </ThemedText>
          <ThemedText style={styles.emptyText}>
            Get closer to an arena to see its leaderboard here.
          </ThemedText>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => router.push("/(tabs)")}
          >
            <ThemedText style={styles.mapButtonText}>Go to Map</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) return <LeaderboardSkeleton />;

  const filteredResults = allResults.filter((result) => {
    if (selectedMode === "sprint") return result.mode === "sprint";
    return (
      result.mode === "countdown" && result.limitSeconds === selectedDuration
    );
  });

  const ranked = bestPerUser(filteredResults);
  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <SafeAreaView style={styles.container}>
      <Banner />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 12 + 64 + 12 },
        ]}
      >
        <ThemedText style={styles.eyebrow}>
          {arenaName.toUpperCase()} · LIVE
        </ThemedText>
        <ThemedText type="title">Leaderboard</ThemedText>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              selectedMode === "sprint" && styles.toggleButtonActive,
            ]}
            onPress={() => setSelectedMode("sprint")}
          >
            <ThemedText
              numberOfLines={1}
              style={
                selectedMode === "sprint"
                  ? styles.toggleTextActive
                  : styles.toggleText
              }
            >
              Sprint
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              selectedMode === "countdown" && styles.toggleButtonActive,
            ]}
            onPress={() => setSelectedMode("countdown")}
          >
            <ThemedText
              numberOfLines={1}
              style={
                selectedMode === "countdown"
                  ? styles.toggleTextActive
                  : styles.toggleText
              }
            >
              Countdown
            </ThemedText>
          </TouchableOpacity>
        </View>

        {selectedMode === "countdown" && (
          <View style={styles.durationRow}>
            {COUNTDOWN_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.seconds}
                style={[
                  styles.durationChip,
                  selectedDuration === preset.seconds &&
                    styles.durationChipActive,
                ]}
                onPress={() => setSelectedDuration(preset.seconds)}
              >
                <ThemedText
                  style={
                    selectedDuration === preset.seconds
                      ? styles.durationChipTextActive
                      : styles.durationChipText
                  }
                >
                  {preset.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {podium.length === 0 ? (
          <ThemedText style={styles.emptyText}>
            No completed races yet — be the first!
          </ThemedText>
        ) : (
          <View style={styles.podiumRow}>
            {[podium[1], podium[0], podium[2]].map((entry, slot) =>
              entry ? (
                <View
                  key={entry.userId}
                  style={[
                    styles.podiumSlot,
                    slot === 1 && styles.podiumSlotFirst,
                  ]}
                >
                  {slot === 1 && (
                    <IconSymbol
                      name="crown.fill"
                      size={20}
                      color={Colors.accent}
                    />
                  )}
                  {profilesByUser[entry.userId]?.photoUrl ? (
                    <Image
                      source={{ uri: profilesByUser[entry.userId].photoUrl! }}
                      style={[styles.avatar, slot === 1 && styles.avatarFirst]}
                    />
                  ) : (
                    <View
                      style={[styles.avatar, slot === 1 && styles.avatarFirst]}
                    >
                      <ThemedText style={styles.avatarText}>
                        {getInitials(displayNameFor(entry))}
                      </ThemedText>
                    </View>
                  )}
                  <ThemedText style={styles.podiumName}>
                    {displayNameFor(entry)}
                  </ThemedText>
                  {getMedal(profilesByUser[entry.userId]?.favouriteMedalId) && (
                    <Image
                      source={
                        getMedal(
                          profilesByUser[entry.userId]?.favouriteMedalId,
                        )!.image
                      }
                      style={styles.podiumMedal}
                    />
                  )}
                  <ThemedText type="defaultSemiBold">
                    {entry.speciesFound}
                  </ThemedText>
                  <ThemedText style={styles.podiumTime}>
                    {displayTimeFor(entry)}
                  </ThemedText>
                </View>
              ) : (
                <View key={`empty-${slot}`} style={styles.podiumSlot} />
              ),
            )}
          </View>
        )}

        {rest.map((entry, index) => (
          <View
            key={entry.userId}
            style={[styles.row, entry.userId === user?.uid && styles.rowSelf]}
          >
            <ThemedText style={styles.rank}>{index + 4}</ThemedText>
            {profilesByUser[entry.userId]?.photoUrl ? (
              <Image
                source={{ uri: profilesByUser[entry.userId].photoUrl! }}
                style={styles.smallAvatar}
              />
            ) : (
              <View style={styles.smallAvatar}>
                <ThemedText style={styles.smallAvatarText}>
                  {getInitials(displayNameFor(entry))}
                </ThemedText>
              </View>
            )}
            <ThemedText style={styles.rowName}>
              {displayNameFor(entry)}
            </ThemedText>
            {getMedal(profilesByUser[entry.userId]?.favouriteMedalId) && (
              <Image
                source={
                  getMedal(profilesByUser[entry.userId]?.favouriteMedalId)!
                    .image
                }
                style={styles.rowMedal}
              />
            )}
            <ThemedText style={styles.podiumTime}>
              {displayTimeFor(entry)}
            </ThemedText>
            <ThemedText type="defaultSemiBold">{entry.speciesFound}</ThemedText>
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
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    padding: 24,
  },
  emptyTitle: {
    alignSelf: "stretch",
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
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
    width: "100%",
    maxWidth: Layout.contentMaxWidth,
    alignSelf: "center",
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1,
    opacity: 0.7,
  },
  toggleRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 8,
    overflow: "hidden",
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: Colors.accent,
  },
  toggleText: {
    fontSize: 13,
    opacity: 0.7,
  },
  toggleTextActive: {
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
  },
  podiumRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 16,
    marginTop: 8,
  },
  podiumSlot: {
    alignItems: "center",
    gap: 4,
    width: 88,
  },
  podiumSlotFirst: {
    marginBottom: 16,
  },
  durationRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: -8,
  },
  durationChip: {
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  durationChipActive: {
    backgroundColor: Colors.accent,
  },
  durationChipText: {
    fontSize: 12,
    opacity: 0.7,
  },
  durationChipTextActive: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.text,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarFirst: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accent,
  },
  avatarText: {
    color: Colors.background,
    fontFamily: Fonts.bodySemiBold,
  },
  podiumName: {
    fontSize: 12,
    textAlign: "center",
  },
  podiumTime: {
    fontSize: 11,
    opacity: 0.7,
  },
  podiumMedal: {
    width: 20,
    height: 20,
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
  rowSelf: {
    borderColor: Colors.text,
    borderWidth: 2,
  },
  rank: {
    width: 20,
    textAlign: "center",
    opacity: 0.7,
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  smallAvatarText: {
    fontSize: 11,
    fontFamily: Fonts.bodySemiBold,
  },
  rowName: {
    flex: 1,
  },
  rowTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  rowMedal: {
    width: 18,
    height: 18,
  },
});
