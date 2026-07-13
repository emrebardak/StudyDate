// Data-access mapping layer: Supabase (snake_case) <-> frontend types (camelCase).
//
// Screens keep using the camelCase interfaces in src/types/index.ts unchanged; only this
// module knows about snake_case column names. Every later phase's wiring reuses these.
// See docs/integration.md.

import type { User, Match, Message, StudyDate, RegistrationData } from '../types';

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
    activeMatchId: row.active_match_id ?? null,
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
