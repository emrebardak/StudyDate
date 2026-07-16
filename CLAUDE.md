# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

StudyMatch — an academic-first matchmaking app for university students to find in-person study partners. Matching is based on academic profile (university/department/current goal), not photos; photos stay blurred until both users mutually reveal mid-chat. A match locks both users out of Discovery until it resolves (the "Lock System" — see Architecture below). Full product spec: [docs/studymatch_full_architecture.md](docs/studymatch_full_architecture.md).

The app is a **React Native CLI project (no Expo)** at `StudyMatch/`, with native `ios/`/`android/` projects committed to the repo. An earlier Expo-managed scaffold (`app/`) was removed — do not reintroduce Expo or suggest Expo-only APIs (`expo-blur`, `expo-image-picker`, etc.) since they are not installed and won't build.

**Backend is in progress, being built incrementally.** Supabase (PostgreSQL, Auth, Realtime, Storage) runs locally via the Supabase CLI (`StudyMatch/supabase/`, Docker-based) — no hosted project yet. Follow [implemention.md](implemention.md) for the phased build order and current progress; don't assume every table/policy described in the PRD exists yet, and don't assume nothing does. Most screens still render mock data defined inline; the **registration flow is wired to the real backend** (see Data layer below) and is the app's current initial route.

## Standing habits
- **Ask clarifying questions before coding.** Before starting any nontrivial implementation, ask questions until you are ~95% confident you understand exactly what's being asked — don't fill gaps with assumptions. This applies even when a request sounds simple; if scope, approach, or intent is ambiguous, ask rather than guess. Trivial, unambiguous one-liners (typo fixes, obvious single-line tweaks) don't need this.
- **Update `docs/development.md`** (session log) and the relevant checklist in `docs/backend-dev.md`/`docs/frontend-dev.md` at the end of any nontrivial chunk of work — not just when asked.
- **Wire frontend to backend at the end of every phase**, not batched into a separate later task — see `implemention.md`'s per-phase "Frontend wiring" steps.

## Commands

All commands run from `StudyMatch/`, not the repo root.

```sh
npm install                 # install deps
npm start                   # start Metro bundler (leave running)
npm run android              # build & install on Android emulator/device (separate terminal)
npm run ios                  # build & run on iOS simulator — requires macOS
npx tsc --noEmit             # type-check the whole project — run after every change
npm test                     # run Jest tests
npm test -- App.test         # run a single test file
npm run lint                 # ESLint
```

iOS additionally requires, once per native-dependency change:
```sh
cd ios && bundle exec pod install && cd ..
```

Backend commands run from `StudyMatch/` as well (Docker Desktop must be running):
```sh
npx supabase start           # boot local Postgres/Auth/Realtime/Storage/Studio
npx supabase status          # show local API URL + anon key; Studio at STUDIO_URL
npx supabase migration up    # apply new migrations in supabase/migrations/
npx supabase db reset        # nuke local DB and replay ALL migrations from scratch (verification step)
npx supabase stop            # stop the local stack
```

**Windows gotcha:** deeply nested repo paths can exceed the 260-character `MAX_PATH` limit during the Android CMake/ninja build for autolinked native modules (e.g. `react-native-gesture-handler`), producing `ninja: error: ... Filename longer than 260 characters`. Fix by enabling Windows long-path support (`HKLM\SYSTEM\CurrentControlSet\Control\FileSystem\LongPathsEnabled = 1`, requires reboot) or cloning to a short path (e.g. `C:\dev\SD`).

## Architecture

### Navigation shape
[`StudyMatch/src/navigation/AppNavigator.tsx`](StudyMatch/src/navigation/AppNavigator.tsx) is the single navigation entry point: a root `NativeStackNavigator` wraps a `MainTabs` bottom-tab navigator (Dashboard / Match / Chats / Planner / Profile). Secondary/modal screens (`StudentProfile`, `EditProfile`, `Filter`, `StudyDatePlanner`-as-modal) live on the root stack, not inside the tabs, so `navigation.navigate('Filter')` from a tab screen relies on React Navigation's automatic forwarding to the parent stack — this is expected behavior, not a bug, when wiring a tab screen to a root-stack route.

Navigation param types are centralized in [`src/types/index.ts`](StudyMatch/src/types/index.ts) (`RootStackParamList`, `TabParamList`) — extend these rather than using untyped `navigation: any` params for new routes that carry data.

### Design tokens
[`src/theme/index.ts`](StudyMatch/src/theme/index.ts) is the single source of truth for all colors, spacing, radius, and typography (dark navy/gold palette). Screens must reference `Colors`/`Spacing`/`Radius`/`Typography` — never hardcode hex values or pixel numbers inline.

