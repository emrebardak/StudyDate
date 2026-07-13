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

---

## Session 3 — Registration flow + backend Phase 0/1 (Supabase)

### What was done

#### 4-screen registration flow
Added `RegisterVerificationScreen.tsx`, `RegisterProfileScreen.tsx`, `RegisterTraitsScreen.tsx`, `RegisterFinalScreen.tsx` under `src/screens/`, matching the dark-mode mockups in `screen/`. Data accumulates across screens via navigation params (`RegistrationData` in `src/types/index.ts`), following the existing Filter↔Discovery round-trip pattern. App now launches into `RegisterVerification` (`AppNavigator.tsx`'s `initialRouteName`); "Complete Archive" on the final screen does a `navigation.reset` into `MainTabs`.

Also reorganized docs into `docs/` (`HOW_TO_RUN.md`, `development.md`, `studymatch_full_architecture.md` moved; added `frontend-dev.md`, `backend-dev.md`, `integration.md`), added root `CLAUDE.md`, and added the four project subagents in `.claude/agents/`.

#### Backend — Phase 0: local Supabase scaffold
- `npx supabase init` in `StudyMatch/` → created `StudyMatch/supabase/config.toml` + `migrations/`.
- `npx supabase start` → local stack (Postgres, Auth/GoTrue v2.192.0, Realtime, Storage, Studio, Kong) running in Docker.
- **Gotcha hit**: first `supabase start` was cancelled mid-image-pull, which left an orphaned Docker network and caused `failed to start docker container ... network ... not found` on retry. Fixed with `supabase stop --no-backup` then `supabase start` again (images were already cached, so it was quick the second time).
- **Known non-blocking issue**: the `vector` (log-shipper) container crash-loops on Windows because Docker Desktop doesn't expose the daemon over `tcp://localhost:2375` by default, and `vector` needs that to tail container logs for the local analytics/log-explorer UI. Does not affect Postgres/Auth/REST/Realtime/Storage — all confirmed healthy. Fix (optional): enable "Expose daemon on tcp://localhost:2375" in Docker Desktop settings and restart.

#### Backend — Phase 1: accounts (`users` table, `.edu` gate, RLS)
Four migrations in `StudyMatch/supabase/migrations/`:
1. `create_users_table.sql` — `public.users`, 1:1 with `auth.users`, snake_case columns matching `src/types/index.ts`'s `User` interface (`trust_score DEFAULT 100`, `active_match_id`, badges, vibe/habit fields, etc.), plus a **mock** `verification_code TEXT DEFAULT '000000'` column standing in for real email confirmation (to be replaced with Supabase Auth OTP/magic-link in a later phase — user's explicit call: "option A").
2. `edu_email_gate.sql` — `BEFORE INSERT` trigger on `auth.users` rejecting any email not ending in `.edu`/`.edu.tr`.
3. `users_row_created.sql` — `AFTER INSERT` trigger auto-provisioning a `public.users` row on every signup (standard Supabase pattern).
4. `users_rls.sql` — RLS enabled, own-row `SELECT`/`UPDATE` policies (`auth.uid() = id`).

**Bug caught during verification, fixed same session**: this Supabase CLI version's default privileges grant `authenticated` only `TRUNCATE`/`REFERENCES`/`TRIGGER` on new tables — never DML. Without an explicit `GRANT SELECT, UPDATE ON public.users TO authenticated`, RLS policies never even get evaluated; every query fails with "permission denied" first. Added the `GRANT` to migration 4 and re-verified via a full `supabase db reset`.

**Verified end-to-end** (`docker exec` into `supabase_db_StudyMatch`, testing as the `authenticated` role with `SET request.jwt.claims`):
- `eve@gmail.com` → rejected by the gate
- `alice@mit.edu`, `bob@boun.edu.tr` → accepted, `public.users` row auto-created (`trust_score=100`, `verification_code=000000`)
- Alice can read/update her own row; her `UPDATE` against Bob's row affects 0 rows (RLS blocks); `anon` role denied entirely
- Deleting `auth.users` row cascades to `public.users`

