// Maps a Supabase/PostgREST error (or any thrown error) to a safe, user-facing
// message. Never surface error.message directly in the UI — it can contain raw
// Postgres constraint/column names or other internal detail (flagged in a
// security review as a mild information-disclosure/UX issue). The real error
// still goes to console.warn so it's visible in dev tooling, matching the
// pattern DiscoveryScreen.tsx's recordSwipe() already used for its own
// non-blocking failures.

interface ErrorLike {
  code?: string;
  message?: string;
}

export interface FriendlyErrorOptions {
  /** Shown for Postgres 23505 (unique_violation). Supply context-specific
   * wording per call site — "already submitted this survey" and "already sent
   * this request" aren't the same message. */
  duplicateMessage?: string;
  /** Shown for anything that isn't a known case. Defaults to a generic string. */
  fallbackMessage?: string;
}

const DEFAULT_DUPLICATE_MESSAGE = "You've already done that.";
const DEFAULT_FALLBACK_MESSAGE = 'Something went wrong. Please try again.';
const PERMISSION_DENIED_MESSAGE = "You don't have permission to do that.";
const NETWORK_MESSAGE = 'Check your connection and try again.';

export function toFriendlyErrorMessage(
  error: unknown,
  options: FriendlyErrorOptions = {},
): string {
  const err = (error ?? {}) as ErrorLike;
  console.warn(err.message ?? String(error));

  if (err.code === '23505') {
    return options.duplicateMessage ?? DEFAULT_DUPLICATE_MESSAGE;
  }
  if (err.code === '42501') {
    return PERMISSION_DENIED_MESSAGE;
  }
  if (!err.code && error instanceof TypeError) {
    return NETWORK_MESSAGE;
  }
  return options.fallbackMessage ?? DEFAULT_FALLBACK_MESSAGE;
}
