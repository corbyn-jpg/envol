import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  getDoc,
  setDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Banner } from "@/components/banner";
import { ThemedText } from "@/components/themed-text";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Colors, Fonts, Layout } from "@/constants/theme";
import * as ImagePicker from "expo-image-picker";
import { parseExifDate, wasTakenToday } from "@/lib/photo-verification";
import { progressKey, type GameMode } from "@/lib/game-modes";

type SpeciesDetails = {
  commonName: string;
  scientificName: string;
  imageUrl: string;
  funFact: string;
};

export default function SpeciesDetailScreen() {
  const { arenaId, speciesId, mode: modeParam, limit } = useLocalSearchParams<{
    arenaId: string;
    speciesId: string;
    mode?: string;
    limit?: string;
  }>();
  const { user } = useAuth();
  const router = useRouter();
  const [species, setSpecies] = useState<SpeciesDetails | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const mode: GameMode = modeParam === "countdown" ? "countdown" : "sprint";
  const limitSeconds = limit ? Number(limit) : null;
  const progressId = progressKey(arenaId, mode, limitSeconds);

  //A 260px hero image eats most of a landscape viewport, so it shrinks there
  const { width, height } = useWindowDimensions();
  const imageHeight = width > height ? 180 : 260;

  useEffect(() => {
    if (!arenaId || !speciesId) return;

    (async () => {
      const snapshot = await getDoc(
        doc(db, "arenas", arenaId, "birds", speciesId),
      );
      const data = snapshot.data();
      if (data) {
        setSpecies({
          commonName: data["common name"],
          scientificName: data["scientific name"],
          imageUrl: data.imgURL,
          funFact: data["fun fact"],
        });
      }
    })();
  }, [arenaId, speciesId]);

  //Requires a photo taken today before the bird can be logged as found
  async function handleVerifyAndFind() {
    setVerifyError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setVerifyError("Photo library access is needed to verify your sighting.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      // Cropping re-encodes the file and destroys the metadata we're checking.
      allowsEditing: false,
      quality: 1,
      exif: true,
    });

    if (result.canceled) return;

    setVerifying(true);
    try {
      const takenAt = parseExifDate(result.assets[0].exif);

      if (!takenAt) {
        setVerifyError(
          "That image has no capture date, so it can't be verified. Photograph the bird with your camera.",
        );
        return;
      }

      if (!wasTakenToday(takenAt)) {
        setVerifyError(
          "That photo wasn't taken today. Find the bird and photograph it now.",
        );
        return;
      }

      await handleFound();
    } finally {
      setVerifying(false);
    }
  }

  async function handleFound() {
    if (!user || !arenaId || !speciesId) return;

    const progressRef = doc(db, "users", user.uid, "raceProgress", progressId);
    const progressSnapshot = await getDoc(progressRef);

    await setDoc(
      progressRef,
      {
        //Found species id unions the given species with any array value
        foundSpeciesIds: arrayUnion(speciesId),
        //Returns a sentinel to include a server-generated timestamp in the written data.
        foundAt: { [speciesId]: serverTimestamp() },
        ...(progressSnapshot.data()?.startedAt
          ? {}
          : { startedAt: serverTimestamp() }),
      },
      { merge: true },
    );

    // The Ledger is the player's permanent record for an arena and reads the Sprint document, so a Countdown find is mirrored into it.
    if (mode === "countdown") {
      await setDoc(
        doc(db, "users", user.uid, "raceProgress", arenaId),
        {
          foundSpeciesIds: arrayUnion(speciesId),
          foundAt: { [speciesId]: serverTimestamp() },
        },
        { merge: true },
      );
    }

    router.back();
  }

  if (!species) return null;

  return (
    <SafeAreaView style={styles.container}>
      <Banner showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Image
          source={{ uri: species.imageUrl }}
          style={[styles.fullImage, { height: imageHeight }]}
        />
        <ThemedText type="title">{species.commonName}</ThemedText>
        <ThemedText type="scientific">{species.scientificName}</ThemedText>
        <ThemedText style={styles.funFact}>{species.funFact}</ThemedText>
      </ScrollView>

      <TouchableOpacity
        style={styles.foundButton}
        onPress={handleVerifyAndFind}
        disabled={verifying}
      >
        <ThemedText style={styles.foundButtonText}>
          {verifying ? "Verifying..." : "I Found This!"}
        </ThemedText>
      </TouchableOpacity>

      {verifyError && (
        <ThemedText style={styles.verifyError}>{verifyError}</ThemedText>
      )}
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
    gap: 12,
    width: "100%",
    maxWidth: Layout.contentMaxWidth,
    alignSelf: "center",
  },
  fullImage: {
    width: "100%",
    borderRadius: 12,
  },
  funFact: {
    marginTop: 8,
  },
  foundButton: {
    backgroundColor: Colors.text,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    margin: 24,
  },
  foundButtonText: {
    color: Colors.background,
    fontFamily: Fonts.bodySemiBold,
  },
  verifyError: {
    color: "#B00020",
    textAlign: "center",
    marginHorizontal: 24,
    marginBottom: 12,
  },
});