#### Validation
- `npx tsc --noEmit` — **0 errors** (registration screens)
- `npx supabase migration up` / `npx supabase db reset` — all 4 Phase 1 migrations replay cleanly from empty DB

#### Backend — Phase 1 frontend wiring (registration → real Supabase)
Connected the 4-screen registration flow to the live local backend (the plan now wires frontend at the end of every phase, not batched at the end):
- Installed `@supabase/supabase-js`, `@react-native-async-storage/async-storage`, `react-native-url-polyfill`.
- `src/lib/supabase.ts` — client singleton configured for React Native (URL polyfill, AsyncStorage session persistence, `detectSessionInUrl: false`). Holds the **local** dev URL/anon key (shared non-secret defaults) — swap for hosted values in Phase 6.
- `src/data/mappers.ts` — camelCase↔snake_case boundary (`mapUserFromAPI`, `registrationToProfileUpdate`) per `docs/integration.md`.
- `RegisterVerificationScreen.tsx` (Step 1) — replaced the client-side `.edu` regex with a real `supabase.auth.signUp({ email, password })`; the backend `.edu` gate's error now surfaces on-screen. Signup initially used a throwaway random password (flow is passwordless-by-design per PRD §3, OTP deferred); **superseded in Session 4 by a real user-entered password field**. Added loading state.
- `RegisterFinalScreen.tsx` (Step 4) — "Complete Archive" now does an authenticated `UPDATE` on `public.users` (`name`, `university`, `department`, `current_tags`←traits, `current_goal_text`←focus goal) filtered by the session user's id, then resets to `MainTabs`. Added saving/error state.

**Verified** at the REST/Auth API level (same calls supabase-js makes, since running the RN app needs a native rebuild for AsyncStorage):
- `signUp` with `nope@gmail.com` → rejected with the real `.edu` gate message (Postgres `23514`)
- `signUp` with `wire-test@stanford.edu` → returns an `access_token` + session
- authenticated `PATCH /rest/v1/users` with that token → profile fields (`name`, `university`, `department`, `current_tags`, `current_goal_text`) persist; `trust_score=100`, `verification_code=000000` intact
- `npx tsc --noEmit` — **0 errors**

> **Note**: to actually run the app, a native rebuild is required (`npx react-native run-android`) because AsyncStorage links native code. The wiring logic is API-verified but not yet exercised on a device/emulator.

### Next steps (suggested)
- [ ] Run the app on the emulator and walk the registration flow end-to-end on-device (needs native rebuild for AsyncStorage)
- [x] Backend Phase 2: `matches`, `messages`, `study_dates` tables + RLS — done, see Session 4
- [ ] Backend Phase 3: Lock System single-active-match trigger on `matches`
- [ ] Backend Phase 4: Realtime publication + `discoverable_users` shadowban view
- [ ] Backend Phase 5: trust-score function + match-timeout cron
- [ ] Replace the mock `verification_code` with real Supabase Auth email confirmation (magic link/OTP)
- [ ] Fix (or accept) the `vector` container crash-loop if local log-explorer/analytics is ever needed

---

## Session 4 — Backend Phase 2: matches / messages / study_dates (+ Chat & Planner wiring)

### What was done

#### Backend — two migrations in `StudyMatch/supabase/migrations/`
1. `20260713140804_create_matches_messages_study_dates.sql` — the three core relational tables per `docs/backend-dev.md` / PRD §9:
   - `matches` (status enum CHECK, reveal flags, `matches_distinct_users` CHECK against self-matches, indexes on user1/user2/status). Also **closes Migration 1's forward reference**: `users.active_match_id` now has a real FK to `matches` with `ON DELETE SET NULL` (a hard-deleted match releases the lock instead of dangling).
   - `messages` (FK to matches ON DELETE CASCADE, non-empty content CHECK, indexes on match_id and created_at DESC).
   - `study_dates` (status enum CHECK, FK to matches, index on match_id).