### The swipe deck (Match/Discovery screen)
[`src/screens/DiscoveryScreen.tsx`](StudyMatch/src/screens/DiscoveryScreen.tsx) implements drag-to-decide gestures using `react-native-gesture-handler`'s `Gesture.Pan()` (native gesture recognition — not the JS-based `PanResponder`, which was tried first and proved unreliable for slow/interrupted drags on Android). Key details for anyone touching this file:
- Position is driven by `Animated.ValueXY` with `useNativeDriver: false` consistently across both the drag and the release animations (`forceSwipe`/`springBack`) — mixing native- and JS-driven animations on the same value causes the drag to silently stop responding.
- On swipe completion, `position` is reset to `{0,0}` in a `useEffect` keyed on `deckIndex`, **after** the state update — not synchronously in the completion callback. Resetting it before the index advances causes the just-swiped (old) card to flash back at center for one frame.
- The deck advances through a local mock `PROFILES` array; there's no pagination/fetch logic yet.

### Screens are mostly still self-contained mock UIs
Most files in `src/screens/` define their own mock data constants and render directly from them — there is no shared store beyond the data layer below. When wiring real data (Supabase), replace the mock constants in place and keep the existing component structure, animations, and theme usage intact rather than rewriting screens from scratch. The registration screens (`RegisterVerificationScreen.tsx`, `RegisterFinalScreen.tsx`) are the first to be wired — use them as the reference pattern for wiring the rest.

### Data layer: Supabase client + camelCase↔snake_case mapping
- [`src/lib/supabase.ts`](StudyMatch/src/lib/supabase.ts) — the one Supabase client singleton, configured for React Native (`react-native-url-polyfill`, AsyncStorage session persistence, `detectSessionInUrl: false`). Currently points at the **local** Docker stack's URL/anon key (shared non-secret local-dev defaults) — import this, never call `createClient` again elsewhere.
- [`src/data/mappers.ts`](StudyMatch/src/data/mappers.ts) — the *only* sanctioned crossing point between Supabase's snake_case rows and the frontend's camelCase interfaces in `src/types/index.ts` (`mapUserFromAPI`, `registrationToProfileUpdate`). Never read/write a Supabase row's fields directly in a screen — add a mapper function here instead. A raw 1:1 field assumption (e.g. reading `row.activeMatchId` off a snake_case row) silently yields `undefined`.
- Auth: registration signs up via `supabase.auth.signUp({ email, password })` with a **user-entered password** (Step 1 of the flow; min length mirrors `supabase/config.toml`'s `minimum_password_length`). Supabase Auth stores it as a bcrypt hash on `auth.users` — never write a password to `public.users` or anywhere else. The PRD's passwordless OTP/magic-link flow and real email confirmation remain deferred. Backend enforces academic email via a Postgres trigger (`.edu`/`.edu.tr` only) on `auth.users`, not client-side validation — always let that error surface rather than re-validating the domain list in the UI.

### Filter round-trip pattern
[`FilterScreen.tsx`](StudyMatch/src/screens/FilterScreen.tsx) and `DiscoveryScreen.tsx` demonstrate the app's pattern for passing state between a tab screen and a root-stack screen without a global store: filters are passed forward via `route.params.current` and returned via `navigation.navigate('MainTabs', { screen: 'Match', params: { filters } })`. Follow this same params-round-trip pattern for other screen-to-screen state handoffs until a real state layer exists.

### Project-specific subagents
Five subagents in `.claude/agents/` model the intended division of labor for backend/full-stack work:
- `studymatch-architect` — coordinates cross-layer work, enforces one shared type contract (`src/types/index.ts`) across frontend and backend
- `studymatch-supabase` — schema, RLS, Auth (`.edu` email gate), Realtime config; owns the snake_case DB naming convention
- `studymatch-frontend` — screen/UI wiring, progressive-disclosure blur, Lock System navigation
- `studymatch-logic` — trust score algorithm, shadowban view, match-timeout cron job
- `studymatch-bug-hunter` — read-only QA/security auditor; hunts the camelCase↔snake_case mapping boundary, Realtime listener leaks, Lock System bypasses, and RLS/trust-score race conditions. Reports findings + proposed refactors, doesn't implement features.

Note the naming split these agents rely on: `src/types/index.ts` interfaces are **camelCase**; the Supabase schema (`StudyMatch/supabase/migrations/`) is **snake_case** by convention — the mapping layer at `src/data/mappers.ts` is required at the data-access boundary, not a 1:1 field-name assumption.

## Reference docs
- [docs/studymatch_full_architecture.md](docs/studymatch_full_architecture.md) — full PRD: matching rules, Lock System, trust score/badge point values, moderation tiers, DB schema outline
- [implemention.md](implemention.md) — the phased backend build-out plan (migrations + per-phase frontend wiring); check this for current progress before assuming a table/policy exists
- [docs/development.md](docs/development.md) — session-by-session log of what's actually been built
- [docs/backend-dev.md](docs/backend-dev.md) — backend checklist (what's actually deployed vs. still planned)
- [docs/integration.md](docs/integration.md) — data-mapping and query/Realtime patterns for the frontend↔backend boundary
- [docs/HOW_TO_RUN.md](docs/HOW_TO_RUN.md) — detailed Android emulator setup walkthrough
