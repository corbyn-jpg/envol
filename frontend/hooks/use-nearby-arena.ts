import { useEffect, useMemo, useState } from "react";
import * as Location from "expo-location";
import { collection, getDocs } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { getDistanceMeters } from "@/lib/distance";

type Arena = {
  id: string;
  name: string;
  province: string;
  description: string;
  radiusMeters: number;
  latitude: number;
  longitude: number;
};

export function useNearbyArena() {
  const [region, setRegion] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [locationDone, setLocationDone] = useState(false);
  const [arenasDone, setArenasDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Location permission is required to find nearby arenas");
          return;
        }

        const position = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } finally {
        // Runs even when permission is denied or the lookup throws
        setLocationDone(true);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const snapshot = await getDocs(collection(db, "arenas"));
      setArenas(
        snapshot.docs.map((doc) => {
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
        }),
      );
      setArenasDone(true);
    })();
  }, []);

  const nearest = useMemo(() => {
    if (!region || arenas.length === 0) return null;

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
      .sort((a, b) => a.distanceMeters - b.distanceMeters)[0];
  }, [region, arenas]);

  const isActive = nearest
    ? nearest.distanceMeters <= nearest.arena.radiusMeters
    : false;
  const loading = !locationDone || !arenasDone;

  return { region, arenas, nearest, isActive, errorMsg, loading };
}
