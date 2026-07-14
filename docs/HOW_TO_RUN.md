# How to Run StudyMatch on emulator-5554

## Setup Type
- **Pure React Native CLI** (no Expo, no Expo Go)
- **Device:** emulator-5554 (your Android virtual device)
- **Build System:** Gradle + React Native CLI
- **First build:** ~3–5 minutes
- **Subsequent builds:** ~10–30 seconds (hot reload)

---

## Prerequisites
- Android Studio installed
- emulator-5554 created and available in Device Manager
- Node.js and npm installed

---

## Step 1 — Start Your Emulator

1. Open **Android Studio**
2. Click **Device Manager** (right sidebar)
3. Find your virtual device and click the green **▶ Play** button
4. Wait for the Android home screen to fully appear

Verify it is running — open a terminal and run:
```sh
adb devices
```
You should see:
```
emulator-5554    device
```
If it shows `offline`, wait another 30 seconds and try again.

---

## Step 2 — Open Terminal & Navigate to the App

```sh
cd C:\MrBardak\Code\StudyDate\StudyMatch
```

---

## Step 3 — Start Metro Bundler

Open a terminal and run:
```sh
npm start
```
Leave this terminal open. Metro is the JavaScript server that talks to your emulator.

---

## Step 4 — Build & Install on emulator-5554

Open a **second terminal** and run:
```sh
cd C:\MrBardak\Code\StudyDate\StudyMatch
npm run android
```

What happens:
1. Gradle compiles the native Android APK
2. ADB installs it on emulator-5554
3. StudyMatch launches automatically on the emulator

First run output will end with:
```
BUILD SUCCESSFUL
...
info Starting the app on "emulator-5554"
```

---

## Step 5 — Using the App

The app is now running natively on emulator-5554. No Expo Go involved.

| Action | How |
|---|---|
| Reload JS | Press `R` twice in the Metro terminal |
| Open dev menu | Press `M` in the Metro terminal |
| Stop Metro | `Ctrl+C` in the Metro terminal |

**Edit any file in `src/`** → save → app hot-reloads in ~2 seconds on the emulator.

---

## Everyday Workflow

```
1. Start emulator from Android Studio Device Manager
2. Terminal 1:  cd C:\MrBardak\Code\StudyDate\StudyMatch  →  npm start
3. Terminal 2:  cd C:\MrBardak\Code\StudyDate\StudyMatch  →  npm run android
4. Edit files in src/ — changes auto-reload on emulator-5554
```

After the first install, you only need `npm start` for subsequent sessions
(the APK stays installed on the emulator).

---

## Troubleshooting

**"No emulator found" or "no devices"**
- Make sure the emulator is fully booted (Android home screen visible)
- Run `adb devices` — must show `emulator-5554   device` (not offline)

**Metro port already in use**
```sh
npm start -- --port 8082
```
Then in the second terminal:
```sh
npm run android -- --port 8082
```

**Gradle build fails**
```sh
cd android
./gradlew clean
cd ..
npm run android
```

**App crashes on launch (white/black screen)**
- Press `M` in Metro terminal → select "Reload"
- Or press `R` twice in the Metro terminal

**Icons not showing (blank squares)**
- This means `react-native-vector-icons` fonts haven't been linked yet
- Run `npm run android` once — the `fonts.gradle` script copies them automatically

---

## Shutting Everything Down

The app now depends on the local Supabase stack too (Docker), not just Metro/the emulator. Shut down in this order:

1. **Stop Metro** — in its terminal, press `Ctrl+C`.
2. **Stop the local Supabase stack** (from `StudyMatch/`):
   ```sh
   npx supabase stop
   ```
   This stops all the backend containers (Postgres, Auth, Realtime, Storage, Studio, Kong). Your database data is preserved on disk — the next `npx supabase start` picks up right where you left off, no data loss.
3. **Close the emulator** — close its window, or from a terminal:
   ```sh
   adb -s emulator-5554 emu kill
   ```
4. **(Optional) Quit Docker Desktop** — only needed if you want to free up RAM/CPU; not required for day-to-day work, since `supabase stop` already stops the containers.

### Full reset (rare — wipes local DB data)
If you want to start the backend completely fresh (drop all local test users/data and replay every migration from scratch):
```sh
npx supabase db reset
```
This does **not** touch your migration files (`supabase/migrations/`) — only the live local database contents.

### Everyday startup, for reference
```sh
cd C:\MrBardak\Code\StudyDate\StudyMatch
npx supabase start     # backend (Docker) — leave running
npm start               # Metro — separate terminal, leave running
npm run android         # separate terminal, after Metro is ready
```
