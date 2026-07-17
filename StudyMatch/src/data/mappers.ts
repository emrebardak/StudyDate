// Data-access mapping layer: Supabase (snake_case) <-> frontend types (camelCase).
//
// Screens keep using the camelCase interfaces in src/types/index.ts unchanged; only this
// module knows about snake_case column names. Every later phase's wiring reuses these.
// See docs/integration.md.

import type {
  User,
  DiscoveryCandidate,
  EmailVerificationStatus,
  Match,
  Message,
  StudyDate,
  RegistrationData,
} from '../types';

/** Map a `public.users` row (snake_case) to the frontend `User` type (camelCase). */
export function mapUserFromAPI(row: any): User {
  return {
    id: row.id,
    name: row.name ?? '',
    university: row.university ?? '',
    department: row.department ?? '',
    grade: row.grade ?? 0,
    year: row.year ?? 'Freshman',
    trustScore: row.trust_score,
    badges: row.badges ?? {},
    currentGoalText: row.current_goal_text ?? '',
    currentTags: row.current_tags ?? [],
    audioEnvironment: row.audio_environment ?? undefined,
    studyPacing: row.study_pacing ?? undefined,
    studyFuel: row.study_fuel ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    photos: row.photos ?? undefined,
    bio: row.bio ?? undefined,
    availability: row.availability ?? undefined,
    city: row.city ?? undefined,
    birthdate: row.birthdate ?? undefined,
    activeMatchId: row.active_match_id ?? null,
  };
}

/**
 * Map `public.users`' email-verification columns (snake_case) to the frontend
 * `EmailVerificationStatus` type (camelCase). Takes the same kind of raw row
 * `mapUserFromAPI` does, but only reads the two verification-status columns —
 * callers select just what they need (`email_verified`, `verification_code`,
 * or both), same as `mapUserFromAPI` tolerates a partial `select()`.
 */
export function mapEmailVerificationStatusFromAPI(
  row: any,
): EmailVerificationStatus {
  return {
    emailVerified: row?.email_verified ?? false,
    verificationCode: row?.verification_code ?? '',
  };
}

/**
 * Map a `discoverable_users` row (snake_case) to the frontend `DiscoveryCandidate`
 * type (camelCase) — Phase 7. Adds the view's viewer-relative columns on top of the
 * same base fields `mapUserFromAPI` already maps; `age`/`same_city` are NULL-safe by
 * construction on the view (see `recommendation_scoring.sql`), `match_score` always a
 * concrete 0-100 integer.
 */
export function mapDiscoveryCandidateFromAPI(row: any): DiscoveryCandidate {
  return {
    ...mapUserFromAPI(row),
    age: row.age ?? undefined,
    sameCity: row.same_city ?? undefined,
    matchScore: row.match_score ?? 0,
  };
}

// Frontend-only Match fields with no DB column (see src/types/index.ts): partnerAlias
// is display-derived, messageCount comes from a separate query when needed, and
// revealThreshold is a product constant — none of them live on the matches row.
const DEFAULT_REVEAL_THRESHOLD = 10;

/** Map a `public.matches` row (snake_case) to the frontend `Match` type (camelCase). */
export function mapMatchFromAPI(
  row: any,
  extras?: { partnerAlias?: string; messageCount?: number },
): Match {
  return {
    id: row.id,
    user1Id: row.user1_id,
    user2Id: row.user2_id,
    status: row.status,
    user1Revealed: row.user1_revealed,
    user2Revealed: row.user2_revealed,
    partnerAlias: extras?.partnerAlias ?? 'Anonymous Match',
    messageCount: extras?.messageCount ?? 0,
    revealThreshold: DEFAULT_REVEAL_THRESHOLD,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Map a `public.messages` row (snake_case) to the frontend `Message` type (camelCase). */
export function mapMessageFromAPI(row: any): Message {
  return {
    id: row.id,
    matchId: row.match_id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: row.created_at,
  };
}

/** Map a `public.study_dates` row (snake_case) to the frontend `StudyDate` type (camelCase). */
export function mapStudyDateFromAPI(row: any): StudyDate {
  return {
    id: row.id,
    matchId: row.match_id,
    proposedBy: row.proposed_by,
    location: row.location ?? '',
    scheduledTime: row.scheduled_time ?? '',
    focusSubject: row.focus_subject ?? '',
    status: row.status,
    createdAt: row.created_at,
  };
}

/**
 * Build the `public.users` UPDATE payload (snake_case) from the registration data
 * accumulated across the 4 signup screens. Only the columns registration collects are
 * included; everything else keeps its DB default.
 */
export function registrationToProfileUpdate(
  data: Partial<RegistrationData>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (data.fullName !== undefined) payload.name = data.fullName;
  if (data.institution !== undefined) payload.university = data.institution;
  if (data.department !== undefined) payload.department = data.department;
  if (data.traits !== undefined) payload.current_tags = data.traits;
  if (data.focusGoal !== undefined) payload.current_goal_text = data.focusGoal;
  return payload;
}

/**
 * Inverse of registrationToProfileUpdate: rebuilds a partial RegistrationData
 * from a `public.users` row, passed forward as route.params.data when
 * AppNavigator.tsx routes a session with an incomplete profile back into the
 * registration flow. `email` comes from the auth session, not this row.
 *
 * IMPORTANT — this does NOT currently restore a user's previously-typed
 * values: registrationToProfileUpdate only ever runs once, inside Step 4's
 * "Complete Archive" handler. Steps 2-3 never write to public.users, only
 * pass data forward via navigation params — so if this function is reached
 * at all (AppNavigator's `!row?.name` gate), name/university/department/
 * current_tags/current_goal_text are guaranteed NULL by construction; only
 * `email` will ever actually populate. "Resume" today means "don't land in
 * MainTabs with a blank profile," not "get your typed data back." If
 * registration is ever changed to persist incrementally per step, this
 * function will start actually restoring data without needing to change —
 * but until then, don't read this as doing more than it does.
 */
export function profileRowToRegistrationData(
  row: any,
  email?: string,
): Partial<RegistrationData> {
  const data: Partial<RegistrationData> = {};
  if (email) data.email = email;
  if (row?.name) data.fullName = row.name;
  if (row?.university) data.institution = row.university;
  if (row?.department) data.department = row.department;
  if (row?.current_tags?.length) data.traits = row.current_tags;
  if (row?.current_goal_text) data.focusGoal = row.current_goal_text;
  return data;
}
