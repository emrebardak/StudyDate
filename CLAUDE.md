# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

StudyMatch — an academic-first matchmaking app for university students to find in-person study partners. Matching is based on academic profile (university/department/current goal), not photos; photos stay blurred until both users mutually reveal mid-chat. A match locks both users out of Discovery until it resolves (the "Lock System" — see Architecture below). Full product spec: [docs/studymatch_full_architecture.md](docs/studymatch_full_architecture.md).

The app is a **React Native CLI project (no Expo)** at `StudyMatch/`, with native `ios/`/`android/` projects committed to the repo. An earlier Expo-managed scaffold (`app/`) was removed — do not reintroduce Expo or suggest Expo-only APIs (`expo-blur`, `expo-image-picker`, etc.) since they are not installed and won't build.

There is no backend yet. Supabase (PostgreSQL, Auth, Realtime, Storage) is planned but not wired up — all screens currently render mock data defined inline in each screen file.

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

### Screens are currently self-contained mock UIs
Every file in `src/screens/` defines its own mock data constants and renders directly from them — there is no shared data layer, context, or store yet. When wiring real data (Supabase), replace the mock constants in place and keep the existing component structure, animations, and theme usage intact rather than rewriting screens from scratch.

### Filter round-trip pattern
[`FilterScreen.tsx`](StudyMatch/src/screens/FilterScreen.tsx) and `DiscoveryScreen.tsx` demonstrate the app's pattern for passing state between a tab screen and a root-stack screen without a global store: filters are passed forward via `route.params.current` and returned via `navigation.navigate('MainTabs', { screen: 'Match', params: { filters } })`. Follow this same params-round-trip pattern for other screen-to-screen state handoffs until a real state layer exists.

### Project-specific subagents
Four subagents in `.claude/agents/` model the intended division of labor for backend/full-stack work:
- `studymatch-architect` — coordinates cross-layer work, enforces one shared type contract (`src/types/index.ts`) across frontend and future backend
- `studymatch-supabase` — schema, RLS, Auth (`.edu` email gate), Realtime config; owns the snake_case DB naming convention
- `studymatch-frontend` — screen/UI wiring, progressive-disclosure blur, Lock System navigation
- `studymatch-logic` — trust score algorithm, shadowban view, match-timeout cron job

Note the naming split these agents rely on: `src/types/index.ts` interfaces are **camelCase**; any future Supabase schema is **snake_case** by convention — a mapping layer is required at the data-access boundary, not a 1:1 field-name assumption.

## Reference docs
- [docs/studymatch_full_architecture.md](docs/studymatch_full_architecture.md) — full PRD: matching rules, Lock System, trust score/badge point values, moderation tiers, DB schema outline
- [docs/development.md](docs/development.md) — session-by-session log of what's actually been built
- [docs/HOW_TO_RUN.md](docs/HOW_TO_RUN.md) — detailed Android emulator setup walkthrough
