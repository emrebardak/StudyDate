# Frontend Developer Guide

This guide covers frontend development workflow, architecture, and patterns for StudyMatch. Designed primarily for the [studymatch-frontend](./../.claude/agents/studymatch-frontend.md) subagent and frontend developers.

---

## Local Workflow

From `StudyMatch/`:

```sh
npm start                    # Start Metro bundler (terminal 1)
npm run android              # Build & install on emulator (terminal 2)
npx tsc --noEmit             # Type-check after every change
npm test                     # Run Jest tests
npm test -- App.test         # Run a single test file
npm run lint                 # ESLint
```

**Edit → save → auto-reload in emulator** (Metro watches `src/**`).

iOS additionally requires, once per native-dependency change:
```sh
cd ios && bundle exec pod install && cd ..
```

---

## Architecture

### Navigation Structure

[`src/navigation/AppNavigator.tsx`](../StudyMatch/src/navigation/AppNavigator.tsx):
- Root `Stack.Navigator` wraps `MainTabs` (bottom-tab navigator with 5 tabs: Dashboard / Match / Chats / Planner / Profile)
- Secondary/modal screens (`StudentProfile`, `EditProfile`, `Filter`, `StudyDatePlanner`-as-modal) live on the root stack
- `navigation.navigate('Filter')` from a tab screen relies on React Navigation's automatic forwarding to the parent stack — this is expected, not a bug

**Type safety**: `RootStackParamList` and `TabParamList` in [`src/types/index.ts`](../StudyMatch/src/types/index.ts) — extend these, never use untyped `navigation: any` params for new routes.

### Design Tokens

[`src/theme/index.ts`](../StudyMatch/src/theme/index.ts) is the single source of truth:
- `Colors` — dark navy/gold palette
- `Spacing` — all padding/margin
- `Radius` — border radius values
- `Typography` — font sizes and weights
- `Shadow` — shadow definitions

**Rule**: Never hardcode hex values or pixel numbers inline. Always reference theme tokens.

### Screen Architecture

[`src/screens/`](../StudyMatch/src/screens/) — each screen is self-contained and currently renders mock data inline.

When wiring real data (Supabase):
- Replace mock constants in place
- Preserve UI layout, animations, and theme usage
- Keep navigation param types aligned with `src/types/index.ts`

#### Key Screens

**Discovery/Match** ([`DiscoveryScreen.tsx`](../StudyMatch/src/screens/DiscoveryScreen.tsx))
- Swipe deck using `react-native-gesture-handler`'s native `Gesture.Pan()`
- Animations use `Animated.ValueXY` with `useNativeDriver: false` throughout (both drag and release)
- Position resets in a `useEffect` keyed on `deckIndex` **after** state updates (not synchronously)
- Deck cycles through a `PROFILES` array — extend to real data when backend exists

**Chat** ([`ChatScreen.tsx`](../StudyMatch/src/screens/ChatScreen.tsx))
- Mock message list; will subscribe to Supabase Realtime for real messages
- Reveal button drives mutual `both_revealed` flow (currently visual state only)

**Filter** ([`FilterScreen.tsx`](../StudyMatch/src/screens/FilterScreen.tsx))
- State round-trips back to Discovery via navigation params
- Demonstrates the params-handoff pattern used across the app

### State Handoff Pattern (Without a Global Store)

FilterScreen ↔ DiscoveryScreen example:
- **Forward**: `navigation.navigate('Filter', { current: activeFilters })`
- **Receiving**: Read from `route.params.current`
- **Return**: `navigation.navigate('MainTabs', { screen: 'Match', params: { filters } })`
- **Consuming**: DiscoveryScreen reads `route.params.filters`

Follow this pattern for tab ↔ root-stack state handoffs until a real state layer exists.

### Shared Components

- [`src/components/ProfileCard.tsx`](../StudyMatch/src/components/ProfileCard.tsx) — profile display card
- [`src/components/VintageStamp.tsx`](../StudyMatch/src/components/VintageStamp.tsx) — rotated stamp labels
- [`src/components/FilmRoll.tsx`](../StudyMatch/src/components/FilmRoll.tsx) — photo carousel wrapper

Extend these rather than duplicating styles/logic.

---

## Types & Data Contracts

[`src/types/index.ts`](../StudyMatch/src/types/index.ts) defines the source of truth:

```typescript
interface User {
  id: string;
  name: string;
  university: string;
  department: string;
  grade: number;
  trustScore: number;
  badges: Record<string, number>;
  currentGoalText: string;
  currentTags: string[];
  activeMatchId: string | null;
  audioEnvironment?: AudioEnvironment;
  studyPacing?: StudyPacing;
  studyFuel?: StudyFuel;
  // ... more fields
}

interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  status: 'active' | 'completed' | 'terminated' | 'expired';
  user1Revealed: boolean;
  user2Revealed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface StudyDate {
  id: string;
  matchId: string;
  proposedBy: string;
  location: string;
  scheduledTime: string;
  focusSubject: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  createdAt: string;
}
```

**Rule**: Every screen and mock-data shape must agree with these interfaces (camelCase, as defined).

When wiring Supabase: the backend schema will be `snake_case` (Postgres convention), and a **mapping layer is required at the data boundary** — not a direct field-name copy. See [integration.md](integration.md) for examples.

---

## Common Patterns

### Loading & Error States

Reuse the existing `EmptyState` pattern from `DiscoveryScreen.tsx`:
- Show a loading state on first fetch
- Show an empty/error message when there's no data
- Handle network retries gracefully

### Progressive Disclosure (Photos)

Currently: photos are overlaid with a semi-opaque `View` + eye-off icon (see `photoOverlay` style in `DiscoveryScreen.tsx`).

When wiring real reveal logic: transition the UI when the mutual-reveal condition (`both_revealed` or equivalent) flips, without requiring a manual refresh.

---

## Integration with Backend

See [integration.md](integration.md) for:
- Query patterns (how to fetch data from Supabase)
- Realtime subscription patterns (Lock System, chat messages)
- Error handling conventions
- Data mapping (camelCase ← → snake_case)
