# StudyMatch — Development Log

---

## Session 1 — UI Scaffold (All 8 Screens)

### What was done

Bootstrapped the full React Native / Expo project and built every screen shown in the design PDF.

#### Project setup
- Created Expo project with `blank-typescript` template inside `app/`
- Installed: `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`, `expo-blur`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-safe-area-context`, `react-native-screens`, `@expo/vector-icons`

#### Files created

| File | Description |
|---|---|
| `src/theme/index.ts` | Central design tokens — colors, spacing, radius, shadow, typography |
| `src/types/index.ts` | TypeScript interfaces for User, Match, Message, StudyDate + navigation param types |
| `src/navigation/AppNavigator.tsx` | Bottom tab navigator (5 tabs) + root stack for modal/push screens |
| `src/screens/DashboardScreen.tsx` | Home screen with upcoming sessions cards and liked profiles horizontal scroll |
| `src/screens/DiscoveryScreen.tsx` | Swipe card with blurred photo + X/✓ buttons; toggles to empty "Archive is Quiet" state |
| `src/screens/StudentProfileScreen.tsx` | Revealed partner profile — photo hero, bio, trust score stars, availability chips, badges, Pass/Connect CTA |
| `src/screens/ChatScreen.tsx` | Locked chat — blurred avatar header, reveal button, message bubbles, calendar shortcut, send input |
| `src/screens/StudyDatePlannerScreen.tsx` | Ticket-style modal — location dropdown, map placeholder, date field, time spinners, propose button |
| `src/screens/MyProfileScreen.tsx` | Own profile — polaroid carousel, academic stats, study focus, achievements, archived notes |
| `src/screens/EditProfileScreen.tsx` | Edit form — primary + secondary photo slots, academic fields, status textarea, trait chips |
| `App.tsx` | Root entry point wiring gesture handler + AppNavigator |

#### Design decisions
- All colors, spacing, and typography live in `src/theme/index.ts` — single source of truth
- Photo blur is simulated with a color overlay + eye-off icon (no `expo-blur` needed for MVP)
- Discovery screen has a local `hasCards` toggle (tap the gear icon) to preview the empty state
- Study Date Planner is registered as a `transparentModal` stack screen so it floats over the chat background
- All screens use mock data and accept `navigation: any` — ready to be wired to real Supabase data

#### Validation
- `npx tsc --noEmit` — **0 errors**

---

### Next steps (suggested)
- [ ] Connect Supabase Auth (OTP magic link with `.edu` email gate)
- [ ] Replace mock data with real Supabase queries (`supabase-js`)
- [ ] Add gesture-based swipe (react-native-gesture-handler pan responder) to Discovery card
- [ ] Implement Supabase Realtime subscription for chat messages and the screen-lock mechanism
- [ ] Add `expo-image-picker` integration to Edit Profile photo slots
- [ ] Build post-date survey modal and trust score update flow

---

## Session 2 — Drop Expo scaffold, fix duplicate bottom tab bar

### What was done

#### Removed the Expo-based scaffold
- Deleted the `app/` directory entirely (Expo `blank-typescript` RN CLI project) — the project now standardizes on `StudyMatch/`, the pure React Native CLI app (no Expo), which already has native `ios/` and `android/` folders generated.
- `git rm -r --cached app/` staged the removal; change is reversible via git history but not yet committed.
- Reasoning: only one native app is needed going forward, and iOS App Store publishing requires a real Xcode project — `StudyMatch/ios` already provides that; the Expo scaffold was redundant.

#### Fixed duplicate bottom tab bar bug
- Root cause: `AppNavigator.tsx` already renders a real bottom tab bar via `createBottomTabNavigator`, but four screens also rendered their own hand-rolled, non-functional `TabBar`/`BottomTabBar` components left over from an earlier mockup stage — causing two bars to stack visually. The fake bars had no `onPress` navigation wiring.
- Removed the local `TabBar`/`BottomTabBar` component definitions, their render calls, and their now-unused styles from:
  - `src/screens/DashboardScreen.tsx`
  - `src/screens/DiscoveryScreen.tsx`
  - `src/screens/ChatScreen.tsx`
  - `src/screens/MyProfileScreen.tsx`
- `AppNavigator.tsx`'s `Tab.Navigator` is now the single source of the bottom tab bar across all tab screens.

#### Validation
- `npx tsc --noEmit` — **0 errors**

### Next steps (suggested)
- [ ] Confirm `StudyDatePlannerScreen.tsx` renders correctly both as a tab screen and as a modal stack screen (no leftover custom nav assumptions)
- [ ] Review `FilterScreen.tsx`'s custom bottom action bar (Apply/Reset) — screen-specific, not a nav duplicate, but worth a design pass since it sits in the root Stack
- [ ] Set up EAS Build (or Mac + Xcode) for iOS distribution, since local iOS builds require macOS
- [ ] Continue Supabase integration work per Session 1 next steps
