import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, setDoc, arrayUnion } from "firebase/firestore";
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Banner } from "@/components/banner";
import { ThemedText } from "@/components/themed-text";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Colors, Fonts } from "@/constants/theme";

type SpeciesDetails = {
  commonName: string;
  scientificName: string;
  imageUrl: string;
  funFact: string;
};

export default function SpeciesDetailScreen() {
  const { arenaId, speciesId } = useLocalSearchParams<{
    arenaId: string;
    speciesId: string;
  }>();
  const { user } = useAuth();
  const router = useRouter();
  const [species, setSpecies] = useState<SpeciesDetails | null>(null);

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

  async function handleFound() {
    if (!user || !arenaId || !speciesId) return;

    await setDoc(
      doc(db, "users", user.uid, "raceProgress", arenaId),
      { foundSpeciesIds: arrayUnion(speciesId) },
      { merge: true },
    );

    router.back();
  }

  if (!species) return null;

  return (
  <SafeAreaView style={styles.container}>
    <Banner showBack />
    <ScrollView contentContainerStyle={styles.content}>
      <Image source={{ uri: species.imageUrl }} style={styles.fullImage} />
      <ThemedText type="title">{species.commonName}</ThemedText>
      <ThemedText type="scientific">{species.scientificName}</ThemedText>
      <ThemedText style={styles.funFact}>{species.funFact}</ThemedText>
    </ScrollView>

    <TouchableOpacity style={styles.foundButton} onPress={handleFound}>
      <ThemedText style={styles.foundButtonText}>I Found This!</ThemedText>
    </TouchableOpacity>
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
  },
  fullImage: {
    width: "100%",
    height: 260,
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
});
