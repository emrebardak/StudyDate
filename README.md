# StudyMatch

> Academic-first matchmaking for university students who need a real study partner — not a date.

StudyMatch (working title) pairs students up for focused, in-person study sessions based on their *academic profile* — university, department, current goals — instead of photos. Matching is a means to an end: the goal of every match is to schedule a real "Study Date" at a library or café.

Built with **React Native (CLI, no Expo)** + **TypeScript**, designed to run on Android and iOS from a single codebase, with a **Supabase** backend planned for auth, realtime chat, and storage.

---

## Table of Contents

- [Core Concept](#core-concept)
- [Screens](#screens)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Design System](#design-system)
- [Roadmap](#roadmap)
- [Known Issues](#known-issues)

---

## Core Concept

Three hooks differentiate StudyMatch from a typical dating app:

1. **Single-Tasking** — you can only have one active chat/match at a time. No juggling conversations, no ghosting five people at once.
2. **Progressive Disclosure** — photos are hidden until both users opt to reveal them mid-chat. Matching is driven entirely by academic compatibility (university, department, current study goal, tags like `#MidtermPrep`).
3. **Action-Oriented** — a match isn't the finish line. The app pushes both users toward scheduling an actual "Study Date" (location, time, subject) via a built-in planner.

Full product spec: [studymatch_full_architecture.md](studymatch_full_architecture.md).

## Screens

| Screen | File | Purpose |
|---|---|---|
| Dashboard | [`DashboardScreen.tsx`](StudyMatch/src/screens/DashboardScreen.tsx) | Home — upcoming study sessions, recent matches, "Find a Partner" CTA |
| Match (Discovery) | [`DiscoveryScreen.tsx`](StudyMatch/src/screens/DiscoveryScreen.tsx) | Swipeable deck of academic profiles — drag left/right to decline/accept, with live gold "CONNECT" / red "PASS" stamps |
| Filter | [`FilterScreen.tsx`](StudyMatch/src/screens/FilterScreen.tsx) | Institution search, distance & age range sliders, department chips — round-trips selections back to Discovery |
| Chat | [`ChatScreen.tsx`](StudyMatch/src/screens/ChatScreen.tsx) | Locked chat with a blurred-identity partner; mutual "Reveal Profile" flow |
| Study Date Planner | [`StudyDatePlannerScreen.tsx`](StudyMatch/src/screens/StudyDatePlannerScreen.tsx) | Ticket-style modal to propose a physical meetup (location, time, subject) |
| My Profile | [`MyProfileScreen.tsx`](StudyMatch/src/screens/MyProfileScreen.tsx) | Own profile — photos, academic details, earned badges, edit entry point |
| Edit Profile | [`EditProfileScreen.tsx`](StudyMatch/src/screens/EditProfileScreen.tsx) | Photo slots, academic fields, status text, trait chips |
| Student Profile | [`StudentProfileScreen.tsx`](StudyMatch/src/screens/StudentProfileScreen.tsx) | Revealed partner profile — bio, trust score, availability, badges |
| Match Found | [`MatchFoundScreen.tsx`](StudyMatch/src/screens/MatchFoundScreen.tsx) | Celebratory screen shown on a mutual match |

Navigation is a bottom tab bar (Dashboard / Match / Chats / Planner / Profile) wrapped in a root stack for modal and secondary screens — see [`AppNavigator.tsx`](StudyMatch/src/navigation/AppNavigator.tsx).

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Native (CLI, no Expo) |
| Language | TypeScript |
| Navigation | React Navigation (`native-stack` + `bottom-tabs`) |
| Gestures | `react-native-gesture-handler` (native pan gestures for the swipe deck) |
| Icons | `react-native-vector-icons` (Ionicons) |
| Backend (planned) | Supabase — PostgreSQL, Auth (`.edu` OTP/magic link), Realtime, Storage |

Why no Expo: the app needs native iOS/Android build output (`ios/`, `android/`) for direct App Store / Play Store distribution. An earlier Expo-managed scaffold was removed in favor of standardizing on the RN CLI project in [`StudyMatch/`](StudyMatch).

## Project Structure

```
StudyDate/
├── StudyMatch/                  # the app (React Native CLI project)
│   ├── android/                 # native Android project
│   ├── ios/                     # native iOS project
│   ├── src/
│   │   ├── components/          # shared UI (ProfileCard, VintageStamp, FilmRoll)
│   │   ├── navigation/          # AppNavigator (tabs + root stack)
│   │   ├── screens/             # one file per screen (see table above)
│   │   ├── theme/               # design tokens — colors, spacing, radius, typography
│   │   └── types/                # User/Match/Message/StudyDate interfaces + navigation param types
│   ├── App.tsx
│   └── package.json
├── studymatch_full_architecture.md   # full PRD + technical architecture
├── development.md                    # session-by-session dev log
├── HOW_TO_RUN.md                      # emulator setup walkthrough
└── README.md                          # this file
```

## Getting Started

### Prerequisites
- Node.js ≥ 22.11.0
- [React Native environment set up](https://reactnative.dev/docs/set-up-your-environment) for your target platform (Android Studio + SDK, or Xcode on macOS for iOS)

### Install

```sh
cd StudyMatch
npm install
```

### Run on Android

```sh
npm start          # terminal 1 — Metro bundler
npm run android     # terminal 2 — build & install on emulator/device
```

### Run on iOS *(requires macOS)*

```sh
bundle install
cd ios && bundle exec pod install && cd ..
npm run ios
```

See [`HOW_TO_RUN.md`](HOW_TO_RUN.md) for a detailed emulator walkthrough (Android Studio Device Manager, Metro workflow, troubleshooting).

> **Windows note:** deeply nested project paths can hit the 260-character `MAX_PATH` limit during the Android native (CMake/ninja) build for autolinked packages like `react-native-gesture-handler`. If you see `ninja: error: ... Filename longer than 260 characters`, either enable Windows long-path support (`HKLM\SYSTEM\CurrentControlSet\Control\FileSystem\LongPathsEnabled = 1`, requires a reboot) or clone the repo to a short path (e.g. `C:\dev\SD`).

### Type-check

```sh
cd StudyMatch
npx tsc --noEmit
```

## Design System

All colors, spacing, radius, and typography live in a single source of truth: [`src/theme/index.ts`](StudyMatch/src/theme/index.ts). Palette: Ink Black / Prussian Blue / Regal Navy backgrounds with School Bus Yellow / Gold accents. No design constants are hardcoded in screens — everything references `Colors`, `Spacing`, `Radius`, and `Typography` tokens.

## Roadmap

- [ ] Supabase Auth (OTP magic link, `.edu` email gate)
- [ ] Replace mock data with real Supabase queries
- [ ] Supabase Realtime for chat messages + match-lock mechanism
- [ ] `expo-image-picker`-equivalent photo upload for Edit Profile
- [ ] Post-date survey + trust score update flow
- [ ] Moderation & reporting (soft strike / shadowban / hard ban per the architecture doc)
- [ ] iOS build pipeline (EAS Build or Mac + Xcode) for App Store distribution

## Known Issues

- Discovery/Match deck currently swipes through mock profile data — filters selected in `FilterScreen` round-trip back to Discovery but don't yet filter the (mock) deck contents.
- Android debug builds can fail on Windows due to the `MAX_PATH` issue described above.

---

Full product/technical spec: [`studymatch_full_architecture.md`](studymatch_full_architecture.md) · Development log: [`development.md`](development.md)
