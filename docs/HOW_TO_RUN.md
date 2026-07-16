# How to Run StudyMatch

Covers the full stack: local Supabase backend (Docker) + Metro bundler + Android emulator. All three must be running together for the app to work end-to-end (registration, matching, chat, etc.).

## Setup Type
- **Pure React Native CLI** (no Expo, no Expo Go)
- **Backend:** Local Supabase stack via Docker (Postgres, Auth, Realtime, Storage, Studio)
- **Device:** Android emulator (e.g. `emulator-5554`)
- **Build System:** Gradle + React Native CLI
- **First build:** ~3–5 minutes
- **Subsequent builds:** ~10–30 seconds (hot reload)

---

## Prerequisites
- Android Studio installed, with a virtual device created in Device Manager
- Node.js and npm installed
- **Docker Desktop installed** (required for the local Supabase stack — see [CLAUDE.md](../CLAUDE.md))
- Windows long-path support enabled (`HKLM\SYSTEM\CurrentControlSet\Control\FileSystem\LongPathsEnabled = 1`, reboot required) — otherwise the Android build can fail with a 260-character path error on nested native modules

---

## Every Session: 3 Things Must Be Running

| # | What | Terminal | Leave running? |
|---|---|---|---|
| 1 | Docker Desktop + local Supabase stack | any | Yes |
| 2 | Metro bundler | Terminal 1 | Yes |
| 3 | App on the emulator | Terminal 2 (one-off command) | — |

Start them **in this order** — the app needs the backend reachable at launch (registration is the app's initial screen and calls Supabase immediately).

---

## Step 1 — Start Docker Desktop

Open Docker Desktop and wait until it's fully running (whale icon steady in the system tray, not animating).

Verify from a terminal:
```sh
docker ps
```
If this hangs or errors with something like `open //./pipe/dockerDesktopLinuxEngine`, Docker Desktop isn't finished starting yet — wait and retry.

---

## Step 2 — Start the Local Supabase Backend

```sh
cd C:\MrBardak\Code\StudyDate\StudyMatch
npx supabase start
```

First run ever pulls ~10 Docker images and can take several minutes with little visible output — this is normal, not a hang. Every run after that reuses the cached images and starts in seconds, restoring your existing data from backup.

Wait for:
```
Started supabase local development setup.
```
followed by a JSON block with `API_URL`, `ANON_KEY`, `STUDIO_URL`, etc. — these are the same shared local-dev defaults every time (not secrets), already baked into `StudyMatch/src/lib/supabase.ts`.

**Verify the backend is actually reachable:**
```sh
npx supabase status
```
Then open **http://127.0.0.1:54323** in a browser — Supabase Studio should load. This is your window into the database (Table Editor, Authentication → Users, SQL Editor).

---

## Step 3 — Start Your Emulator

1. Open **Android Studio**
2. Click **Device Manager** (right sidebar)
3. Find your virtual device and click the green **▶ Play** button
4. Wait for the Android home screen to fully appear

Verify it is running:
```sh
adb devices
```
You should see:
```
emulator-5554    device
```
If it shows `offline`, wait another 30 seconds and try again.

---

## Step 4 — Start Metro Bundler

```sh
cd C:\MrBardak\Code\StudyDate\StudyMatch
npm start
```
Leave this terminal open. Metro is the JavaScript server that talks to your emulator.

---

## Step 5 — Build & Install on the Emulator

Open a **second terminal**:
```sh
cd C:\MrBardak\Code\StudyDate\StudyMatch
npm run android
```

What happens:
1. Gradle compiles the native Android APK
2. ADB installs it on the emulator
3. StudyMatch launches automatically, landing on the registration screen (Step 1)

First run output ends with:
```
BUILD SUCCESSFUL
...
info Starting the app on "emulator-5554"
```

---

## Step 6 — Using the App

| Action | How |
|---|---|
| Reload JS (after editing a `.ts`/`.tsx` file) | Press `R` twice in the Metro terminal, or shake/`M` → Reload |
| Open dev menu | Press `M` in the Metro terminal |
| Stop Metro | `Ctrl+C` in the Metro terminal |
| View/edit database directly | Supabase Studio → http://127.0.0.1:54323 |

**Edit any file in `src/`** → save → app hot-reloads in ~2 seconds. No rebuild needed for JS-only changes — only `npm run android` needs re-running after installing a new native dependency or changing native/`android`/`ios` config.

---

## Everyday Workflow (after first-time setup)

```
1. Open Docker Desktop, wait for it to be ready
2. Terminal 1:  cd StudyMatch  →  npx supabase start   (leave running)
3. Start emulator from Android Studio Device Manager
4. Terminal 2:  cd StudyMatch  →  npm start             (leave running)
5. Terminal 3:  cd StudyMatch  →  npm run android        (one-off; app stays installed after)
6. Edit files in src/ — changes auto-reload
```

After the first install, you only need steps 1, 2, 3, 4 for subsequent sessions (the APK stays installed on the emulator — `npm run android` is only needed again after a native change).

---

## Troubleshooting

### Backend

**`supabase start is already running` but then `container is not running: exited`**
This happens whenever the containers stopped outside a clean `supabase stop` — e.g. after a PC restart, Docker Desktop restart, or sleep/wake. The CLI's local state file goes stale and thinks the stack is still up. Fix — stop first to clear the stale state, then start clean:
```sh
npx supabase stop
npx supabase start
```
Your data is preserved either way (`"Starting database from backup..."` in the output confirms it).

**Can't open Supabase Studio in the browser (page won't load)**
The stack isn't actually running. Check:
```sh
docker ps
```
If no `supabase_*` containers are listed, run `npx supabase start` (see the stale-state fix above if it errors). Confirm with:
```sh
curl -o /dev/null -w "%{http_code}\n" http://127.0.0.1:54323
```
should print `307`, not `000`/connection-refused.

