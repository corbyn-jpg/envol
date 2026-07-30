import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, {Marker} from 'react-native-maps';
import * as Location from 'expo-location';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getDistanceMeters } from '@/lib/distance';
import { ThemedText } from '@/components/themed-text';
import { useLandscapeCapable } from '@/hooks/use-landscape-capable';
import { Colors } from '@/constants/theme';

type Arena = {
id: string;
name: string;
region: string;
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

  //useMemo ensures that the calculation doesn't rerun on every render
  const nearestArena = useMemo(() => {
    if(!region || arenas?.length === 0) return null;
    
    return arenas
    .map((arena) => ({
      arena,
      distanceMeters: getDistanceMeters(
        region.latitude,
        region.longitude,
        arena.latitude,
        arena.longitude
      )
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters)[0];
  }, [region, arenas]);

  useEffect(() => {
    //useEffect can't be async so we call it inside the function
    (async () => {
      //status waits until the user grants permissions for location while the app is in the foreground.
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      //If location is not granted, error is thrown
      if(status !== 'granted') {
        setErrorMsg('Location permission is required to find nearby arena');
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
      const snapshot = await getDocs(collection(db, 'arenas'));

      const fetched = snapshot.docs.map((doc) => {
        const data = doc.data();
        return{
          id: doc.id,
          name: data.name,
          region: data.region,
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

  if(!region) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return(
    <MapView style={styles.map} initialRegion={region} showsUserLocation>
    {arenas.map((arena) => (
      <Marker
        key={arena.id}
        coordinate={{ latitude: arena.latitude, longitude: arena.longitude }}
        title={arena.name}
        description={arena.region}
      />
    ))}
  </MapView>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  map: {
    flex: 1,
  },
});
