import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';

import { ThemedText } from '@/components/themed-text';
import { useLandscapeCapable } from '@/hooks/use-landscape-capable';
import { Colors } from '@/constants/theme';

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
    <MapView style={styles.map} initialRegion={region} showsUserLocation/>
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
