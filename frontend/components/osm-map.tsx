import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

type MapArena = {
  id: string;
  name: string;
  province: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

type OsmMapProps = {
  latitude: number;
  longitude: number;
  arenas: MapArena[];
  accentColor: string;
};

// Draws the map with Leaflet and free OpenStreetMap tiles inside a WebView.
// Expo Go's built-in Google Maps key has expired on Android, and OSM needs no key.
export function OsmMap({ latitude, longitude, arenas, accentColor }: OsmMapProps) {
  const html = useMemo(() => {
    // Escaping "<" stops an arena name like "</script>" from breaking the page
    const data = JSON.stringify({ latitude, longitude, arenas, accentColor }).replace(
      /</g,
      "\\u003c",
    );

    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>html, body, #map { height: 100%; margin: 0; }</style>
</head>
<body>
  <div id="map"></div>
  <script>
    const data = ${data};
    const map = L.map("map", { zoomControl: false }).setView([data.latitude, data.longitude], 15);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // The player's position
    L.circleMarker([data.latitude, data.longitude], {
      radius: 8,
      color: "#ffffff",
      weight: 3,
      fillColor: "#4285F4",
      fillOpacity: 1,
    }).addTo(map);

    data.arenas.forEach((arena) => {
      // Shows the area the player has to be inside to enter
      L.circle([arena.latitude, arena.longitude], {
        radius: arena.radiusMeters,
        color: data.accentColor,
        weight: 2,
        fillOpacity: 0.15,
      }).addTo(map);

      // textContent rather than an HTML string, so names are shown as plain text
      const popup = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = arena.name;
      popup.append(title, document.createElement("br"), arena.province);

      L.marker([arena.latitude, arena.longitude]).addTo(map).bindPopup(popup);
    });
  </script>
</body>
</html>`;
  }, [latitude, longitude, arenas, accentColor]);

  return (
    <WebView
      style={styles.map}
      originWhitelist={["*"]}
      // OpenStreetMap blocks tile requests that don't say where they come from
      source={{ html, baseUrl: "https://github.com/corbyn-jpg/envol" }}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