**App shows "Network request failed" on registration (or any Supabase call)**
On the **Android emulator**, `127.0.0.1` inside the app refers to the emulator itself, not your PC. `StudyMatch/src/lib/supabase.ts` already handles this via `Platform.select` (`10.0.2.2` on Android, `127.0.0.1` elsewhere) — if you still see this error, confirm the backend is actually running (see above), and that you didn't revert that file. A **real physical device** isn't covered by this fix and needs your PC's LAN IP instead of either alias.

**The `vector` container keeps restarting / shows "Restarting" in `docker ps`**
Known, harmless on Windows — `vector` (the log-shipper feeding Studio's analytics/log-explorer) needs Docker's daemon exposed over `tcp://localhost:2375`, which isn't enabled by default. Doesn't affect Postgres/Auth/REST/Realtime/Storage. Fix only if you need the log explorer: Docker Desktop → Settings → General → enable "Expose daemon on tcp://localhost:2375 without TLS" → restart Docker → `npx supabase start` again.

**Docker Desktop itself won't start / `docker ps` hangs**
Docker Desktop doesn't currently auto-start on login on this machine — you have to open it manually each session before `npx supabase start` will work.

### Emulator / Metro

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
- Press `M` in the Metro terminal → select "Reload"
- Or press `R` twice in the Metro terminal
- If the crash is Supabase-related, confirm the backend is actually running first (see Backend section above) — the registration screen calls Supabase on launch

**Icons not showing (blank squares)**
- Means `react-native-vector-icons` fonts haven't been linked yet
- Run `npm run android` once — the `fonts.gradle` script copies them automatically

**Metro cache acting weird / stale bundle errors**
```sh
npm start -- --reset-cache
```

---

## Shutting Everything Down

Shut down in this order:

1. **Stop the app on the emulator** — not strictly required, but tidy: just leave it, or close the emulator (next step) which takes it down too.
2. **Stop Metro** — in its terminal, press `Ctrl+C`.
3. **Stop the local Supabase stack** (from `StudyMatch/`):
   ```sh
   npx supabase stop
   ```
   Stops all backend containers (Postgres, Auth, Realtime, Storage, Studio, Kong). Data is preserved — the next `npx supabase start` restores it, no data loss.
4. **Close the emulator** — close its window, or:
   ```sh
   adb -s emulator-5554 emu kill
   ```
5. **(Optional) Quit Docker Desktop** — only to free up RAM/CPU; not required day-to-day since `supabase stop` already stops the containers. No files or the database itself are deleted by quitting Docker Desktop.

**No "cleaning" is needed for a normal close/reopen cycle** — this whole sequence is just stopping processes; nothing needs to be wiped or reset between sessions.

### Full reset (rare, deliberate — wipes local DB data)
Only if you want to drop **all** local test users/matches/messages and replay every migration from scratch:
```sh
npx supabase db reset
```
This does **not** touch your migration files (`supabase/migrations/`) — only the live local database contents. Use this if the local DB gets into a confusing state during testing, not as part of routine shutdown.
