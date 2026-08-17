import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { COUNTDOWN_PRESETS, type GameMode } from "@/lib/game-modes";
import { Banner } from "@/components/banner";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { db } from "@/lib/firebase";
import { getCurrentSeason } from "@/lib/season";
import { Colors, Fonts, Layout } from "@/constants/theme";
import { useTheme } from "@/contexts/theme-context";

type ArenaDetails = {
  name: string;
  province: string;
  description: string;
};

const TIPS = [
  "Move quietly — birds sense disturbance quickly",
  "Look up as well as around — many species perch high",
  "You identify the birds yourself using your own skills",
];

export default function ArenaEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { primary } = useTheme();
  const [arena, setArena] = useState<ArenaDetails | null>(null);
  const [speciesCount, setSpeciesCount] = useState(0);
  const [mode, setMode] = useState<GameMode>("sprint");
  const [limitSeconds, setLimitSeconds] = useState(
    COUNTDOWN_PRESETS[1].seconds,
  );

  useEffect(() => {
    if (!id) return;

    (async () => {
      const snapshot = await getDoc(doc(db, "arenas", id));
      const data = snapshot.data();
      if (data) {
        setArena({
          name: data.name,
          province: data.province,
          description: data.description,
        });
      }

      const speciesSnapshot = await getDocs(
        collection(db, "arenas", id, "birds"),
      );
      setSpeciesCount(speciesSnapshot.size);
    })();
  }, [id]);

  if (!arena) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Banner showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.activeCard, { borderColor: primary }]}>
          <ThemedText style={[styles.activeLabel, { color: primary }]}>
            ARENA ACTIVE
          </ThemedText>
          <ThemedText type="title">{arena.name}</ThemedText>
          <ThemedText style={styles.arenaSubtitle}>
            {arena.province} · {arena.description}
          </ThemedText>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <ThemedText type="subtitle">{speciesCount}</ThemedText>
              <ThemedText style={styles.statLabel}>SPECIES</ThemedText>
            </View>
            <View style={styles.stat}>
              <ThemedText type="subtitle">
                {getCurrentSeason().toUpperCase()}
              </ThemedText>
              <ThemedText style={styles.statLabel}>SEASON</ThemedText>
            </View>
          </View>
        </View>

        <ThemedText style={styles.sectionLabel}>RACE MODE</ThemedText>

        <TouchableOpacity
          style={[
            styles.modeCard,
            { borderColor: mode === "sprint" ? primary : Colors.accent },
          ]}
          onPress={() => setMode("sprint")}
        >
          <View style={[styles.modeIcon, { backgroundColor: primary }]}>
            <IconSymbol
              name="stopwatch.fill"
              size={22}
              color={Colors.background}
            />
          </View>
          <View style={styles.modeTextContainer}>
            <ThemedText type="subtitle">Stopwatch Sprint</ThemedText>
            <ThemedText style={styles.modeSubtitle}>
              Race freely · No time limit
            </ThemedText>
            <ThemedText style={styles.modeDescription}>
              Log as many species as you can find at {arena.name}. Stop when
              you're done. Score tallied at finish.
            </ThemedText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeCard,
            { borderColor: mode === "countdown" ? primary : Colors.accent },
          ]}
          onPress={() => setMode("countdown")}
        >
          <View style={[styles.modeIcon, { backgroundColor: primary }]}>
            <IconSymbol name="timer" size={22} color={Colors.background} />
          </View>
          <View style={styles.modeTextContainer}>
            <ThemedText type="subtitle">Countdown Challenge</ThemedText>
            <ThemedText style={styles.modeSubtitle}>
              Beat the clock · Fixed time
            </ThemedText>
            <ThemedText style={styles.modeDescription}>
              Find as many species as you can before time runs out. The run ends
              automatically at zero.
            </ThemedText>

            {mode === "countdown" && (
              <View style={styles.presetRow}>
                {COUNTDOWN_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.seconds}
                    style={[
                      styles.preset,
                      limitSeconds === preset.seconds && {
                        backgroundColor: primary,
                        borderColor: primary,
                      },
                    ]}
                    onPress={() => setLimitSeconds(preset.seconds)}
                  >
                    <ThemedText
                      style={
                        limitSeconds === preset.seconds
                          ? styles.presetTextActive
                          : styles.presetText
                      }
                    >
                      {preset.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </TouchableOpacity>

        <ThemedText style={styles.sectionLabel}>BEFORE YOU BEGIN</ThemedText>
        <View style={styles.tipsCard}>
          {TIPS.map((tip) => (
            <ThemedText key={tip} style={styles.tip}>
              • {tip}
            </ThemedText>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: primary }]}
          onPress={() =>
            router.push({
              pathname: "/arena/active-screen",
              params: {
                id,
                mode,
                ...(mode === "countdown"
                  ? { limit: String(limitSeconds) }
                  : {}),
              },
            })
          }
        >
          <ThemedText style={styles.startButtonText}>
            {mode === "sprint" ? "Start Sprint" : "Start Challenge"}
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
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
  content: {
    padding: 24,
    gap: 20,
    width: "100%",
    maxWidth: Layout.contentMaxWidth,
    alignSelf: "center",
  },
  activeCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    gap: 4,
    backgroundColor: "#fff",
  },
  activeLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  arenaSubtitle: {
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    gap: 24,
    marginTop: 8,
  },
  stat: {
    gap: 2,
  },
  statLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 1,
    opacity: 0.7,
  },
  modeCard: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#fff",
  },
  modeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  modeTextContainer: {
    flex: 1,
    gap: 2,
  },
  modeSubtitle: {
    opacity: 0.7,
  },
  modeDescription: {
    marginTop: 4,
  },
  presetRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  preset: {
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  presetText: {
    fontSize: 12,
    opacity: 0.7,
  },
  presetTextActive: {
    fontSize: 12,
    color: "#fff",
    fontFamily: Fonts.bodySemiBold,
  },
  tipsCard: {
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    backgroundColor: "#fff",
  },
  tip: {},
  startButton: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  startButtonText: {
    color: Colors.background,
    fontFamily: Fonts.bodySemiBold,
  },
});
