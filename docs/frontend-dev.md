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
- **The `'Chats'` tab renders `ConversationsListScreen`, not `ChatScreen`, as of Session 15** — a live conversation thread is the `'Chat'` route (`{ matchId }`) on the root stack, reached by tapping a row in the list. This was a deliberate fix, not a refactor for its own sake: `ChatScreen` used to be the tab component directly with a no-param "fall back to my current active match" resolver, which made any match that had ended (via manual termination or the Phase 5 cron sweep) permanently unreachable from the tab bar
- Secondary/modal screens (`StudentProfile`, `EditProfile`, `Filter`, `StudyDatePlanner`-as-modal, `PostDateSurvey`-as-modal) and `Chat` live on the root stack
- `navigation.navigate('Filter')` from a tab screen relies on React Navigation's automatic forwarding to the parent stack — this is expected, not a bug
- On launch, calls `supabase.auth.getSession()` once (shown as a brief splash spinner) and sets `initialRouteName` to `MainTabs` if a session already exists, otherwise `RegisterVerification` — a returning user with a valid session skips registration entirely
- `MatchFoundScreen` is a real file (`src/screens/MatchFoundScreen.tsx`) but is **not currently registered** in this stack. Its "Start Chat" button navigates to `'Chat'`, which as of Session 15 **is** a real registered route (`ChatScreen`, moved off the `'Chats'` tab) — but the screen itself is still unregistered/unreachable, and its `matchId: 'new'` param is still hardcoded nonsense, so this is unchanged in practice

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
- Deck reads real candidates from `discoverable_users`; `recordSwipe()` persists each decision to `public.swipes` (match formation itself happens server-side on mutual right-swipes, see backend-dev.md)
- `recordSwipe()` failure handling: silent `console.warn` only for `23505` (re-swiping an already-decided candidate — expected/harmless); every other failure (including a null/stale `currentUserId` from an expired session) shows a self-dismissing bottom toast banner and, for the null-user case, re-runs `loadDiscovery()` to surface the real auth error state — don't let a swipe fail silently again

**Chat** ([`ChatScreen.tsx`](../StudyMatch/src/screens/ChatScreen.tsx))
- Real message history loaded on mount (no live Realtime subscription yet — messages don't push live, only load-on-mount/refetch)
- Header subtitle shows the matched partner's real `name` (fetched via the match's `user1_id`/`user2_id` → `users_select_matched` RLS), falling back to "Anonymous Match" only while unresolved — names are not part of the photo-blur progressive disclosure, only photos stay hidden until mutual reveal
- Reveal button drives mutual `both_revealed` flow (currently visual state only)
- **Not a tab component anymore (Session 15)** — lives on the root stack as the `'Chat'` route (`{ matchId }`), reached from `ConversationsListScreen.tsx` (the actual `'Chats'` tab) or directly from `DiscoveryScreen.tsx`'s Lock System handlers. Its own no-`matchId` "fall back to my active match" logic still exists but is no longer the primary path — don't remove it, other call sites may still rely on it.
- Post-date survey banner (Phase 5, Session 14): shown when an unreviewed past `study_dates` row exists for this match — the eligibility query has **no `.limit()`** (a Session 14 version capped it at 5, which could silently hide an older unreviewed date; removed in Session 15) — don't reintroduce a cap without pagination to match

**Conversations List** ([`ConversationsListScreen.tsx`](../StudyMatch/src/screens/ConversationsListScreen.tsx), new in Session 15)
- The real `'Chats'` tab component now — lists every match the caller is part of (active or ended), not just the current one, so an ended match's chat (and its survey banner) stays reachable. Tapping a row navigates to `'Chat', { matchId }`.
- This is what finally exercises the long-open "Chats-tab entry: a conversations list" item from Sessions 4/5's dev log

**Registration Step 1 / Login** ([`RegisterVerificationScreen.tsx`](../StudyMatch/src/screens/RegisterVerificationScreen.tsx))
- Doubles as the login screen: a `mode` toggle (`'signup' | 'login'`) switches the same email/password fields between `supabase.auth.signUp` → `RegisterProfile` and `supabase.auth.signInWithPassword` → `navigation.reset` straight to `MainTabs`
- No separate LoginScreen file — this was a deliberate choice to reuse the existing form rather than duplicate it

**Filter** ([`FilterScreen.tsx`](../StudyMatch/src/screens/FilterScreen.tsx))
- State round-trips back to Discovery via navigation params
- Demonstrates the params-handoff pattern used across the app

**Dashboard** ([`DashboardScreen.tsx`](../StudyMatch/src/screens/DashboardScreen.tsx))
- Fetches own profile + upcoming `study_dates` (active match only) + a "Recently Liked" list (`public.swipes` where `direction='right'`) on mount and on tab focus (`useFocusEffect`, same pattern as Discovery)
- "Recently Liked" replaced an earlier mock "Recent Matches %" section — there's no compatibility-score field in the schema, so don't reintroduce a percentage badge here without a real backing column
- Reading a liked target's profile depends on the `users_select_swiped_right` RLS policy (outbound-only, no "who liked me" leak) — see backend-dev.md

**My Profile** ([`MyProfileScreen.tsx`](../StudyMatch/src/screens/MyProfileScreen.tsx))
- Fetches own profile on mount and on tab focus; Academic Details/Badges/photos all read straight off the `users` row (`university`/`department`/`year`/`badges`/`photo_url`/`photos`)
- `badges` is normally `{}` for a new user (populated by the Phase 5 post-date survey once study dates actually happen, see backend-dev.md/`docs/development.md` Session 14) — the empty state is expected for anyone without a completed study date yet, not a bug
- "Log Out" button (below Edit Profile) confirms via `Alert`, calls `supabase.auth.signOut()`, then `navigation.reset`s to `RegisterVerification`

**Edit Profile** ([`EditProfileScreen.tsx`](../StudyMatch/src/screens/EditProfileScreen.tsx))
- Now wired (was the last mock screen; wired in Session 13) — loads the own `users` row on mount, saves `university`/`department`/`year`/`bio`/`current_tags` via a single `update().eq('id', userId)`
- `year`'s dropdown is hard-limited to `Freshman`/`Sophomore`/`Junior`/`Senior` — that's a DB `CHECK` constraint, not a style choice; don't add other options without a migration
- Its `STUDY_TRAITS` list must stay in sync (same key strings) with `RegisterTraitsScreen.tsx`'s `TRAITS` — both write into the same free-text `current_tags` column, so a tag picked at signup needs to show as selected here too
- Photo upload (avatar + gallery) is explicitly NOT wired — no image-picker dependency and no Storage bucket exist yet; both surfaces show a "Coming soon" alert instead of doing nothing silently

**Match Found** ([`MatchFoundScreen.tsx`](../StudyMatch/src/screens/MatchFoundScreen.tsx))
- Shows the real matched partner's name (fetched via the current user's `active_match_id`, no route param needed — the Lock System guarantees at most one active match), falling back to "your study partner" while unresolved
- Everything else on this screen is still mock (98% "synergy" score, subject name) and it has its own local color constants instead of `src/theme`
- **Not currently reachable**: not registered in `AppNavigator.tsx`'s `Stack.Navigator`. Its "Start Chat" button's `'Chat'` route now exists (Session 15) but its `matchId: 'new'` param is still hardcoded — registering the screen alone wouldn't be enough to make this button work correctly

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
