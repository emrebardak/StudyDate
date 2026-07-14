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
- [x] Backend Phase 3: Lock System — `BEFORE INSERT/UPDATE` trigger on `matches` enforcing the single-active-match invariant + setting both users' `active_match_id` — done, see Session 5
- [ ] Backend Phase 4: Realtime publication (`matches`, `messages`) + `discoverable_users` shadowban view; ChatScreen gains live message subscription
- [ ] Backend Phase 5: `apply_trust_delta` + match-timeout `pg_cron` sweep
- [ ] Chats-tab entry: a conversations list (or direct active-match redirect) so ChatScreen's no-param fallback gets exercised on-device

---

## Session 5 — Backend Phase 3: Lock System enforcement (+ End Match wiring)

### What was done

#### Backend — one migration: `20260714073226_lock_system_enforcement.sql`
Two `SECURITY DEFINER` trigger functions on `public.matches` (both participants' `users` rows must be read/written regardless of who's the caller — RLS alone only allows own-row writes plus a matched partner's read, neither broad enough):
1. **`enforce_single_active_match()`** (`BEFORE INSERT OR UPDATE`) — rejects a match becoming `active` while either `user1_id` or `user2_id` already has a *different* non-null `active_match_id`. Raises with a custom `ERRCODE = 'ST001'` / `HINT = 'ALREADY_LOCKED'` so the frontend can detect this specific rejection later (vs. a generic error) once Discovery does real inserts in Phase 4. Re-saving an already-active match (e.g. flipping a reveal flag) is exempted — only a genuine *new* lock attempt is checked.
2. **`sync_active_match_id()`** (`AFTER INSERT OR UPDATE`) — the single source of truth mirror: sets both participants' `active_match_id` to the match's id when it becomes active, and nulls it on both (guarded by `active_match_id = <this match>`, so it never clobbers a lock since acquired elsewhere) when an active match closes (`completed`/`terminated`/`expired`).

Per `implemention.md`'s explicit flag: the PRD's illustrative `CHECK` constraint referencing another table isn't valid Postgres — this trigger pair is the correct mechanism, not a doc bug to replicate.

#### Frontend wiring — Manual Termination (PRD §5 "End Match")
`ChatScreen.tsx`'s previously non-functional header `ellipsis-vertical` button now triggers `handleEndMatch`: a confirmation `Alert`, then `UPDATE matches SET status='terminated'` on the current match (RLS already allows either participant to do this — Phase 2's `matches_update_participant` policy). This directly exercises the new trigger's unlock path and needs no new RLS. On success, navigates back to `MainTabs`.

**Scoped decision**: Discovery's swipe-to-real-match-insert wiring (the other half of implemention.md's Phase 3 frontend step) is **not** done this session — Discovery still has no real candidate users to swipe on (RLS only allows reading your own row + a matched partner's row; there's no cross-user read yet, that's Phase 4's `discoverable_users` view). Wiring a real `matches` insert against a fake/mock target would either fail the FK or require faking data. This piece naturally lands together with Phase 4.

#### Verified
- SQL-level trigger suite (`docker exec` psql as `authenticated`, 3 users): alice matches bob → both `active_match_id` set to the match id; alice attempts a second active match with carol while locked → `ERROR ST001 / HINT ALREADY_LOCKED`; carol attempts to match the already-locked bob → same rejection; alice terminates the match → both users' `active_match_id` clear atomically; alice can then form a new match with carol (re-lock confirmed working after unlock).
- REST-level end-to-end (same calls supabase-js/ChatScreen make): alice creates a match with bob → both locked; **bob taps End Match** (`PATCH matches {status:'terminated'}`) → both users' `active_match_id` cleared.
- `npx supabase db reset` — all 7 migrations replay cleanly from an empty DB.
- `npx tsc --noEmit` — **0 errors**.

