import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDistanceMeters } from "@/lib/distance";
import { ThemedText } from "@/components/themed-text";
import { useLandscapeCapable } from "@/hooks/use-landscape-capable";
import { Colors, Fonts } from "@/constants/theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { OrnateDivider } from "@/components/ornate-divider";
import { useTheme } from "@/contexts/theme-context";
import { MiniTimer } from "@/components/mini-timer";
import { Banner } from "@/components/banner";

type Arena = {
  id: string;
  name: string;
  province: string;
  description: string;
  radiusMeters: number;
  latitude: number;
  longitude: number;
};

export default function MapScreen() {
  //Allows this page to go into landscape
  useLandscapeCapable();

  const [region, setRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [arenas, setArenas] = useState<Arena[]>([]);
  const insets = useSafeAreaInsets();
  const { primary } = useTheme();
  const router = useRouter();

  //useMemo ensures that the calculation doesn't rerun on every render
  const arenasWithDistance = useMemo(() => {
    if (!region) return [];

    return arenas
      .map((arena) => ({
        arena,
        distanceMeters: getDistanceMeters(
          region.latitude,
          region.longitude,
          arena.latitude,
          arena.longitude,
        ),
      }))
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [region, arenas]);

  const nearest = arenasWithDistance[0] ?? null;
  const isActive = nearest
    ? nearest.distanceMeters <= nearest.arena.radiusMeters
    : false;

  useEffect(() => {
    //useEffect can't be async so we call it inside the function
    (async () => {
      //status waits until the user grants permissions for location while the app is in the foreground.
      const { status } = await Location.requestForegroundPermissionsAsync();

      //If location is not granted, error is thrown
      if (status !== "granted") {
        setErrorMsg("Location permission is required to find nearby arena");
        return;
      }

      //Position requests for one-time delivery of the user's current location.
      const position = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  useEffect(() => {
    (async () => {
      //Returns a snapshot containing every document in the collection
      const snapshot = await getDocs(collection(db, "arenas"));

      const fetched = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          province: data.province,
          description: data.description,
          radiusMeters: data.radiusMeters,
          latitude: data.location.latitude,
          longitude: data.location.longitude,
        };
      });

      setArenas(fetched);
    })();
  }, []);

  //Returns a page with the error message
  if (errorMsg) {
    return (
      <SafeAreaView style={styles.center}>
        <ThemedText>{errorMsg}</ThemedText>
      </SafeAreaView>
    );
  }

  if (!region) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Banner />

      <View style={styles.mapContainer}>
        {/* Creates arena markers */}
        <MapView style={styles.map} initialRegion={region} showsUserLocation>
          {arenas.map((arena) => (
            <Marker
              key={arena.id}
              coordinate={{
                latitude: arena.latitude,
                longitude: arena.longitude,
              }}
              title={arena.name}
              description={arena.province}
            />
          ))}
        </MapView>

        <View style={styles.miniTimerFloat}>
          <MiniTimer />
        </View>
      </View>
      {/* Creates an arena around our markers */}
      {nearest && (
        <View
          style={[
            styles.card,
            {
              bottom: insets.bottom + 12 + 64 + 12,
              backgroundColor: primary,
            },
          ]}
        >
          <ThemedText style={styles.cardLabel}>
            {isActive
              ? "ARENA ACTIVE"
              : `NEAREST ARENA · ${(nearest.distanceMeters / 1000).toFixed(1)} KM`}
          </ThemedText>
          <ThemedText type="subtitle" style={styles.cardSubtitle}>
            {nearest.arena.name}
          </ThemedText>
          <ThemedText style={styles.cardDescription}>
            {nearest.arena.description}
          </ThemedText>
          <TouchableOpacity
            style={[
              styles.enterButton,
              isActive
                ? { backgroundColor: Colors.accent }
                : styles.enterButtonDisabled,
            ]}
            disabled={!isActive}
            onPress={() =>
              router.push({
                pathname: "/arena/entry-screen",
                params: { id: nearest.arena.id },
              })
            }
          >
            <ThemedText style={styles.enterButtonText}>
              {isActive ? "Enter" : "Get closer to enter"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  miniTimerFloat: {
    position: "absolute",
    top: 12,
    left: 16,
    alignItems: "center",
  },
  card: {
    position: "absolute",
    left: 16,
    right: 16,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  cardLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    color: Colors.accent,
  },
  cardSubtitle: {
    color: "#fff",
  },
  cardDescription: {
    marginBottom: 8,
    color: "#fff",
  },
  enterButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  enterButtonText: {
    color: Colors.text,
    fontFamily: Fonts.bodySemiBold,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  map: {
    flex: 1,
  },
  enterButtonDisabled: {
    backgroundColor: Colors.background,
  },
});
