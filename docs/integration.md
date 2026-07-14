# Frontend ↔ Backend Integration

This guide covers the integration between frontend and backend for StudyMatch. It defines query patterns, realtime subscriptions, error handling, and data mapping conventions.

See [frontend-dev.md](frontend-dev.md) and [backend-dev.md](backend-dev.md) for standalone frontend and backend docs.

> **Status**: Backend schema, RLS, and Realtime are implemented (`docs/backend-dev.md`'s checklist, `docs/development.md` Sessions 1-10). Most of this doc's code samples are still the original illustrative patterns from before implementation started — where the actual wiring diverged (e.g. the Lock System subscribes to `matches`, not `users`; match formation goes through `swipes`, not a direct `matches` insert), a note points to the real implementation and the dev log session that explains why.

---

## Data Mapping (camelCase ↔ snake_case)

**Frontend** ([`src/types/index.ts`](../StudyMatch/src/types/index.ts)): camelCase (TypeScript convention)

**Backend** (Supabase PostgreSQL): snake_case (Postgres convention)

A mapping layer at the data-access boundary ensures alignment without spreading 1:1 field-name assumptions throughout the code.

### Example

Backend row (from `SELECT * FROM users`):
```json
{
  "id": "abc-123",
  "email": "user@university.edu",
  "trust_score": 100,
  "active_match_id": "match-456",
  "current_goal_text": "Study for midterms",
  "current_tags": ["#MidtermPrep"],
  "audio_environment": "Absolute Silence"
}
```

Frontend type (after mapping):
```typescript
const user: User = {
  id: apiRow.id,
  name: apiRow.name,
  trustScore: apiRow.trust_score,           // snake_case → camelCase
  activeMatchId: apiRow.active_match_id,    // snake_case → camelCase
  currentGoalText: apiRow.current_goal_text,
  currentTags: apiRow.current_tags,
  audioEnvironment: apiRow.audio_environment,
  // ... more fields
};
```

Create a **mapping utility module** (e.g., `src/data/mappers.ts`) that handles these conversions:

```typescript
export function mapUserFromAPI(row: any): User {
  return {
    id: row.id,
    trustScore: row.trust_score,
    activeMatchId: row.active_match_id,
    // ... etc
  };
}

export function mapMatchFromAPI(row: any): Match {
  return {
    id: row.id,
    user1Id: row.user1_id,
    user2Id: row.user2_id,
    status: row.status as 'active' | 'completed' | 'terminated' | 'expired',
    // ... etc
  };
}
```

---

## Query Patterns

Frontend fetches data using `@supabase/supabase-js`. Always type the result using the mapping utility.

### Example: Fetch upcoming study dates

```typescript
import { createClient } from '@supabase/supabase-js';
import { mapStudyDateFromAPI } from './mappers';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fetchUpcomingStudyDates(userId: string): Promise<StudyDate[]> {
  const { data, error } = await supabase
    .from('study_dates')
    .select('*')
    .eq('match_id', (
      // Subquery to get active match
      SELECT id FROM matches
      WHERE (user1_id = ? OR user2_id = ?) AND status = 'active'
    ))
    .gt('scheduled_time', new Date().toISOString())
    .order('scheduled_time', { ascending: true });
  
  if (error) throw error;
  
  return data.map(mapStudyDateFromAPI);
}
```

### Example: Fetch discoverable users (with shadowban applied)

```typescript
async function fetchDiscoverableProfiles(): Promise<User[]> {
  const { data, error } = await supabase
    .from('discoverable_users')  // Reads from the shadowban view
    .select('*')
    .limit(50);
  
  if (error) throw error;
  
  return data.map(mapUserFromAPI);
}
```

---

## Realtime Subscription Patterns

Realtime subscriptions are critical for the Lock System (forcing navigation when a user acquires an active match) and for live chat messages.

### Lock System: Subscribe to user's `active_match_id` changes

> **Illustrative only — not the actual implementation.** `users` was never added to the Realtime publication (only `matches` and `messages` were, per Phase 4). `DiscoveryScreen.tsx` subscribes to `matches` directly, filtered on `user1_id`/`user2_id`, instead of the pattern below. See `docs/development.md` Session 7 for why, and the "User swipes right on a profile" scenario further down this file for what's actually implemented (including Session 10's move to mutual-swipe-driven match formation).

```typescript
import { RealtimeChannel } from '@supabase/supabase-js';

let subscription: RealtimeChannel;

function subscribeLockSystem(userId: string, onMatchAcquired: (matchId: string) => void) {
  subscription = supabase
    .channel(`user-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`,
      },
      (payload) => {
        const newUser = payload.new as any;
        const oldUser = payload.old as any;
        
        // Check if active_match_id changed from NULL to non-NULL
        if (!oldUser?.active_match_id && newUser?.active_match_id) {
          onMatchAcquired(newUser.active_match_id);
        }
        
        // Check if active_match_id cleared (match expired/terminated)
        if (oldUser?.active_match_id && !newUser?.active_match_id) {
          // Unlock Discovery screen
          navigation.reset({ ... });
        }
      }
    )
    .subscribe();
}

function unsubscribeLockSystem() {
  subscription?.unsubscribe();
}
```

**Usage in Discovery screen**:
```typescript
useEffect(() => {
  subscribeLockSystem(userId, (matchId) => {
    // Force navigate to chat
    navigation.reset({
      index: 0,
      routes: [
        { name: 'MainTabs', params: { screen: 'Chats' } },
        { name: 'Chat', params: { matchId } },
      ],
    });
  });
  
  return () => unsubscribeLockSystem();
}, [userId]);
```