### Next steps (suggested)
- [x] Harden Lock System against direct client writes + concurrent-match races — done, see Session 6
- [ ] Backend Phase 4: Realtime publication (`matches`, `messages`) + `discoverable_users` shadowban view — this is what finally lets Discovery read real candidate profiles and attempt a real match insert (completing the deferred half of Phase 3's frontend wiring), plus live lock/unlock via Realtime instead of manual navigation
- [ ] Backend Phase 5: `apply_trust_delta` + match-timeout `pg_cron` sweep (the sweep must go through `matches.status` updates, not write `active_match_id` directly, so it reuses this session's trigger instead of bypassing it)
- [ ] Chats-tab entry: a conversations list (or direct active-match redirect) so ChatScreen's no-param fallback gets exercised on-device

---

## Session 6 — Lock System hardening (bug-hunt follow-up on Session 5)

### What was done

A bug-hunt audit against Session 5's trigger pair found two real gaps, both closed in one migration: `20260714074808_lock_system_hardening.sql`.

#### Gap 1 — `active_match_id`/`trust_score` were directly client-writable
Phase 1's `users_update_own` RLS policy allows an authenticated user to `UPDATE` any column on their own `public.users` row — including `active_match_id` and `trust_score`, neither of which Session 5's trigger pair (which only fires on writes to `public.matches`) touched. Concretely: `PATCH /rest/v1/users?id=eq.<self> {"active_match_id": null}` let a user silently self-unlock Discovery while their match partner was still locked and unaware — the exact ghosting scenario the Lock System exists to prevent.

**Fix**: `protect_privileged_user_columns()`, a `BEFORE UPDATE` trigger on `public.users` that rejects any change to `active_match_id` or `trust_score` unless `current_user IN ('service_role', 'postgres')`.

**Important implementation correction from the audit's suggested approach**: the audit asked for this guard to be `SECURITY DEFINER`. Empirically verified (scratch-table trigger + `RAISE NOTICE`) that this would have been wrong and made the guard a permanent no-op: `SECURITY DEFINER` switches `current_user` to the function's *owner* (`postgres`, since that's who ran the migrations) for the entire duration of the call — including when the trigger fires because of someone else's statement. A `SECURITY DEFINER` guard would see `current_user = 'postgres'` on *every* invocation, whether the actual writer was an authenticated client or trusted internal code, and would never reject anything. Kept the guard as plain `SECURITY INVOKER` (the default) instead: `current_user` inside it correctly reflects whoever issued the `UPDATE` — `'authenticated'`/`'anon'` for a plain client (rejected), or `'postgres'` when the write originates from inside `sync_active_match_id()` (itself `SECURITY DEFINER`, owned by `postgres`, per Session 5) — since by the time *that* function's own `UPDATE` statement fires this trigger, `current_user` has already been switched to `postgres` by the outer call (allowed). Documented this reasoning directly in the migration's header comment so it isn't silently "fixed" back to `SECURITY DEFINER` later.

#### Gap 2 — TOCTOU race allowed two simultaneously-active matches
`enforce_single_active_match()` only `SELECT`ed (no row lock) before the separate `AFTER` trigger's `UPDATE`. Under default `READ COMMITTED`, two concurrent `INSERT`s sharing a user (e.g. two near-simultaneous swipes) could each pass the `BEFORE`-trigger check before either transaction's `UPDATE` committed.

**Fix**: added `PERFORM 1 FROM public.users WHERE id IN (NEW.user1_id, NEW.user2_id) ORDER BY id FOR UPDATE;` before the existing check. `ORDER BY id` gives every transaction the same lock-acquisition order for any pair of users, which is what prevents a circular-wait deadlock between two transactions locking two overlapping users in opposite order.

#### Verified
- **Gap 1, SQL-level**: as `authenticated` via `SET request.jwt.claims` — direct `UPDATE` of own `active_match_id` or `trust_score` → `ERROR ST002 / HINT PROTECTED_COLUMN`; explicitly re-tested the real self-unlock scenario (lock a user via a real match, then attempt `active_match_id = NULL` as that same user while genuinely locked) → denied, lock unchanged; unrelated own-row columns (`name`) still update fine; a no-op `NULL → NULL` write is allowed (no actual change, correctly not flagged); the trigger-driven path (create a match → both locked; End Match → both unlocked) still works end-to-end, proving `sync_active_match_id()` is unaffected.
- **Gap 2, concurrency**: two real concurrent psql sessions — Txn A (alice+bob, `active`) holds its transaction open via `pg_sleep(3)` before committing; Txn B (bob+carol, `active`) starts ~1s into A's sleep. Measured wall-clock timing proved genuine blocking, not a fast sequential race: Txn B's `INSERT` took **2.23s** (blocked on bob's row lock, resumed right when A's `pg_sleep(3)` ended and it committed), then correctly received `ST001/ALREADY_LOCKED` once it saw bob's now-committed lock. Final state: exactly one active match for bob, carol correctly left unlocked — the race is closed.
- **No self-deadlock**: timed a normal single match insert (`BEFORE` trigger's `FOR UPDATE` + `AFTER` trigger's `UPDATE` on the identical rows, same transaction) — completed in 0.375s, no hang.
- `npx supabase db reset` — all 8 migrations replay cleanly from an empty DB.
- **REST-level regression** (Session 4/5's full checks re-run unchanged): alice/bob match → message exchange → study date proposed + accepted → End Match, all still pass end-to-end. Added one new REST check: `PATCH /rest/v1/users` attempting to forge `active_match_id` now returns `{"code":"ST002",...}` instead of silently succeeding.
- `npx tsc --noEmit` — **0 errors** (no frontend files touched this session).

### Next steps (suggested)
- [x] Backend Phase 4: Realtime publication (`matches`, `messages`) + `discoverable_users` shadowban view — done, see Session 7
- [ ] Backend Phase 5: `apply_trust_delta` + match-timeout `pg_cron` sweep (the sweep must go through `matches.status` updates, not write `active_match_id` directly, so it reuses the Lock System trigger instead of bypassing it)
- [ ] Chats-tab entry: a conversations list (or direct active-match redirect) so ChatScreen's no-param fallback gets exercised on-device
- [ ] ChatScreen still has no live message subscription (Realtime is only wired for the Lock System in Discovery this session) — messages currently only load on screen mount, not pushed live
- [ ] No `likes`/`swipes` table exists, so a right swipe creates an immediately-`active` match rather than PRD §4's literal "double opt-in" (both sides swipe right independently, match forms only on mutual agreement) — flagged, not fixed, since it's a schema addition beyond this phase's scope

---

## Session 7 — Backend Phase 4: Realtime + shadowban view (+ Discovery real wiring)

### What was done

#### Backend — two migrations
1. `20260714080406_realtime_publication.sql` — `ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;` and `... ADD TABLE public.messages;`. No RLS changes needed: Migration 6's existing `matches_select_participant` / `messages_select_participant` policies (`auth.uid() IN (user1_id, user2_id)` / EXISTS-via-matches) already scope exactly what a subscribed client should see — Realtime enforces RLS on `postgres_changes`, it doesn't bypass it.
2. `20260714080407_discoverable_users_view.sql` — the shadowban view (PRD §8: `trust_score < 60` hidden from Discovery, not banned — the user can still read/use their own row normally).

**Deviation from the literal `SELECT * FROM public.users` in `docs/backend-dev.md`**: used an explicit column list instead, excluding `email` and `verification_code`. Neither is read by the frontend `User` type or `mapUserFromAPI`, and broadcasting every discoverable user's real email + mock auth verification code to any authenticated client via Discovery is a real privacy leak with no product justification. Flagged the same way Session 6 flagged its `SECURITY DEFINER` correction, rather than silently diverging.

**Cross-user reads without loosening `users`' own-row RLS**: the view is a plain view (no `security_invoker`), so it evaluates using the *view owner's* privileges (`postgres`, a superuser that bypasses RLS) rather than the querying role's — this is what lets any authenticated user read across all discoverable rows despite `public.users`' Phase 1 own-row-only policies staying untouched. Explicitly verified this is actually true in this stack (not just assumed from docs) — see Verified below. Also added `security_barrier = true`, a different/complementary hardening that stops the query planner from using a caller-supplied qualifier to infer values from filtered-out (shadowbanned) rows via a side channel.

#### Frontend — `DiscoveryScreen.tsx` rewritten onto real data (mock `PROFILES` array removed)
- Fetches candidates from `discoverable_users`, excluding self (`.neq('id', userId)`) and anyone already locked (`.is('active_match_id', null)`).
- `CardFace` now renders real fields onto the *existing* card layout/slots rather than adding new UI: university + year as the two chip slots, department as the field line, `currentGoalText` as the quoted bio line (PRD §4's academic-card shape — no age, no photo, matches the PRD better than the old mock shape did).
- **New states**: `LoadingState`, `ErrorState` (retry), and `LockedState` — the last one finally implements the "you're already in a study date" UI that Phase 3's plan explicitly deferred until Discovery had a real candidate pool to check against. Checked via the user's own `active_match_id` on load and kept in sync by the Realtime subscription below.
- **Real match creation**: a right swipe (both the gesture release and the Like button) now calls `handleSwipeRight`, which inserts a real `matches` row against the swiped candidate — completing the half of Phase 3's frontend wiring that was deferred for lack of a real candidate pool. On the Lock System trigger's `ST001` rejection, parses the locked user's UUID out of the trigger's own error message to tell apart "I'm the one already locked" from "this candidate just matched with someone else" and shows the right message for each.
- **Realtime Lock System, live**: subscribes to `matches` filtered by `user1_id=eq.<uid>` and `user2_id=eq.<uid>` (two `.on()` listeners on one channel — Realtime's `filter` only supports single-column equality, not an OR expression, so participant coverage needs both). Deliberately **not** navigating synchronously right after the insert's own REST response — the Realtime event is the single code path that drives the lock/unlock transition for *both* participants (the swiper and the swiped-on), which is what makes this "the actual Lock System" rather than a special-cased happy path for whoever clicked. `useFocusEffect` re-runs the candidate/lock fetch whenever the tab regains focus (e.g. returning from Chat after an End Match unlock).
- Docs/integration.md's illustrative Realtime pattern subscribes to the `users` table (`active_match_id` changes) — not implemented that way here, since `implemention.md`'s Phase 4 migration spec (and this task) only publishes `matches`/`messages`, not `users`. Subscribing to `matches` directly is the pattern that actually works against what's published; noting this so the docs/integration.md example isn't mistaken for the literal implementation.

#### Verified
- **Realtime publication**: `SELECT * FROM pg_publication_tables WHERE pubname='supabase_realtime'` → both `matches` and `messages` listed.
- **Shadowban view, SQL-level**: as `authenticated` (`SET request.jwt.claims`) — a bystander's *direct* `public.users` query for another user returns 0 rows (base table RLS untouched), but `discoverable_users` correctly includes a `trust_score=100` user and excludes one manually lowered to 50; the shadowbanned user can still read her own row directly; `email`/`verification_code` columns don't exist on the view (`ERROR: column "email" does not exist`); `anon` gets `permission denied` on the view.
- **Realtime × RLS, real websocket test** (not just SQL/REST — a Node script using the actual `@supabase/supabase-js` client against the running local stack): alice inserts a match with bob; bob, subscribed filtered to `user2_id=eq.<bob>`, receives the `INSERT` event (`status=active`) within the test window. **Carol, subscribed to `matches` with zero filter at all** (the literal "blanket firehose" case), receives nothing — proving RLS gates Realtime delivery itself, not merely the client-side filter string.
- **Discovery flow, REST-level** (the exact calls the rewritten screen makes): `discoverable_users?id=neq.<self>&active_match_id=is.null` returns a real candidate; a Discovery-style match insert succeeds; the matched candidate immediately drops out of the caller's `discoverable_users` result (locked); after End Match, the candidate reappears (`active_match_id: null`).
- **Full regression** (Sessions 4-6 unchanged): message exchange, study date propose+accept, End Match, and the Gap 1 hardening's self-forge block (`ST002`) all still pass end-to-end against the final 10-migration state.
- `npx supabase db reset` — all 10 migrations replay cleanly from an empty DB.
- `npx tsc --noEmit` — **0 errors**.

### Next steps (suggested)
- [x] Harden `discoverable_users` against the client-filter-only lock leak and add persisted swipe history — done, see Session 8
- [ ] Backend Phase 5: `apply_trust_delta` + match-timeout `pg_cron` sweep (through the Lock System trigger, not around it)
- [ ] ChatScreen: wire the `messages` Realtime subscription now that the table is published (currently still load-on-mount only)
- [ ] The `swipes` table (Session 8) is a real per-user pass/like history but is *not* the PRD §4 "double opt-in" mechanism — a single right swipe still locks both users immediately (Session 6's note); a genuine two-sided match-formation flow would consume `swipes` rows differently (match only once both sides have a mutual 'right'), which is a bigger design change than this session's scope
- [ ] Run the rewritten Discovery screen on-device to confirm the swipe gesture + real insert + Realtime navigation feels right end-to-end (this session's verification is API/websocket-level, matching the project's established pattern of verifying wiring logic without a native rebuild — see Session 3's note)

---

## Session 8 — discoverable_users hardening (bug-hunt follow-up on Session 7)

### What was done

A bug-hunt audit against Session 7 found two real gaps, both closed in one migration: `20260714121615_discoverable_users_hardening.sql`.

#### Gap 1 — "exclude locked candidates" was a client-supplied filter, not server-enforced
`discoverable_users` only filtered `trust_score >= 60`; excluding already-locked users was done in `DiscoveryScreen.tsx`'s query string (`.is('active_match_id', null)`), not the view itself. Any authenticated client could drop that param and read every discoverable user's lock status regardless — not exploitable to force a bad match (the Lock System trigger still correctly rejects that), but a read-side leak of information Discovery is supposed to hide entirely.

**Fix**: `CREATE OR REPLACE VIEW public.discoverable_users` adds `AND active_match_id IS NULL` directly into the view's `WHERE` clause. Kept the same explicit column list, `security_barrier = true`, and the `email`/`verification_code` exclusion from Migration 10. `DiscoveryScreen.tsx`'s existing client-side filter was left in place — it's now redundant defense-in-depth, not the actual gate.

#### Gap 2 — no persisted swipe/pass history, so Discovery looped the same candidates forever
`loadDiscovery()` re-fetched the same batch on every refresh/refocus with nothing excluding candidates already decided on.

**Fix**: new `public.swipes` table (`swiper_id`, `target_id`, `direction` CHECK'd to `'left'|'right'`, `UNIQUE (swiper_id, target_id)` — doubles as the exact index the exclusion query needs). RLS: `authenticated` can `INSERT`/`SELECT` only their own rows (`swiper_id = auth.uid()`) — a user never needs to read who swiped on *them*; no `UPDATE`/`DELETE` policies, since a swipe decision is permanent (matches the "no undo" semantics already implied by the swipe-card UI). `discoverable_users` gained `AND NOT EXISTS (SELECT 1 FROM public.swipes WHERE swiper_id = auth.uid() AND target_id = users.id)`.

**`auth.uid()` inside a non-`security_invoker` view re-evaluating per caller** — the task asked me not to assume this from documentation alone, so it was tested the same way Session 7 tested the security-definer-view pattern: the identical query, no parameters, run as two different authenticated users. Alice (who'd swiped left on bob) got an empty result for bob; carol (who had not swiped on bob) got bob back in the same query. Confirms `auth.uid()` reads the live per-session `request.jwt.claims` GUC at query time, not something baked in when the view was created — consistent with Session 6's finding that GUC-backed functions are unaffected by role-switching mechanics (there it was `SECURITY DEFINER`/`current_user`; here it's view evaluation semantics, same underlying category of fact).

#### Frontend — `DiscoveryScreen.tsx`
Added `recordSwipe(candidate, direction)`, called from three sites: `handleSwipeRight`'s success path (after the match insert actually succeeds — not on `ST001` rejection, since that candidate's unavailability is transient, not a real "pass"), and both left-swipe trigger sites (gesture release past the left threshold, and the Pass button). Kept out of the `matches` insert entirely — a separate call, since swipe history is advisory UI-quality state, not something the Lock System depends on.

**Decision on re-swiping a duplicate candidate** (asked to be made and documented): silently ignored, not surfaced as a user-facing error. `discoverable_users` now excludes already-swiped candidates itself, so under normal operation a duplicate can only happen from an already-stale local deck (a genuine edge case, not a normal flow) — logs a `console.warn` for debugging, no `Alert`.

#### Verified
- **Gap 1, SQL-level**: as a bystander (`carol`, unlocked, `trust_score=100`) — a full view scan **with no `active_match_id` predicate anywhere in the query** correctly omits a locked pair (`alice`+`bob`) entirely; an explicit by-id lookup for the locked user returns 0 rows.
- **Gap 2, SQL-level**: alice swipes left on bob → bob absent from alice's `discoverable_users`, carol (unaffected, same table state) still sees bob — proves the exclusion is per-caller via `auth.uid()`, not a global flag on the row. Duplicate `(swiper_id, target_id)` insert → `23505 unique_violation`, correctly rejected. Alice cannot read bob's swipe *on her* (`swipes_select_own` correctly scoped to own-as-swiper only). Bob cannot insert a swipe forging alice as the swiper (`swipes_insert_own` correctly rejects).
- **REST-level, real `@supabase/supabase-js` client** (mirroring `DiscoveryScreen.tsx`'s exact query shape): alice's initial load includes bob → alice swipes left → bob absent on reload → alice matches carol (Session 7's real-insert path, unaffected) → carol also absent on reload (Gap 1, now locked).
- **Full regression**: Sessions 4-6's checks (message exchange, study date, End Match, `ST002` self-forge block, `ST001` lock rejection) all still pass against the final 11-migration state. Session 7's Realtime × RLS websocket test was flaky once immediately after `db reset` (the Realtime container was still settling post-restart — confirmed via `docker ps`/`pg_publication_tables`, both healthy) and passed cleanly on immediate retry; this migration touched neither the `matches`/`messages` RLS policies nor the publication, so this was a timing artifact, not a regression.
- `npx supabase db reset` — all 11 migrations replay cleanly from an empty DB.
- `npx tsc --noEmit` — **0 errors**.

---

## Session 9 — Backend verification of frontend-added login mode (no backend changes)

### What was done

The frontend agent added a login mode to `RegisterVerificationScreen.tsx` (`supabase.auth.signInWithPassword`, toggled alongside the existing signup flow, `navigation.reset` to `MainTabs` on success) and updated `AppNavigator.tsx` to call `supabase.auth.getSession()` on launch and route straight to `MainTabs` if a session already exists. This session verified the backend actually supports that correctly — **no migrations or backend files were touched**, this is an audit-only entry.

#### Verified — all at the REST/Auth API level (GoTrue v2.192.0, matching Sessions 3-8's established pattern)

1. **`signInWithPassword` correctness**: signed up a real `.edu` user, then `POST /auth/v1/token?grant_type=password` — correct password returns `access_token` + `refresh_token` (`expires_in: 3600`, matching `config.toml`'s `jwt_expiry`); wrong password and a **non-existent email** both return the exact same `{"code":400,"error_code":"invalid_credentials","msg":"Invalid login credentials"}` — confirmed no user-enumeration leak (GoTrue does not distinguish "wrong password" from "no such user" in its response).
2. **Session persistence/refresh**: used the returned `refresh_token` against `grant_type=refresh_token` — got a new `access_token` *and* new `refresh_token` (rotation is on, `enable_refresh_token_rotation = true`), both genuinely different from the originals; the new access token successfully authenticated an own-row REST read. Reusing the *old* refresh token immediately afterward still succeeded — expected and correct, not a bug: `refresh_token_reuse_interval = 10` (seconds) is a deliberate grace window for concurrent/retried requests, not an infinite-reuse hole. This confirms `src/lib/supabase.ts`'s `autoRefreshToken: true` + `persistSession: true` + AsyncStorage config has a working backend underneath it: on relaunch, `getSession()` restoring a stored session with an expired access token but valid refresh token will genuinely refresh to a working session, not a stale/broken one.
3. **RLS/GRANTs for a login-derived session**: identical to a signup-derived session in every way tested — own-row read/update work, another user's row is unreadable, and the Session 6 hardening still fires (`ST002`/`PROTECTED_COLUMN`) on both `active_match_id` and `trust_score` self-forge attempts. There is nothing in the RLS policies or the `protect_privileged_user_columns` trigger that distinguishes a session's origin (`signUp` vs. `signInWithPassword`) — both produce an identical `authenticated`-role JWT, so this was expected to hold and did.
4. **Incomplete-registration gap — confirmed real, not fixed (out of scope per the task)**: signed up a user and deliberately stopped after Step 1 (never called the Step 2-4 `UPDATE`s). The auto-provisioned `public.users` row is genuinely blank (`name`, `university`, `department`, `current_goal_text` all `NULL`). That same user can `signInWithPassword` successfully at any later point and would land in `MainTabs` per `AppNavigator.tsx`'s session-only check — there is no profile-completeness check anywhere in the routing logic. **Mitigating context**: as of this session, none of `MainTabs`' screens actually consume real profile data yet — `DashboardScreen.tsx` is still fully mock, and `MyProfileScreen.tsx` only calls `supabase` for sign-out, not for reading `name`/`university`/etc. — so this doesn't currently crash or show broken UI, it would just show the same mock placeholders every user currently sees. The gap is real at the product-logic level (a user can abandon registration and later "complete" login into an app that never asks them to finish), not yet visible as a broken UI, since nothing downstream reads the blank fields yet. Flagging for the frontend agent / product decision, not fixing here.

### Next steps (suggested)
- [x] Real double opt-in match formation — done, see Session 10 (this closes the gap Session 9 item 4's neighbor issue did NOT cover: a user reported swiping right from one account with no reciprocal swipe still formed a match)
- [ ] Backend Phase 5: `apply_trust_delta` + match-timeout `pg_cron` sweep
- [ ] Incomplete-registration gap from item 4 above — still open, needs a product decision (redirect to registration on incomplete profile vs. design around it)

---

## Session 10 — Real double opt-in match formation (user-reported bug)

### What was done

**Reported bug**: "I swiped right on them from one account, but I didn't swipe from my other account. Even so, we matched." Confirmed as a real bug, not a misunderstanding: `DiscoveryScreen.tsx` inserted directly into `public.matches` on a single right swipe, which the Session 3 Lock System trigger pair immediately locked both users on — there was never a reciprocity check. This was already a known, previously-flagged gap in Sessions 6-8's dev log ("no `likes`/`swipes` table means single-swipe instantly locks both users") that had not yet been fixed. User confirmed they wanted it fixed now.

#### Backend — one migration: `20260714132223_mutual_match_formation.sql`

- **`form_match_on_mutual_swipe()`** — `AFTER INSERT` trigger on `public.swipes` (the table added in Session 8, previously only used for Discovery's "don't show me the same person twice" exclusion). On a `'right'` swipe, checks for the reciprocal `'right'` row; only if found does it `INSERT` into `public.matches` itself. `SECURITY DEFINER` for the same reason as the Lock System triggers (Migration 7) — the resulting `matches` row is never inserted "as" either participant, it's system-formed, which the old `matches_insert_initiator`-style RLS shape can't express.
- **`pg_advisory_xact_lock`, keyed on the sorted pair of user ids** — closes a race distinct from Session 6's Gap 2: two people swiping right on each other near-simultaneously are two `INSERT`s on *different* `swipes` rows, so there's no shared row a `SELECT ... FOR UPDATE` could lock. Without serializing on the pair, both transactions' "does the reciprocal row exist?" check could run before either commits, both see nothing, and **neither** forms a match even though both people really did swipe right on each other (a "double miss," the mirror image of Gap 2's "double lock"). The advisory lock forces the second transaction to wait for the first to fully commit before checking.
- **Match-creation failure never rolls back the swipe** — wrapped in a nested `BEGIN/EXCEPTION` block. If forming the match fails (most commonly `ST001`, because one side acquired an unrelated active match in the meantime — the existing Lock System trigger still runs unmodified on this `INSERT`), the swipe itself still commits; the failure is `RAISE WARNING`-logged, not surfaced to the user. Recording someone's swipe decision must always succeed on its own merits.
- **Closed the actual bypass, not just the UI path**: `REVOKE INSERT ON public.matches FROM authenticated` + dropped the old `matches_insert_initiator` policy. Without this, a modified client (or a stale build of `DiscoveryScreen.tsx`) could still `POST` straight to `/rest/v1/matches` and reproduce the exact reported bug regardless of what the UI does — enforcing double opt-in only in the normal UI path isn't real enforcement, matching this project's established stance (see Sessions 6 and 8's equivalent "close the actual gap, not just the client's happy path" fixes).
- Added `swipes_no_self_swipe CHECK (swiper_id <> target_id)` to `public.swipes` for defensive hygiene, mirroring `matches`' existing `matches_distinct_users` — never reachable through the UI, but cheap to enforce at the schema level anyway.

#### Frontend — `DiscoveryScreen.tsx`
Removed `handleSwipeRight` (and the now-dead `LOCK_ERROR_CODE`/`extractLockedUserId` helpers, and the now-unused `Alert` import) entirely. Both right-swipe trigger sites (gesture release, Like button) now just call `recordSwipe(candidate, 'right')` — the exact same call the left-swipe path already made, since a right swipe is no longer functionally different from a left swipe at the client level: it just records a decision. Match formation is now **exclusively** a backend concern; the existing Session 7 Realtime subscription (unchanged) is what tells a screen a match actually formed, whether that happens immediately (this swipe completed a pair someone already started) or later (the other side swipes right afterward).

#### Verified
- **SQL-level, the exact reported scenario**: alice swipes right on bob (one-sided) → `0` matches, `active_match_id` stays `NULL` — reproduces and confirms the fix for the reported bug. Bob then swipes right on alice → match forms, both locked.
- **Bypass closed**: a direct client `INSERT` into `public.matches` now fails with `permission denied for table matches` (`42501`) — confirmed via REST, not just the RLS policy removal in isolation.
- **Concurrency ("double miss" race)**: two real concurrent psql sessions, mirroring Session 6's Gap 2 methodology — Txn A (alice→bob) holds its transaction open 3s; Txn B (bob→alice) starts ~1s in. Measured timing proved genuine blocking (Txn B took 2.3s, resuming exactly when Txn A committed), and exactly one match formed with both users locked — not zero.
- **Swipe survives a failed match attempt**: alice locks with bob first; carol (who alice had earlier swiped right on) then swipes right on alice — the match-formation attempt correctly fails (`RAISE WARNING`, `ST001` internally) but carol's swipe row is still recorded, and no phantom match was created.
- **Realtime still fires for trigger-created rows** (not just direct client inserts) — verified with a real `@supabase/supabase-js` client: a one-sided swipe produced zero Realtime events for either party; the reciprocal swipe (which never calls `matches.insert()` on the client at all) produced a Realtime `INSERT` event with `status=active` for **both** participants. Confirms the "actual Lock System" behavior from Session 7 is unaffected by moving match creation into a trigger.
- **Full regression** (Sessions 4-9, using mutual swipes instead of direct match inserts to set up test state, since that path no longer exists): message exchange, study date propose+accept, End Match, Session 6's `ST002` self-forge block, and Session 9's login flow all still pass. Session 8's `discoverable_users` behavior confirmed correct and *unchanged* in spirit: a user who already swiped right on someone never sees them again even after that person later becomes unlocked — this is the existing, correct "permanent decision" semantics from Session 8, not a new regression.
- `npx supabase db reset` — all 12 migrations replay cleanly from an empty DB.
- `npx tsc --noEmit` — **0 errors**.

### Next steps (suggested)
- [ ] Backend Phase 5: `apply_trust_delta` + match-timeout `pg_cron` sweep
- [ ] Failed match-formation attempts (e.g. candidate got locked elsewhere first) are not retried once the blocking lock clears — a known, flagged limitation (see migration header), would need a periodic sweep or an on-unlock re-check to fully close
- [ ] Consider surfacing a lightweight "Like sent" affordance on a one-sided right swipe, since the UI currently gives identical feedback (just the swipe-out animation) for a pass and an unreciprocated like — not implemented here since it wasn't asked for and is a UI/product decision, not a backend correctness issue
- [ ] Incomplete-registration gap (Session 9, item 4) — still open

No new migrations. `npx supabase db reset` was not needed (schema unchanged); all test users created for this verification were cleaned up (`DELETE FROM auth.users WHERE email IN (...)`), confirmed via a follow-up query returning zero rows.

---

## Session 11 — Wire Dashboard + My Profile to real data

### What was done

**Requested**: replace the mock data in `DashboardScreen.tsx` and `MyProfileScreen.tsx` with real Supabase data — the last two screens still showing hardcoded constants outside the registration/Discovery/Chat/Planner flows already wired in earlier sessions.

One piece had no backing schema: the Dashboard mock's "Recent Matches" cards showed a match-percentage badge (98%, 94%), but no compatibility-score field or algorithm exists anywhere in the schema (only `trust_score`, a post-date reputation number that Phase 5 hasn't built yet either). Asked the user how to handle it; they chose to repurpose the section as **"Recently Liked"** — the people this user has swiped right on (`public.swipes`), dropping the fabricated percentage entirely. This also better matches the *original* Session 1 scaffold description of this screen ("upcoming sessions cards and liked profiles horizontal scroll") than the match-% version that had crept into the mock data since.

#### Backend — one migration: `20260714135015_users_select_swiped_right.sql`
Recently Liked needs to read the *profile* of someone the user swiped right on, and no existing RLS policy covers that: `users_select_own`/`users_select_matched` (Migrations 4/6) only cover your own row and a matched partner's row, and `discoverable_users` (Migration 11) deliberately *excludes* anyone already swiped on. Added `users_select_swiped_right`: a user may `SELECT` the profile of anyone they have an outbound `direction='right'` row on in `public.swipes` — deliberately one-directional (outbound only), so there's no "who liked me" leak, and no exposure for a left swipe/pass. Not a new privacy exposure in practice: `DiscoveryScreen`'s swipe card already rendered this same academic-identity data (name/university/department/year) unblurred, sourced from `discoverable_users`, before the swipe was ever recorded — this policy just lets the same already-seen data be read again afterward. Photos are unaffected either way (progressive-disclosure blur for photos is still a separate, unimplemented later phase).

#### Frontend
- **`DashboardScreen.tsx`**: on mount + tab-focus (`useFocusEffect`, matching `DiscoveryScreen`'s pattern), fetches the caller's own `users` row (hero greeting + avatar initial), the up-to-5 soonest future `study_dates` for their active match (if any — partner name resolved via the match row + `users_select_matched`), and up to 5 most recent `swipes` rows where `direction='right'` (partner profiles resolved via the new policy above). Added loading/error states mirroring `DiscoveryScreen`'s `LoadingState`/`ErrorState`. "View Full Schedule" now navigates to the Planner tab and "Find a Partner" to the Match tab (previously both were inert `TouchableOpacity`s with no `onPress` at all). Dropped the fake `timeRange` ("14:00 – 16:00") since `study_dates.scheduled_time` is a single timestamp with no duration/end-time column — real sessions show a single formatted time instead.
- **`MyProfileScreen.tsx`**: fetches the caller's own `users` row on mount + tab-focus. Academic Details now reads real `university`/`department`/`year`. Earned Badges reads the real `badges` JSONB (`Record<string, count>`), mapped through a `BADGE_META` dict covering the PRD §7 badge set (Punctual, Silent & Focused, Great Explainer, Good Break Buddy) with a generic-icon fallback for any unrecognized key; shows an explicit empty state ("No badges yet...") since `badges` is `{}` for every real user until the Phase 5 trust-score/badge system exists. Photo grid renders real `photo_url`/`photos` via `Image` when present, falling back to the existing placeholder icon/boxes when absent (still the common case — there's no photo upload flow yet either).
- **Explicitly left out of scope**: `EditProfileScreen.tsx` remains fully mock (hardcoded field values, a hardcoded remote avatar URL, and a "Save" button that just calls `goBack()` without writing anything) — the user asked for the Dashboard and (display) Profile screen specifically, not the edit form. Flagging this as the next natural gap: `MyProfileScreen`'s "Edit Profile" button currently opens a form that cannot actually change what was just wired up.

#### Verified
- New RLS policy, SQL-level (`docker exec ... psql`, `SET LOCAL request.jwt.claims`): a swiper can read a right-swipe target's profile (1 row), cannot read a left-swipe target's profile (0 rows), and the target cannot read the swiper's profile in reverse (0 rows, confirming no "who liked me" leak).
- Full REST-level round trip via a real `@supabase/supabase-js` script (`dashboard_profile_real_data_test.mjs`): signed up 3 real users, filled in profiles via authenticated PATCH, formed a real match via mutual right-swipe (alice↔bob) plus a one-sided like (alice→carol), proposed a real future `study_dates` row, then replicated `DashboardScreen`'s exact query sequence end-to-end — correct partner-id derivation from the match row, correct partner name resolution, correct upcoming-study-date row, and both liked profiles (matched Bob *and* one-sided-liked Carol) readable via the new policy. A negative check confirmed a bystander alice never swiped on stays unreadable.
- `npx supabase db reset` — all 13 migrations replay cleanly from an empty DB; re-ran the same REST verification script against the fresh DB with an identical pass.
- `npx tsc --noEmit` — **0 errors**.

### Next steps (suggested)
- [ ] Wire `EditProfileScreen.tsx` to real data (currently fully mock — see above)
- [ ] Backend Phase 5: `apply_trust_delta` + match-timeout `pg_cron` sweep (also what would start populating real `badges`)
- [ ] Incomplete-registration gap (Session 9, item 4) — still open

---

## Session 12 — Frontend: log out, login mode, swipe-failure visibility, real partner names

### What was done

Four frontend-only tasks, no backend/migration files touched:

#### 1. Log Out button (`MyProfileScreen.tsx`)
There was no way to sign out of the app. Added a "Log Out" button below "Edit Profile": confirms via `Alert.alert`, calls `supabase.auth.signOut()`, then `navigation.reset`s to `RegisterVerification`. (This landed before Session 11's real-data wiring of this screen; both changes coexist cleanly — the button and its handler are untouched by that later rewrite.)

#### 2. Login mode + session resume (`RegisterVerificationScreen.tsx`, `AppNavigator.tsx`)
The app had signup but no way for a returning user to log in. Added a signup/login toggle to Step 1 of registration: same email/password fields, a "Log In" / "Create Account" link switches `mode`, and `handleContinue` branches — login mode calls `supabase.auth.signInWithPassword` and resets straight to `MainTabs` on success instead of continuing into `RegisterProfile`. Also updated `AppNavigator.tsx` to call `supabase.auth.getSession()` once on launch (shown as a brief splash spinner) and set `initialRouteName` to `MainTabs` if a session already exists, instead of always starting at `RegisterVerification`. Session 9 (above) is the backend agent's verification pass against this change — confirmed `signInWithPassword` correctness, session refresh, and RLS all behave the same as a signup-derived session, and flagged (not fixed) that a user who abandons registration after Step 1 can still log in and land in `MainTabs` with a blank profile.

#### 3. `DiscoveryScreen.tsx` — `recordSwipe()` silent-failure bug
Reported bug: a stale/expired session let a right-swipe animate normally with zero indication the underlying `swipes` insert had failed — confirmed via direct DB query that no row existed for either account despite both appearing to have swiped. Root cause was purely client-side: `recordSwipe()` returned immediately with no logging at all when `currentUserId` was null, and swallowed every other insert error into a `console.warn` with no user-facing signal. Fixed to three-way branch:
- `currentUserId` null/stale → `console.warn` + a new non-blocking toast banner ("Couldn't save that — please sign in again.") + calls `loadDiscovery()` to re-resolve auth state and surface the real "Not signed in" error state.
- Postgres `23505` (unique_violation, re-swiping an already-decided candidate) → unchanged, silent `console.warn` only, per Session 8's original decision — still expected/harmless.
- Any other failure (RLS denial, network, etc.) → `console.warn` + the same toast banner ("Couldn't save that — check your connection.").

The banner is a self-dismissing (3s) absolutely-positioned bottom toast rather than an `Alert`, since by the time an insert failure resolves the card has already animated off-screen and a modal would be jarring. Did not touch the Lock System, the mutual-match trigger, or `loadDiscovery()`'s existing loading/error/locked states beyond calling it from the null-user branch, per the task's explicit scope.

#### 4. Real partner names (`ChatScreen.tsx`, `MatchFoundScreen.tsx`)
Both screens showed placeholder names even though `users_select_matched` RLS (Phase 2) already lets a matched user read their partner's row — confirmed with the backend agent that names are not part of the photo-blur progressive disclosure (only photos stay hidden until mutual reveal), so this was purely a frontend wiring gap.
- `ChatScreen.tsx`: `loadChat()` now fetches the resolved match's `user1_id`/`user2_id`, derives the partner id, and reads their real `name`, following the same query shape as `DashboardScreen.tsx`'s upcoming-session partner lookup (Session 11). The header subtitle renders `{partnerName || 'Anonymous Match'}` instead of the hardcoded string.
- `MatchFoundScreen.tsx`: had zero backend wiring at all (no `supabase` import, hardcoded everything) and no `matchId` route param — `RootStackParamList`'s `MatchFound: undefined` doesn't carry one. Resolved the partner via the current user's own `active_match_id` instead (same pattern Dashboard uses, valid since the Lock System guarantees at most one active match), replacing the hardcoded `"Dr. Eleanor Vance"` with `{partnerName || 'your study partner'}`.

**Flagged, not fixed** (out of scope for a names-only fix): `MatchFoundScreen` isn't registered in `AppNavigator.tsx`'s `Stack.Navigator` at all, and its "Start Chat" button calls `navigation.navigate('Chat', { matchId: 'new' })` — `'Chat'` isn't a valid route (the tab is named `'Chats'`). The screen is currently unreachable in the running app regardless of the name fix.

#### Verified
- `npx tsc --noEmit` — **0 errors** after each of the four changes.
- **Not verified on-device or against the running local Supabase stack this session** — no emulator/browser access available; all four changes are type-check-verified only. Still needed before considering this done: sign out via Studio mid-session and swipe → confirm the new banner appears (not silent); a genuine `23505` duplicate swipe → confirm it's still silent; log in with an existing account → lands in `MainTabs`; relaunch with a valid session → skips straight past `RegisterVerification`; match two real test accounts → confirm both `ChatScreen` and (once reachable) `MatchFoundScreen` show each other's actual registered name.

### Next steps (suggested)
- [ ] Register `MatchFoundScreen` in `AppNavigator.tsx`'s stack and fix its `'Chat'` → `'Chats'` route name mismatch, or confirm with the user whether this screen is still meant to be used at all
- [ ] On-device verification pass for all four Session 12 changes (see Verified above) — nothing in this session has been exercised outside `tsc`
- [ ] Wire `EditProfileScreen.tsx` to real data (still fully mock, flagged since Session 11)
- [ ] Incomplete-registration gap (Session 9, item 4) — still open
