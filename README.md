# Envol

A location-based birdwatching race for mobile. Players travel to real-world **arenas**, race to identify the bird species found there, and verify each sighting with a photograph. Built with React Native (Expo) and Firebase.

> DV 300 — Term 3 project. Open Window Institute.

---

## Mockups

<!-- Drop the exported images into assets/screenshots/ using these filenames and
     they will appear here automatically. Delete any row you don't end up using. -->

| Map | Race in progress | Leaderboard |
| --- | --- | --- |
| ![Map screen](assets/screenshots/map.png) | ![Active race](assets/screenshots/race.png) | ![Leaderboard](assets/screenshots/leaderboard.png) |

| Ledger | Medals | Species detail |
| --- | --- | --- |
| ![Ledger](assets/screenshots/ledger.png) | ![Medals](assets/screenshots/medals.png) | ![Species detail](assets/screenshots/species.png) |

---

## Contents

- [Mockups](#mockups)
- [What it does](#what-it-does)
- [Tech stack](#tech-stack)
- [Running the project](#running-the-project)
- [Project structure](#project-structure)
- [Data model](#data-model)
- [Architecture notes](#architecture-notes)
- [Security model](#security-model)
- [Constraints and trade-offs](#constraints-and-trade-offs)
- [Known limitations and future work](#known-limitations-and-future-work)

---

## What it does

**Arenas and location.** The map shows nearby arenas pulled from Firestore. Each arena has a coordinate and a radius; the app compares the device's GPS position against them using the haversine formula and only unlocks an arena once the player is physically inside it. The Ledger and Leaderboard tabs follow the same rule — they show the arena you are currently standing in.

**Two game modes.**

| Mode | Timer | Ends when |
| --- | --- | --- |
| Stopwatch Sprint | Counts up, no limit | Every species found, or the player finishes |
| Countdown Challenge | Counts down from 5, 10 or 20 minutes | Time expires, every species found, or the player finishes early |

The race clock lives in a React Context, so it keeps running while the player moves between the map, the ledger and species pages. A mini timer appears on those screens and taps back into the active race. Sprints can be paused; Countdown runs deliberately cannot.

**Photo verification.** A species is only logged as found after the player supplies a photograph whose EXIF `DateTimeOriginal` falls on the current day. Images with stripped metadata — screenshots, downloads, anything forwarded through a messaging app — are rejected. The photo is inspected and discarded; nothing is stored.

**Ledger.** A per-arena record of species found versus still unseen, with a progress bar. Countdown finds are mirrored into it, so timed runs still build the permanent log.

**Leaderboard.** Per arena, segmented by mode, and — because a score is only comparable against the same clock — segmented again by duration within Countdown. Ranked by species found, with elapsed time as the tiebreaker. Sprint entries show how long the run took; Countdown entries show how much time was left. Names, profile pictures and favourite medals are read live rather than from the frozen copy stored on the result.

**Medals.** Eight achievements derived from race history rather than stored as flags — Early Bird, Night Owl, Weekend Warrior, Speed Demon, First Blood, Explorer, Comeback and Marathoner. Players choose one as a favourite, which then appears beside their name on the leaderboard.

**Seasonal theming.** The accent colour follows the current season, or can be pinned manually in Settings.

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | React Native 0.81 via Expo SDK 54 |
| Language | TypeScript |
| Navigation | Expo Router (file-based, typed routes) |
| Backend | Firebase — Authentication and Cloud Firestore |
| Maps | `react-native-maps` |
| Location | `expo-location` |
| Camera / photos | `expo-image-picker`, `expo-image-manipulator` |
| Fonts | Cinzel Decorative, Amarante, Tinos via `@expo-google-fonts` |

---

## Running the project

**Prerequisites:** Node.js 18+, the Expo Go app on a physical device (location and camera features need real hardware).

```bash
cd envol/frontend
npm install
npm start
```

Scan the QR code with Expo Go. `npm run start:web` opens a browser build, though the map and camera features will not work there.

### Firebase setup

The client configuration lives in `lib/firebase.ts`. To point the app at your own Firebase project, replace that object and enable:

- **Authentication** with the Email/Password provider
- **Cloud Firestore**

Then publish security rules — see [Security model](#security-model) below.

### Seeding data

Arenas and their bird species are not created by the app; they must exist in Firestore before anything is playable. Create at least one `arenas` document with a `birds` subcollection following the shapes in [Data model](#data-model).

Field names inside `birds` documents contain spaces (`common name`, `scientific name`, `fun fact`), which is why the code reads them with bracket notation rather than dot access.

---

## Project structure

```
app/                      Screens — file-based routes
  (auth)/                 Login and signup, shown when signed out
  (tabs)/                 Map, Ledger, Leaderboard, Medals
  arena/                  Race entry (mode select) and the active race
  species/                Species detail and photo verification
  settings.tsx            Display name, profile picture, theme, password
components/               Banner, tab bar, mini timer, skeletons, themed text
contexts/                 Auth, theme and race-timer providers
hooks/                    use-nearby-arena — shared GPS/arena resolution
lib/                      Firebase init, medals, game modes, distance,
                          season, photo verification
constants/theme.ts        Colours, fonts, seasonal palette, layout limits
```

---

## Data model

```
users/{uid}
  displayName, photoUrl, favouriteMedalId, themePreference

users/{uid}/raceProgress/{progressKey}
  foundSpeciesIds[], foundAt{speciesId: timestamp},
  startedAt, accumulatedSeconds, completed

arenas/{arenaId}
  name, province, description, location (geopoint),
  radiusMeters, firstCompletedBy

arenas/{arenaId}/birds/{speciesId}
  "common name", "scientific name", imgURL, "fun fact"

raceResults/{resultId}
  userId, displayName, arenaId, mode, limitSeconds,
  totalSeconds, speciesFound, completedAt
```

**The `progressKey` is the interesting part.** Sprint progress is stored under the bare `arenaId`; Countdown uses `{arenaId}_countdown_{limitSeconds}`. Without that separation, playing both modes in one arena would share a single found-birds list and clock. Sprint deliberately kept the original key so progress saved before Countdown existed still loads.

---

## Architecture notes

**The race timer is a context, not screen state.** A timer owned by the race screen would reset every time the player navigated to a species page and back. Instead `RaceProvider` tracks a start timestamp plus banked seconds, and elapsed time is derived from `Date.now()` rather than accumulated by an interval — so the clock stays accurate even if the ticking is throttled. Countdown is the same value subtracted from a limit, which means countdown needed no new timing logic at all.

**Completion is detected, not triggered.** A race can end without the player pressing anything — the last species gets logged on the detail screen, or the clock reaches zero. Recording is therefore driven by derived state (`isFullyComplete || isTimeUp`) rather than by a button handler, with a guard flag preventing a double write.

**Denormalised display names.** `raceResults` stores the player's name at completion time so the leaderboard has a fallback without an extra read, but the leaderboard prefers the live value from `users/{uid}` — otherwise renaming yourself would leave stale names scattered across old results, and the results are immutable by design.

**Medals are derived, not awarded.** Nothing writes "you earned Early Bird". `lib/medals.ts` defines each medal as a predicate over the player's race history, evaluated on render. Adding a medal means adding one entry to an array. The trade-off is that medal logic depends on history staying available.

**A shared max content width.** Every screen caps its content at 560px and centres it. This is what makes landscape and tablet layouts hold together instead of stretching list rows across the full viewport.

---

## Security model

The Firebase config in `lib/firebase.ts` is **not a secret**. Client-side Firebase keys identify the project; they do not grant access. Every meaningful restriction is enforced server-side by Firestore rules, which is where the real security lives.

Rules this app depends on:

- `raceResults` — a user may only create a result carrying their own `userId`, and results are immutable once written (no update, no delete), so scores cannot be edited after the fact.
- `arenas` — readable by everyone, but writable only for the `firstCompletedBy` field, and only when it has not already been set. That makes the First Blood medal a genuine race rather than something any client can claim.
- `users/{uid}` — a user may only write their own document.

The one credential that would need protecting is an Anthropic API key, had the AI verification path been taken — see below.

---

## Constraints and trade-offs

**Cloud Storage requires a paid Firebase plan**, so profile pictures could not be uploaded conventionally. Instead images are cropped square, resized to 256px, JPEG-compressed and stored as a base64 data URI on the user document. That keeps the feature on the free tier at the cost of roughly 15–25KB per user, and it works because a data URI is accepted anywhere an image URL is. Size discipline matters here — the leaderboard reads every displayed racer's user document.

**Photo verification: metadata over AI.** The stronger design would send each photo to a vision model to confirm it shows the expected species. That was costed and prototyped: roughly R0.25 per verification, requiring a serverless proxy to hold the API key, since embedding it in the app would let anyone extract and spend it. Metadata validation was chosen instead as a free, offline, zero-infrastructure check that still defeats the most common cheats. Its honest limit is that it proves *when* a photo was taken, not *what it shows*.

**In-app capture was considered and rejected.** Forcing the camera would make the timestamp unfakeable, but it would also exclude photographs taken on a dedicated camera — a real use case for birdwatchers. Trusting metadata is the cost of supporting them.

---

## Known limitations and future work

- **EXIF timestamps are editable.** The check raises the effort bar considerably but is not tamper-proof. It is a deterrent, not a security boundary.
- **Pixel analysis** would close the gap metadata cannot: confirming the photo shows the right species, detecting photographs of a screen, and catching near-duplicate images passed between players.
- **Medals count Countdown results.** They were intended to be Sprint-only, since a fixed time limit makes duration-based medals like Speed Demon trivial to earn.
- **Duplicate photo detection** — hashing accepted photos would stop one good photograph being shared around a group, a cheat no image analysis catches because the photo is genuine.
- **Google Sign-In** was deferred; it requires leaving Expo Go for a development build.
- **No offline support.** Every screen assumes a live Firestore connection.