2. `20260713140806_matches_messages_study_dates_rls.sql` — RLS + explicit GRANTs (Phase 1 lesson: no GRANT → "permission denied" before policies are ever evaluated):
   - `matches`: participants SELECT/UPDATE; INSERT only as `user1_id` (the initiator); no client DELETE. Single-active-match invariant is deliberately deferred to Phase 3's trigger.
   - `messages`: SELECT via participant-of-match EXISTS subquery; INSERT only as yourself and **only into an `active` match** (closed matches are read-only history); immutable — no UPDATE/DELETE.
   - `study_dates`: SELECT/UPDATE via same subquery; INSERT only as yourself into your active match.
   - `users` addition — `users_select_matched`: you can read the profile of anyone you share a match with (Chat/StudentProfile need the partner row). Discovery-wide reads remain deferred to Phase 4's `discoverable_users` view.

#### Frontend wiring (per-phase rule)
- `src/data/mappers.ts` — added `mapMatchFromAPI`, `mapMessageFromAPI`, `mapStudyDateFromAPI`. The `Match` interface's frontend-only fields (`partnerAlias`, `messageCount`, `revealThreshold`) have no DB columns — the mapper derives/defaults them (`extras` param, `DEFAULT_REVEAL_THRESHOLD = 10`) instead of pretending they're 1:1.
- `ChatScreen.tsx` — mock message array replaced with real queries: resolves the match from `route.params.matchId` or (from the Chats tab) the user's single active match, loads history ordered by `created_at`, maps via `mapMessageFromAPI`; `handleSend` INSERTs and appends the returned row. Loading / error-with-retry / no-active-match states added; `senderId === 'me'` became `senderId === currentUserId`. No Realtime yet — that's Phase 4 by design.
- `StudyDatePlannerScreen.tsx` — "Create Date" now INSERTs a real `study_dates` row (`scheduled_time` composed from the calendar day + time spinners, `focus_subject` from tags + notes, location from the selector), with saving/error state; closes the modal on success. Same active-match fallback as ChatScreen.

#### Verified
- SQL-level RLS suite (`docker exec` psql as `authenticated` with `request.jwt.claims`, 18 checks): participants can read their matches/messages/dates and each other's profiles; a bystander sees none of it (0 rows everywhere, UPDATE 0); forged `sender_id` INSERT denied; INSERT into a terminated match denied (both as participant and as bystander); match INSERT on others' behalf denied; self-match CHECK fires; deleting a match nulls `active_match_id` via the FK.
- REST-level end-to-end (same calls supabase-js makes): two `.edu` signups → alice creates match → alice sends message → **bob reads it** → bob reads alice's profile via the matched-partner policy → bob proposes a study date → **alice accepts it** (`status=accepted`); forged-sender INSERT returns RLS error `42501`; `anon` is denied on `matches` entirely.
- `npx supabase db reset` — all 6 migrations replay cleanly from an empty DB.
- `npx tsc --noEmit` — **0 errors**.

#### Registration: user-entered password (same session)
Replaced Step 1's throwaway random password with a real password field on `RegisterVerificationScreen.tsx`: lock-icon input with show/hide toggle, client-side min-length check mirroring `supabase/config.toml`'s `minimum_password_length = 6`, passed straight to `supabase.auth.signUp`. Supabase Auth persists it as a bcrypt hash on `auth.users` — it is never written to `public.users` or stored in plaintext. Verified via the Auth API: signup with a chosen password → sign-in with the same password returns a session; wrong password → `invalid_credentials`; `encrypted_password` column confirmed `$2a$…` bcrypt. CLAUDE.md's auth note updated to match.

### Next steps (suggested)
- [ ] Backend Phase 3: Lock System — `BEFORE INSERT/UPDATE` trigger on `matches` enforcing the single-active-match invariant + setting both users' `active_match_id`; Discovery wiring surfaces the rejection
- [ ] Backend Phase 4: Realtime publication (`matches`, `messages`) + `discoverable_users` shadowban view; ChatScreen gains live message subscription
- [ ] Backend Phase 5: `apply_trust_delta` + match-timeout `pg_cron` sweep
- [ ] Chats-tab entry: a conversations list (or direct active-match redirect) so ChatScreen's no-param fallback gets exercised on-device