### Chat: Subscribe to new messages in a match

```typescript
function subscribeToMessages(matchId: string, onNewMessage: (msg: Message) => void) {
  const subscription = supabase
    .channel(`match-${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        const newMessage = mapMessageFromAPI(payload.new);
        onNewMessage(newMessage);
      }
    )
    .subscribe();
  
  return subscription;
}

// In ChatScreen:
useEffect(() => {
  const subscription = subscribeToMessages(matchId, (msg) => {
    setMessages((prev) => [...prev, msg]);
  });
  
  return () => subscription.unsubscribe();
}, [matchId]);
```

---

## Error Handling

### Network Errors

For queries that fail due to network:

```typescript
try {
  const data = await fetchDiscoverableProfiles();
} catch (error) {
  if (error?.message?.includes('Failed to fetch')) {
    // Show a "No internet" or "Retry" prompt
    setError('No internet connection. Tap to retry.');
  } else {
    // Show a generic error
    setError('Something went wrong. Tap to retry.');
  }
}
```

Reuse the existing `EmptyState` pattern from `DiscoveryScreen.tsx` to display the error with a retry button.

### RLS Violations

If a user attempts to access data they don't have permission for, the query will return an RLS error. In normal app flow, this should never happen, but log it and show a generic error:

```typescript
if (error?.code === '403' || error?.message?.includes('permission')) {
  console.error('RLS violation:', error);
  setError('Access denied');
}
```

### Realtime Disconnect/Reconnect

When Realtime loses the WebSocket connection, subscriptions pause. When reconnected, they resume automatically. Show a subtle indicator so users know the status:

```typescript
const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'reconnecting'>('connected');

useEffect(() => {
  const channel = supabase
    .channel(`user-${userId}`)
    .on('system', { event: 'connected' }, () => setRealtimeStatus('connected'))
    .on('system', { event: 'sync' }, () => setRealtimeStatus('connected'))
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') setRealtimeStatus('reconnecting');
    });
  
  return () => channel.unsubscribe();
}, [userId]);

// In the UI:
{realtimeStatus === 'reconnecting' && (
  <View style={{ backgroundColor: Colors.surfaceHigh, padding: Spacing.sm }}>
    <Text style={{ fontSize: Typography.size.xs, color: Colors.textMuted }}>
      Reconnecting…
    </Text>
  </View>
)}
```

---

## Common Integration Scenarios

### Scenario: User swipes right on a profile (real double opt-in, implemented Session 10)

A right swipe **never inserts into `matches` directly** — `authenticated` has no INSERT grant on that table at all (see `mutual_match_formation.sql`). Both sides recording a decision is what forms a match:

1. Frontend calls `supabase.from('swipes').insert({ swiper_id, target_id, direction: 'right' })` — identical shape to a left swipe/pass, just a different `direction`.
2. A backend trigger (`form_match_on_mutual_swipe`, `AFTER INSERT` on `swipes`) checks for the reciprocal right-swipe. Nothing else happens if it's not there yet (one-sided swipe = no match, by design — this is what actually fixes the double opt-in requirement, previously unimplemented and the source of a real reported bug).
3. Once both sides have swiped right on each other, that same trigger inserts the `matches` row itself (`SECURITY DEFINER`) — which in turn fires the existing Lock System trigger pair (Migration 7) exactly as if a client had inserted it, setting both users' `active_match_id`.
4. Realtime notification fires on both users' **`matches`** table subscription (not `users` — `users` was never added to the Realtime publication; see `docs/development.md` Session 7 for why the frontend pattern below subscribes to `matches` directly instead of the `users`-table pattern shown earlier in this doc).
5. Both users' Discovery screens receive the notification → force-navigate to chat (locked) — this fires identically regardless of *which* of the two swipes completed the pair, since it's driven by the `matches` row itself, not by which client happened to make the insert.

### Scenario: User sends a message

1. Frontend calls `supabase.from('messages').insert({ match_id, sender_id, content })`
2. Realtime INSERT notification fires on the `messages` subscription
3. Other user's ChatScreen receives the notification → appends message to list

### Scenario: 12 hours pass with no messages in an active match

1. Cron job wakes up (every 15 minutes)
2. Finds matches with `status = 'active'` and `updated_at < NOW() - 12h` with no recent messages
3. Sets `status = 'expired'` and nullifies both users' `active_match_id`
4. Realtime notifications fire on both users' `users` subscriptions
5. Both users' Discovery screens unlock (receive the `active_match_id = NULL` update)

---

## Development Workflow

1. **Backend first**: Deploy schema, RLS, triggers, cron jobs
2. **Mock queries**: Frontend temporarily mocks Supabase responses locally (or uses `development.json` fixture data)
3. **Wire one screen**: Pick the simplest screen (e.g., Dashboard upcoming sessions) and wire it to real data
4. **Test end-to-end**: Verify the query, mapping, and subscription work with actual Supabase data
5. **Expand**: Wire remaining screens incrementally

---

## Type Safety Across Layers

The mapping layer ensures frontend types (`src/types/index.ts`) match backend schema:

- Frontend: `User`, `Match`, `Message`, `StudyDate` interfaces (camelCase)
- Backend: `users`, `matches`, `messages`, `study_dates` tables (snake_case)
- Mapping: `mapUserFromAPI()`, `mapMatchFromAPI()`, etc. (one-way conversion)

If the backend schema changes (new column, renamed field), **update both**:
1. The SQL table definition
2. The `src/types/index.ts` interface
3. The mapping function in `mappers.ts`

This prevents silent data mismatches.
