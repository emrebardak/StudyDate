// Supabase client singleton for StudyMatch (React Native).
//
// React Native specifics:
//   * `react-native-url-polyfill/auto` — RN has no full WHATWG `URL`; supabase-js needs it.
//   * AsyncStorage — persists the auth session across app restarts (RN has no localStorage).
//   * detectSessionInUrl: false — there is no URL to parse a session out of in a native app.
//
// The URL/key below are the Supabase CLI's LOCAL dev values (from `npx supabase status`).
// They are the shared, non-secret defaults baked into every local Supabase install — safe
// to commit for local development. Swap these for the hosted project's values in Phase 6
// (ideally via env/config rather than editing this file).

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// LOCAL DEV — replace with hosted values in Phase 6.
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
