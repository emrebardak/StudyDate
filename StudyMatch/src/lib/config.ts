// App-wide feature-delivery mode switches. Kept as single named constants so a later
// change (e.g. wiring up a real email provider) is a small, contained edit here rather
// than a rewrite scattered across screens.

/**
 * 'offline' — no real email is sent. RegisterEmailCodeScreen.tsx fetches and displays the
 *   verification_code directly from the user's own row (RLS-permitted own-row SELECT) and
 *   labels it as a temporary dev/offline stand-in. regenerate_verification_code() writes a
 *   fresh code + expiry server-side (returns void); the screen re-fetches its own row
 *   afterward rather than trusting a client-visible RPC return value.
 * 'online' — not implemented yet. Would mean: the backend sends the code via a real email
 *   provider instead of it being client-readable, and the screen stops rendering the code
 *   on-screen (and stops re-fetching it for display) entirely.
 */
export type EmailVerificationMode = 'offline' | 'online';

export const EMAIL_VERIFICATION_MODE: EmailVerificationMode = 'offline';
